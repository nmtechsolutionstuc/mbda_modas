import axiosClient from './axiosClient'
import type { User } from '../types'

interface AuthResult {
  accessToken: string
  user: User
}

export async function adminLogin(email: string, password: string): Promise<AuthResult> {
  const { data } = await axiosClient.post<{ success: true; data: AuthResult }>('/auth/admin/login', { email, password })
  return data.data
}

export async function resellerLogin(email: string, password: string): Promise<AuthResult> {
  const { data } = await axiosClient.post<{ success: true; data: AuthResult }>('/auth/reseller/login', { email, password })
  return data.data
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  whatsapp: string
  storeName: string
  acceptTerms: true
}

export async function resellerRegister(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await axiosClient.post<{ success: true; data: AuthResult }>('/auth/reseller/register', payload)
  return data.data
}

export async function logoutApi(): Promise<void> {
  await axiosClient.post('/auth/logout')
}

export async function fetchMe(): Promise<User> {
  const { data } = await axiosClient.get<{ success: true; data: User }>('/auth/me')
  return data.data
}
