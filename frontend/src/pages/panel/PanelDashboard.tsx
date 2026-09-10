import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../context/ToastContext'
import { isReseller } from '../../types'
import { markOnboardingSeen, getDashboardSummary, type DashboardSummary } from '../../api/reseller'

function fmtMoney(n: number) {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

function deltaCaption(current: number, previous: number, unit: 'money' | 'count'): string {
  if (previous <= 0) return current > 0 ? 'nuevo este mes' : 'sin cambios vs mes anterior'
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  const sign = diff >= 0 ? '+' : ''
  if (unit === 'count') return `${sign}${diff} vs mes anterior`
  return `${sign}${pct}% vs mes anterior`
}

// ── Resumen (ventas, pedidos, reservas del mes) ───────────────────────────────

function ResumenStats({ summary }: { summary: DashboardSummary | null }) {
  const stats = [
    {
      label: 'Ventas',
      value: summary ? fmtMoney(summary.salesThisMonth) : '—',
      caption: summary ? deltaCaption(summary.salesThisMonth, summary.salesLastMonth, 'money') : '',
    },
    {
      label: 'Pedidos',
      value: summary ? summary.ordersThisMonth : '—',
      caption: summary ? deltaCaption(summary.ordersThisMonth, summary.ordersLastMonth, 'count') : '',
    },
    {
      label: 'Reservas',
      value: summary ? summary.pendingReservations : '—',
      caption: 'Pendientes de pago',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e0dbd0' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>{s.label}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111', lineHeight: 1.2, margin: '0.25rem 0' }}>{s.value}</p>
          {s.caption && <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.caption}</p>}
        </div>
      ))}
    </div>
  )
}

const ONBOARDING_STEPS = [
  { icon: '🛍️', title: 'Armá tu catálogo', desc: 'Elegí productos de MBDA Modas, definí tu precio de venta y mostralos en tu tienda pública.' },
  { icon: '📋', title: 'Reservá para tus clientas', desc: 'Cuando una clienta te confirma la compra por WhatsApp, cargás la reserva vos. MBDA verifica el pago y recién ahí se descuenta el stock.' },
  { icon: '💰', title: 'Cómo funciona tu ganancia', desc: 'Si vendés al precio oficial, ganás la comisión de ese producto. Si le sumás un aumento, esa diferencia es tuya — nunca por debajo del precio oficial.' },
  { icon: '📦', title: 'Ciclos y despacho', desc: 'Cada venta confirmada se suma al ciclo de compra abierto. En Concepción retirás en el local; fuera de Concepción, MBDA despacha a tu domicilio.' },
]

function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem 1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem', textAlign: 'center' }}>
          ¡Bienvenida a MBDA! 🎉
        </h2>
        <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Esto es lo que podés hacer desde tu panel:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{step.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{step.title}</p>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
        >
          Entendido, ¡empecemos!
        </button>
      </div>
    </div>
  )
}

interface QuickLink { title: string; icon: string; href: string }
const QUICK_LINKS: QuickLink[] = [
  { title: 'Mi catálogo', icon: '🛍️', href: '/panel/catalogo' },
  { title: 'Crear reserva', icon: '📋', href: '/panel/reservar' },
  { title: 'Mis ventas', icon: '🧾', href: '/panel/ventas' },
  { title: 'Mi cuenta', icon: '⚙️', href: '/panel/perfil' },
]

export function PanelDashboard() {
  const { user, setUser } = useAuthStore()
  const { showToast } = useToast()
  const reseller = user && isReseller(user) ? user : null
  const storeName = reseller?.storeName ?? ''
  const storeSlug = reseller?.storeSlug ?? ''
  const [showOnboarding, setShowOnboarding] = useState(!!reseller && !reseller.onboardingSeenAt)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch(() => {/* silencioso */})
  }, [])

  async function closeOnboarding() {
    setShowOnboarding(false)
    try {
      const updated = await markOnboardingSeen()
      if (reseller) setUser({ ...reseller, onboardingSeenAt: updated.onboardingSeenAt })
    } catch { /* si falla, se le vuelve a mostrar en el próximo ingreso */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', fontWeight: 700, color: '#111' }}>
              Resumen
            </h1>
            {storeName && (
              <p style={{ color: '#6b7280', marginTop: '0.125rem' }}>
                Tienda: <strong style={{ color: '#111' }}>{storeName}</strong>
              </p>
            )}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Este mes</span>
        </div>

        <ResumenStats summary={summary} />

        {/* Link único */}
        {storeSlug && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0dbd0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>El link de tu tienda</p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                  {window.location.origin}/tienda/{storeSlug}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <a
                  href={`/tienda/${storeSlug}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#fff', color: '#111', padding: '0.625rem 1.375rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  Ver mi tienda
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tienda/${storeSlug}`)
                      .then(() => showToast('¡Link copiado al portapapeles!', 'success'))
                      .catch(() => showToast('No se pudo copiar el link', 'error'))
                  }}
                  style={{ background: '#111', color: '#f5f3ef', padding: '0.625rem 1.375rem', borderRadius: '0.625rem', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  📋 Copiar link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.05rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>
          Accesos rápidos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {QUICK_LINKS.map(item => (
            <Link
              key={item.title}
              to={item.href}
              style={{ background: '#fff', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #e0dbd0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111' }}>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
    </div>
  )
}
