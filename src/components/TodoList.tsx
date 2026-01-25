import { AnimatePresence, motion } from 'framer-motion'
import type { Todo } from '../App'
import TodoItem from './TodoItem'
import { VARIANTS_CONTAINER } from '../constants/animations'

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, text: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onRename }: TodoListProps) {
  return (
    <motion.div 
      className="space-y-2"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AnimatePresence mode='popLayout'>
        {todos.map((todo) => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            onToggle={onToggle} 
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
