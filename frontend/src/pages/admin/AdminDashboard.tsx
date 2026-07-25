import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getDashboardStats, type DashboardStats } from '../../api/admin'
import { isAdminLike } from '../../types'

interface MenuItem { title: string; desc: string; icon: string; href: string; active: boolean; adminOnly?: boolean; phase?: string }

const MENU: MenuItem[] = [
  { title: 'Productos', desc: 'Creá y gestioná el catálogo de MBDA', icon: '👗', href: '/admin/productos', active: true },
  { title: 'Configuración', desc: 'CBU, alias, WhatsApp, pedidos', icon: '⚙️', href: '/admin/configuracion', active: true, adminOnly: true },
  { title: 'Landing Page', desc: 'Editá el contenido de la página de inicio', icon: '🖋️', href: '/admin/landing', active: true, adminOnly: true },
  { title: 'Pedidos', desc: 'Confirmá pagos y despachá pedidos', icon: '📦', href: '/admin/pedidos', active: true, adminOnly: true },
  { title: 'Revendedores', desc: 'Gestioná cuentas de revendedores', icon: '👥', href: '/admin/revendedores', active: true, adminOnly: true },
  { title: 'Subadmins', desc: 'Gestioná usuarios con acceso a productos', icon: '🔑', href: '/admin/subadmins', active: true, adminOnly: true },
]

export function AdminDashboard() {
  const { user } = useAuthStore()
  const isSubAdmin = user?.role === 'SUBADMIN'
  const name = user && isAdminLike(user) ? user.name : 'Admin'
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (!isSubAdmin) {
      getDashboardStats().then(setStats).catch(() => null)
    }
  }, [isSubAdmin])

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#b8922a', fontWeight: 600, marginBottom: '0.25rem' }}>Panel de administración</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#111' }}>
            Bienvenido, {name}
          </h1>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Productos activos', value: stats.activeProducts, sub: `${stats.totalProducts} total`, highlight: false },
              { label: 'Categorías', value: stats.totalCategories, sub: 'activas', highlight: false },
              { label: 'Revendedores activos', value: stats.activeResellers, sub: `${stats.totalResellers} registrados`, highlight: false },
              { label: 'Pedidos pendientes', value: stats.pendingOrders, sub: 'esperan confirmación', highlight: stats.pendingOrders > 0 },
              { label: 'Comisiones pendientes', value: `$${Number(stats.pendingCommissionsAmount).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`, sub: 'por pagar a revendedores', highlight: false },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: '1rem', padding: '1.25rem', border: `1px solid ${s.highlight ? '#fcd34d' : '#e0dbd0'}`, background: s.highlight ? '#fffbeb' : '#fff' }}>
                <p style={{ fontSize: typeof s.value === 'number' ? '1.875rem' : '1.375rem', fontWeight: 700, color: s.highlight ? '#d97706' : '#b8922a', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111', marginTop: '0.25rem' }}>{s.label}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Badge de rol */}
        {isSubAdmin && (
          <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e0dbd0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔑</span>
            <div>
              <p style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>Acceso de Subadmin</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Podés gestionar productos y categorías del catálogo.</p>
            </div>
          </div>
        )}

        {/* Módulos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {MENU.filter(item => !isSubAdmin || !item.adminOnly).map(item => (
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
