import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { getMyCycles, type MyCycle, type CycleStatus } from '../../api/reseller'
import { useToast } from '../../context/ToastContext'
import { useAuthStore } from '../../store/authStore'
import { isReseller } from '../../types'

const STATUS_LABEL: Record<CycleStatus, string> = { OPEN: 'Activo', CLOSED: 'Preparación', PREPARING: 'En camino', DISPATCHED: 'Entregado' }
const STATUS_COLOR: Record<CycleStatus, string> = { OPEN: '#16a34a', CLOSED: '#f59e0b', PREPARING: '#6366f1', DISPATCHED: '#6b7280' }
const TABS: CycleStatus[] = ['OPEN', 'CLOSED', 'PREPARING', 'DISPATCHED']

function fmt(v: string | number) { return `$${Number(v).toLocaleString('es-AR')}` }
function fmtDate(iso: string) { return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }

function CycleCard({ entry }: { entry: MyCycle }) {
  const [open, setOpen] = useState(entry.cycle.status === 'OPEN')
  const { cycle, productCount, total, orders } = entry

  return (
    <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <div>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>Ciclo #{cycle.number}</p>
          {cycle.status === 'OPEN' && (
            <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Fecha límite para sumar: {fmtDate(cycle.closeAt)}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#111' }}>{productCount} producto{productCount !== 1 ? 's' : ''}</span>
          <span style={{ fontWeight: 700, color: 'var(--c-accent)' }}>{fmt(total)}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', background: STATUS_COLOR[cycle.status] + '18', color: STATUS_COLOR[cycle.status], border: `1px solid ${STATUS_COLOR[cycle.status]}40` }}>
            {STATUS_LABEL[cycle.status]}
          </span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #e0dbd0', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: '#faf9f7', borderRadius: '0.625rem', padding: '0.75rem 0.875rem' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111' }}>{order.orderNumber} — {order.buyerName}</p>
              {order.items.filter(i => !i.cancelled).map((item, i) => (
                <p key={i} style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                  {item.productName} — {item.color} · Talle {item.size} × {item.quantity}
                </p>
              ))}
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-accent)', marginTop: '0.25rem' }}>{fmt(order.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function normalizeCity(city: string | null) {
  return (city ?? '').trim().toLowerCase()
}

export function MyCyclesPage() {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const reseller = user && isReseller(user) ? user : null
  const isConcepcion = normalizeCity(reseller?.city ?? null) === 'concepción' || normalizeCity(reseller?.city ?? null) === 'concepcion'
  // De Concepción siempre retira en el local, más allá de lo que haya elegido antes.
  const effectiveMethod: 'PICKUP' | 'SHIPPING' = isConcepcion ? 'PICKUP' : (reseller?.deliveryMethod ?? 'SHIPPING')
  const [cycles, setCycles] = useState<MyCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<CycleStatus>('OPEN')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCycles(await getMyCycles())
    } catch {
      showToast('Error al cargar los pedidos del ciclo', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = cycles.filter(entry => entry.cycle.status === tab)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/panel" style={{ color: 'var(--c-accent)', textDecoration: 'none' }}>Panel</Link> / Pedidos del ciclo
        </p>
        <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '0.875rem' }}>Pedidos del ciclo</h1>

        {reseller && (
          <div style={{ background: effectiveMethod === 'PICKUP' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${effectiveMethod === 'PICKUP' ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: effectiveMethod === 'PICKUP' ? '#166534' : '#1e40af' }}>
            {effectiveMethod === 'PICKUP'
              ? <>🏪 Al cerrar el ciclo, <strong>retirás vos</strong> los pedidos confirmados en el local de Concepción.</>
              : <>📦 Al cerrar el ciclo, <strong>MBDA te despacha</strong> los pedidos confirmados a {reseller.address ?? 'tu dirección'}, {reseller.city ?? '—'} (CP {reseller.postalCode ?? '—'}).</>
            }
            {!isConcepcion && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>
                <Link to="/panel/perfil" style={{ color: 'inherit', textDecoration: 'underline' }}>Podés cambiarlo en Mi cuenta.</Link>
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem', background: '#e8e3d5', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(s => (
            <button
              key={s}
              onClick={() => setTab(s)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                background: tab === s ? '#fff' : 'transparent', color: tab === s ? 'var(--c-accent)' : '#6b7280',
                boxShadow: tab === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No hay ciclos en "{STATUS_LABEL[tab]}"</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(entry => <CycleCard key={entry.cycle.id} entry={entry} />)}
          </div>
        )}

        <p style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button onClick={() => setTab('DISPATCHED')} style={{ background: 'transparent', border: 'none', color: 'var(--c-accent)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            Ver historial de ciclos →
          </button>
        </p>
      </div>
    </div>
  )
}
