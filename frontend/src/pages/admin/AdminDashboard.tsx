import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { getDashboardStats, getAdminOrders, type DashboardStats, type Order } from '../../api/admin'

interface MenuItem { title: string; desc: string; icon: string; href: string; active: boolean; adminOnly?: boolean; phase?: string }

const MENU: MenuItem[] = [
  { title: 'Productos', desc: 'Creá y gestioná el catálogo de MBDA', icon: '👗', href: '/admin/productos', active: true },
  { title: 'Retiros', desc: 'Pedidos listos para retirar en el local', icon: '🏷️', href: '/admin/retiros', active: true },
  { title: 'Ciclos de compra', desc: 'Cierres, despachos y pedidos agrupados por ciclo', icon: '🔁', href: '/admin/ciclos', active: true },
  { title: 'Pedidos', desc: 'Confirmá pagos y despachá pedidos', icon: '📦', href: '/admin/pedidos', active: true, adminOnly: true },
  { title: 'Revendedores', desc: 'Gestioná cuentas de revendedores', icon: '👥', href: '/admin/revendedores', active: true, adminOnly: true },
  { title: 'Cursos', desc: 'Videos de capacitación para revendedoras', icon: '🎓', href: '/admin/cursos', active: true },
  { title: 'Configuración', desc: 'CBU, alias, WhatsApp, plazos y legales', icon: '⚙️', href: '/admin/configuracion', active: true, adminOnly: true },
  { title: 'Landing Page', desc: 'Editá el contenido de la página de inicio', icon: '🖋️', href: '/admin/landing', active: true, adminOnly: true },
  { title: 'Subadmins', desc: 'Gestioná usuarios con acceso a productos', icon: '🔑', href: '/admin/subadmins', active: true, adminOnly: true },
]

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', PROOF_RECEIVED: 'Comprobante enviado', CONFIRMED: 'En preparación', DISPATCHED: 'Entregado', CANCELLED: 'Cancelado',
}
const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b', PROOF_RECEIVED: '#3b82f6', CONFIRMED: '#10b981', DISPATCHED: '#6366f1', CANCELLED: '#ef4444',
}

export function AdminDashboard() {
  const { user } = useAuthStore()
  const isSubAdmin = user?.role === 'SUBADMIN'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!isSubAdmin) {
      getDashboardStats().then(setStats).catch(() => null)
      getAdminOrders({ limit: 5 }).then(r => setRecentOrders(r.orders)).catch(() => null)
    }
  }, [isSubAdmin])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>
            Resumen general
          </h1>
          <span style={{ fontSize: '0.8125rem', color: '#6b7280', border: '1px solid #e0dbd0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', background: '#fff' }}>
            Este mes ▾
          </span>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Revendedoras', value: stats.activeResellers },
              { label: 'Ventas totales', value: `$${stats.totalSalesAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` },
              { label: 'Pedidos', value: stats.totalOrders },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e0dbd0', background: '#fff' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginTop: '0.375rem' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Últimos pedidos */}
        {!isSubAdmin && (
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0' }}>
              <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>Últimos pedidos</p>
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Sin pedidos todavía</p>
            ) : (
              <div>
                {recentOrders.map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #f5f3ef', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#6b7280', width: '60px' }}>#{o.orderNumber.replace('ORD-', '')}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111', flex: 1 }}>{o.reseller.storeName}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111' }}>${Number(o.total).toLocaleString('es-AR')}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', background: ORDER_STATUS_COLOR[o.status] + '18', color: ORDER_STATUS_COLOR[o.status] }}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: '0.875rem 1.25rem' }}>
              <Link to="/admin/pedidos" style={{ fontSize: '0.8125rem', color: '#C4693F', fontWeight: 600, textDecoration: 'none' }}>Ver todos los pedidos →</Link>
            </div>
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
