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

    if (error.response?.status !== 401 || originalRequest._retry) {
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
