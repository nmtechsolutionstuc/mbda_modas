import { useAuthStore } from '../../store/authStore'
import { isReseller } from '../../types'

export function PanelDashboard() {
  const { user } = useAuthStore()
  const name = user && isReseller(user) ? user.firstName : 'Revendedor'
  const storeName = user && isReseller(user) ? user.storeName : ''
  const refCode = user && isReseller(user) ? user.referralCode : ''

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
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Tienda: <strong style={{ color: '#111' }}>{storeName}</strong></p>
          )}
        </div>

        {/* Tu código de referido */}
        {refCode && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tu código de revendedor</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#b8922a', letterSpacing: '0.08em' }}>
                {refCode}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/catalogo?ref=${refCode}`)}
              style={{ background: '#111', color: '#f5f3ef', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Copiar link
            </button>
          </div>
        )}

        {/* Próximas funciones — Phase 2+ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { title: 'Mi Catálogo', desc: 'Agregá y gestioná tus productos', icon: '🛍️', href: '/panel/catalogo', disabled: true },
            { title: 'Mis Ventas', desc: 'Seguí el estado de tus pedidos', icon: '📦', href: '/panel/ventas', disabled: true },
            { title: 'Mis Comisiones', desc: 'Revisá tus ganancias', icon: '💰', href: '/panel/comisiones', disabled: true },
            { title: 'Mi Perfil', desc: 'Editá los datos de tu tienda', icon: '⚙️', href: '/panel/perfil', disabled: true },
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
                  Próximamente
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
