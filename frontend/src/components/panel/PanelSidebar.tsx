import { Link, useLocation, useNavigate } from 'react-router'
import {
  Menu, X, Home, ShoppingBag, ClipboardList, Receipt, Store, User, LogOut, HelpCircle, GraduationCap,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { logoutApi } from '../../api/auth'
import { getPublicConfig } from '../../api/public'
import { isReseller } from '../../types'

// El panel es de uso principal desde el celular — en pantallas angostas la
// barra lateral (240px fijos) no entraba y empujaba todo el contenido fuera
// de la pantalla (scroll horizontal roto). Acá pasa a ser un cajón que se
// abre con el botón de menú en vez de ocupar espacio siempre.
// El ancho, posición y transform viven todos acá (no inline en el <aside>) —
// mezclar inline style con reglas de la hoja de estilos para las MISMAS
// propiedades no funciona: el inline siempre gana, así que la media query de
// abajo nunca se aplicaría si "position"/"width" quedaran también inline.
const RESPONSIVE_CSS = `
  .panel-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 0; transform: none; }
  .panel-mobile-topbar { display: none; }
  .panel-backdrop { display: none; }
  @media (max-width: 768px) {
    .panel-sidebar {
      position: fixed; inset: 0 auto 0 0; z-index: 1000; height: 100vh;
      transform: translateX(-100%); transition: transform 0.22s ease;
    }
    .panel-sidebar.open { transform: translateX(0); }
    .panel-mobile-topbar {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem;
      background: #fff; border-bottom: 1px solid var(--c-line);
      position: fixed; top: 0; left: 0; right: 0; z-index: 900;
    }
    /* El topbar queda fixed (fuera del flujo), así que el contenido necesita
       lugar para no quedar tapado debajo — altura real del topbar ~54px. */
    .panel-content { padding-top: 54px; }
    .panel-backdrop.open {
      display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999;
    }
    .panel-sidebar-close { display: block !important; }
  }
`

// Panel simplificado a lo esencial: catálogo, pedidos, cobrar. El ciclo y el
// retiro/despacho de cada pedido se ven directo en "Mis ventas", sin una
// página aparte. El ranking y las comisiones detalladas siguen andando por
// atrás y se pueden volver a mostrar más adelante sin perder nada.
const ITEMS = [
  { label: 'Inicio', href: '/panel', icon: Home },
  { label: 'Productos', href: '/panel/catalogo', icon: ShoppingBag },
  { label: 'Reservas', href: '/panel/reservar', icon: ClipboardList },
  { label: 'Mis ventas', href: '/panel/ventas', icon: Receipt },
]

const EXTRA_ITEMS = [
  { label: 'Cursos', href: '/panel/cursos', icon: GraduationCap },
  { label: 'Mi cuenta', href: '/panel/perfil', icon: User },
]

export function PanelSidebar() {
  const { user, clearAuth } = useAuthStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [helpUrl, setHelpUrl] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getPublicConfig().then(c => setHelpUrl(c.helpUrl)).catch(() => {})
  }, [])

  // Cerrar el cajón al cambiar de página (mobile)
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    try { await logoutApi() } catch { /* ignorar errores de red */ }
    clearAuth()
    navigate('/', { replace: true })
  }

  const storeName = user && isReseller(user) ? user.storeName : ''
  const storeSlug = user && isReseller(user) ? user.storeSlug : ''

  function navLinkStyle(active: boolean): React.CSSProperties {
    return {
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '0.625rem',
      textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
      color: active ? 'var(--c-accent)' : '#6b7280', background: active ? 'var(--c-softAlt)' : 'transparent',
    }
  }

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      {/* Barra superior — solo visible en mobile (≤768px) */}
      <div className="panel-mobile-topbar">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Menu size={22} color="#2B1B12" />
        </button>
        <Link to="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', color: '#2B1B12', textDecoration: 'none' }}>MBDA</Link>
      </div>

      {/* Fondo oscuro al abrir el cajón en mobile */}
      <div className={`panel-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`panel-sidebar${open ? ' open' : ''}`} style={{
        background: '#fff', borderRight: '1px solid var(--c-line)',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
      <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Menu size={20} color="#2B1B12" />
          <div>
            <Link to="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', color: '#2B1B12', textDecoration: 'none' }}>MBDA</Link>
            {storeName && <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{storeName}</p>}
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="panel-sidebar-close" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
          <X size={20} color="#6b7280" />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href} style={navLinkStyle(pathname === item.href)}>
              <Icon size={17} /> {item.label}
            </Link>
          )
        })}
        {storeSlug && (
          <a href={`/tienda/${storeSlug}`} target="_blank" rel="noopener noreferrer" style={navLinkStyle(false)}>
            <Store size={17} /> Mi tienda
          </a>
        )}
        {EXTRA_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href} style={navLinkStyle(pathname === item.href)}>
              <Icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--c-line)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {helpUrl && (
          <a href={helpUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '0.625rem', textDecoration: 'none', fontSize: '0.8125rem', color: '#9ca3af' }}>
            <HelpCircle size={16} /> ¿Tenés dudas?
          </a>
        )}
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
