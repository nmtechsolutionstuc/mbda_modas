import { useAuthStore } from '../../store/authStore'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const name = user?.role === 'ADMIN' ? user.name : 'Admin'

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#b8922a', fontWeight: 600, marginBottom: '0.25rem' }}>
            Panel de administración
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#111' }}>
            Bienvenido, {name}
          </h1>
        </div>

        {/* Módulos — se habilitan en Phase 2+ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            { title: 'Productos', desc: 'Creá y gestioná el catálogo de MBDA', icon: '👗', href: '/admin/productos', disabled: true },
            { title: 'Pedidos', desc: 'Confirmá pagos y despachá pedidos', icon: '📦', href: '/admin/pedidos', disabled: true },
            { title: 'Revendedores', desc: 'Gestioná cuentas de revendedores', icon: '👥', href: '/admin/revendedores', disabled: true },
            { title: 'Configuración', desc: 'CBU, alias, días de despacho', icon: '⚙️', href: '/admin/configuracion', disabled: true },
            { title: 'Landing', desc: 'Editá el contenido de la página de inicio', icon: '🖋️', href: '/admin/landing', disabled: true },
          ].map(item => (
            <div
              key={item.title}
              style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', opacity: item.disabled ? 0.5 : 1 }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item.desc}</p>
              {item.disabled && (
                <span style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.75rem', background: '#f5f3ef', color: '#b8922a', padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid #e8e3d5' }}>
                  Fase 2
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
