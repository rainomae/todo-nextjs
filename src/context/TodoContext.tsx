'use client'

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import {
  getTasks, createTask, updateTask, deleteTask, saveTaskOrder as apiSaveTaskOrder,
  getCategories, createCategory, updateCategory, deleteCategory,
  getPriorities, createPriority, updatePriority, deletePriority,
} from '../api/todos'
import type { TodoTask, TodoCategory, TodoPriority, PriorityRank } from '../types'

interface TodoState {
  tasks: TodoTask[]
  categories: TodoCategory[]
  priorities: TodoPriority[]
  loading: boolean
  error: string | null
}

type TodoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_TASKS'; payload: TodoTask[] }
  | { type: 'ADD_TASK'; payload: TodoTask }
  | { type: 'UPDATE_TASK'; payload: TodoTask }
  | { type: 'REPLACE_TASKS'; payload: TodoTask[] }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: TodoCategory[] }
  | { type: 'ADD_CATEGORY'; payload: TodoCategory }
  | { type: 'UPDATE_CATEGORY'; payload: TodoCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PRIORITIES'; payload: TodoPriority[] }
  | { type: 'ADD_PRIORITY'; payload: TodoPriority }
  | { type: 'UPDATE_PRIORITY'; payload: TodoPriority }
  | { type: 'DELETE_PRIORITY'; payload: string }
  | { type: 'RESET' }

interface TodoContextValue extends TodoState {
  priorityRankById: Record<string, PriorityRank>
  fetchAll: () => Promise<void>
  fetchTasks: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchPriorities: () => Promise<void>
  addTask: (data: Partial<TodoTask>) => Promise<TodoTask>
  editTask: (id: string, data: Partial<TodoTask>) => Promise<TodoTask>
  removeTask: (id: string) => Promise<void>
  reorderTasks: (tasks: TodoTask[]) => void
  saveTaskOrder: (items: { id: string; taskSort: number }[]) => Promise<void>
  addCategory: (data: Omit<TodoCategory, 'id'>) => Promise<TodoCategory>
  editCategory: (id: string, data: TodoCategory) => Promise<TodoCategory>
  removeCategory: (id: string) => Promise<void>
  addPriority: (data: Omit<TodoPriority, 'id'>) => Promise<TodoPriority>
  editPriority: (id: string, data: TodoPriority) => Promise<TodoPriority>
  removePriority: (id: string) => Promise<void>
  reset: () => void
}

const initialState: TodoState = {
  tasks: [],
  categories: [],
  priorities: [],
  loading: false,
  error: null,
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload, error: null }
    case 'SET_ERROR': return { ...state, loading: false, error: action.payload }
    case 'SET_TASKS': return { ...state, tasks: action.payload, loading: false }
    case 'ADD_TASK': return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map((t) => t.id === action.payload.id ? action.payload : t) }
    case 'REPLACE_TASKS': return { ...state, tasks: action.payload }
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) }
    case 'SET_CATEGORIES': return { ...state, categories: action.payload, loading: false }
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, action.payload] }
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map((c) => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter((c) => c.id !== action.payload) }
    case 'SET_PRIORITIES': return { ...state, priorities: action.payload, loading: false }
    case 'ADD_PRIORITY': return { ...state, priorities: [...state.priorities, action.payload] }
    case 'UPDATE_PRIORITY': return { ...state, priorities: state.priorities.map((p) => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PRIORITY': return { ...state, priorities: state.priorities.filter((p) => p.id !== action.payload) }
    case 'RESET': return initialState
  }
}

const TodoContext = createContext<TodoContextValue | null>(null)

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, initialState)

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [tasksRes, catsRes, priRes] = await Promise.all([getTasks(), getCategories(), getPriorities()])
      dispatch({ type: 'SET_TASKS', payload: tasksRes.data })
      dispatch({ type: 'SET_CATEGORIES', payload: catsRes.data })
      dispatch({ type: 'SET_PRIORITIES', payload: priRes.data })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: (e as Error)?.message ?? 'Andmete laadimine ebaõnnestus' })
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const res = await getTasks()
    dispatch({ type: 'SET_TASKS', payload: res.data })
  }, [])

  const fetchCategories = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const res = await getCategories()
    dispatch({ type: 'SET_CATEGORIES', payload: res.data })
  }, [])

  const fetchPriorities = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const res = await getPriorities()
    dispatch({ type: 'SET_PRIORITIES', payload: res.data })
  }, [])

  const addTask = useCallback(async (data: Partial<TodoTask>): Promise<TodoTask> => {
    const res = await createTask(data)
    dispatch({ type: 'ADD_TASK', payload: res.data })
    return res.data
  }, [])

  const editTask = useCallback(async (id: string, data: Partial<TodoTask>): Promise<TodoTask> => {
    const res = await updateTask(id, data)
    dispatch({ type: 'UPDATE_TASK', payload: res.data })
    return res.data
  }, [])

  const removeTask = useCallback(async (id: string): Promise<void> => {
    await deleteTask(id)
    dispatch({ type: 'DELETE_TASK', payload: id })
  }, [])

  const reorderTasks = useCallback((tasks: TodoTask[]) => {
    dispatch({ type: 'REPLACE_TASKS', payload: tasks })
  }, [])

  const saveTaskOrder = useCallback(async (items: { id: string; taskSort: number }[]): Promise<void> => {
    await apiSaveTaskOrder(items)
  }, [])

  const addCategory = useCallback(async (data: Omit<TodoCategory, 'id'>): Promise<TodoCategory> => {
    const res = await createCategory(data)
    dispatch({ type: 'ADD_CATEGORY', payload: res.data })
    return res.data
  }, [])

  const editCategory = useCallback(async (id: string, data: TodoCategory): Promise<TodoCategory> => {
    const res = await updateCategory(id, data)
    dispatch({ type: 'UPDATE_CATEGORY', payload: res.data })
    return res.data
  }, [])

  const removeCategory = useCallback(async (id: string): Promise<void> => {
    await deleteCategory(id)
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }, [])

  const addPriority = useCallback(async (data: Omit<TodoPriority, 'id'>): Promise<TodoPriority> => {
    const res = await createPriority(data)
    dispatch({ type: 'ADD_PRIORITY', payload: res.data })
    return res.data
  }, [])

  const editPriority = useCallback(async (id: string, data: TodoPriority): Promise<TodoPriority> => {
    const res = await updatePriority(id, data)
    dispatch({ type: 'UPDATE_PRIORITY', payload: res.data })
    return res.data
  }, [])

  const removePriority = useCallback(async (id: string): Promise<void> => {
    await deletePriority(id)
    dispatch({ type: 'DELETE_PRIORITY', payload: id })
  }, [])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const priorityRankById = state.priorities.reduce<Record<string, PriorityRank>>((acc, p) => {
    const sorted = [...state.priorities].sort((a, b) => a.prioritySort - b.prioritySort)
    const rank = sorted.indexOf(p)
    const total = sorted.length
    acc[p.id] = rank === 0 ? 'high' : rank === total - 1 ? 'low' : 'medium'
    return acc
  }, {})

  return (
    <TodoContext.Provider value={{
      ...state, priorityRankById,
      fetchAll, fetchTasks, fetchCategories, fetchPriorities,
      addTask, editTask, removeTask, reorderTasks, saveTaskOrder,
      addCategory, editCategory, removeCategory,
      addPriority, editPriority, removePriority,
      reset,
    }}>
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos(): TodoContextValue {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos must be used inside TodoProvider')
  return ctx
}
