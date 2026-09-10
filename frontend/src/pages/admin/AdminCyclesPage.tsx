import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import {
  getCycles, createCycle, updateCycleStatus, updateCycleDates, getCycleShipping,
  type CycleWithTotals, type CycleStatus, type CycleShippingEntry,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = {
  padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem', background: '#fff', outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

const STATUS_LABEL: Record<CycleStatus, string> = { OPEN: 'Abierto', CLOSED: 'Cerrado', PREPARING: 'Preparando', DISPATCHED: 'Despachado' }
const STATUS_COLOR: Record<CycleStatus, string> = { OPEN: '#16a34a', CLOSED: '#6b7280', PREPARING: '#b8922a', DISPATCHED: '#6366f1' }
const NEXT_ACTION: Partial<Record<CycleStatus, { label: string; next: 'CLOSED' | 'PREPARING' | 'DISPATCHED' }>> = {
  OPEN: { label: 'Cerrar ciclo', next: 'CLOSED' },
  CLOSED: { label: 'Marcar en preparación', next: 'PREPARING' },
  PREPARING: { label: 'Marcar despachado', next: 'DISPATCHED' },
}

function fmt(v: number) { return `$${v.toLocaleString('es-AR')}` }
function fmtDate(iso: string) { return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Formulario de creación ─────────────────────────────────────────────────────
function CreateCycleForm({ onCreated }: { onCreated: (c: CycleWithTotals) => void }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [closeAt, setCloseAt] = useState('')
  const [dispatchAt, setDispatchAt] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!closeAt || !dispatchAt) {
      showToast('Completá las dos fechas', 'error')
      return
    }
    setSaving(true)
    try {
      const cycle = await createCycle(new Date(closeAt).toISOString(), new Date(dispatchAt).toISOString())
      onCreated({ ...cycle, orderCount: 0, total: 0 })
      showToast('Ciclo creado — el anterior se cerró automáticamente', 'success')
      setCloseAt(''); setDispatchAt(''); setOpen(false)
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error al crear el ciclo', 'error')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, cursor: 'pointer', marginBottom: '1.25rem' }}>
        + Nuevo ciclo
      </button>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>Nuevo ciclo de compra</p>
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.875rem' }}>
        Si hay un ciclo abierto, se cierra automáticamente al crear este.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={LABEL}>Fecha y hora de cierre</label>
          <input value={closeAt} onChange={e => setCloseAt(e.target.value)} type="datetime-local" style={INP} />
        </div>
        <div>
          <label style={LABEL}>Fecha y hora de despacho</label>
          <input value={dispatchAt} onChange={e => setDispatchAt(e.target.value)} type="datetime-local" style={INP} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
        <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '0.65rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Creando...' : 'Crear ciclo'}
        </button>
      </div>
    </div>
  )
}

// ── Fila de ciclo ──────────────────────────────────────────────────────────────
function CycleRow({ cycle, onChanged }: { cycle: CycleWithTotals; onChanged: (c: CycleWithTotals) => void }) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [editingDates, setEditingDates] = useState(false)
  const [closeAt, setCloseAt] = useState(() => toLocalInput(cycle.closeAt))
  const [dispatchAt, setDispatchAt] = useState(() => toLocalInput(cycle.dispatchAt))
  const action = NEXT_ACTION[cycle.status]

  async function advance() {
    if (!action) return
    if (!confirm(`¿${action.label} del ciclo #${cycle.number}?`)) return
    setSaving(true)
    try {
      const updated = await updateCycleStatus(cycle.id, action.next)
      onChanged({ ...cycle, status: updated.status })
      showToast('Ciclo actualizado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error', 'error')
    }
    setSaving(false)
  }

  async function saveDates() {
    setSaving(true)
    try {
      const updated = await updateCycleDates(cycle.id, new Date(closeAt).toISOString(), new Date(dispatchAt).toISOString())
      onChanged({ ...cycle, closeAt: updated.closeAt, dispatchAt: updated.dispatchAt })
      showToast('Fechas actualizadas', 'success')
      setEditingDates(false)
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1px solid #e0dbd0', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>Ciclo #{cycle.number}</p>
          {editingDates ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxWidth: '320px' }}>
              <div>
                <label style={LABEL}>Fecha y hora de cierre</label>
                <input value={closeAt} onChange={e => setCloseAt(e.target.value)} type="datetime-local" style={INP} />
              </div>
              <div>
                <label style={LABEL}>Fecha y hora de despacho</label>
                <input value={dispatchAt} onChange={e => setDispatchAt(e.target.value)} type="datetime-local" style={INP} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setEditingDates(false)} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={saveDates} disabled={saving} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar fechas'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Cierre: {fmtDate(cycle.closeAt)}</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Despacho: {fmtDate(cycle.dispatchAt)}</p>
              {cycle.status === 'OPEN' && (
                <button onClick={() => setEditingDates(true)} style={{ marginTop: '0.25rem', background: 'transparent', border: 'none', color: '#b8922a', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}>
                  ✏️ Editar fechas
                </button>
              )}
            </>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', background: STATUS_COLOR[cycle.status] + '18', color: STATUS_COLOR[cycle.status], border: `1px solid ${STATUS_COLOR[cycle.status]}40` }}>
          {STATUS_LABEL[cycle.status]}
        </span>
      </div>

      <div style={{ marginTop: '0.625rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#111' }}>{cycle.orderCount} pedido{cycle.orderCount !== 1 ? 's' : ''} · <span style={{ fontWeight: 700, color: '#b8922a' }}>{fmt(cycle.total)}</span></p>
      </div>

      <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {action && (
          <button onClick={advance} disabled={saving} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Guardando...' : action.label}
          </button>
        )}
        <button onClick={() => setShowShipping(s => !s)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
          {showShipping ? 'Ocultar direcciones de despacho' : 'Ver direcciones de despacho'}
        </button>
      </div>

      {showShipping && <ShippingSummary cycleId={cycle.id} />}
    </div>
  )
}

// ── Resumen de despacho por revendedora ────────────────────────────────────────
function ShippingEntryRow({ e }: { e: CycleShippingEntry }) {
  return (
    <div style={{ background: '#faf9f7', borderRadius: '0.625rem', padding: '0.75rem 0.875rem' }}>
      <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#111' }}>{e.storeName}</p>
      {e.deliveryMethod === 'SHIPPING' && (
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {e.address ?? 'Sin dirección cargada'} - {e.city ?? '—'} (CP {e.postalCode ?? '—'})
        </p>
      )}
      <p style={{ fontSize: '0.8125rem', color: '#111', marginTop: '0.25rem' }}>{e.productCount} producto{e.productCount !== 1 ? 's' : ''} · {fmt(e.total)}</p>
    </div>
  )
}

function ShippingSummary({ cycleId }: { cycleId: string }) {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<CycleShippingEntry[] | null>(null)

  useEffect(() => {
    getCycleShipping(cycleId)
      .then(setEntries)
      .catch(() => showToast('Error al cargar las direcciones de despacho', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId])

  if (!entries) return <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#6b7280' }}>Cargando...</p>
  if (entries.length === 0) return <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#6b7280' }}>Sin pedidos confirmados en este ciclo todavía.</p>

  const toDispatch = entries.filter(e => e.deliveryMethod === 'SHIPPING')
  const toPickup = entries.filter(e => e.deliveryMethod === 'PICKUP')

  return (
    <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          A despachar ({toDispatch.length})
        </p>
        {toDispatch.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Nadie elige envío en este ciclo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {toDispatch.map(e => <ShippingEntryRow key={e.resellerId} e={e} />)}
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          A retirar en el local ({toPickup.length})
        </p>
        {toPickup.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Nadie retira en el local en este ciclo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {toPickup.map(e => <ShippingEntryRow key={e.resellerId} e={e} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export function AdminCyclesPage() {
  const { showToast } = useToast()
  const [cycles, setCycles] = useState<CycleWithTotals[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCycles(await getCycles())
    } catch {
      showToast('Error al cargar los ciclos', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  function handleChanged(updated: CycleWithTotals) {
    setCycles(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  function handleCreated(created: CycleWithTotals) {
    setCycles(prev => [created, ...prev.map(c => c.status === 'OPEN' ? { ...c, status: 'CLOSED' as const } : c)])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Panel</Link> / Ciclos de compra
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '1.25rem' }}>Ciclos de compra</h1>

        <CreateCycleForm onCreated={handleCreated} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : cycles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Todavía no hay ciclos</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cycles.map(c => <CycleRow key={c.id} cycle={c} onChanged={handleChanged} />)}
          </div>
        )}
      </div>
    </div>
  )
}
