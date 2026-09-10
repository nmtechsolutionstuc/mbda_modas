import { useState } from 'react'

const INP: React.CSSProperties = {
  padding: '0.65rem 0.875rem',
  borderRadius: '0.625rem',
  border: '1.5px solid #e0dbd0',
  width: '100%',
  fontSize: '0.9375rem',
  background: '#fff',
  outline: 'none',
  color: '#111',
  boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#1e1914',
  marginBottom: '0.25rem',
}
const BTN_PRIMARY: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  borderRadius: '0.625rem',
  border: 'none',
  cursor: 'pointer',
  background: '#111',
  color: '#f5f3ef',
  fontWeight: 600,
  fontSize: '0.875rem',
}
const BTN_GHOST: React.CSSProperties = {
  ...BTN_PRIMARY,
  background: 'transparent',
  color: '#6b7280',
  border: '1.5px solid #e0dbd0',
}

interface ConfirmPasswordModalProps {
  message: string
  onConfirm: (password: string) => void
  onCancel: () => void
}

export function ConfirmPasswordModal({ message, onConfirm, onCancel }: ConfirmPasswordModalProps) {
  const [pwd, setPwd] = useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, color: '#111', margin: 0 }}>
            🔒 Confirmá tu contraseña
          </h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            {message}
          </p>
          <label style={LABEL}>Contraseña</label>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pwd && onConfirm(pwd)}
            style={INP}
            placeholder="Tu contraseña actual"
            autoFocus
          />
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={BTN_GHOST}>Cancelar</button>
          <button
            onClick={() => pwd && onConfirm(pwd)}
            disabled={!pwd}
            style={{ ...BTN_PRIMARY, opacity: pwd ? 1 : 0.5 }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
