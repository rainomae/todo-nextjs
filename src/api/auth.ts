import type { AxiosResponse } from 'axios'
import api from './axiosInstance'
import type { AuthData } from '../types'

export const login = (email: string, password: string): Promise<AxiosResponse<AuthData>> =>
  api.post('/Account/Login', { email, password })

export const register = (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AxiosResponse<AuthData>> =>
  api.post('/Account/Register', { email, password, firstName, lastName })

export const refreshToken = (jwt: string, refreshToken: string): Promise<AxiosResponse<AuthData>> =>
  api.post('/Account/RefreshToken', { jwt, refreshToken })
