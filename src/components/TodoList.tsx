import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Todo } from '../App'
import TodoItem from './TodoItem'
import { getTranslation } from '../i18n'
import type { Language } from '../i18n'

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, text: string) => void;
  onUpdateDetails: (id: string, details: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  language: Language;
}

export default function TodoList({ todos, onToggle, onDelete, onRename, onUpdateDetails, onReorder, language }: TodoListProps) {
  const t = getTranslation(language)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    // Make drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    if (draggedIndex !== null && targetIndex !== null && draggedIndex !== targetIndex) {
      onReorder(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setTargetIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex !== null && index !== targetIndex) {
      setTargetIndex(index)
    }
  }

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <AnimatePresence mode='popLayout'>
        {todos.map((todo, index) => (
          <motion.div
            key={todo.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: draggedIndex === index ? 1.02 : 1
            }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.2, 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            draggable
            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
            onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
            onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
            className="relative cursor-grab active:cursor-grabbing"
          >
            {/* Drop Indicator - Top */}
            <AnimatePresence>
              {targetIndex === index && draggedIndex !== null && draggedIndex > index && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  className="absolute -top-1.5 left-4 right-4 h-0.5 bg-violet-500 rounded-full origin-left z-10"
                />
              )}
            </AnimatePresence>
            
            {/* Drop Indicator - Bottom */}
            <AnimatePresence>
              {targetIndex === index && draggedIndex !== null && draggedIndex < index && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  className="absolute -bottom-1.5 left-4 right-4 h-0.5 bg-violet-500 rounded-full origin-left z-10"
                />
              )}
            </AnimatePresence>
            
            <TodoItem 
              todo={todo} 
              onToggle={onToggle} 
              onDelete={onDelete}
              onRename={onRename}
              onUpdateDetails={onUpdateDetails}
              language={language}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Drag Hint Toast */}
      <AnimatePresence>
        {draggedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-full shadow-lg z-50 pointer-events-none"
          >
            {t.dropToReorder}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
