import axios, { type InternalAxiosRequestConfig } from 'axios'
import { isExpiringSoon } from '../utils/jwt'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

const api = axios.create({ baseURL: BASE_URL })

let proactiveRefresh: Promise<string | null> | null = null

async function refreshNow(): Promise<string | null> {
  const jwt = localStorage.getItem('jwt')
  const refreshToken = localStorage.getItem('refreshToken')
  if (!jwt || !refreshToken) return null
  const res = await axios.post<{ token: string; refreshToken: string }>(
    `${BASE_URL}/Account/RefreshToken`,
    { jwt, refreshToken }
  )
  localStorage.setItem('jwt', res.data.token)
  localStorage.setItem('refreshToken', res.data.refreshToken)
  return res.data.token
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? ''
  if (url.includes('/Account/RefreshToken') || url.includes('/Account/Login') || url.includes('/Account/Register')) {
    return config
  }
  let token = localStorage.getItem('jwt')
  if (token && isExpiringSoon(token)) {
    proactiveRefresh ??= refreshNow().catch(() => null).finally(() => { proactiveRefresh = null })
    const newToken = await proactiveRefresh
    if (newToken) token = newToken
  }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => { failedQueue.push({ resolve, reject }) })
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original) })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      const jwt = localStorage.getItem('jwt')
      const refreshToken = localStorage.getItem('refreshToken')

      if (!jwt || !refreshToken) {
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post<{ token: string; refreshToken: string }>(
          `${BASE_URL}/Account/RefreshToken`,
          { jwt, refreshToken }
        )
        const newJwt = res.data.token
        const newRefresh = res.data.refreshToken
        localStorage.setItem('jwt', newJwt)
        localStorage.setItem('refreshToken', newRefresh)
        original.headers.Authorization = `Bearer ${newJwt}`
        processQueue(null, newJwt)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('jwt')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
