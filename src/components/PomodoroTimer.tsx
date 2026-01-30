import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Settings, X } from 'lucide-react'
import clsx from 'clsx'
import type { Language } from '../i18n'

interface PomodoroTimerProps {
  language: Language
}

type TimerMode = 'work' | 'break'

const STORAGE_KEY_WORK = 'softdo-pomodoro-work'
const STORAGE_KEY_BREAK = 'softdo-pomodoro-break'

const DEFAULT_WORK_DURATION = 25 // minutes
const DEFAULT_BREAK_DURATION = 5 // minutes

export default function PomodoroTimer({ language }: PomodoroTimerProps) {
  // 从 localStorage 读取自定义时间
  const [workDuration, setWorkDuration] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORK)
    return saved ? parseInt(saved) : DEFAULT_WORK_DURATION
  })
  const [breakDuration, setBreakDuration] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BREAK)
    return saved ? parseInt(saved) : DEFAULT_BREAK_DURATION
  })

  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  // 临时编辑值
  const [editWorkMin, setEditWorkMin] = useState(workDuration.toString())
  const [editBreakMin, setEditBreakMin] = useState(breakDuration.toString())

  const totalTime = mode === 'work' ? workDuration * 60 : breakDuration * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  // Timer logic
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer completed
          if (mode === 'work') {
            setCompletedPomodoros(c => c + 1)
            setMode('break')
            setIsRunning(false)
            return breakDuration * 60
          } else {
            setMode('work')
            setIsRunning(false)
            return workDuration * 60
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, mode, workDuration, breakDuration])

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60)
  }, [mode, workDuration, breakDuration])

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(newMode === 'work' ? workDuration * 60 : breakDuration * 60)
  }, [workDuration, breakDuration])

  const openSettings = () => {
    setEditWorkMin(workDuration.toString())
    setEditBreakMin(breakDuration.toString())
    setShowSettings(true)
  }

  const saveSettings = () => {
    const newWork = Math.max(1, Math.min(120, parseInt(editWorkMin) || DEFAULT_WORK_DURATION))
    const newBreak = Math.max(1, Math.min(60, parseInt(editBreakMin) || DEFAULT_BREAK_DURATION))

    setWorkDuration(newWork)
    setBreakDuration(newBreak)
    localStorage.setItem(STORAGE_KEY_WORK, newWork.toString())
    localStorage.setItem(STORAGE_KEY_BREAK, newBreak.toString())

    // 重置当前计时器
    setIsRunning(false)
    setTimeLeft(mode === 'work' ? newWork * 60 : newBreak * 60)
    setShowSettings(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const t = {
    work: language === 'zh' ? '专注' : 'Focus',
    break: language === 'zh' ? '休息' : 'Break',
    pomodoros: language === 'zh' ? '番茄' : 'Pomodoros',
    settings: language === 'zh' ? '设置' : 'Settings',
    workTime: language === 'zh' ? '专注时长' : 'Focus Time',
    breakTime: language === 'zh' ? '休息时长' : 'Break Time',
    minutes: language === 'zh' ? '分钟' : 'min',
    save: language === 'zh' ? '保存' : 'Save',
    cancel: language === 'zh' ? '取消' : 'Cancel',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Main Timer Card */}
      <div className={clsx(
        "relative rounded-2xl p-4 border transition-all duration-500",
        mode === 'work'
          ? "bg-gradient-to-br from-violet-50/80 to-purple-50/60 border-violet-100/50"
          : "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-100/50"
      )}>
        {/* Progress Bar Background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <motion.div
            className={clsx(
              "absolute bottom-0 left-0 h-full transition-colors duration-500",
              mode === 'work' ? "bg-violet-200/30" : "bg-emerald-200/30"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="relative z-10">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => switchMode('work')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer",
                mode === 'work'
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white/50 text-neu-muted hover:bg-white/80"
              )}
            >
              {t.work}
            </button>
            <button
              onClick={() => switchMode('break')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5",
                mode === 'break'
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white/50 text-neu-muted hover:bg-white/80"
              )}
            >
              <Coffee size={12} />
              {t.break}
            </button>
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Time */}
              <motion.div
                key={timeLeft}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className={clsx(
                  "text-3xl font-black tracking-tight tabular-nums",
                  mode === 'work' ? "text-violet-600" : "text-emerald-600"
                )}
              >
                {formatTime(timeLeft)}
              </motion.div>

              {/* Pomodoro Count */}
              <AnimatePresence mode="wait">
                {completedPomodoros > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    {[...Array(Math.min(completedPomodoros, 4))].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-2 h-2 rounded-full bg-red-400"
                      />
                    ))}
                    {completedPomodoros > 4 && (
                      <span className="text-[10px] font-bold text-red-400 ml-0.5">
                        +{completedPomodoros - 4}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openSettings}
                className={clsx(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                  mode === 'work'
                    ? "text-violet-400 hover:bg-violet-100 hover:text-violet-600"
                    : "text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600"
                )}
              >
                <Settings size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer}
                className={clsx(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                  mode === 'work'
                    ? "text-violet-400 hover:bg-violet-100 hover:text-violet-600"
                    : "text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600"
                )}
              >
                <RotateCcw size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTimer}
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer",
                  mode === 'work'
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
                )}
              >
                <AnimatePresence mode="wait">
                  {isRunning ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                    >
                      <Pause size={18} fill="currentColor" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                    >
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[260px] bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neu-text">{t.settings}</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-neu-muted hover:text-neu-text p-1 cursor-pointer rounded-full hover:bg-gray-100"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Work Duration */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-violet-600">{t.workTime}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editWorkMin}
                      onChange={(e) => setEditWorkMin(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-bold text-center bg-violet-50 border border-violet-100 rounded-xl outline-none focus:ring-2 focus:ring-violet-200"
                    />
                    <span className="text-xs text-neu-muted font-medium">{t.minutes}</span>
                  </div>
                </div>

                {/* Break Duration */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-emerald-600">{t.breakTime}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={editBreakMin}
                      onChange={(e) => setEditBreakMin(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-bold text-center bg-emerald-50 border border-emerald-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <span className="text-xs text-neu-muted font-medium">{t.minutes}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="py-2.5 text-[11px] font-bold text-neu-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={saveSettings}
                    className="py-2.5 text-[11px] font-bold text-white bg-violet-500 rounded-xl hover:bg-violet-600 shadow-lg shadow-violet-500/20 transition-colors cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
