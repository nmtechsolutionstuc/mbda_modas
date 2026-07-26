import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { logoutApi } from '../../api/auth'
import { getPublicConfig } from '../../api/public'
import { isReseller } from '../../types'

export function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [helpUrl, setHelpUrl] = useState('')

  useEffect(() => {
    if (user?.role === 'RESELLER') {
      getPublicConfig().then(c => setHelpUrl(c.helpUrl)).catch(() => {/* silencioso */})
    }
  }, [user?.role])

  async function handleLogout() {
    try { await logoutApi() } catch { /* ignorar errores de red */ }
    clearAuth()
    navigate('/', { replace: true })
  }

  const navStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#fff',
    borderBottom: '1px solid #e0dbd0',
    padding: '0 1.5rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }

  const logoStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.01em',
  }

  const linkStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#6b7280',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    transition: 'color 0.15s, background 0.15s',
    textDecoration: 'none',
  }

  const btnStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    background: '#111',
    color: '#f5f3ef',
    padding: '0.5rem 1.25rem',
    borderRadius: '0.625rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  }

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <Link to="/" style={logoStyle}>
        MBDA
      </Link>

      {/* Links condicionales */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!user && (
          <>
            <Link to="/login" style={linkStyle}>
              Ingresar
            </Link>
            <Link to="/registro" style={{ ...btnStyle }}>
              Registrarse
            </Link>
          </>
        )}

        {user && user.role === 'RESELLER' && (
          <>
            <Link to="/panel" style={linkStyle}>
              Mi Panel
            </Link>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {isReseller(user) ? user.storeName : ''}
            </span>
            {helpUrl && (
              <a href={helpUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: '#b8922a' }}>
                ¿Tenés dudas?
              </a>
            )}
            <button onClick={handleLogout} style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer' }}>
              Salir
            </button>
          </>
        )}

        {user && (user.role === 'ADMIN' || user.role === 'SUBADMIN') && (
          <>
            <Link to="/admin" style={linkStyle}>
              {user.role === 'SUBADMIN' ? 'Productos' : 'Admin'}
            </Link>
            {user.role === 'SUBADMIN' && (
              <span style={{ fontSize: '0.75rem', background: '#f5f3ef', color: '#b8922a', padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid #e8e3d5', fontWeight: 600 }}>
                Subadmin
              </span>
            )}
            <button onClick={handleLogout} style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer' }}>
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
