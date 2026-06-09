'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { TodoProvider } from '../context/TodoContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TodoProvider>{children}</TodoProvider>
    </AuthProvider>
  )
}
