import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicCatalog, createPublicOrder, getPublicConfig, type PublicProduct, type PublicVariant, type CreatedOrder } from '../../api/public'
import { linkYaTransferi } from '../../utils/whatsapp'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CartItem {
  variantId: string
  productId: string
  productName: string
  size: string
  color: string
  photo: string
  quantity: number
  unitPrice: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const GOLD = '#b8922a'
const CREAM = '#f5f3ef'
const INP: React.CSSProperties = { padding: '0.6rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

function cartKey(refCode: string) { return `cart-${refCode}` }
function loadCart(refCode: string): CartItem[] {
  try { return JSON.parse(localStorage.getItem(cartKey(refCode)) || '[]') } catch { return [] }
}
function saveCart(refCode: string, items: CartItem[]) {
  localStorage.setItem(cartKey(refCode), JSON.stringify(items))
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: PublicProduct; onAdd: (item: CartItem) => void }) {
  const [open, setOpen] = useState(false)
  const [selVariant, setSelVariant] = useState<PublicVariant | null>(null)
  const [qty, setQty] = useState(1)

  const photo = product.photos[0] ?? null
  const availVariants = product.variants.filter(v => v.stock > 0)

  function handleAdd() {
    if (!selVariant) return
    onAdd({
      variantId: selVariant.id,
      productId: product.productId,
      productName: product.name,
      size: selVariant.size,
      color: selVariant.color,
      photo: photo ?? '',
      quantity: qty,
      unitPrice: product.sellingPrice,
    })
    setOpen(false)
    setSelVariant(null)
    setQty(1)
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
      >
        <div style={{ height: '200px', background: CREAM, position: 'relative', overflow: 'hidden' }}>
          {photo
            ? <img src={photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>🧥</div>
          }
        </div>
        <div style={{ padding: '0.875rem' }}>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{product.name}</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>{product.category.name}</p>
          <p style={{ fontWeight: 700, color: GOLD, fontSize: '1.125rem' }}>${product.sellingPrice.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Modal de producto */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Foto */}
            <div style={{ position: 'relative', background: CREAM, borderRadius: '1.25rem 1.25rem 0 0', overflow: 'hidden', flexShrink: 0 }}>
              {photo
                ? <img src={photo} alt={product.name} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                : <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🧥</div>
              }
              {/* Botón cerrar */}
              <button
                onClick={() => setOpen(false)}
                style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >
                ✕
              </button>
              {/* Badge categoría */}
              <span style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '99px' }}>
                {product.category.name}
              </span>
            </div>

            {/* Contenido */}
            <div style={{ padding: '1.5rem' }}>
              {/* Nombre y precio */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.375rem', fontWeight: 700, color: '#111', margin: 0 }}>{product.name}</h2>
                <p style={{ fontWeight: 700, fontSize: '1.375rem', color: GOLD, margin: 0, whiteSpace: 'nowrap' }}>${product.sellingPrice.toLocaleString('es-AR')}</p>
              </div>

              {product.description && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>{product.description}</p>
              )}

              {/* Variantes */}
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Talle y color</p>
              {availVariants.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 600, marginBottom: '1rem' }}>Sin stock disponible</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {availVariants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelVariant(selVariant?.id === v.id ? null : v)}
                      style={{
                        padding: '0.45rem 1rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                        border: selVariant?.id === v.id ? `2px solid ${GOLD}` : '1.5px solid #e0dbd0',
                        background: selVariant?.id === v.id ? '#fef9ec' : '#faf9f7',
                        color: selVariant?.id === v.id ? GOLD : '#374151',
                        boxShadow: selVariant?.id === v.id ? `0 0 0 3px ${GOLD}22` : 'none',
                      }}
                    >
                      {v.size} / {v.color}
                      <span style={{ color: selVariant?.id === v.id ? '#c9a84c' : '#9ca3af', fontWeight: 400, marginLeft: '0.3rem', fontSize: '0.8rem' }}>({v.stock})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cantidad */}
              {selVariant && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem', background: CREAM, borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0, flex: 1 }}>Cantidad</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >−</button>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', minWidth: '28px', textAlign: 'center', color: '#111' }}>{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(selVariant.stock, q + 1))}
                      style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >+</button>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleAdd}
                disabled={!selVariant || availVariants.length === 0}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                  background: selVariant ? '#111' : '#e0dbd0',
                  color: selVariant ? '#fff' : '#9ca3af',
                  fontWeight: 700, fontSize: '1rem', cursor: selVariant ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.15s',
                }}
              >
                {!selVariant
                  ? 'Seleccioná un talle y color'
                  : `Agregar al carrito — $${(product.sellingPrice * qty).toLocaleString('es-AR')}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Checkout inline ───────────────────────────────────────────────────────────
function Checkout({ cart, refCode, onBack, onSuccess }: {
  cart: CartItem[]
  refCode: string
  onBack: () => void
  onSuccess: (result: CreatedOrder, waLink: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<{ cbu: string; alias: string; whatsapp: string } | null>(null)

  const [form, setForm] = useState({
    buyerName: '', buyerWhatsapp: '', buyerEmail: '',
    shippingMethod: 'LOCAL_PICKUP' as 'LOCAL_PICKUP' | 'CORREO_ARGENTINO' | 'ANDREANI',
    shippingAddress: '', shippingCity: '', shippingProvince: '', shippingZip: '',
  })

  const total = cart.reduce((a, i) => a + i.unitPrice * i.quantity, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.buyerName || !form.buyerWhatsapp) { setError('Nombre y WhatsApp son obligatorios'); return }
    setError('')
    setSubmitting(true)
    try {
      const cfg = await getPublicConfig()
      setConfig(cfg)
      setStep(2)
    } catch { setError('Error al cargar datos de pago') }
    setSubmitting(false)
  }

  async function handleConfirm() {
    if (!config) return
    setSubmitting(true)
    setError('')
    try {
      const result = await createPublicOrder({
        refCode,
        buyerName: form.buyerName,
        buyerWhatsapp: form.buyerWhatsapp,
        buyerEmail: form.buyerEmail || undefined,
        shippingMethod: form.shippingMethod,
        ...(form.shippingMethod !== 'LOCAL_PICKUP' && {
          shippingAddress: form.shippingAddress,
          shippingCity: form.shippingCity,
          shippingProvince: form.shippingProvince,
          shippingZip: form.shippingZip,
        }),
        items: cart.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      })
      const waLink = linkYaTransferi(result.payment.whatsapp, {
        orderNumber: result.order.orderNumber,
        buyerName: form.buyerName,
        total,    // usa el total local calculado del carrito (es un número real)
      })
      onSuccess(result, waLink)
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Error al procesar el pedido')
    }
    setSubmitting(false)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[{ n: 1, label: 'Tus datos' }, { n: 2, label: 'Pagar' }].map(s => (
          <div key={s.n} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center', background: step === s.n ? '#111' : '#e8e3d5', color: step === s.n ? '#fff' : '#6b7280', fontSize: '0.8125rem', fontWeight: 600 }}>
            {s.n}. {s.label}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div><label style={LABEL}>Nombre completo *</label><input value={form.buyerName} onChange={f('buyerName')} style={INP} required /></div>
          <div><label style={LABEL}>WhatsApp (con código de país) *</label><input value={form.buyerWhatsapp} onChange={f('buyerWhatsapp')} placeholder="5493812345678" style={INP} required /></div>
          <div><label style={LABEL}>Email (opcional)</label><input type="email" value={form.buyerEmail} onChange={f('buyerEmail')} style={INP} /></div>

          <div>
            <label style={LABEL}>Método de envío *</label>
            <select value={form.shippingMethod} onChange={f('shippingMethod')} style={INP}>
              <option value="LOCAL_PICKUP">Retiro local / acordar con revendedor</option>
              <option value="CORREO_ARGENTINO">Correo Argentino</option>
              <option value="ANDREANI">Andreani</option>
            </select>
          </div>

          {form.shippingMethod !== 'LOCAL_PICKUP' && (
            <>
              <div><label style={LABEL}>Dirección</label><input value={form.shippingAddress} onChange={f('shippingAddress')} style={INP} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><label style={LABEL}>Ciudad</label><input value={form.shippingCity} onChange={f('shippingCity')} style={INP} /></div>
                <div><label style={LABEL}>Provincia</label><input value={form.shippingProvince} onChange={f('shippingProvince')} style={INP} /></div>
              </div>
              <div><label style={LABEL}>Código postal</label><input value={form.shippingZip} onChange={f('shippingZip')} style={INP} /></div>
            </>
          )}

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onBack} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Volver</button>
            <button type="submit" disabled={submitting} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: CREAM, fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? 'Cargando...' : `Continuar · $${total.toLocaleString('es-AR')}`}
            </button>
          </div>
        </form>
      )}

      {step === 2 && config && (
        <div>
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: GOLD, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos para transferir</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111', marginBottom: '0.25rem' }}>${total.toLocaleString('es-AR')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>CBU</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.05em' }}>{config.cbu}</span>
              </div>
              {config.alias && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Alias</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{config.alias}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.75rem' }}>Tu pedido</p>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#374151' }}>{item.productName} × {item.quantity} <span style={{ color: '#9ca3af' }}>({item.size}/{item.color})</span></span>
                <span style={{ fontWeight: 600 }}>${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}

          <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', marginBottom: '1rem' }}>
            Al hacer clic en "Ya transferí" se confirmará tu pedido y se abrirá WhatsApp para notificar el pago.
          </p>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.625rem', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            {submitting ? 'Procesando...' : '✓ Ya transferí'}
          </button>
          <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.625rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Volver
          </button>
        </div>
      )}
    </div>
  )
}

// ── Confirmación final ────────────────────────────────────────────────────────
function Confirmation({ order, waLink, storeName }: { order: CreatedOrder; waLink: string; storeName: string }) {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '2rem 1rem' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>
        ¡Pedido registrado!
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Pedido <strong>{order.order.orderNumber}</strong> de <strong>{storeName}</strong>.<br />
        Una vez que confirmemos tu transferencia, preparamos el envío.
      </p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', padding: '0.875rem', borderRadius: '0.625rem', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', marginBottom: '1rem' }}
      >
        📲 Avisar que transferí por WhatsApp
      </a>
      <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
        Tu stock está reservado por {/* dispatchDays */} 24 horas. Si no confirmamos el pago, se cancela automáticamente.
      </p>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function CatalogPage() {
  const [params] = useSearchParams()
  const refCode = params.get('ref') ?? ''

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [catalog, setCatalog] = useState<{ reseller: any; products: PublicProduct[]; categories: any[] } | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'catalog' | 'checkout' | 'done'>('catalog')
  const [doneData, setDoneData] = useState<{ order: CreatedOrder; waLink: string } | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    if (!refCode) { setNotFound(true); setLoading(false); return }
    setCart(loadCart(refCode))
    getPublicCatalog(refCode)
      .then(setCatalog)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [refCode])

  function addToCart(item: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === item.variantId)
      const next = existing
        ? prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...prev, item]
      saveCart(refCode, next)
      return next
    })
    setCartOpen(true)
  }

  function removeFromCart(variantId: string) {
    setCart(prev => { const next = prev.filter(i => i.variantId !== variantId); saveCart(refCode, next); return next })
  }

  function clearCart() {
    setCart([]); saveCart(refCode, [])
  }

  const filtered = (catalog?.products ?? []).filter(p => {
    const matchCat = !filterCat || p.category.id === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const cartTotal = cart.reduce((a, i) => a + i.unitPrice * i.quantity, 0)
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM }}>
      <p style={{ color: '#6b7280' }}>Cargando catálogo...</p>
    </div>
  )

  if (notFound || !catalog) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: CREAM, textAlign: 'center', padding: '2rem' }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>Catálogo no encontrado</h1>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>El link que usaste no es válido o ya no está disponible.</p>
    </div>
  )

  if (view === 'done' && doneData) return (
    <div style={{ minHeight: '100vh', background: CREAM, padding: '2rem 1.5rem' }}>
      <Confirmation order={doneData.order} waLink={doneData.waLink} storeName={catalog.reseller.storeName} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: CREAM }}>
      {/* Header de tienda */}
      <div style={{ background: '#111', color: '#fff', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {catalog.reseller.storePhoto
              ? <img src={catalog.reseller.storePhoto} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏪</div>
            }
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.125rem' }}>{catalog.reseller.storeName}</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{catalog.products.length} productos</p>
            </div>
          </div>

          {cartCount > 0 && (
            <button
              onClick={() => view === 'checkout' ? setView('catalog') : setCartOpen(!cartOpen)}
              style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '2rem', padding: '0.5rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              🛒 {cartCount} · ${cartTotal.toLocaleString('es-AR')}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
        {view === 'catalog' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                style={{ ...INP, width: '200px', flex: '0 0 auto' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterCat('')}
                  style={{ padding: '0.4rem 0.875rem', borderRadius: '99px', border: '1.5px solid', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', borderColor: !filterCat ? '#111' : '#e0dbd0', background: !filterCat ? '#111' : '#fff', color: !filterCat ? '#fff' : '#6b7280' }}
                >
                  Todos
                </button>
                {catalog.categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)}
                    style={{ padding: '0.4rem 0.875rem', borderRadius: '99px', border: '1.5px solid', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', borderColor: filterCat === c.id ? '#111' : '#e0dbd0', background: filterCat === c.id ? '#111' : '#fff', color: filterCat === c.id ? '#fff' : '#6b7280' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            {filtered.length === 0
              ? <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No se encontraron productos</p>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {filtered.map(p => <ProductCard key={p.productId} product={p} onAdd={addToCart} />)}
                </div>
            }
          </>
        )}

        {view === 'checkout' && (
          <Checkout
            cart={cart}
            refCode={refCode}
            onBack={() => setView('catalog')}
            onSuccess={(order, waLink) => {
              clearCart()
              setDoneData({ order, waLink })
              setView('done')
            }}
          />
        )}
      </div>

      {/* Drawer del carrito */}
      {cartOpen && view === 'catalog' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setCartOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '360px', maxWidth: '100vw', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.1rem' }}>🛒 Carrito ({cartCount})</p>
              <button onClick={() => setCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6b7280' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {cart.length === 0
                ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>El carrito está vacío</p>
                : cart.map(item => (
                    <div key={item.variantId} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', padding: '0.75rem', borderRadius: '0.625rem', background: CREAM }}>
                      {item.photo
                        ? <img src={item.photo} alt="" style={{ width: '56px', height: '56px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                        : <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', background: '#e0dbd0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧥</div>
                      }
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111' }}>{item.productName}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.size} / {item.color} × {item.quantity}</p>
                        <p style={{ fontWeight: 700, color: GOLD, fontSize: '0.9rem' }}>${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.variantId)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.1rem', alignSelf: 'flex-start' }}>×</button>
                    </div>
                  ))
              }
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1rem', borderTop: '1px solid #e0dbd0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem', color: GOLD }}>${cartTotal.toLocaleString('es-AR')}</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setView('checkout') }}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: CREAM, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}
                >
                  Comprar ahora →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
