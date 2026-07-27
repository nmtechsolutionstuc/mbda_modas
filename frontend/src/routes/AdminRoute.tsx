import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../store/authStore'

function Spinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e0dbd0', borderTopColor: '#111', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/**
 * Protege rutas accesibles por ADMIN o SUBADMIN.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN' && user.role !== 'SUBADMIN') return <Navigate to="/" replace />

  return <>{children}</>
}

/**
 * Protege rutas exclusivas del rol ADMIN (no SUBADMIN).
 * Redirige al /admin si el usuario es SUBADMIN.
 */
export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'SUBADMIN') return <Navigate to="/admin/productos" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />

  return <>{children}</>
}
