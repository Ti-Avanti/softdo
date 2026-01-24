import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Pin, CircleCheck, Trash2, Bell, ArrowRight, Droplet, ArrowDownRight } from 'lucide-react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueTime?: Date | null;
}

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
}

const STORAGE_KEY = 'softdo-todos'
const SKIP_VERSION_KEY = 'softdo-skip-version'
const OPACITY_KEY = 'softdo-opacity'
const VERSION = 'v1.1.2'

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map((t: Todo) => ({
          ...t,
          dueTime: t.dueTime ? new Date(t.dueTime) : null
        }))
      }
    } catch { /* Ignore parse errors */ }
    return []
  })
  
  const [opacity, setOpacity] = useState(() => {
    const saved = localStorage.getItem(OPACITY_KEY)
    return saved ? parseFloat(saved) : 1
  })
  
  const [isPinned, setIsPinned] = useState(false)
  const [showOpacityControl, setShowOpacityControl] = useState(false)
  const [, setTick] = useState(0)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const opacityRef = useRef<HTMLDivElement>(null)
  
  // Resize logic
  const isResizing = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ w: 0, h: 0 })

  const handleResizeStart = (e: React.MouseEvent) => {
    isResizing.current = true
    startPos.current = { x: e.screenX, y: e.screenY }
    startSize.current = { w: window.outerWidth, h: window.outerHeight }
    document.body.style.cursor = 'nwse-resize'
    
    // Disable selection during resize
    document.body.style.userSelect = 'none'
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return

    requestAnimationFrame(() => {
      const deltaX = e.screenX - startPos.current.x
      const deltaY = e.screenY - startPos.current.y
      
      const newWidth = Math.max(320, startSize.current.w + deltaX)
      const newHeight = Math.max(480, startSize.current.h + deltaY)

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ipcRenderer } = require('electron')
        ipcRenderer.send('resize-window', { width: newWidth, height: newHeight })
      } catch { /* Not in Electron */ }
    })
  }, [])

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    localStorage.setItem(OPACITY_KEY, opacity.toString())
  }, [opacity])

  // Click outside to close opacity control
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opacityRef.current && !opacityRef.current.contains(event.target as Node)) {
        setShowOpacityControl(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-update check
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ipcRenderer } = require('electron');
        const result = await ipcRenderer.invoke('check-for-updates');
        
        if (result.hasUpdate) {
          const skippedVersion = localStorage.getItem(SKIP_VERSION_KEY);
          if (skippedVersion !== result.latestVersion) {
            // Delay showing updated notification to not annoy user immediately on startup
            setTimeout(() => {
              setUpdateInfo(result);
            }, 5000);
          }
        }
      } catch { /* Not in Electron or network error */ }
    }

    checkUpdate();
  }, [])

  const addTodo = (text: string, dueTime?: Date | null) => {
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text, completed: false, dueTime }])
  }

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const clearAll = () => {
    setTodos([])
  }

  const closeApp = () => window.close()

  const minimizeApp = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('minimize-window');
    } catch { /* Not in Electron */ }
  }

  const togglePin = () => {
    setIsPinned(!isPinned);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('toggle-always-on-top', !isPinned);
    } catch { /* Not in Electron */ }
  }

  const handleUpdate = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('open-release-page');
    } catch { /* Not in Electron */ }
    setUpdateInfo(null);
  }

  const skipUpdate = () => {
    if (updateInfo) {
      localStorage.setItem(SKIP_VERSION_KEY, updateInfo.latestVersion);
      setUpdateInfo(null);
    }
  }

  const closeUpdate = () => {
    setUpdateInfo(null);
  }

  return (
    <div className="h-screen w-screen p-4 bg-transparent flex flex-col">
      {/* Main Container - solid background with subtle border */}
      <div 
        className="relative flex-1 w-full rounded-[28px] overflow-hidden flex flex-col border border-[#e8e6f0]/60 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-colors duration-200"
        style={{ backgroundColor: `rgba(248, 247, 252, ${opacity})` }}
      >
        
        {/* Window Controls */}
        <div className="flex items-center justify-between px-5 py-4 app-drag-region relative z-50">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-400 to-purple-600" 
            />
            <span className="text-sm font-semibold text-neu-text/80 tracking-wide">SoftDo</span>
            <span className="text-[10px] font-medium text-neu-muted/40 tracking-wider">{VERSION}</span>
          </motion.div>
          
          <div className="flex items-center gap-1.5 app-no-drag">
            {/* Opacity Control */}
            <div className="relative" ref={opacityRef}>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowOpacityControl(!showOpacityControl)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  showOpacityControl ? 'bg-violet-500/20 text-violet-600' : 'hover:bg-black/5 text-neu-muted/40'
                }`}
              >
                <Droplet size={11} fill={showOpacityControl ? 'currentColor' : 'none'} />
              </motion.button>
              
              <AnimatePresence>
                {showOpacityControl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute top-9 left-1/2 -translate-x-1/2 w-32 p-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 flex flex-col gap-2 items-center z-50 origin-top"
                  >
                    <div className="w-full flex justify-between text-[10px] text-neu-muted font-medium px-0.5">
                      <span>Opacity</span>
                      <span>{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.01"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-violet-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-sm outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={togglePin}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                isPinned ? 'bg-violet-500/20 text-violet-600' : 'hover:bg-black/5 text-neu-muted/40'
              }`}
            >
              <Pin size={11} fill={isPinned ? 'currentColor' : 'none'} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={minimizeApp}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 text-neu-muted/40 transition-all duration-300 cursor-pointer"
            >
              <Minus size={11} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,107,107,0.1)' }}
              whileTap={{ scale: 0.85 }}
              onClick={closeApp}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:text-red-400 text-neu-muted/40 transition-all duration-300 cursor-pointer"
            >
              <X size={11} />
            </motion.button>
          </div>
        </div>

        {/* Update Notification */}
        <AnimatePresence>
          {updateInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 overflow-hidden flex-shrink-0 relative z-40"
            >
              <div className="bg-violet-50/80 rounded-xl p-3 flex items-start gap-3 border border-violet-100 mb-2">
                <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600 mt-0.5">
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-violet-900">New Version {updateInfo.latestVersion}</span>
                    <button onClick={closeUpdate} className="text-violet-400 hover:text-violet-600 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-violet-600/80 mb-2 leading-relaxed">
                    A new version is available with improved features and fixes.
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleUpdate}
                      className="flex-1 bg-violet-600 text-white text-[10px] font-medium py-1.5 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Update</span>
                      <ArrowRight size={10} />
                    </button>
                    <button 
                      onClick={skipUpdate}
                      className="px-3 bg-white text-violet-500 text-[10px] font-medium py-1.5 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 relative z-30">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Header with Clear All */}
            <header className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neu-text tracking-tight">Today's Tasks</h1>
                <motion.p 
                  key={todos.filter(t => !t.completed).length}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neu-muted text-xs font-medium tracking-wide"
                >
                  {todos.filter(t => !t.completed).length} remaining
                </motion.p>
              </div>
              
              {/* Clear All Button - shows when there are any todos */}
              <AnimatePresence>
                {todos.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-400 text-xs font-medium hover:bg-red-100 transition-all duration-300 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </header>
            
            {/* Input & List */}
            <div className="space-y-4">
              <TodoInput onAdd={addTodo} />
              
              <AnimatePresence mode="wait">
                {todos.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center py-12"
                  >
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.15, duration: 0.5, type: 'spring', bounce: 0.4 }}
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center border border-violet-100/30"
                    >
                      <CircleCheck size={24} className="text-violet-400" />
                    </motion.div>
                    <motion.p 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-neu-muted/60 text-sm font-medium"
                    >
                      All clear! Add a task above.
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TodoList 
                      todos={todos} 
                      onToggle={toggleTodo} 
                      onDelete={deleteTodo} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-1 cursor-nwse-resize z-50 group app-no-drag"
          onMouseDown={handleResizeStart}
        >
          <ArrowDownRight size={16} className="text-neu-muted/30 group-hover:text-neu-muted/60 transition-colors" />
        </div>
      </div>
    </div>
  )
}

export default App
