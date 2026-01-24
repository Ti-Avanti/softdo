import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Pin, CircleCheck, Trash2 } from 'lucide-react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueTime?: Date | null;
}

const STORAGE_KEY = 'softdo-todos'
const VERSION = 'v1.1.0'

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
  const [isPinned, setIsPinned] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
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

  return (
    <div className="h-screen w-screen p-4 bg-transparent">
      {/* Main Container - solid background with subtle border */}
      <div className="relative h-full w-full bg-[#f8f7fc] rounded-[28px] overflow-hidden flex flex-col border border-[#e8e6f0]/60 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        
        {/* Window Controls */}
        <div className="flex items-center justify-between px-5 py-4 app-drag-region">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
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
      </div>
    </div>
  )
}

export default App
