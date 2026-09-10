import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { getPendingPickups, markPickedUp, type PendingPickup } from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { linkWhatsApp } from '../../utils/whatsapp'

const PICKUP_LABEL: Record<'BUYER' | 'RESELLER', string> = {
  BUYER: '🚶 Retira el comprador',
  RESELLER: '🏍️ Retira el revendedor',
}

function fmt(val: string | number) {
  return `$${Number(val).toLocaleString('es-AR')}`
}

function hoursLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.round((new Date(deadline).getTime() - Date.now()) / 3600000)
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const hrs = hoursLeft(deadline)
  if (hrs === null) return null
  const color = hrs < 0 ? '#dc2626' : hrs < 12 ? '#d97706' : '#16a34a'
  const text = hrs < 0 ? 'Vencido' : hrs < 24 ? `${hrs}h restantes` : `${Math.floor(hrs / 24)}d restantes`
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', background: color + '18', color, border: `1px solid ${color}40` }}>
      ⏳ {text}
    </span>
  )
}

function PickupCard({ pickup, onChanged }: { pickup: PendingPickup; onChanged: () => void }) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  async function markDone() {
    if (!confirm(`¿Confirmar que ${pickup.buyerName} / ${pickup.reseller.storeName} retiró el pedido ${pickup.orderNumber}?`)) return
    setSaving(true)
    try {
      await markPickedUp(pickup.id)
      showToast('Marcado como retirado', 'success')
      onChanged()
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al marcar como retirado', 'error')
    }
    setSaving(false)
  }

  const remindLink = linkWhatsApp(pickup.reseller.whatsapp,
    `Hola ${pickup.reseller.storeName}! Te recordamos que el pedido ${pickup.orderNumber} (${pickup.buyerName}) está listo para retirar en el local. ¡No te olvides!`)

  const notPaidLink = linkWhatsApp(pickup.reseller.whatsapp,
    `Hola ${pickup.reseller.storeName}. Sobre el pedido ${pickup.orderNumber} (${pickup.buyerName}): todavía no vemos acreditada la transferencia. No vamos a poder entregar la prenda hasta confirmar el pago. Cualquier novedad avisanos por acá.`)

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 700, color: '#b8922a', fontSize: '0.9375rem' }}>{pickup.orderNumber}</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{pickup.reseller.storeName}</p>
        </div>
        <DeadlineBadge deadline={pickup.pickupDeadline} />
      </div>

      <div style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        <p><strong>{pickup.buyerName}</strong> · {pickup.buyerWhatsapp}</p>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>{PICKUP_LABEL[pickup.pickupBy]}</p>
      </div>

      <div style={{ background: '#faf9f6', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
        {pickup.items.map(item => (
          <p key={item.id} style={{ opacity: item.cancelled ? 0.4 : 1 }}>
            {item.productName} — {item.size}/{item.color} ×{item.quantity}{item.cancelled ? ' (cancelado)' : ''}
          </p>
        ))}
        <p style={{ fontWeight: 700, color: '#111', marginTop: '0.375rem' }}>Total: {fmt(pickup.total)}</p>
      </div>

      <div style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '1rem' }}>
        {pickup.paymentMethod === 'CASH' && <p>💵 Pagado en efectivo</p>}
        {pickup.paymentMethod === 'TRANSFER' && <p>💸 Pagado por transferencia</p>}
        {!pickup.paymentMethod && <p style={{ color: '#9ca3af' }}>Sin método de pago registrado</p>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={markDone} disabled={saving} style={{ flex: '1 1 160px', padding: '0.6rem', borderRadius: '0.5rem', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
          ✓ Marcar como retirado
        </button>
        <a href={remindLink} target="_blank" rel="noopener noreferrer" style={{ flex: '1 1 160px', textAlign: 'center', padding: '0.6rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
          📲 Recordar retiro
        </a>
        {pickup.paymentMethod === 'TRANSFER' && (
          <a href={notPaidLink} target="_blank" rel="noopener noreferrer" style={{ flex: '1 1 220px', textAlign: 'center', padding: '0.6rem', borderRadius: '0.5rem', border: '1.5px solid #fde8e8', background: '#fff5f5', color: '#dc2626', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
            ⚠️ Avisar pago no acreditado
          </a>
        )}
      </div>
    </div>
  )
}

export function AdminPickupsPage() {
  const { showToast } = useToast()
  const [pickups, setPickups] = useState<PendingPickup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPickups(await getPendingPickups())
    } catch {
      showToast('Error al cargar retiros pendientes', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = pickups.filter(p => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.buyerName.toLowerCase().includes(q) || p.reseller.storeName.toLowerCase().includes(q) || p.orderNumber.toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Panel</Link> / Retiros
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#111' }}>Retiros pendientes</h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, tienda o Nº pedido..."
          style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', fontSize: '0.9375rem', marginBottom: '1.25rem', boxSizing: 'border-box' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</p>
            <p style={{ fontWeight: 600, color: '#111' }}>No hay retiros pendientes</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map(p => <PickupCard key={p.id} pickup={p} onChanged={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}
