import { Check, Trash2, Clock, Pencil, GripVertical } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../App'
import { VARIANTS_ITEM } from '../constants/animations'

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, text: string) => void;
}

interface TimeInfo {
  text: string;
  urgent: boolean;
  overdue: boolean;
  secondsLeft?: number;
}

function formatTimeRemaining(dueTime: Date): TimeInfo {
  const now = new Date()
  const diff = dueTime.getTime() - now.getTime()
  
  if (diff < 0) {
    const mins = Math.abs(Math.floor(diff / 60000))
    if (mins < 60) return { text: `${mins}m overdue`, urgent: true, overdue: true }
    const hours = Math.floor(mins / 60)
    if (hours < 24) return { text: `${hours}h overdue`, urgent: true, overdue: true }
    return { text: `${Math.floor(hours / 24)}d overdue`, urgent: true, overdue: true }
  }
  
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return { text: `${seconds}s`, urgent: true, overdue: false, secondsLeft: seconds }
  
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { text: `${mins}m left`, urgent: mins < 30, overdue: false }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { text: `${hours}h ${mins % 60}m`, urgent: hours < 2, overdue: false }
  const days = Math.floor(hours / 24)
  return { text: `${days}d ${hours % 24}h`, urgent: false, overdue: false }
}

export default function TodoItem({ todo, onToggle, onDelete, onRename }: TodoItemProps) {
  const [, setTick] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }
  
  // Update every second if urgent
  useEffect(() => {
    if (!todo.dueTime) return
    const now = new Date()
    const diff = new Date(todo.dueTime).getTime() - now.getTime()
    // If less than 1 min, tick every second
    if (diff > 0 && diff < 60000) {
        const interval = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(interval)
    }
  }, [todo.dueTime])

  const timeInfo = todo.dueTime ? formatTimeRemaining(new Date(todo.dueTime)) : null
  
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      variants={VARIANTS_ITEM}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={clsx(
        'group flex items-center gap-3 p-3.5 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/50 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden',
        todo.completed && 'opacity-60 bg-white/40'
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-neu-muted/20 hover:text-violet-400 p-1 -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
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
            // Improved Skeuomorphism: 
            // Inset shadow when inactive (subtle depth), Pop out when checked or Active state logic
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
            transition={{ type: "spring", stiffness: 400, damping: 25 }} // Snappier check
          >
            <Check size={12} strokeWidth={3} className="drop-shadow-sm" />
          </motion.div>
        </motion.div>
        
        {/* Ripple - Slightly refined */}
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
                            setEditText(todo.text); // Reset if empty
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
                className="block text-sm font-medium select-none truncate pr-6" // Padding for edit icon if needed, but we put it outside
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

      {/* Edit Button - hover only, not for completed */}
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

      {/* Delete Button - always visible for completed, hover for incomplete */}
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
  )
}
