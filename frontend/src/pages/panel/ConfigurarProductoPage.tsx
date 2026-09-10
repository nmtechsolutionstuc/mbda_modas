import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { getMyCatalogItem, updateCatalogItem, type CatalogItem } from '../../api/reseller'
import { useToast } from '../../context/ToastContext'

// La regla real de comisión (calcularComision en el backend) es binaria:
// vender AL precio oficial paga la comisión fija del producto; vender MÁS ALTO
// paga el 100% de la diferencia. No hay una tercera forma intermedia, así que
// el editor solo ofrece esas dos opciones, no un genérico "% de aumento".
type PriceMode = 'oficial' | 'propio'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function photoUrl(p: string) { return p.startsWith('http') ? p : `${API_BASE}${p}` }

const INP: React.CSSProperties = {
  padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem', background: '#fff', outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.375rem' }

export function ConfigurarProductoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [item, setItem] = useState<CatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)
  const [saving, setSaving] = useState(false)

  const [mode, setMode] = useState<PriceMode>('oficial')
  const [priceInput, setPriceInput] = useState('')

  useEffect(() => {
    if (!id) return
    getMyCatalogItem(id)
      .then(i => {
        setItem(i)
        setVisible(i.visible)
        const base = Number(i.product.basePrice)
        const selling = Number(i.sellingPrice)
        setMode(selling > base ? 'propio' : 'oficial')
        setPriceInput(selling > base ? i.sellingPrice : '')
      })
      .catch(() => showToast('No se pudo cargar el producto', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const base = item ? Number(item.product.basePrice) : 0
  const commissionPct = item ? Number(item.product.commissionPct) : 0
  const propioNum = parseFloat(priceInput)
  const computedPrice = mode === 'oficial' ? base : propioNum

  async function save() {
    if (!id || !item) return
    setSaving(true)
    try {
      const data: { sellingPrice?: number; visible?: boolean } = { visible }
      if (item.saleMode === 'ONLINE') data.sellingPrice = computedPrice
      const updated = await updateCatalogItem(id, data)
      setItem(updated)
      showToast('Cambios guardados', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Cargando...</div>
  if (!item) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Producto no encontrado</div>

  const colors = [...new Set(item.product.variants.map(v => v.color))]
  const sizes = [...new Set(item.product.variants.map(v => v.size))]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate('/panel/catalogo')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="#2B1B12" />
          </button>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.375rem', fontWeight: 700, color: '#111' }}>{item.product.name}</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.75rem' }}>Información</p>

          {item.product.photos[0] && (
            <img src={photoUrl(item.product.photos[0])} alt={item.product.name} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '0.625rem', marginBottom: '1.25rem' }} />
          )}

          {item.saleMode === 'ONLINE' ? (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={LABEL}>Precio de venta</label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.75rem', borderRadius: '0.625rem', border: `1.5px solid ${mode === 'oficial' ? 'var(--c-accent)' : '#e0dbd0'}`, background: mode === 'oficial' ? '#faf5eb' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" checked={mode === 'oficial'} onChange={() => setMode('oficial')} style={{ marginTop: '0.2rem' }} />
                  <span>
                    <span style={{ display: 'block', fontWeight: 700, color: '#111', fontSize: '0.875rem' }}>Vender al precio oficial (${base.toLocaleString('es-AR')})</span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.15rem' }}>
                      Ganás {commissionPct}% (${(base * commissionPct / 100).toLocaleString('es-AR')} por venta).
                    </span>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.75rem', borderRadius: '0.625rem', border: `1.5px solid ${mode === 'propio' ? 'var(--c-accent)' : '#e0dbd0'}`, background: mode === 'propio' ? '#faf5eb' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" checked={mode === 'propio'} onChange={() => setMode('propio')} style={{ marginTop: '0.2rem' }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: '#111', fontSize: '0.875rem' }}>Poner mi propio precio (más alto)</span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.15rem', marginBottom: mode === 'propio' ? '0.625rem' : 0 }}>
                      Ganás toda la diferencia por encima del precio oficial.
                    </span>
                    {mode === 'propio' && (
                      <>
                        <input
                          type="number"
                          value={priceInput}
                          onChange={e => setPriceInput(e.target.value)}
                          min={base} step="any"
                          placeholder={`Mínimo $${base.toLocaleString('es-AR')}`}
                          style={INP}
                          onClick={e => e.stopPropagation()}
                        />
                        {!isNaN(propioNum) && (
                          propioNum < base ? (
                            <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.375rem' }}>No puede ser menor al precio oficial.</p>
                          ) : (
                            <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.375rem' }}>Ganás +${(propioNum - base).toLocaleString('es-AR')} por venta.</p>
                          )
                        )}
                      </>
                    )}
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={LABEL}>Precio de venta</label>
              <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>${Number(item.sellingPrice).toLocaleString('es-AR')} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8125rem' }}>(precio fijo del local)</span></p>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={LABEL}>Colores disponibles</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.map(c => (
                <span key={c} title={c} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '99px', border: '1.5px solid #e0dbd0', background: c.toLowerCase() }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={LABEL}>Talles disponibles</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sizes.map(s => (
                <span key={s} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={LABEL}>Estado</label>
            <select value={visible ? 'active' : 'inactive'} onChange={e => setVisible(e.target.value === 'active')} style={INP}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo (oculto en tu tienda)</option>
            </select>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
            Los precios que configures se verán en tu tienda pública.
          </p>

          {(() => {
            const priceInvalid = item.saleMode === 'ONLINE' && mode === 'propio'
              && (isNaN(propioNum) || propioNum < base)
            return (
              <button
                onClick={save}
                disabled={saving || priceInvalid}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', border: 'none', background: 'var(--c-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: (saving || priceInvalid) ? 0.5 : 1 }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )
          })()}
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/panel/catalogo" style={{ fontSize: '0.8125rem', color: '#6b7280' }}>← Volver al catálogo</Link>
        </p>
      </div>
    </div>
  )
}
