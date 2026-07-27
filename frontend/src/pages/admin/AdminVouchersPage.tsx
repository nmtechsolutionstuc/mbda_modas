import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import {
  getVouchers, createVoucher, updateVoucher, markVoucherUsed, cancelVoucher,
  type Voucher, type VoucherStatus,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = {
  padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem', background: '#fff', outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

const STATUS_LABEL: Record<VoucherStatus, string> = { ACTIVE: 'Activo', USED: 'Usado', CANCELLED: 'Anulado' }
const STATUS_COLOR: Record<VoucherStatus, string> = { ACTIVE: '#16a34a', USED: '#6366f1', CANCELLED: '#dc2626' }

function fmt(v: string | number) { return `$${Number(v).toLocaleString('es-AR')}` }

// ── Formulario de creación ─────────────────────────────────────────────────────
function CreateVoucherForm({ onCreated }: { onCreated: (v: Voucher) => void }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [relatedOrderNumber, setRelatedOrderNumber] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    const amountNum = parseFloat(amount)
    if (!buyerName || !buyerWhatsapp || !amountNum || amountNum <= 0) {
      showToast('Completá nombre, WhatsApp y un monto válido', 'error')
      return
    }
    setSaving(true)
    try {
      const voucher = await createVoucher({
        buyerName, buyerWhatsapp, amount: amountNum,
        note: note || undefined,
        relatedOrderNumber: relatedOrderNumber || undefined,
      })
      onCreated(voucher)
      showToast('Vale creado', 'success')
      setBuyerName(''); setBuyerWhatsapp(''); setAmount(''); setNote(''); setRelatedOrderNumber('')
      setOpen(false)
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al crear el vale', 'error')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, cursor: 'pointer', marginBottom: '1.25rem' }}>
        + Crear vale
      </button>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: '0.875rem' }}>Nuevo vale de cambio</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={LABEL}>Nombre del comprador</label>
          <input value={buyerName} onChange={e => setBuyerName(e.target.value)} style={INP} />
        </div>
        <div>
          <label style={LABEL}>WhatsApp</label>
          <input value={buyerWhatsapp} onChange={e => setBuyerWhatsapp(e.target.value)} style={INP} placeholder="5493812345678" />
        </div>
        <div>
          <label style={LABEL}>Monto</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" style={INP} />
        </div>
        <div>
          <label style={LABEL}>Nº de pedido relacionado (opcional)</label>
          <input value={relatedOrderNumber} onChange={e => setRelatedOrderNumber(e.target.value)} style={INP} placeholder="ORD-1234" />
        </div>
      </div>
      <label style={LABEL}>Nota (opcional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...INP, minHeight: '60px', resize: 'vertical', marginBottom: '1rem' } as React.CSSProperties} />
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
        <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '0.65rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Creando...' : 'Crear vale'}
        </button>
      </div>
    </div>
  )
}

// ── Fila de vale ───────────────────────────────────────────────────────────────
function VoucherRow({ voucher, onChanged }: { voucher: Voucher; onChanged: (v: Voucher) => void }) {
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(voucher.amount)
  const [note, setNote] = useState(voucher.note ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const updated = await updateVoucher(voucher.id, { amount: Number(amount), note: note || undefined })
      onChanged(updated)
      setEditing(false)
      showToast('Vale actualizado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  async function use() {
    if (!confirm(`¿Marcar el vale de ${voucher.buyerName} como usado?`)) return
    setSaving(true)
    try {
      onChanged(await markVoucherUsed(voucher.id))
      showToast('Vale marcado como usado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error', 'error')
    }
    setSaving(false)
  }

  async function cancel() {
    if (!confirm(`¿Anular el vale de ${voucher.buyerName}?`)) return
    setSaving(true)
    try {
      onChanged(await cancelVoucher(voucher.id))
      showToast('Vale anulado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1px solid #e0dbd0', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>{voucher.buyerName}</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{voucher.buyerWhatsapp}</p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', background: STATUS_COLOR[voucher.status] + '18', color: STATUS_COLOR[voucher.status], border: `1px solid ${STATUS_COLOR[voucher.status]}40` }}>
          {STATUS_LABEL[voucher.status]}
        </span>
      </div>

      {!editing ? (
        <div style={{ marginTop: '0.625rem' }}>
          <p style={{ fontWeight: 700, color: '#b8922a', fontSize: '1.0625rem' }}>{fmt(voucher.amount)}</p>
          {voucher.note && <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>{voucher.note}</p>}
          {voucher.relatedOrderNumber && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>Pedido: {voucher.relatedOrderNumber}</p>}
        </div>
      ) : (
        <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" style={INP} />
          <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...INP, minHeight: '50px', resize: 'vertical' } as React.CSSProperties} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
        {voucher.status === 'ACTIVE' && !editing && (
          <>
            <button onClick={() => setEditing(true)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>✏️ Editar</button>
            <button onClick={use} disabled={saving} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#6366f1', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Marcar usado</button>
            <button onClick={cancel} disabled={saving} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #fde8e8', background: '#fff5f5', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Anular</button>
          </>
        )}
        {editing && (
          <>
            <button onClick={() => { setEditing(false); setAmount(voucher.amount); setNote(voucher.note ?? '') }} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export function AdminVouchersPage() {
  const { showToast } = useToast()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getVouchers({ search: search || undefined, limit: 50 })
      setVouchers(r.vouchers)
      setTotal(r.total)
    } catch {
      showToast('Error al cargar vales', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, showToast])

  useEffect(() => { load() }, [load])

  function handleChanged(updated: Voucher) {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v))
  }

  function handleCreated(created: Voucher) {
    setVouchers(prev => [created, ...prev])
    setTotal(t => t + 1)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Panel</Link> / Vales
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>Vales de cambio</h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total} vale{total !== 1 ? 's' : ''}</span>
        </div>

        <CreateVoucherForm onCreated={handleCreated} />

        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o WhatsApp..."
          style={{ ...INP, marginBottom: '1.25rem' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No hay vales</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vouchers.map(v => <VoucherRow key={v.id} voucher={v} onChanged={handleChanged} />)}
          </div>
        )}
      </div>
    </div>
  )
}
