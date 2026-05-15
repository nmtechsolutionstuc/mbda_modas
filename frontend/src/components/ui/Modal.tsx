import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = '640px' }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          animation: 'modalIn 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e0dbd0',
        }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#f5f3ef', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', cursor: 'pointer',
              fontSize: '1.25rem', color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>

      <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
