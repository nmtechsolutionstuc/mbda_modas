import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import { useToast } from '../../context/ToastContext'

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
  shippingMethod: string
  shippingCity: string | null
  shippingProvince: string | null
  subtotal: string
  total: string
  status: OrderStatus
  cancelReason: string | null
  reservedUntil: string
  trackingNumber: string | null
  createdAt: string
  items: SaleItem[]
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

const SHIPPING_LABEL: Record<string, string> = {
  CORREO_ARGENTINO: 'Correo Argentino',
  ANDREANI: 'Andreani',
  LOCAL_PICKUP: 'Retiro en persona',
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

function SaleModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const remainingMs = new Date(sale.reservedUntil).getTime() - Date.now()
  const hoursLeft = Math.max(0, Math.floor(remainingMs / 3600000))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>{sale.orderNumber}</h2>
            <StatusBadge status={sale.status} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Comprador */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b8922a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Comprador</h3>
            {[
              { label: 'Nombre', value: sale.buyerName },
              { label: 'WhatsApp', value: sale.buyerWhatsapp },
              { label: 'Envío', value: SHIPPING_LABEL[sale.shippingMethod] ?? sale.shippingMethod },
              ...(sale.shippingCity ? [{ label: 'Localidad', value: `${sale.shippingCity}, ${sale.shippingProvince}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Productos */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b8922a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Productos</h3>
            {sale.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem', opacity: item.cancelled ? 0.4 : 1 }}>
                <span>{item.productName} — {item.size}/{item.color} ×{item.quantity}{item.cancelled ? ' (cancelado)' : ''}</span>
                <span style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', fontWeight: 700, fontSize: '1rem', color: '#b8922a' }}>
              Total: {fmt(sale.total)}
            </div>
          </div>

          {/* Info de reserva */}
          {sale.status === 'PENDING' && hoursLeft > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#92400e' }}>
              ⏳ Stock reservado por <strong>{hoursLeft}h</strong> más. Si no se confirma el pago, el pedido se cancela automáticamente.
            </div>
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

export function MySalesPage() {
  const { showToast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Sale | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get<{ success: true; data: SalesResponse }>('/reseller/orders', {
        params: { page, limit: 20, status: statusFilter || undefined },
      })
      setSales(data.data.orders)
      setTotal(data.data.total)
      setTotalPages(data.data.totalPages)
    } catch {
      showToast('Error al cargar ventas', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, showToast])

  useEffect(() => { load() }, [load])

  function handleFilter(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/panel" style={{ color: '#b8922a', textDecoration: 'none' }}>Mi panel</Link> / Mis ventas
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Mis ventas
          </h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total} venta{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => handleFilter(f.value)} style={{
              padding: '0.375rem 0.875rem', borderRadius: '99px', border: '1px solid',
              borderColor: statusFilter === f.value ? '#b8922a' : '#e0dbd0',
              background: statusFilter === f.value ? '#b8922a' : '#fff',
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
              {total === 0 && !statusFilter ? (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛍️</p>
                  <p style={{ fontWeight: 600, color: '#111' }}>Aún no tenés ventas</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Compartí tu catálogo para empezar a vender.</p>
                </>
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
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#b8922a' }}>{sale.orderNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{sale.buyerName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(sale.total)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={sale.status} /></td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(sale.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#b8922a', fontWeight: 600, fontSize: '0.8125rem' }}>Ver →</span></td>
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

      {selected && <SaleModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
