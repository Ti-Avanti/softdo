import { useState, useEffect, useCallback } from 'react'

export interface Todo {
  id: string
  text: string
  completed: boolean
  dueTime?: Date | null
  createdAt: Date  // 创建时间，用于计算 deadline 进度
  details?: string
}

const STORAGE_KEY = 'softdo-todos'

/**
 * useTodos Hook - 管理 Todo 列表的状态和操作
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map((t: Todo) => ({
          ...t,
          dueTime: t.dueTime ? new Date(t.dueTime) : null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
        }))
      }
    } catch { /* Ignore parse errors */ }
    return []
  })

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const addTodo = useCallback((text: string, dueTime?: Date | null) => {
    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      completed: false,
      dueTime,
      createdAt: new Date()
    }])
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const renameTodo = useCallback((id: string, newText: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, text: newText } : t
    ))
  }, [])

  const updateDetails = useCallback((id: string, details: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, details } : t
    ))
  }, [])

  const updateDue = useCallback((id: string, dueTime: Date | null) => {
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t
      const createdAt = t.createdAt || new Date()
      return { ...t, dueTime, createdAt }
    }))
  }, [])

  const reorderTodos = useCallback((fromIndex: number, toIndex: number) => {
    setTodos(prev => {
      const newTodos = [...prev]
      const [removed] = newTodos.splice(fromIndex, 1)
      newTodos.splice(toIndex, 0, removed)
      return newTodos
    })
  }, [])

  const clearAll = useCallback(() => {
    setTodos([])
  }, [])

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    renameTodo,
    updateDetails,
    updateDue,
    reorderTodos,
    clearAll,
    pendingCount: todos.filter(t => !t.completed).length,
  }
}

export default useTodos
