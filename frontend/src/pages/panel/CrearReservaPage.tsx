import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, X } from 'lucide-react'
import { getMyCatalog, createReservation, type CatalogItem } from '../../api/reseller'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = {
  padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem', background: '#fff', outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.375rem' }

interface ReservationLine {
  catalogItemId: string
  variantId: string
  productName: string
  color: string
  size: string
  price: number
}

function fmt(v: number) { return `$${v.toLocaleString('es-AR')}` }

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function photoUrl(p: string) { return p.startsWith('http') ? p : `${API_BASE}${p}` }

// ── Selector de producto ──────────────────────────────────────────────────────
// Modal a pantalla completa: se navega el catálogo visualmente (foto + nombre +
// precio) en vez de depender solo de tipear un nombre exacto — con catálogos
// grandes, ver y tocar es más rápido y menos propenso a error que buscar a ciegas.
function ProductPickerModal({ catalog, existingVariantIds, onAdd, onClose }: {
  catalog: CatalogItem[]; existingVariantIds: string[]; onAdd: (line: ReservationLine) => void; onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [variantId, setVariantId] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? catalog.filter(i => i.product.name.toLowerCase().includes(q)) : catalog
  }, [catalog, query])

  const availableVariants = selected ? selected.product.variants.filter(v => v.stock > 0 && !existingVariantIds.includes(v.id)) : []

  function confirm() {
    const variant = availableVariants.find(v => v.id === variantId)
    if (!selected || !variant) return
    onAdd({
      catalogItemId: selected.id, variantId: variant.id, productName: selected.product.name,
      color: variant.color, size: variant.size, price: Number(selected.sellingPrice),
    })
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid #e0dbd0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>
            {selected ? selected.product.name : 'Elegí un producto'}
          </p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {!selected ? (
          <>
            <div style={{ padding: '1rem 1.25rem 0.75rem' }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar en tu catálogo..."
                autoFocus
                style={INP}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {results.length === 0 ? (
                <p style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>Sin resultados</p>
              ) : results.map(i => {
                const stock = i.product.variants.reduce((s, v) => s + v.stock, 0)
                const photo = i.product.photos[0]
                return (
                  <button
                    key={i.id}
                    onClick={() => setSelected(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem',
                      background: '#faf9f6', border: '1px solid #e8e3d5', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '3rem', height: '3rem', flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', background: '#f0ece1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {photo ? <img src={photoUrl(photo)} alt={i.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🧥</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111' }}>{i.product.name}</p>
                      <p style={{ fontSize: '0.75rem', color: stock === 0 ? '#dc2626' : '#6b7280' }}>{stock === 0 ? 'Sin stock' : `${stock} en stock`}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--c-accent)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{fmt(Number(i.sellingPrice))}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
            <button onClick={() => { setSelected(null); setVariantId('') }} style={{ background: 'transparent', border: 'none', color: 'var(--c-accent)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', padding: 0, marginBottom: '1rem' }}>
              ← Elegir otro producto
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '4rem', height: '4rem', flexShrink: 0, borderRadius: '0.625rem', overflow: 'hidden', background: '#f0ece1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.product.photos[0] ? <img src={photoUrl(selected.product.photos[0])} alt={selected.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🧥</span>}
              </div>
              <p style={{ fontWeight: 700, color: 'var(--c-accent)', fontSize: '1.125rem' }}>{fmt(Number(selected.sellingPrice))}</p>
            </div>

            <label style={LABEL}>Talle / color</label>
            {availableVariants.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.75rem' }}>Sin stock disponible</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {availableVariants.map(v => (
                  <button key={v.id} onClick={() => setVariantId(v.id)}
                    style={{
                      padding: '0.4rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                      border: variantId === v.id ? '2px solid var(--c-accent)' : '1.5px solid #e0dbd0',
                      background: variantId === v.id ? 'var(--c-accent)' : '#fff', color: variantId === v.id ? '#fff' : '#374151',
                    }}>
                    {v.color} / {v.size} ({v.stock})
                  </button>
                ))}
              </div>
            )}

            <button onClick={confirm} disabled={!variantId} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: 'none', background: 'var(--c-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: variantId ? 1 : 0.5 }}>
              Agregar a la reserva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function CrearReservaPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [lines, setLines] = useState<ReservationLine[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderNumber: string; cbu: string; alias: string } | null>(null)

  useEffect(() => {
    getMyCatalog().then(setCatalog).catch(() => showToast('Error al cargar el catálogo', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.price, 0), [lines])

  function removeLine(variantId: string) {
    setLines(prev => prev.filter(l => l.variantId !== variantId))
  }

  async function submit() {
    if (lines.length === 0 || !buyerName || !buyerWhatsapp) {
      showToast('Completá cliente y al menos un producto', 'error')
      return
    }
    setSubmitting(true)
    try {
      const { order, payment } = await createReservation({
        items: lines.map(l => ({ catalogItemId: l.catalogItemId, variantId: l.variantId, quantity: 1 })),
        buyerName, buyerWhatsapp, note: note || undefined,
      })
      setResult({ orderNumber: order.orderNumber, cbu: payment.cbu, alias: payment.alias })
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error al crear la reserva', 'error')
    }
    setSubmitting(false)
  }

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem' }}>✅</p>
          <h2 style={{ fontFamily: "var(--f-display)", fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Reserva creada</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Pedido {result.orderNumber}</p>
          <div style={{ background: '#faf9f6', border: '1px solid #e8e3d5', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-accent)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Datos para que tu comprador transfiera</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>CBU</span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{result.cbu}</span>
            </div>
            {result.alias && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Alias</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{result.alias}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1.25rem' }}>
            Pasale estos datos a tu comprador por WhatsApp. Cuando MBDA confirme el pago, vas a ver la venta reflejada en <strong>Mis ventas</strong>.
          </p>
          <button onClick={() => navigate('/panel')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', border: 'none', background: 'var(--c-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Listo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="#2B1B12" />
          </button>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.375rem', fontWeight: 700, color: '#111' }}>Nueva reserva</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.75rem' }}>Cliente</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={LABEL}>Nombre o alias de la clienta</label>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} style={INP} placeholder="Ej: María López" />
            </div>
            <div>
              <label style={LABEL}>WhatsApp</label>
              <input value={buyerWhatsapp} onChange={e => setBuyerWhatsapp(e.target.value)} style={INP} placeholder="5493812345678" />
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.75rem' }}>Productos</p>

          {lines.map(l => (
            <div key={l.variantId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: '#faf9f6', borderRadius: '0.625rem', padding: '0.625rem 0.875rem', marginBottom: '0.5rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111' }}>{l.productName}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{l.color} - Talle {l.size} — {fmt(l.price)}</p>
              </div>
              <button onClick={() => removeLine(l.variantId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={16} color="#9ca3af" />
              </button>
            </div>
          ))}

          <button onClick={() => setShowPicker(true)} style={{ background: 'transparent', border: 'none', color: 'var(--c-accent)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem 0', marginBottom: '1rem' }}>
            + Agregar producto
          </button>

          {showPicker && (
            <ProductPickerModal
              catalog={catalog}
              existingVariantIds={lines.map(l => l.variantId)}
              onAdd={line => setLines(prev => [...prev, line])}
              onClose={() => setShowPicker(false)}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #e0dbd0', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, color: '#111' }}>Total</span>
            <span style={{ fontWeight: 700, color: 'var(--c-accent)' }}>{fmt(total)}</span>
          </div>

          <label style={LABEL}>Notas (opcional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Consulta por envío, etc." style={{ ...INP, minHeight: '70px', resize: 'vertical', marginBottom: '1.25rem' }} />

          <button
            onClick={submit}
            disabled={submitting || lines.length === 0 || !buyerName || !buyerWhatsapp}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', border: 'none', background: 'var(--c-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: (submitting || lines.length === 0 || !buyerName || !buyerWhatsapp) ? 0.5 : 1 }}
          >
            {submitting ? 'Creando...' : 'Crear reserva'}
          </button>
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/panel/catalogo" style={{ fontSize: '0.8125rem', color: '#6b7280' }}>← Volver al catálogo</Link>
        </p>
      </div>
    </div>
  )
}
