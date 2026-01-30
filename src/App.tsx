import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Pin, CircleCheck, Trash2, Bell, ArrowRight, Droplet, Sparkles, Power, Globe } from 'lucide-react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import PomodoroTimer from './components/PomodoroTimer'
import { getTranslation } from './i18n'
import { useTodos, useAppSettings, useWindowResize, electronAPI } from './hooks'

// Re-export Todo type for other components
export type { Todo } from './hooks/useTodos'

function App() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    renameTodo,
    updateDetails,
    updateDue,
    reorderTodos,
    clearAll,
    pendingCount,
  } = useTodos()

  const {
    opacity,
    language,
    isPinned,
    autoStart,
    updateInfo,
    showWelcome,
    showVersionToast,
    VERSION,
    setOpacity,
    toggleLanguage,
    togglePin,
    toggleAutoStart,
    handleUpdate,
    skipUpdate,
    checkForUpdates,
    closeWelcome,
    closeUpdate,
  } = useAppSettings()

  const { handleResizeStart } = useWindowResize()

  const t = getTranslation(language)
  const [showOpacityControl, setShowOpacityControl] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const opacityRef = useRef<HTMLDivElement>(null)

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

  const closeApp = () => electronAPI.window.closeToTray()
  const minimizeApp = () => electronAPI.window.minimize()

  return (
    <div className="h-screen w-screen p-4 bg-transparent flex flex-col">
      {/* Main Container */}
      <div
        className="relative flex-1 w-full rounded-[28px] overflow-hidden flex flex-col border border-white/60 transition-colors duration-200 backdrop-blur-3xl"
        style={{ backgroundColor: `rgba(240, 238, 248, ${opacity})` }}
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
            <span className="text-sm font-bold text-neu-text tracking-wide">SoftDo</span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkForUpdates}
              className="app-no-drag text-[10px] font-black text-neu-text/30 tracking-wider hover:text-violet-500 transition-colors cursor-pointer relative z-50 px-1"
              title="Click to check for updates"
            >
              {VERSION}
            </motion.button>
          </motion.div>

          <div className="flex items-center gap-1.5 app-no-drag">
            {/* Opacity Control */}
            <div className="relative" ref={opacityRef}>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowOpacityControl(!showOpacityControl)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  showOpacityControl ? 'bg-violet-500/20 text-violet-600' : 'hover:bg-black/5 text-neu-text/30'
                }`}
              >
                <Droplet size={11} fill={showOpacityControl ? 'currentColor' : 'none'} strokeWidth={3} />
              </motion.button>

              <AnimatePresence>
                {showOpacityControl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute top-9 right-0 w-40 p-2.5 bg-white/98 backdrop-blur-2xl rounded-xl shadow-xl border border-gray-200/60 flex flex-col gap-2 items-center z-50 origin-top-right"
                  >
                    <div className="w-full flex justify-between text-[10px] text-neu-muted font-medium px-0.5">
                      <span>{t.opacity}</span>
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

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-100" />

                    {/* Auto Start Toggle */}
                    <button
                      onClick={toggleAutoStart}
                      className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-violet-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Power size={12} className={autoStart ? 'text-violet-600' : 'text-neu-muted/50'} />
                        <span className="text-[10px] font-medium text-neu-muted">{t.autoStart}</span>
                      </div>
                      <div className={`w-7 h-4 rounded-full transition-colors ${autoStart ? 'bg-violet-500' : 'bg-gray-200'} flex items-center px-0.5`}>
                        <motion.div
                          animate={{ x: autoStart ? 12 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-100" />

                    {/* Language Toggle */}
                    <button
                      onClick={toggleLanguage}
                      className="w-full flex items-center justify-between px-1 py-1 rounded-lg hover:bg-violet-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-neu-muted/50" />
                        <span className="text-[10px] font-medium text-neu-muted">{t.language}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium">
                        <span className={language === 'en' ? 'text-violet-600' : 'text-neu-muted/40'}>EN</span>
                        <span className="text-neu-muted/30">/</span>
                        <span className={language === 'zh' ? 'text-violet-600' : 'text-neu-muted/40'}>中</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={togglePin}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                isPinned ? 'bg-violet-500/20 text-violet-600' : 'hover:bg-black/5 text-neu-text/30'
              }`}
            >
              <Pin size={11} fill={isPinned ? 'currentColor' : 'none'} strokeWidth={3} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={minimizeApp}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 text-neu-text/30 transition-all duration-300 cursor-pointer ml-1"
            >
              <Minus size={11} strokeWidth={3} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,107,107,0.1)' }}
              whileTap={{ scale: 0.85 }}
              onClick={closeApp}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:text-red-400 text-neu-text/30 transition-all duration-300 cursor-pointer"
            >
              <X size={11} strokeWidth={3} />
            </motion.button>
          </div>
        </div>

        {/* Welcome Notification */}
        <AnimatePresence>
          {showWelcome && !updateInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="px-5 overflow-hidden flex-shrink-0 relative z-40"
            >
              <div className="bg-gradient-to-r from-violet-50 to-purple-50/80 rounded-xl p-3 flex items-start gap-3 border border-violet-100 shadow-sm relative overflow-hidden">
                {/* Sparkle decoration */}
                <div className="absolute top-0 right-0 p-2 text-violet-200 opacity-20 transform translate-x-1/3 -translate-y-1/3">
                  <Sparkles size={80} strokeWidth={1} />
                </div>

                <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg text-white mt-0.5 shadow-sm z-10">
                  <Sparkles size={14} />
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet-900 tracking-tight">{t.welcome} {VERSION}!</span>
                    <button onClick={closeWelcome} className="text-violet-400 hover:text-violet-600 transition-colors p-0.5 hover:bg-violet-100/50 rounded-full cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-violet-600/90 leading-relaxed font-medium">
                    {t.welcomeFeatures}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Notification */}
        <AnimatePresence>
          {updateInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="px-5 overflow-hidden flex-shrink-0 relative z-40"
            >
              <div className="bg-violet-50/80 rounded-xl p-3 flex items-start gap-3 border border-violet-100 mb-2">
                <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600 mt-0.5">
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-violet-900">{t.newVersion} {updateInfo.latestVersion}</span>
                    <button onClick={closeUpdate} className="text-violet-400 hover:text-violet-600 transition-colors cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-violet-600/80 mb-2 leading-relaxed">
                    {t.updateAvailable}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 bg-violet-600 text-white text-[10px] font-medium py-1.5 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{t.update}</span>
                      <ArrowRight size={10} />
                    </button>
                    <button
                      onClick={skipUpdate}
                      className="px-3 bg-white text-violet-500 text-[10px] font-medium py-1.5 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors cursor-pointer"
                    >
                      {t.skip}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pomodoro Timer - Fixed at top, doesn't scroll */}
        <div className="px-5 pb-3 flex-shrink-0 relative z-40">
          <PomodoroTimer language={language} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 relative z-30 [scrollbar-gutter:stable]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Header with Clear All */}
            <header className="flex items-start justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-neu-text tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{t.todayTasks}</h1>
                <motion.p
                  key={pendingCount}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neu-muted text-xs font-medium tracking-wide"
                >
                  {pendingCount} {t.remaining}
                </motion.p>
              </div>

              {/* Clear All Button */}
              <div className="h-8 flex items-center">
                <AnimatePresence>
                  {todos.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowClearConfirm(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer border border-red-100/50 shadow-sm ml-4 whitespace-nowrap"
                    >
                      <Trash2 size={12} strokeWidth={2.5} />
                      <span>{t.clearAll}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </header>

            {/* Input & List */}
            <div className="space-y-4">
              <TodoInput onAdd={addTodo} language={language} />

              <AnimatePresence mode="popLayout" initial={false}>
                {todos.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                    transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                    className="text-center py-12 overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center border border-violet-100/30"
                    >
                      <CircleCheck size={24} className="text-violet-400" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-neu-muted/60 text-sm font-medium"
                    >
                      {t.allClear}
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <TodoList
                      todos={todos}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onRename={renameTodo}
                      onUpdateDetails={updateDetails}
                      onUpdateDue={updateDue}
                      onReorder={reorderTodos}
                      language={language}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Resize Handles */}
        {/* Bottom Right */}
        <div
          className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end z-50 group app-no-drag cursor-nwse-resize"
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        >
          <div
            className="absolute bottom-0 right-0 w-full h-full rounded-tl-3xl transition-all duration-300 ease-out opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at bottom right, rgba(139, 92, 246, ${Math.max(0.4, opacity * 0.8)}) 0%, transparent 70%)`
            }}
          />
        </div>

        {/* Bottom Left */}
        <div
          className="absolute bottom-0 left-0 w-8 h-8 flex items-end justify-start z-50 group app-no-drag cursor-nesw-resize"
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        >
          <div
            className="absolute bottom-0 left-0 w-full h-full rounded-tr-3xl transition-all duration-300 ease-out opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at bottom left, rgba(139, 92, 246, ${Math.max(0.4, opacity * 0.8)}) 0%, transparent 70%)`
            }}
          />
        </div>

        {/* Clear All Confirm Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[280px] bg-white rounded-3xl shadow-2xl border border-white/50 p-5"
              >
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                    <Trash2 size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-sm font-bold text-neu-text mb-1">
                    {language === 'zh' ? '确认清空' : 'Confirm Clear'}
                  </h3>
                  <p className="text-xs text-neu-muted">
                    {language === 'zh'
                      ? `确定要清空所有 ${todos.length} 个任务吗？此操作无法撤销。`
                      : `Are you sure you want to clear all ${todos.length} tasks? This cannot be undone.`
                    }
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="py-2.5 text-[11px] font-bold text-neu-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => { clearAll(); setShowClearConfirm(false); }}
                    className="py-2.5 text-[11px] font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors cursor-pointer"
                  >
                    {language === 'zh' ? '确认清空' : 'Clear All'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Version Check Toast */}
        <AnimatePresence>
          {showVersionToast && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
              className="absolute bottom-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-2xl shadow-xl shadow-violet-500/10 overflow-hidden"
            >
              {/* Progress Bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-[2px] bg-violet-500"
              />

              <div className="p-1.5 bg-green-50 rounded-full text-green-500">
                <CircleCheck size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neu-text">{t.upToDate}</h3>
                <p className="text-[10px] text-neu-muted">{t.latestVersion} {VERSION}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default App
