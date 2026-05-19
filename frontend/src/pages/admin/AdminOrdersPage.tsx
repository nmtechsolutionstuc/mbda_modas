import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminOrders, confirmOrderPayment, dispatchOrder, cancelAdminOrder,
  markOrderProofReceived, rejectOrderPayment, cancelSingleItem,
  type Order, type OrderStatus,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { linkWhatsApp } from '../../utils/whatsapp'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROOF_RECEIVED: 'Comprobante recibido',
  CONFIRMED: 'Confirmado',
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

// ── Badge de estado ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '99px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: STATUS_COLOR[status] + '20',
      color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Modal detalle de pedido ───────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onRefresh }: {
  order: Order
  onClose: () => void
  onRefresh: () => void
}) {
  const { showToast } = useToast()
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? '')
  const [cancelReason, setCancelReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'detail' | 'dispatch' | 'cancel' | 'reject'>('detail')
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    try {
      await confirmOrderPayment(order.id)
      showToast('Pago confirmado. Comisión generada.', 'success')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error al confirmar', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDispatch() {
    if (!trackingInput.trim()) {
      showToast('Ingresá el número de seguimiento', 'error')
      return
    }
    setLoading(true)
    try {
      await dispatchOrder(order.id, trackingInput.trim())
      showToast('Pedido marcado como despachado', 'success')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error al despachar', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkProof() {
    setLoading(true)
    try {
      await markOrderProofReceived(order.id)
      showToast('Comprobante marcado como recibido', 'success')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      showToast('Indicá el motivo del rechazo', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await rejectOrderPayment(order.id, rejectReason.trim())
      showToast('Pago rechazado. Pedido cancelado.', 'success')
      if (result.waLink) window.open(result.waLink, '_blank')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error al rechazar', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      showToast('Indicá el motivo de cancelación', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await cancelAdminOrder(order.id, cancelReason.trim())
      showToast('Pedido cancelado', 'success')
      if (result.waLink) window.open(result.waLink, '_blank')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error al cancelar', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelItem(itemId: string) {
    setCancelingItemId(itemId)
    try {
      await cancelSingleItem(order.id, itemId)
      showToast('Ítem cancelado. Total recalculado.', 'success')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error al cancelar ítem', 'error')
    } finally {
      setCancelingItemId(null)
    }
  }

  const waConfirmLink = linkWhatsApp(
    order.reseller.whatsapp,
    `✅ Recibimos tu pago para el pedido ${order.orderNumber}. Pronto comenzamos a prepararlo. ¡Gracias por tu compra!`,
  )
  const waDispatchLink = linkWhatsApp(
    order.buyerWhatsapp,
    `📦 Tu pedido ${order.orderNumber} fue despachado con tracking ${trackingInput || order.trackingNumber || 'N/D'}. Podés seguirlo en el correo correspondiente.`,
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>
              {order.orderNumber}
            </h2>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Comprador */}
          <Section title="Comprador">
            <Row label="Nombre" value={order.buyerName} />
            <Row label="WhatsApp" value={order.buyerWhatsapp} />
            {order.buyerEmail && <Row label="Email" value={order.buyerEmail} />}
            <Row label="Envío" value={SHIPPING_LABEL[order.shippingMethod]} />
            {order.shippingAddress && (
              <Row label="Dirección" value={`${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingZip})`} />
            )}
          </Section>

          {/* Revendedor */}
          <Section title="Revendedor">
            <Row label="Tienda" value={order.reseller.storeName} />
            <Row label="Contacto" value={`${order.reseller.firstName} ${order.reseller.lastName}`} />
            <Row label="WhatsApp" value={order.reseller.whatsapp} />
            {order.reseller.cbu && <Row label="CBU" value={order.reseller.cbu} />}
            {order.reseller.alias && <Row label="Alias" value={order.reseller.alias} />}
          </Section>

          {/* Items */}
          <Section title="Productos">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0dbd0' }}>
                  {['Producto', 'Talle/Color', 'Cant.', 'P. Unit.', 'Subtotal', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.25rem', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f5f3ef', opacity: item.cancelled ? 0.4 : 1 }}>
                    <td style={{ padding: '0.5rem 0.25rem' }}>{item.productName}{item.cancelled && <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '0.25rem' }}>(cancelado)</span>}</td>
                    <td style={{ padding: '0.5rem 0.25rem', color: '#6b7280' }}>{item.size} / {item.color}</td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>{item.quantity}</td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>{fmt(item.unitPrice)}</td>
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      {!item.cancelled && order.status !== 'DISPATCHED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelItem(item.id)}
                          disabled={cancelingItemId === item.id}
                          title="Cancelar este ítem"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}
                        >
                          {cancelingItemId === item.id ? '...' : '✕'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ padding: '0.75rem 0.25rem', textAlign: 'right', fontWeight: 700 }}>Total:</td>
                  <td style={{ padding: '0.75rem 0.25rem', fontWeight: 700, color: '#b8922a' }}>{fmt(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </Section>

          {/* Comisiones generadas */}
          {order.commissions.length > 0 && (
            <Section title="Comisiones">
              {order.commissions.map(c => (
                <Row key={c.id} label={c.status === 'PAID' ? 'Comisión (pagada)' : 'Comisión (pendiente)'} value={fmt(c.amount)} />
              ))}
            </Section>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <Section title="Seguimiento">
              <Row label="N° de tracking" value={order.trackingNumber} />
            </Section>
          )}

          {/* Acciones */}
          {view === 'detail' && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {order.status === 'PENDING' && (
                <>
                  <ActionBtn onClick={handleMarkProof} loading={loading} color="#3b82f6">
                    📎 Marcar comprobante recibido
                  </ActionBtn>
                  <ActionBtn onClick={handleConfirm} loading={loading} color="#10b981">
                    ✅ Confirmar pago
                  </ActionBtn>
                  <ActionBtn onClick={() => setView('cancel')} color="#ef4444" outline>Cancelar pedido</ActionBtn>
                </>
              )}
              {order.status === 'PROOF_RECEIVED' && (
                <>
                  <ActionBtn onClick={handleConfirm} loading={loading} color="#10b981">
                    ✅ Confirmar pago
                  </ActionBtn>
                  <a href={waConfirmLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <ActionBtn onClick={() => {}} color="#25d366">📱 Avisar al revendedor</ActionBtn>
                  </a>
                  <ActionBtn onClick={() => setView('reject')} color="#f59e0b" outline>
                    ❌ Rechazar comprobante
                  </ActionBtn>
                  <ActionBtn onClick={() => setView('cancel')} color="#ef4444" outline>Cancelar pedido</ActionBtn>
                </>
              )}
              {order.status === 'CONFIRMED' && (
                <>
                  <ActionBtn onClick={() => setView('dispatch')} color="#6366f1">
                    🚚 Marcar como despachado
                  </ActionBtn>
                  <ActionBtn onClick={() => setView('cancel')} color="#ef4444" outline>Cancelar pedido</ActionBtn>
                </>
              )}
              {order.status === 'DISPATCHED' && (
                <a href={waDispatchLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <ActionBtn onClick={() => {}} color="#6366f1">📱 Avisar al comprador</ActionBtn>
                </a>
              )}
            </div>
          )}

          {/* Sub-vista: despachar */}
          {view === 'dispatch' && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f5f3ef', borderRadius: '0.75rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#111' }}>Ingresar número de seguimiento</h3>
              <input
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="Ej: CA123456789AR"
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e0dbd0', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ActionBtn onClick={handleDispatch} loading={loading} color="#6366f1">Confirmar despacho</ActionBtn>
                <ActionBtn onClick={() => setView('detail')} color="#6b7280" outline>Volver</ActionBtn>
              </div>
            </div>
          )}

          {/* Sub-vista: cancelar */}
          {view === 'cancel' && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#ef4444' }}>Cancelar pedido</h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Se liberará el stock y se enviará un link de WhatsApp para notificar al revendedor.
              </p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación..."
                rows={3}
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #fca5a5', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '0.75rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ActionBtn onClick={handleCancel} loading={loading} color="#ef4444">Confirmar cancelación</ActionBtn>
                <ActionBtn onClick={() => setView('detail')} color="#6b7280" outline>Volver</ActionBtn>
              </div>
            </div>
          )}

          {/* Sub-vista: rechazar comprobante */}
          {view === 'reject' && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fcd34d' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#d97706' }}>❌ Rechazar comprobante de pago</h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                El pedido se cancelará, el stock se liberará y se abrirá un link de WhatsApp para notificar al revendedor.
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo (ej: el monto no coincide, comprobante ilegible...)"
                rows={3}
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #fcd34d', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '0.75rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ActionBtn onClick={handleReject} loading={loading} color="#d97706">Rechazar y cancelar</ActionBtn>
                <ActionBtn onClick={() => setView('detail')} color="#6b7280" outline>Volver</ActionBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes utilitarios ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#b8922a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#111', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function ActionBtn({
  onClick, loading = false, color, outline = false, children,
}: {
  onClick: () => void
  loading?: boolean
  color: string
  outline?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: outline ? `1px solid ${color}` : 'none',
        background: outline ? 'transparent' : color,
        color: outline ? color : '#fff',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? '...' : children}
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Comprobante', value: 'PROOF_RECEIVED' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'Despachados', value: 'DISPATCHED' },
  { label: 'Cancelados', value: 'CANCELLED' },
]

export function AdminOrdersPage() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminOrders({ page, limit: 20, status: statusFilter || undefined })
      setOrders(res.orders)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch {
      showToast('Error al cargar pedidos', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, showToast])

  useEffect(() => { load() }, [load])

  // Cuando cambia el filtro vuelve a página 1
  function handleFilter(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Admin</Link> / Pedidos
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Pedidos
          </h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total} pedido{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Filtros de estado */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '99px',
                border: '1px solid',
                borderColor: statusFilter === f.value ? '#b8922a' : '#e0dbd0',
                background: statusFilter === f.value ? '#b8922a' : '#fff',
                color: statusFilter === f.value ? '#fff' : '#6b7280',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No hay pedidos{statusFilter ? ' con este estado' : ''}.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0dbd0', background: '#faf9f7' }}>
                    {['Nº Pedido', 'Comprador', 'Revendedor', 'Total', 'Envío', 'Estado', 'Fecha', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid #f5f3ef', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#b8922a' }}>{order.orderNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{order.buyerName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{order.reseller.storeName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(order.total)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8125rem' }}>{SHIPPING_LABEL[order.shippingMethod]}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={order.status as OrderStatus} /></td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: '#b8922a', fontWeight: 600, fontSize: '0.8125rem' }}>Ver →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem', color: '#6b7280', alignSelf: 'center' }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}
