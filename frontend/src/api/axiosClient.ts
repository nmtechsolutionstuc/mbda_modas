import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // envía httpOnly cookie de refresh token
})

// Adjunta el access token a cada request
axiosClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el servidor devuelve 401, intenta renovar el token y reintenta
let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

axiosClient.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config

    // Solo intentar refresh si hay un usuario autenticado (no en rutas públicas).
    // El admin no tiene refresh token propio (sesión stateless) — si se intentara
    // igual, la cookie de refresh de una revendedora con la que se haya iniciado
    // sesión antes en el mismo navegador terminaría reautenticando con esa otra
    // identidad y rol equivocados.
    const currentUser = useAuthStore.getState().user
    const hasSession = !!useAuthStore.getState().accessToken || !!currentUser
    const canRefresh = currentUser?.role === 'RESELLER'
    // Un 401 de /login o /register significa "credenciales inválidas", nunca
    // "token vencido" — nunca hay que reintentarlo vía refresh. Sin este freno,
    // un intento de login fallido mientras queda una sesión de revendedora
    // silenciosa (cookie de refresh de otra cuenta) disparaba un refresh y
    // reintentaba el login igual, duplicando el gasto del límite de intentos.
    const isAuthEndpoint = typeof originalRequest.url === 'string' && /\/(login|register)\b/.test(originalRequest.url)
    if (error.response?.status !== 401 || originalRequest._retry || !hasSession || !canRefresh || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise(resolve => {
        pendingRequests.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(axiosClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      const newToken: string = data.data.accessToken
      useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken)
      pendingRequests.forEach(cb => cb(newToken))
      pendingRequests = []
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axiosClient(originalRequest)
    } catch (refreshError) {
      const status = (refreshError as { response?: { status?: number } })?.response?.status
      if (status === 401 || status === 403) {
        useAuthStore.getState().clearAuth()
      }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosClient
