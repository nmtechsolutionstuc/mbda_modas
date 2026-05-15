import { createContext, useContext, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import { fetchMe } from '../api/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  isAdmin: boolean
  isReseller: boolean
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAdmin: false,
  isReseller: false,
})

// Flag de módulo para evitar refresh concurrentes (StrictMode dispara useEffect 2 veces)
let refreshInProgress = false

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accessToken, user, setAuth, clearAuth, setLoading } = useAuthStore()
  const didRun = useRef(false)

  useEffect(() => {
    // Evitar doble ejecución en StrictMode
    if (didRun.current) return
    didRun.current = true

    // Caso 1: estado completo restaurado desde localStorage → listo
    if (accessToken && user) {
      setLoading(false)
      return
    }

    // Caso 2: token en memoria pero sin datos de usuario (inconsistencia)
    if (accessToken && !user) {
      fetchMe()
        .then(u => setAuth(u, accessToken))
        .catch(() => clearAuth())
      return
    }

    // Caso 3: sin token → intentar refresh silencioso con la httpOnly cookie
    if (!accessToken) {
      if (refreshInProgress) return
      refreshInProgress = true

      import('../api/axiosClient').then(({ default: axiosClient }) => {
        axiosClient
          .post('/auth/refresh')
          .then(({ data }) => {
            const newToken: string = data.data.accessToken
            useAuthStore.setState({ accessToken: newToken })
            return fetchMe().then(u => setAuth(u, newToken))
          })
          .catch(() => {
            if (!useAuthStore.getState().user) {
              clearAuth()
            } else {
              setLoading(false)
            }
          })
          .finally(() => {
            refreshInProgress = false
          })
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: AuthContextValue = {
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isReseller: user?.role === 'RESELLER',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
