import { Link, useLocation, useNavigate } from 'react-router'
import {
  Menu, X, LayoutDashboard, ShoppingBag, Store, Boxes, Package, Users, Image, Settings, UserCog, LogOut, GraduationCap,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { logoutApi } from '../../api/auth'
import { isAdminLike } from '../../types'

// Mismo cajón responsive que el panel de revendedora — a 240px fijos, la
// barra lateral no entraba en el celular y rompía el scroll horizontal.
const RESPONSIVE_CSS = `
  .admin-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 0; transform: none; }
  .admin-mobile-topbar { display: none; }
  .admin-backdrop { display: none; }
  @media (max-width: 768px) {
    .admin-sidebar {
      position: fixed; inset: 0 auto 0 0; z-index: 1000; height: 100vh;
      transform: translateX(-100%); transition: transform 0.22s ease;
    }
    .admin-sidebar.open { transform: translateX(0); }
    .admin-mobile-topbar {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem;
      background: #fff; border-bottom: 1px solid #EFE6DA;
      position: fixed; top: 0; left: 0; right: 0; z-index: 900;
    }
    /* El topbar queda fixed (fuera del flujo), así que el contenido necesita
       lugar para no quedar tapado debajo — altura real del topbar ~54px. */
    .admin-content { padding-top: 54px; }
    .admin-backdrop.open {
      display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999;
    }
    .admin-sidebar-close { display: block !important; }
  }
`

const ITEMS = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard, adminOnly: false },
  { label: 'Productos', href: '/admin/productos', icon: ShoppingBag, adminOnly: false },
  { label: 'Retiros', href: '/admin/retiros', icon: Store, adminOnly: false },
  { label: 'Ciclos de compra', href: '/admin/ciclos', icon: Boxes, adminOnly: false },
  { label: 'Pedidos', href: '/admin/pedidos', icon: Package, adminOnly: true },
  { label: 'Revendedoras', href: '/admin/revendedores', icon: Users, adminOnly: true },
  { label: 'Landing', href: '/admin/landing', icon: Image, adminOnly: true },
  { label: 'Cursos', href: '/admin/cursos', icon: GraduationCap, adminOnly: false },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings, adminOnly: true },
  { label: 'Subadmins', href: '/admin/subadmins', icon: UserCog, adminOnly: true },
]

export function AdminSidebar() {
  const { user, clearAuth } = useAuthStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isSubAdmin = user?.role === 'SUBADMIN'
  const name = user && isAdminLike(user) ? user.name : 'Admin'
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    try { await logoutApi() } catch { /* ignorar errores de red */ }
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div className="admin-mobile-topbar">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Menu size={22} color="#2B1B12" />
        </button>
        <Link to="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', color: '#2B1B12', textDecoration: 'none' }}>MBDA</Link>
      </div>

      <div className={`admin-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`admin-sidebar${open ? ' open' : ''}`} style={{
        background: '#fff', borderRight: '1px solid #EFE6DA',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
      <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Menu size={20} color="#2B1B12" />
          <div>
            <Link to="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', color: '#2B1B12', textDecoration: 'none' }}>MBDA</Link>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {name} {isSubAdmin && <span style={{ background: '#F7E4D6', color: '#C4693F', padding: '0.1rem 0.4rem', borderRadius: '99px', fontSize: '0.6875rem', marginLeft: '0.25rem' }}>Subadmin</span>}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="admin-sidebar-close" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
          <X size={20} color="#6b7280" />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {ITEMS.filter(item => !isSubAdmin || !item.adminOnly).map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '0.625rem',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
                color: active ? '#C4693F' : '#6b7280', background: active ? '#F7E4D6' : 'transparent',
              }}
            >
              <Icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid #EFE6DA' }}>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '0.625rem', border: 'none', background: 'transparent', color: '#6b7280', fontSize: '0.8125rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <LogOut size={16} /> Salir
        </button>
      </div>
      </aside>
    </>
  )
}
