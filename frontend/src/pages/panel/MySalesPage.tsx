import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router'
import { Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import axiosClient from '../../api/axiosClient'
import { useToast } from '../../context/ToastContext'
import { cancelMyOrder, getMyCycles, type MyCycle } from '../../api/reseller'
import { getPublicConfig } from '../../api/public'
import { useAuthStore } from '../../store/authStore'
import { isReseller } from '../../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING' | 'PROOF_RECEIVED' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED'

interface SaleItem {
  id: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: string
  subtotal: string
  cancelled: boolean
}

interface Sale {
  id: string
  orderNumber: string
  buyerName: string
  buyerWhatsapp: string
  pickupBy: 'BUYER' | 'RESELLER'
  paymentMethod: 'TRANSFER' | 'CASH' | null
  cashDueDate: string | null
  subtotal: string
  total: string
  status: OrderStatus
  cancelReason: string | null
  reservedUntil: string
  trackingNumber: string | null
  createdAt: string
  items: SaleItem[]
  cycle: { number: number; status: 'OPEN' | 'CLOSED' | 'PREPARING' | 'DISPATCHED' } | null
}

const CYCLE_STATUS_LABEL: Record<'OPEN' | 'CLOSED' | 'PREPARING' | 'DISPATCHED', string> = {
  OPEN: 'Activo', CLOSED: 'Preparación', PREPARING: 'En camino', DISPATCHED: 'Entregado',
}

interface SalesResponse {
  orders: Sale[]
  total: number
  page: number
  totalPages: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de pago',
  PROOF_RECEIVED: 'Comprobante enviado',
  CONFIRMED: 'Pago confirmado',
  DISPATCHED: 'Despachado',
  CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  PROOF_RECEIVED: '#3b82f6',
  CONFIRMED: '#10b981',
  DISPATCHED: '#6366f1',
  CANCELLED: '#ef4444',
}

const PICKUP_LABEL: Record<'BUYER' | 'RESELLER', string> = {
  BUYER: 'Retira el comprador en el local',
  RESELLER: 'Retirás vos con comprobante y le entregás al comprador',
}

function fmt(val: string | number) {
  return `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '99px',
      fontSize: '0.75rem', fontWeight: 600,
      background: STATUS_COLOR[status] + '20', color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Modal detalle de venta ────────────────────────────────────────────────────

function SaleModal({ sale, payment, onClose, onChanged }: {
  sale: Sale; payment: { cbu: string; alias: string } | null; onClose: () => void; onChanged: () => void
}) {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const reseller = user && isReseller(user) ? user : null
  const normalizedCity = (reseller?.city ?? '').trim().toLowerCase()
  const isConcepcion = normalizedCity === 'concepción' || normalizedCity === 'concepcion'
  const myDeliveryMethod: 'PICKUP' | 'SHIPPING' = isConcepcion ? 'PICKUP' : (reseller?.deliveryMethod ?? 'SHIPPING')
  const remainingMs = new Date(sale.reservedUntil).getTime() - Date.now()
  const hoursLeft = Math.max(0, Math.floor(remainingMs / 3600000))
  const [cancelling, setCancelling] = useState(false)

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => showToast('Copiado', 'success'))
  }

  async function doCancel() {
    if (!confirm('¿Cancelar esta reserva? El stock vuelve a estar disponible.')) return
    setCancelling(true)
    try {
      await cancelMyOrder(sale.id)
      showToast('Reserva cancelada', 'success')
      onChanged()
      onClose()
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al cancelar', 'error')
    }
    setCancelling(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "var(--f-display)", fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>{sale.orderNumber}</h2>
            <StatusBadge status={sale.status} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Comprador */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Comprador</h3>
            {[
              { label: 'Nombre', value: sale.buyerName },
              { label: 'WhatsApp', value: sale.buyerWhatsapp },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Productos */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Productos</h3>
            {sale.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem', opacity: item.cancelled ? 0.4 : 1 }}>
                <span>{item.productName} — {item.size}/{item.color} ×{item.quantity}{item.cancelled ? ' (cancelado)' : ''}</span>
                <span style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--c-accent)' }}>
              Total: {fmt(sale.total)}
            </div>
          </div>

          {/* Info de reserva */}
          {sale.status === 'PENDING' && hoursLeft > 0 && sale.paymentMethod === 'CASH' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#92400e' }}>
              <p style={{ margin: 0 }}>
                💵 Esta venta va a pagarse en efectivo. Tenés hasta el{' '}
                <strong>{sale.cashDueDate ? new Date(sale.cashDueDate).toLocaleDateString('es-AR') : `${hoursLeft}h`}</strong>
                {' '}antes de que se cancele la reserva. Avisale a MBDA por WhatsApp apenas cobres para que confirme el pago.
              </p>
            </div>
          )}
          {sale.status === 'PENDING' && hoursLeft > 0 && sale.paymentMethod !== 'CASH' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#92400e' }}>
              <p style={{ margin: 0 }}>
                ⏳ Stock reservado por <strong>{hoursLeft}h</strong> más. Pedile a tu comprador que transfiera al CBU o alias de MBDA y te comparta el comprobante. Después vos se lo reenviás a MBDA por WhatsApp: el equipo confirma el pago acá apenas lo vea.
              </p>
              {payment && (payment.cbu || payment.alias) && (
                <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', marginTop: '0.75rem' }}>
                  {payment.alias && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                      <span><strong>Alias:</strong> {payment.alias}</span>
                      <button onClick={() => copy(payment.alias)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-accent)', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Copy size={13} /> Copiar
                      </button>
                    </div>
                  )}
                  {payment.cbu && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                      <span><strong>CBU:</strong> {payment.cbu}</span>
                      <button onClick={() => copy(payment.cbu)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-accent)', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Copy size={13} /> Copiar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Retiro y pago */}
          {(sale.status === 'CONFIRMED' || sale.status === 'DISPATCHED') && (
            <div style={{ background: '#f5f3ef', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#374151' }}>
              {sale.cycle && (
                <p>
                  📦 Ciclo #{sale.cycle.number} <span style={{ color: '#6b7280' }}>({CYCLE_STATUS_LABEL[sale.cycle.status]})</span>
                  {' · '}
                  {myDeliveryMethod === 'PICKUP' ? 'lo retirás vos en el local' : 'MBDA te lo despacha a tu dirección'}
                </p>
              )}
              {sale.pickupBy === 'BUYER' && (
                <p style={{ marginTop: sale.cycle ? '0.375rem' : 0 }}>🏷️ {PICKUP_LABEL[sale.pickupBy]}</p>
              )}
              {sale.paymentMethod === 'CASH' && (
                <p style={{ marginTop: '0.375rem' }}>💵 Pagado en efectivo</p>
              )}
              {sale.paymentMethod === 'TRANSFER' && (
                <p style={{ marginTop: '0.375rem' }}>💸 Pagado por transferencia</p>
              )}
            </div>
          )}

          {/* Acciones */}
          {sale.status === 'PENDING' && (
            <button
              onClick={doCancel}
              disabled={cancelling}
              style={{ padding: '0.7rem', borderRadius: '0.625rem', border: '1.5px solid #fde8e8', background: '#fff5f5', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}
            >
              {cancelling ? 'Cancelando...' : 'Cancelar reserva'}
            </button>
          )}

          {/* Tracking */}
          {sale.trackingNumber && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#166534' }}>
              📦 Tracking: <strong>{sale.trackingNumber}</strong>
            </div>
          )}

          {/* Cancelación */}
          {sale.status === 'CANCELLED' && sale.cancelReason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#991b1b' }}>
              Motivo de cancelación: {sale.cancelReason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'Despachados', value: 'DISPATCHED' },
  { label: 'Cancelados', value: 'CANCELLED' },
]

// ── Recompensa por ciclo ──────────────────────────────────────────────────────

function CycleBonusMessage({ cycle }: { cycle: MyCycle }) {
  const isOpen = cycle.cycle.status === 'OPEN'

  // Sin tramos configurados todavía — no mencionamos una recompensa que no existe.
  if (cycle.bonusPct === 0 && cycle.nextTier === null) return null

  if (isOpen) {
    if (cycle.nextTier) {
      return (
        <div>
          <p style={{ fontSize: '0.8125rem', color: '#374151', margin: '0 0 0.375rem' }}>
            {cycle.bonusPct > 0
              ? <>🎉 Ya desbloqueaste <strong>{cycle.bonusPct}%</strong> extra de recompensa. Te faltan <strong>{fmt(cycle.remainingToNextTier ?? 0)}</strong> para subir todavía más.</>
              : <>🎁 Te faltan <strong>{fmt(cycle.remainingToNextTier ?? 0)}</strong> para desbloquear una recompensa extra en este ciclo. ¡Vas por buen camino!</>}
          </p>
          <div style={{ height: '8px', borderRadius: '99px', background: '#e0dbd0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', background: 'var(--c-accent)',
              width: `${Math.min(100, (cycle.total / cycle.nextTier.thresholdAmount) * 100)}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )
    }
    return (
      <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0 }}>
        🏆 ¡Estás en el tope de recompensa de este ciclo! Sumás <strong>{cycle.bonusPct}%</strong> extra en cada venta.
      </p>
    )
  }

  // Ciclo cerrado: informativo, sin barra de progreso ni invitación a seguir vendiendo.
  return (
    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
      {cycle.bonusPct > 0
        ? <>Terminaste este ciclo con <strong>{cycle.bonusPct}%</strong> extra de recompensa por volumen.</>
        : 'No llegaste al tramo de recompensa por volumen en este ciclo.'}
    </p>
  )
}

function CycleNavigator({ cycles, index, onIndexChange, onClear }: {
  cycles: MyCycle[]; index: number; onIndexChange: (i: number) => void; onClear: () => void
}) {
  const entry = cycles[index]
  if (!entry) return null
  const canGoOlder = index < cycles.length - 1
  const canGoNewer = index > 0

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            disabled={!canGoOlder} onClick={() => onIndexChange(index + 1)}
            aria-label="Ciclo anterior"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e0dbd0', background: '#fff', cursor: canGoOlder ? 'pointer' : 'not-allowed', opacity: canGoOlder ? 1 : 0.35 }}
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>Ciclo #{entry.cycle.number}</span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>{CYCLE_STATUS_LABEL[entry.cycle.status]}</span>
          </div>
          <button
            disabled={!canGoNewer} onClick={() => onIndexChange(index - 1)}
            aria-label="Ciclo siguiente"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e0dbd0', background: '#fff', cursor: canGoNewer ? 'pointer' : 'not-allowed', opacity: canGoNewer ? 1 : 0.35 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}>
          Ver todos los ciclos
        </button>
      </div>
      <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--c-accent)', margin: '0 0 0.75rem' }}>{fmt(entry.total)}</p>
      <CycleBonusMessage cycle={entry} />
    </div>
  )
}

export function MySalesPage() {
  const { showToast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Sale | null>(null)
  const [payment, setPayment] = useState<{ cbu: string; alias: string } | null>(null)

  // Ventas por ciclo: arranca mostrando el ciclo actual (índice 0, el más
  // reciente); "Ver todos los ciclos" pone cycleIndex en null y vuelve al
  // comportamiento anterior (todos los pedidos, sin importar el ciclo).
  const [cycles, setCycles] = useState<MyCycle[]>([])
  const [cycleIndex, setCycleIndex] = useState<number | null>(0)
  const selectedCycle = cycleIndex !== null ? cycles[cycleIndex] : undefined

  useEffect(() => {
    getPublicConfig().then(c => setPayment({ cbu: c.cbu, alias: c.alias })).catch(() => {})
    getMyCycles().then(setCycles).catch(() => {})
  }, [])

  // El ciclo tarda un instante en cargar (arranca en undefined) — la primera
  // consulta sale sin cycleId y una segunda, ya filtrada, sale enseguida
  // después. Si la respuesta vieja (sin filtrar) llegara después que la nueva
  // por timing de red, pisaría el resultado correcto — este contador ignora
  // cualquier respuesta que no sea la de la request más reciente.
  const requestSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    try {
      const { data } = await axiosClient.get<{ success: true; data: SalesResponse }>('/reseller/orders', {
        params: {
          page, limit: 20,
          status: statusFilter || undefined,
          cycleId: selectedCycle?.cycle.id,
        },
      })
      if (seq !== requestSeq.current) return
      setSales(data.data.orders)
      setTotal(data.data.total)
      setTotalPages(data.data.totalPages)
    } catch {
      if (seq !== requestSeq.current) return
      showToast('Error al cargar ventas', 'error')
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [page, statusFilter, selectedCycle?.cycle.id, showToast])

  useEffect(() => { load() }, [load])

  function handleFilter(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  function handleCycleChange(i: number | null) {
    setCycleIndex(i)
    setPage(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/panel" style={{ color: 'var(--c-accent)', textDecoration: 'none' }}>Mi panel</Link> / Mis ventas
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Mis ventas
          </h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total} venta{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Ventas por ciclo */}
        {cycleIndex !== null && cycles.length > 0 ? (
          <CycleNavigator cycles={cycles} index={Math.min(cycleIndex, cycles.length - 1)} onIndexChange={handleCycleChange} onClear={() => handleCycleChange(null)} />
        ) : (
          cycles.length > 0 && (
            <button onClick={() => handleCycleChange(0)} style={{ display: 'block', marginBottom: '1.25rem', background: 'none', border: 'none', color: 'var(--c-accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}>
              Ver ventas por ciclo
            </button>
          )
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => handleFilter(f.value)} style={{
              padding: '0.375rem 0.875rem', borderRadius: '99px', border: '1px solid',
              borderColor: statusFilter === f.value ? 'var(--c-accent)' : '#e0dbd0',
              background: statusFilter === f.value ? 'var(--c-accent)' : '#fff',
              color: statusFilter === f.value ? '#fff' : '#6b7280',
              fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
          ) : sales.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              {total === 0 && !statusFilter && cycleIndex === null ? (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛍️</p>
                  <p style={{ fontWeight: 600, color: '#111' }}>Aún no tenés ventas</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Compartí tu catálogo para empezar a vender.</p>
                </>
              ) : selectedCycle ? (
                `Todavía no hay ventas${statusFilter ? ' con este estado' : ''} en el Ciclo #${selectedCycle.cycle.number}.`
              ) : (
                'No hay ventas con este estado.'
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0dbd0', background: '#faf9f7' }}>
                    {['Nº Pedido', 'Comprador', 'Total', 'Estado', 'Fecha', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #f5f3ef', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setSelected(sale)}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--c-accent)' }}>{sale.orderNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{sale.buyerName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(sale.total)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={sale.status} /></td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(sale.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--c-accent)', fontWeight: 600, fontSize: '0.8125rem' }}>Ver →</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Anterior</button>
            <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem', color: '#6b7280', alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Siguiente →</button>
          </div>
        )}
      </div>

      {selected && <SaleModal sale={selected} payment={payment} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  )
}
