import { Check, Trash2, Clock, Pencil, FileText, X, GripVertical } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import type { Todo } from '../App'
import { getTranslation } from '../i18n'
import type { Language } from '../i18n'

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, text: string) => void;
  onUpdateDetails: (id: string, details: string) => void;
  language: Language;
}

interface TimeInfo {
  text: string;
  urgent: boolean;
  overdue: boolean;
  secondsLeft?: number;
}

function formatTimeRemaining(dueTime: Date, t: any): TimeInfo {
  const now = new Date()
  const diff = dueTime.getTime() - now.getTime()
  
  if (diff < 0) {
    const mins = Math.abs(Math.floor(diff / 60000))
    if (mins < 60) return { text: `${mins}m ${t.overdue}`, urgent: true, overdue: true }
    const hours = Math.floor(mins / 60)
    if (hours < 24) return { text: `${hours}h ${t.overdue}`, urgent: true, overdue: true }
    return { text: `${Math.floor(hours / 24)}d ${t.overdue}`, urgent: true, overdue: true }
  }
  
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return { text: `${seconds}s`, urgent: true, overdue: false, secondsLeft: seconds }
  
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { text: `${mins}m ${t.left}`, urgent: mins < 30, overdue: false }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { text: `${hours}h ${mins % 60}m`, urgent: hours < 2, overdue: false }
  const days = Math.floor(hours / 24)
  return { text: `${days}d ${hours % 24}h`, urgent: false, overdue: false }
}

export default function TodoItem({ todo, onToggle, onDelete, onRename, onUpdateDetails, language }: TodoItemProps) {
  const t = getTranslation(language)
  const [, setTick] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsText, setDetailsText] = useState(todo.details || '')
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Update every second if urgent
  useEffect(() => {
    if (!todo.dueTime) return
    const now = new Date()
    const diff = new Date(todo.dueTime).getTime() - now.getTime()
    if (diff > 0 && diff < 60000) {
        const interval = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(interval)
    }
  }, [todo.dueTime])

  // Close context menu on click outside
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

  const timeInfo = todo.dueTime ? formatTimeRemaining(new Date(todo.dueTime), t) : null
  
  return (
    <>
      <motion.div
        layout
        onContextMenu={handleContextMenu}
        className={clsx(
          'group flex items-center gap-2 p-3.5 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/50 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-default',
          todo.completed && 'opacity-60 bg-white/40'
        )}
      >
        {/* Drag Handle - appears on hover */}
        <div className="w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-neu-muted/30 hover:text-violet-400 -ml-1">
          <GripVertical size={14} />
        </div>
        {/* Checkbox */}
        <motion.button
          layout={false}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(todo.id)}
          className="relative cursor-pointer flex-shrink-0 group/checkbox"
        >
          <motion.div
            layout
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border",
              todo.completed 
                ? 'border-violet-500 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]' 
                : 'border-neu-muted/20 bg-white/50 backdrop-blur-md shadow-inner hover:shadow-neu-btn active:shadow-neu-pressed'
            )}
          >
            <motion.div
              initial={false}
              animate={{ 
                scale: todo.completed ? 1 : 0, 
                opacity: todo.completed ? 1 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check size={12} strokeWidth={3} className="drop-shadow-sm" />
            </motion.div>
          </motion.div>
          
          {/* Ripple */}
          <AnimatePresence>
            {todo.completed && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-violet-400 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Task Text & Due Time */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          {isEditing ? (
              <form 
                  onSubmit={(e) => {
                      e.preventDefault();
                      if (editText.trim()) {
                          onRename(todo.id, editText.trim());
                          setIsEditing(false);
                      }
                  }}
                  className="w-full"
              >
                  <input
                      type="text"
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => {
                          if (editText.trim()) {
                              onRename(todo.id, editText.trim());
                          } else {
                              setEditText(todo.text);
                          }
                          setIsEditing(false);
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-neu-text p-0 m-0"
                  />
              </form>
          ) : (
              <div className="relative group/text">
                <motion.span 
                  animate={{ 
                    color: todo.completed ? 'rgba(99, 110, 114, 0.4)' : 'rgba(45, 52, 54, 1)'
                  }}
                  transition={{ duration: 0.3 }}
                  className="block text-sm font-medium select-none truncate"
                >
                  {todo.text}
                </motion.span>
                
                {/* Strikethrough line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: todo.completed ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: todo.completed ? 0.1 : 0 }}
                  style={{ originX: 0 }}
                  className="absolute top-1/2 left-0 right-0 h-[1px] bg-neu-text/60 pointer-events-none"
                />
              </div>
          )}
          
          {/* Details Preview */}
          <AnimatePresence>
            {todo.details && !todo.completed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] text-neu-muted/60 mt-0.5 truncate"
              >
                {todo.details}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Due Time */}
          <AnimatePresence>
            {timeInfo && !todo.completed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className={clsx(
                  "flex items-center gap-2 mt-1 text-xs font-medium overflow-hidden",
                  timeInfo.overdue ? 'text-red-500' :
                  timeInfo.urgent ? 'text-amber-500' : 'text-neu-muted/50'
                )}
              >
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{timeInfo.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Edit Button */}
        {!todo.completed && (
          <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                  setEditText(todo.text);
                  setIsEditing(true);
              }}
              className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center text-neu-muted/30 hover:text-violet-500 hover:bg-violet-50 transition-all duration-300 cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100",
              )}
              title="Rename"
          >
              <Pencil size={14} />
          </motion.button>
        )}

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(todo.id)}
          className={clsx(
            "w-8 h-8 rounded-xl flex items-center justify-center text-neu-muted/30 hover:text-red-400 hover:bg-red-50 transition-all duration-300 cursor-pointer flex-shrink-0",
            todo.completed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Trash2 size={14} />
        </motion.button>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ 
              top: Math.min(contextMenuPos.y, window.innerHeight - 150), 
              left: Math.min(contextMenuPos.x, window.innerWidth - 160) 
            }}
            className="fixed z-[100] bg-white backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/80 py-1.5 min-w-[150px] origin-top-left"
          >
            <button
              onClick={() => {
                setShowContextMenu(false)
                setDetailsText(todo.details || '')
                setShowDetailsModal(true)
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-neu-text hover:bg-violet-50 hover:text-violet-600 transition-colors flex items-center gap-2.5"
            >
              <FileText size={13} className="text-neu-muted" />
              <span>{t.editDetails}</span>
            </button>
            <button
              onClick={() => {
                setShowContextMenu(false)
                setEditText(todo.text)
                setIsEditing(true)
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-neu-text hover:bg-violet-50 hover:text-violet-600 transition-colors flex items-center gap-2.5"
            >
              <Pencil size={13} className="text-neu-muted" />
              <span>{t.rename}</span>
            </button>
            <div className="h-px bg-gray-100 my-1 mx-2" />
            <button
              onClick={() => {
                setShowContextMenu(false)
                onDelete(todo.id)
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5"
            >
              <Trash2 size={13} />
              <span>{t.delete}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-neu-text">Edit Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-neu-muted transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Task Name */}
              <div className="px-4 py-3 bg-violet-50/50 border-b border-gray-100">
                <p className="text-xs text-neu-muted mb-1">Task</p>
                <p className="text-sm font-medium text-neu-text truncate">{todo.text}</p>
              </div>
              
              {/* Details Input */}
              <div className="p-4">
                <label className="text-xs text-neu-muted mb-2 block">Details</label>
                <textarea
                  autoFocus
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  placeholder="Add more details about this task..."
                  className="w-full h-24 p-3 text-sm bg-gray-50 border border-gray-100 rounded-xl resize-none outline-none focus:border-violet-300 focus:bg-white transition-colors"
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-neu-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="flex-1 py-2 text-sm font-medium text-white bg-violet-500 rounded-xl hover:bg-violet-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
