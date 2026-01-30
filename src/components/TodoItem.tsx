import { Check, Trash2, Clock, Pencil, FileText, X, GripVertical } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getTranslation } from '../i18n'
import type { Language } from '../i18n'
import type { Todo } from '../hooks/useTodos'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, text: string) => void
  onUpdateDetails: (id: string, details: string) => void
  onUpdateDue: (id: string, due: Date | null) => void
  language: Language
  darkMode?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  isDragging?: boolean
}

interface TimeInfo {
  text: string
  urgent: boolean
  overdue: boolean
  progress: number
}

function calculateProgress(createdAt: Date, dueTime: Date): number {
  const now = new Date()
  const total = dueTime.getTime() - createdAt.getTime()
  const elapsed = now.getTime() - createdAt.getTime()
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function formatTimeRemaining(createdAt: Date, dueTime: Date, t: ReturnType<typeof getTranslation>): TimeInfo {
  const now = new Date()
  const diff = dueTime.getTime() - now.getTime()
  const progress = calculateProgress(createdAt, dueTime)

  if (diff < 0) {
    const mins = Math.abs(Math.floor(diff / 60000))
    if (mins < 60) return { text: `${mins}m ${t.overdue}`, urgent: true, overdue: true, progress: 100 }
    const hours = Math.floor(mins / 60)
    if (hours < 24) return { text: `${hours}h ${t.overdue}`, urgent: true, overdue: true, progress: 100 }
    return { text: `${Math.floor(hours / 24)}d ${t.overdue}`, urgent: true, overdue: true, progress: 100 }
  }

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return { text: `${seconds}s`, urgent: true, overdue: false, progress }

  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { text: `${mins}m ${t.left}`, urgent: mins < 30, overdue: false, progress }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { text: `${hours}h ${mins % 60}m`, urgent: hours < 2, overdue: false, progress }
  const days = Math.floor(hours / 24)
  return { text: `${days}d ${hours % 24}h`, urgent: false, overdue: false, progress }
}

// 格式化日期为 YYYY-MM-DD
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间为 HH:MM
function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function TodoItem({ todo, onToggle, onDelete, onRename, onUpdateDetails, onUpdateDue, language, darkMode = false, onDragStart, onDragEnd }: TodoItemProps) {
  const t = getTranslation(language)
  const [, setTick] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsText, setDetailsText] = useState(todo.details || '')

  // Due Picker State - 使用原生 input
  const [showDueModal, setShowDueModal] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('12:00')

  const menuRef = useRef<HTMLDivElement>(null)

  // 打开 deadline 弹窗时初始化值
  const openDueModal = () => {
    if (todo.dueTime) {
      const d = new Date(todo.dueTime)
      setDateValue(formatDateForInput(d))
      setTimeValue(formatTimeForInput(d))
    } else {
      // 默认设置为今天
      const today = new Date()
      setDateValue(formatDateForInput(today))
      setTimeValue('12:00')
    }
    setShowDueModal(true)
    setShowContextMenu(false)
  }

  // 保存 deadline
  const handleSaveDue = () => {
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number)
      const [hours, minutes] = timeValue.split(':').map(Number)
      const due = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
      onUpdateDue(todo.id, due)
    } else {
      onUpdateDue(todo.id, null)
    }
    setShowDueModal(false)
  }

  // 清除 deadline
  const handleClearDue = () => {
    onUpdateDue(todo.id, null)
    setShowDueModal(false)
  }

  // 每秒更新进度
  useEffect(() => {
    if (!todo.dueTime || todo.completed) return
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [todo.dueTime, todo.completed])

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false)
      }
    }
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showContextMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleSaveDetails = () => {
    onUpdateDetails(todo.id, detailsText)
    setShowDetailsModal(false)
  }

  const createdAt = todo.createdAt ? new Date(todo.createdAt) : new Date()
  const timeInfo = todo.dueTime ? formatTimeRemaining(createdAt, new Date(todo.dueTime), t) : null
  const hasDeadline = todo.dueTime && !todo.completed

  // 进度条颜色
  const getProgressColors = (progress: number, overdue: boolean) => {
    if (overdue) return { elapsed: 'bg-gradient-to-r from-red-400 to-red-500', remaining: 'bg-red-100/50' }
    if (progress > 80) return { elapsed: 'bg-gradient-to-r from-amber-400 to-orange-500', remaining: 'bg-amber-50/50' }
    if (progress > 50) return { elapsed: 'bg-gradient-to-r from-yellow-400 to-amber-500', remaining: 'bg-yellow-50/50' }
    return { elapsed: 'bg-gradient-to-r from-violet-400 to-purple-500', remaining: 'bg-violet-50/30' }
  }

  const progressColors = timeInfo ? getProgressColors(timeInfo.progress, timeInfo.overdue) : null

  return (
    <>
      <motion.div
        layout
        onContextMenu={handleContextMenu}
        className={clsx(
          'group flex items-center gap-2 p-3.5 backdrop-blur-sm border rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-default',
          todo.completed && 'opacity-60',
          hasDeadline ? 'bg-transparent border-white/30' : darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white/60 hover:bg-white/80 border-white/50'
        )}
      >
        {/* Deadline Progress Bar */}
        {hasDeadline && timeInfo && (
          <>
            <motion.div
              className={clsx("absolute inset-0 rounded-[24px]", progressColors?.remaining)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className={clsx(
                "absolute top-0 left-0 h-full rounded-l-[24px]",
                progressColors?.elapsed,
                timeInfo.progress >= 100 && "rounded-r-[24px]"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${timeInfo.progress}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
              style={{ opacity: timeInfo.overdue ? 0.4 : 0.25 }}
            />
            {timeInfo.progress < 100 && !timeInfo.overdue && (
              <motion.div
                className="absolute top-0 h-full w-1 rounded-full"
                initial={{ left: 0 }}
                animate={{ left: `${timeInfo.progress}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
                style={{
                  background: timeInfo.progress > 80
                    ? 'linear-gradient(to bottom, rgba(251, 191, 36, 0.8), rgba(249, 115, 22, 0.8))'
                    : timeInfo.progress > 50
                    ? 'linear-gradient(to bottom, rgba(250, 204, 21, 0.8), rgba(245, 158, 11, 0.8))'
                    : 'linear-gradient(to bottom, rgba(167, 139, 250, 0.8), rgba(139, 92, 246, 0.8))',
                  boxShadow: timeInfo.progress > 80
                    ? '0 0 12px rgba(249, 115, 22, 0.6)'
                    : timeInfo.progress > 50
                    ? '0 0 12px rgba(245, 158, 11, 0.6)'
                    : '0 0 12px rgba(139, 92, 246, 0.6)',
                  transform: 'translateX(-50%)'
                }}
              />
            )}
          </>
        )}

        {/* Drag Handle */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', '')
            onDragStart?.()
          }}
          onDragEnd={() => onDragEnd?.()}
          className="relative z-10 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-neu-muted/30 hover:text-violet-400 -ml-1"
        >
          <GripVertical size={14} />
        </div>

        {/* Checkbox with enhanced completion animation */}
        <motion.button
          layout={false}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(todo.id)}
          className="relative z-10 cursor-pointer flex-shrink-0 group/checkbox"
        >
          {/* Enhanced celebration effects */}
          <AnimatePresence>
            {todo.completed && (
              <>
                {/* Outer ring burst */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 2.5, 3], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-violet-400"
                />

                {/* Inner glow pulse */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 2, 2.5], opacity: [0, 0.4, 0] }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                />

                {/* Star burst particles - 12 particles in a circle */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.2, 0.8, 0],
                      x: Math.cos((i * 30 * Math.PI) / 180) * 35,
                      y: Math.sin((i * 30 * Math.PI) / 180) * 35,
                      opacity: [1, 1, 0.8, 0],
                    }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.02 }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background: ['#a78bfa', '#c084fc', '#f472b6', '#818cf8', '#34d399', '#fbbf24'][i % 6],
                      boxShadow: `0 0 6px ${['#a78bfa', '#c084fc', '#f472b6', '#818cf8', '#34d399', '#fbbf24'][i % 6]}`,
                    }}
                  />
                ))}

                {/* Sparkle stars - 6 larger sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      x: Math.cos(((i * 60 + 30) * Math.PI) / 180) * 28,
                      y: Math.sin(((i * 60 + 30) * Math.PI) / 180) * 28,
                      opacity: [0, 1, 0],
                      rotate: [0, 180],
                    }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 + i * 0.03 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill={['#fbbf24', '#f472b6', '#34d399', '#818cf8', '#fb923c', '#a78bfa'][i]}>
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                  </motion.div>
                ))}

                {/* Confetti trails */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`confetti-${i}`}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      scale: [0, 1, 0.5],
                      x: Math.cos(((i * 45 + 22.5) * Math.PI) / 180) * 45,
                      y: Math.sin(((i * 45 + 22.5) * Math.PI) / 180) * 45,
                      opacity: [1, 0.8, 0],
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                    className="absolute top-1/2 left-1/2 w-1.5 h-3 -translate-x-1/2 -translate-y-1/2 rounded-sm"
                    style={{
                      background: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#818cf8', '#fb923c', '#c084fc', '#22d3ee'][i],
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.div
            layout
            animate={todo.completed ? {
              scale: [1, 1.3, 0.9, 1.1, 1],
              rotate: [0, -15, 15, -5, 0],
            } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border",
              todo.completed
                ? 'border-violet-500 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.6)]'
                : 'border-neu-muted/20 bg-white/70 backdrop-blur-md shadow-inner'
            )}
          >
            <motion.div
              initial={false}
              animate={{
                scale: todo.completed ? [0, 1.3, 1] : 0,
                opacity: todo.completed ? 1 : 0,
                rotate: todo.completed ? [0, -30, 30, 0] : 0
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Check size={12} strokeWidth={3} className="drop-shadow-sm" />
            </motion.div>
          </motion.div>
        </motion.button>

        {/* Task Text & Due Time */}
        <div className="relative z-10 flex-1 min-w-0 overflow-hidden">
          {isEditing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); if (editText.trim()) { onRename(todo.id, editText.trim()); setIsEditing(false); } }}
              className="w-full"
            >
              <input
                type="text"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => { if (editText.trim()) onRename(todo.id, editText.trim()); else setEditText(todo.text); setIsEditing(false); }}
                className={`w-full bg-transparent border-none outline-none text-sm font-medium p-0 m-0 ${darkMode ? 'text-neu-dark-text' : 'text-neu-text'}`}
              />
            </form>
          ) : (
            <div className="relative group/text">
              <motion.span
                animate={{ color: todo.completed ? (darkMode ? 'rgba(160, 160, 176, 0.4)' : 'rgba(99, 110, 114, 0.4)') : (darkMode ? 'rgba(234, 234, 234, 1)' : 'rgba(45, 52, 54, 1)') }}
                className={clsx(
                  "block text-sm font-medium select-none truncate",
                  hasDeadline && timeInfo?.overdue && (darkMode ? "text-red-400" : "text-red-700")
                )}
              >
                {todo.text}
              </motion.span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: todo.completed ? 1 : 0 }}
                style={{ originX: 0 }}
                className={`absolute top-1/2 left-0 right-0 h-[1px] pointer-events-none ${darkMode ? 'bg-neu-dark-text/60' : 'bg-neu-text/60'}`}
              />
            </div>
          )}

          <AnimatePresence>
            {timeInfo && !todo.completed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={clsx(
                  "flex items-center gap-2 mt-1 text-xs font-semibold",
                  timeInfo.overdue ? 'text-red-600' : timeInfo.urgent ? 'text-amber-600' : 'text-neu-muted/60'
                )}
              >
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{timeInfo.text}</span>
                  {hasDeadline && (
                    <span className="ml-1 opacity-60">({Math.round(timeInfo.progress)}%)</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons - 只显示时钟和编辑按钮，删除按钮通过右键菜单访问 */}
        {!todo.completed && (
          <div className="relative z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); openDueModal(); }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                darkMode ? 'text-neu-dark-muted/50 hover:text-violet-400 hover:bg-violet-500/20' : 'text-neu-muted/30 hover:text-violet-500 hover:bg-violet-50/80'
              }`}
              title={t.changeDue}
            >
              <Clock size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setEditText(todo.text); setIsEditing(true); }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                darkMode ? 'text-neu-dark-muted/50 hover:text-violet-400 hover:bg-violet-500/20' : 'text-neu-muted/30 hover:text-violet-500 hover:bg-violet-50/80'
              }`}
              title={t.rename}
            >
              <Pencil size={14} />
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -5 }}
            style={{ top: Math.min(contextMenuPos.y, window.innerHeight - 180), left: Math.min(contextMenuPos.x, window.innerWidth - 160) }}
            className={`fixed z-[100] backdrop-blur-xl rounded-2xl shadow-2xl border py-2 min-w-[160px] origin-top-left ${
              darkMode ? 'bg-neu-dark-surface/95 border-white/10' : 'bg-white/95 border-gray-200/80'
            }`}
          >
            <div className="px-3.5 py-2 mb-1">
              <p className="text-[10px] font-black text-violet-500/50 uppercase tracking-widest">{t.task}</p>
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-neu-dark-text' : 'text-neu-text'}`}>{todo.text}</p>
            </div>
            <div className={`h-px mx-2 mb-1 ${darkMode ? 'bg-white/10' : 'bg-gray-100/50'}`} />
            <MenuButton icon={<Clock size={13} />} text={t.changeDue} onClick={openDueModal} darkMode={darkMode} />
            <MenuButton icon={<FileText size={13} />} text={t.editDetails} onClick={() => { setShowContextMenu(false); setDetailsText(todo.details || ''); setShowDetailsModal(true); }} darkMode={darkMode} />
            <MenuButton icon={<Pencil size={13} />} text={t.rename} onClick={() => { setShowContextMenu(false); setEditText(todo.text); setIsEditing(true); }} darkMode={darkMode} />
            <div className={`h-px my-1 mx-2 ${darkMode ? 'bg-white/10' : 'bg-gray-100/50'}`} />
            <MenuButton icon={<Trash2 size={13} />} text={t.delete} color="text-red-500" onClick={() => { setShowContextMenu(false); onDelete(todo.id); }} darkMode={darkMode} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Due Date Modal - 优化版 */}
      <AnimatePresence>
        {showDueModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] flex items-start justify-center pt-[180px]"
            onClick={() => setShowDueModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[320px] rounded-3xl shadow-2xl border p-5 max-h-[calc(100vh-200px)] overflow-y-auto mx-4 ${
                darkMode ? 'bg-gradient-to-b from-neu-dark-surface to-neu-dark-base border-white/10' : 'bg-gradient-to-b from-white to-violet-50/30 border-white/50'
              }`}
            >
              {/* 标题 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                    <Clock size={16} className={darkMode ? 'text-violet-400' : 'text-violet-500'} />
                  </div>
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-neu-dark-text' : 'text-neu-text'}`}>{t.changeDue}</h3>
                </div>
                <button onClick={() => setShowDueModal(false)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  darkMode ? 'text-neu-dark-muted hover:text-neu-dark-text hover:bg-white/5' : 'text-neu-muted hover:text-neu-text hover:bg-gray-100'
                }`}>
                  <X size={16} />
                </button>
              </div>

              {/* 倒计时快捷按钮 */}
              <div className="mb-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-amber-400/70' : 'text-amber-600/70'}`}>
                  {language === 'zh' ? '⏱ 倒计时' : '⏱ Countdown'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '15m', minutes: 15 },
                    { label: '30m', minutes: 30 },
                    { label: '1h', minutes: 60 },
                    { label: '2h', minutes: 120 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setMinutes(d.getMinutes() + opt.minutes)
                        setDateValue(formatDateForInput(d))
                        setTimeValue(formatTimeForInput(d))
                      }}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        darkMode
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30'
                          : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 hover:from-amber-100 hover:to-orange-100 border border-amber-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[
                    { label: '3h', minutes: 180 },
                    { label: '6h', minutes: 360 },
                    { label: '12h', minutes: 720 },
                    { label: '24h', minutes: 1440 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setMinutes(d.getMinutes() + opt.minutes)
                        setDateValue(formatDateForInput(d))
                        setTimeValue(formatTimeForInput(d))
                      }}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        darkMode
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30'
                          : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 hover:from-amber-100 hover:to-orange-100 border border-amber-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 快捷日期选项 */}
              <div className="mb-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-neu-dark-muted/50' : 'text-neu-muted/50'}`}>
                  {language === 'zh' ? '📅 指定日期' : '📅 Set Date'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: language === 'zh' ? '今天' : 'Today', days: 0 },
                    { label: language === 'zh' ? '明天' : 'Tmrw', days: 1 },
                    { label: language === 'zh' ? '3天' : '3D', days: 3 },
                    { label: language === 'zh' ? '一周' : '1W', days: 7 },
                  ].map((opt) => {
                    const d = new Date()
                    d.setDate(d.getDate() + opt.days)
                    const optValue = formatDateForInput(d)
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setDateValue(optValue)}
                        className={clsx(
                          "py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer",
                          dateValue === optValue
                            ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                            : darkMode
                            ? 'bg-white/5 text-violet-400 hover:bg-white/10 border border-white/10'
                            : 'bg-white text-violet-600 hover:bg-violet-100 border border-violet-100'
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 日期和时间选择 - 并排布局 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-neu-dark-muted/50' : 'text-neu-muted/50'}`}>
                    {language === 'zh' ? '日期' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-semibold border rounded-xl outline-none transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-neu-dark-text focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20'
                        : 'bg-white border-violet-100 text-neu-text focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-neu-dark-muted/50' : 'text-neu-muted/50'}`}>
                    {language === 'zh' ? '时间' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-semibold border rounded-xl outline-none transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-neu-dark-text focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20'
                        : 'bg-white border-violet-100 text-neu-text focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                    }`}
                  />
                </div>
              </div>

              {/* 快捷时间选项 */}
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {['09:00', '12:00', '18:00', '21:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setTimeValue(time)}
                      className={clsx(
                        "py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                        timeValue === time
                          ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                          : darkMode
                          ? 'bg-white/5 text-violet-400 hover:bg-white/10 border border-white/10'
                          : 'bg-white text-violet-600 hover:bg-violet-100 border border-violet-100'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* 预览 */}
              {dateValue && (
                <div className={`mb-4 p-3 rounded-xl border ${darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className={`text-[11px] font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                      {new Date(dateValue + 'T' + timeValue).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleClearDue}
                  className={`py-2.5 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
                    darkMode ? 'text-red-400 bg-white/5 border border-red-500/30 hover:bg-red-500/10' : 'text-red-500 bg-white border border-red-100 hover:bg-red-50'
                  }`}
                >
                  {language === 'zh' ? '清除' : 'Clear'}
                </button>
                <button
                  onClick={handleSaveDue}
                  className="py-2.5 text-[11px] font-bold text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/30 transition-all cursor-pointer"
                >
                  {language === 'zh' ? '保存' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl shadow-xl border overflow-hidden ${
                darkMode ? 'bg-neu-dark-surface border-white/10' : 'bg-white border-white/50'
              }`}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <h3 className={`text-sm font-bold ${darkMode ? 'text-neu-dark-text' : 'text-neu-text'}`}>{t.editDetails}</h3>
                <button onClick={() => setShowDetailsModal(false)} className={`p-1 rounded-full cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className={`text-[10px] mb-1 font-bold uppercase ${darkMode ? 'text-neu-dark-muted' : 'text-neu-muted'}`}>{t.task}</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-neu-dark-text' : 'text-neu-text'}`}>{todo.text}</p>
                </div>
                <textarea
                  autoFocus
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  placeholder={t.addDetails}
                  className={`w-full h-32 p-4 text-sm border-none rounded-2xl resize-none outline-none transition-all ${
                    darkMode
                      ? 'bg-white/5 text-neu-dark-text placeholder-neu-dark-muted/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20'
                      : 'bg-gray-50 text-neu-text placeholder-neu-muted/50 focus:bg-white focus:ring-2 focus:ring-violet-100'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-colors cursor-pointer ${
                      darkMode ? 'text-neu-dark-muted bg-white/5 hover:bg-white/10' : 'text-neu-muted bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    className="flex-1 py-3 text-sm font-bold text-white bg-violet-500 rounded-2xl hover:bg-violet-600 shadow-lg shadow-violet-500/20 transition-colors cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MenuButton({ icon, text, onClick, color = "text-neu-text", darkMode = false }: { icon: React.ReactNode, text: string, onClick: () => void, color?: string, darkMode?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full px-3.5 py-2.5 text-left text-xs font-semibold transition-all flex items-center gap-3 cursor-pointer",
        color,
        darkMode ? 'hover:bg-white/5 hover:text-violet-400' : 'hover:bg-violet-50 hover:text-violet-600'
      )}
    >
      <span className="opacity-50 group-hover:opacity-100">{icon}</span>
      <span>{text}</span>
    </button>
  )
}
