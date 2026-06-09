import type { AxiosResponse } from 'axios'
import api from './axiosInstance'
import type { TodoTask, TodoCategory, TodoPriority } from '../types'

export const getTasks = (): Promise<AxiosResponse<TodoTask[]>> => api.get('/TodoTasks')
export const getTask = (id: string): Promise<AxiosResponse<TodoTask>> => api.get(`/TodoTasks/${id}`)
export const createTask = (data: Partial<TodoTask>): Promise<AxiosResponse<TodoTask>> => api.post('/TodoTasks', data)
export const updateTask = (id: string, data: Partial<TodoTask>): Promise<AxiosResponse<TodoTask>> => api.put(`/TodoTasks/${id}`, data)
export const deleteTask = (id: string): Promise<AxiosResponse<void>> => api.delete(`/TodoTasks/${id}`)

export const getCategories = (): Promise<AxiosResponse<TodoCategory[]>> => api.get('/TodoCategories')
export const createCategory = (data: Omit<TodoCategory, 'id'>): Promise<AxiosResponse<TodoCategory>> => api.post('/TodoCategories', data)
export const updateCategory = (id: string, data: TodoCategory): Promise<AxiosResponse<TodoCategory>> => api.put(`/TodoCategories/${id}`, data)
export const deleteCategory = (id: string): Promise<AxiosResponse<void>> => api.delete(`/TodoCategories/${id}`)

export const getPriorities = (): Promise<AxiosResponse<TodoPriority[]>> => api.get('/TodoPriorities')
export const createPriority = (data: Omit<TodoPriority, 'id'>): Promise<AxiosResponse<TodoPriority>> => api.post('/TodoPriorities', data)
export const updatePriority = (id: string, data: TodoPriority): Promise<AxiosResponse<TodoPriority>> => api.put(`/TodoPriorities/${id}`, data)
export const deletePriority = (id: string): Promise<AxiosResponse<void>> => api.delete(`/TodoPriorities/${id}`)
