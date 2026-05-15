import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

const COLORS: Record<ToastType, { bg: string; color: string; border: string }> = {
  success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  error:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  info:    { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div
              key={t.id}
              style={{
                background: c.bg,
                color: c.color,
                border: `1px solid ${c.border}`,
                padding: '0.75rem 1.25rem',
                borderRadius: '0.875rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontSize: '0.875rem',
                fontWeight: 500,
                minWidth: '260px',
                maxWidth: '360px',
                pointerEvents: 'auto',
                animation: 'toastIn 0.25s ease',
              }}
            >
              {t.message}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
