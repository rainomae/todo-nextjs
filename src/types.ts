export interface AuthData {
  token: string
  refreshToken: string
  firstName: string
  lastName: string
}

export interface TodoTask {
  id: string
  taskName: string
  taskSort: number
  isCompleted: boolean
  isArchived: boolean
  dueDt: string | null
  todoCategoryId: string | null
  todoPriorityId: string | null
  createdDt?: string
}

export interface TodoCategory {
  id: string
  categoryName: string
  categorySort: number
  tag: string
}

export interface TodoPriority {
  id: string
  priorityName: string
  prioritySort: number
}

export type PriorityRank = 'high' | 'medium' | 'low'
