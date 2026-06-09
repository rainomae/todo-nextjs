'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/auth'
import { createCategory, createPriority } from '../api/todos'
import type { AuthData } from '../types'

const DEFAULT_CATEGORIES = [
  { categoryName: 'Kool', categorySort: 1, tag: '' },
  { categoryName: 'Töö', categorySort: 2, tag: '' },
  { categoryName: 'Kodu', categorySort: 3, tag: '' },
] as const

const DEFAULT_PRIORITIES = [
  { priorityName: 'Kõrge', prioritySort: 1 },
  { priorityName: 'Keskmine', prioritySort: 2 },
  { priorityName: 'Madal', prioritySort: 3 },
] as const

interface AuthState {
  jwt: string | null
  refreshToken: string | null
  firstName: string
  lastName: string
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'LOGIN'; payload: AuthData }
  | { type: 'UPDATE_TOKENS'; payload: { token: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'SYNC'; payload: { jwt: string | null; refreshToken: string | null; firstName: string; lastName: string } }

interface AuthContextValue extends AuthState {
  fullName: string
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
}

function getInitialState(): AuthState {
  return {
    jwt: null,
    refreshToken: null,
    firstName: '',
    lastName: '',
    isAuthenticated: false,
  }
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        jwt: action.payload.token,
        refreshToken: action.payload.refreshToken,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        isAuthenticated: true,
      }
    case 'UPDATE_TOKENS':
      return { ...state, jwt: action.payload.token, refreshToken: action.payload.refreshToken }
    case 'LOGOUT':
      return { jwt: null, refreshToken: null, firstName: '', lastName: '', isAuthenticated: false }
    case 'SYNC':
      return {
        jwt: action.payload.jwt,
        refreshToken: action.payload.refreshToken,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        isAuthenticated: !!action.payload.jwt,
      }
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function seedDefaults(): Promise<void> {
  try {
    await Promise.all([
      ...DEFAULT_CATEGORIES.map((c) => createCategory(c)),
      ...DEFAULT_PRIORITIES.map((p) => createPriority(p)),
    ])
  } catch {
    // best effort
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState)

  useEffect(() => {
    dispatch({
      type: 'SYNC',
      payload: {
        jwt: localStorage.getItem('jwt'),
        refreshToken: localStorage.getItem('refreshToken'),
        firstName: localStorage.getItem('firstName') ?? '',
        lastName: localStorage.getItem('lastName') ?? '',
      },
    })
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== 'jwt') return
      dispatch({
        type: 'SYNC',
        payload: {
          jwt: e.newValue,
          refreshToken: localStorage.getItem('refreshToken'),
          firstName: localStorage.getItem('firstName') ?? '',
          lastName: localStorage.getItem('lastName') ?? '',
        },
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const res = await apiLogin(email, password)
    const data = res.data
    localStorage.setItem('jwt', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('firstName', data.firstName)
    localStorage.setItem('lastName', data.lastName)
    dispatch({ type: 'LOGIN', payload: data })
  }

  async function register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const res = await apiRegister(email, password, firstName, lastName)
    const data = res.data
    localStorage.setItem('jwt', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('firstName', data.firstName)
    localStorage.setItem('lastName', data.lastName)
    dispatch({ type: 'LOGIN', payload: data })
    await seedDefaults()
  }

  function logout(): void {
    localStorage.removeItem('jwt')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('firstName')
    localStorage.removeItem('lastName')
    dispatch({ type: 'LOGOUT' })
  }

  const fullName = `${state.firstName} ${state.lastName}`.trim()

  return (
    <AuthContext.Provider value={{ ...state, fullName, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
