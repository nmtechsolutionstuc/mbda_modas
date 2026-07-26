import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../context/ToastContext'
import { isReseller } from '../../types'

interface MenuItem { title: string; desc: string; icon: string; href: string; active: boolean; phase?: string }
const MENU: MenuItem[] = [
  { title: 'Mi Catálogo', desc: 'Agregá y gestioná tus productos con tus precios', icon: '🛍️', href: '/panel/catalogo', active: true },
  { title: 'Mi Perfil', desc: 'Editá los datos de tu tienda y datos de cobro', icon: '⚙️', href: '/panel/perfil', active: true },
  { title: 'Mis Ventas', desc: 'Seguí el estado de tus pedidos', icon: '📦', href: '/panel/ventas', active: true },
  { title: 'Mis Comisiones', desc: 'Revisá tus ganancias acumuladas', icon: '💰', href: '/panel/comisiones', active: true },
  { title: 'Mis Prendas', desc: 'Publicá tus propias prendas en la vitrina', icon: '🎽', href: '/panel/mis-prendas', active: true },
]

export function PanelDashboard() {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const reseller = user && isReseller(user) ? user : null
  const name      = reseller?.firstName ?? 'Revendedor'
  const storeName = reseller?.storeName ?? ''
  const refCode   = reseller?.referralCode ?? ''

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#b8922a', fontWeight: 600, marginBottom: '0.25rem' }}>
            Panel de revendedor
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#111' }}>
            ¡Hola, {name}! 👋
          </h1>
          {storeName && (
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Tienda: <strong style={{ color: '#111' }}>{storeName}</strong>
            </p>
          )}
        </div>

        {/* Link único */}
        {refCode && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tu link de catálogo único</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#b8922a', letterSpacing: '0.06em' }}>
                  {refCode}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                  {window.location.origin}/catalogo?ref={refCode}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/catalogo?ref=${refCode}`)
                    .then(() => showToast('¡Link copiado al portapapeles!', 'success'))
                    .catch(() => showToast('No se pudo copiar el link', 'error'))
                }}
                style={{ background: '#111', color: '#f5f3ef', padding: '0.625rem 1.375rem', borderRadius: '0.625rem', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              >
                📋 Copiar link
              </button>
            </div>
          </div>
        )}

        {/* Módulos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {MENU.map(item => (
            item.active
              ? (
                <Link
                  key={item.title}
                  to={item.href}
                  style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item.desc}</p>
                  <p style={{ marginTop: '0.875rem', fontSize: '0.8125rem', color: '#b8922a', fontWeight: 600 }}>Ir →</p>
                </Link>
              ) : (
                <div key={item.title} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', opacity: 0.5 }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item.desc}</p>
                  <span style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.75rem', background: '#f5f3ef', color: '#b8922a', padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid #e8e3d5' }}>
                    {item.phase}
                  </span>
                </div>
              )
          ))}
        </div>
      </div>
    </div>
  )
}
