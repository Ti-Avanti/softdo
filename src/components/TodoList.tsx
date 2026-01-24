import { AnimatePresence } from 'framer-motion'
import type { Todo } from '../App'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleNotify: (id: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onToggleNotify }: TodoListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false} mode='popLayout'>
        {todos.map((todo) => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            onToggle={onToggle} 
            onDelete={onDelete}
            onToggleNotify={onToggleNotify}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
