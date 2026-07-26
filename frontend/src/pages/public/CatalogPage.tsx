import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPublicCatalog, createPublicOrder, getPublicConfig,
  type PublicProduct, type PublicConfig, type PublicVariant, type CreatedOrder, type ZipnovaQuote,
} from '../../api/public'
import { linkYaTransferi, linkWhatsApp } from '../../utils/whatsapp'

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
function ProductCard({ product, resellerWhatsapp, storeName, shippingEnabled, cart, onAddToCart }: {
  product: PublicProduct
  resellerWhatsapp: string
  storeName: string
  // Carrito clásico con envío a domicilio — solo se usa si el admin activó "Envíos activos"
  shippingEnabled: boolean
  cart: CartItem[]
  onAddToCart: (item: CartItem, variantStock: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [selVariant, setSelVariant] = useState<PublicVariant | null>(null)
  const [qty, setQty] = useState(1)

  const photo = product.photos[0] ?? null

  // Calcula cuántas unidades de cada variante ya están en el carrito clásico
  function inCartQty(variantId: string) {
    return cart.find(i => i.variantId === variantId)?.quantity ?? 0
  }

  // Solo muestra variantes con al menos 1 unidad disponible (descontando lo ya reservado en el carrito clásico)
  const availVariants = product.variants.filter(v => v.stock - inCartQty(v.id) > 0)

  // Cuántas unidades quedan disponibles de la variante seleccionada
  const maxAddable = selVariant ? selVariant.stock - inCartQty(selVariant.id) : 0

  function selectVariant(v: PublicVariant | null) {
    setSelVariant(v)
    setQty(1)
  }

  const whatsappLink = selVariant
    ? linkWhatsApp(resellerWhatsapp,
        `Hola! Vi "${product.name}" (${selVariant.size}/${selVariant.color}) x${qty} en el catálogo de ${storeName} y quiero comprarlo. ¿Está disponible?`)
    : ''

  function handleAddToCart() {
    if (!selVariant || qty < 1 || qty > maxAddable) return
    onAddToCart({
      variantId: selVariant.id,
      productId: product.productId,
      productName: product.name,
      size: selVariant.size,
      color: selVariant.color,
      photo: photo ?? '',
      quantity: qty,
      unitPrice: product.sellingPrice,
    }, selVariant.stock)
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
                <p style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 600, marginBottom: '1rem' }}>
                  Sin stock disponible
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {product.variants.map(v => {
                    const remaining = v.stock - inCartQty(v.id)
                    const soldOut = remaining <= 0
                    const selected = selVariant?.id === v.id
                    return (
                      <button
                        key={v.id}
                        disabled={soldOut}
                        onClick={() => selectVariant(selected ? null : v)}
                        style={{
                          padding: '0.45rem 1rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600,
                          cursor: soldOut ? 'not-allowed' : 'pointer', transition: 'all 0.12s',
                          border: selected ? `2px solid ${GOLD}` : '1.5px solid #e0dbd0',
                          background: soldOut ? '#f5f3ef' : selected ? '#fef9ec' : '#faf9f7',
                          color: soldOut ? '#9ca3af' : selected ? GOLD : '#374151',
                          boxShadow: selected ? `0 0 0 3px ${GOLD}22` : 'none',
                          opacity: soldOut ? 0.6 : 1,
                          textDecoration: soldOut ? 'line-through' : 'none',
                        }}
                      >
                        {v.size} / {v.color}
                        <span style={{ color: soldOut ? '#9ca3af' : selected ? '#c9a84c' : '#9ca3af', fontWeight: 400, marginLeft: '0.3rem', fontSize: '0.8rem' }}>
                          ({soldOut ? 'agotado' : remaining})
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Cantidad */}
              {selVariant && (
                <div style={{ marginBottom: '1.25rem', background: CREAM, borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0, flex: 1 }}>Cantidad</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <span style={{ fontWeight: 700, fontSize: '1.125rem', minWidth: '28px', textAlign: 'center', color: '#111' }}>{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(maxAddable, q + 1))}
                        disabled={qty >= maxAddable}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #e0dbd0', background: '#fff', cursor: qty >= maxAddable ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty >= maxAddable ? 0.4 : 1 }}
                      >+</button>
                    </div>
                  </div>
                  {/* Info stock disponible */}
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.375rem', marginBottom: 0 }}>
                    Stock disponible: <strong>{maxAddable}</strong> unidades
                  </p>
                </div>
              )}

              {/* CTA — contactar por WhatsApp */}
              {selVariant && qty >= 1 && qty <= maxAddable ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                    background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  📲 Contactar por WhatsApp — ${(product.sellingPrice * qty).toLocaleString('es-AR')}
                </a>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                    background: '#e0dbd0', color: '#9ca3af',
                    fontWeight: 700, fontSize: '1rem', cursor: 'not-allowed',
                  }}
                >
                  Seleccioná un talle y color
                </button>
              )}

              {/* Alternativa: carrito clásico con envío a domicilio — solo si el admin activó "Envíos activos" */}
              {shippingEnabled && (
                <button
                  onClick={handleAddToCart}
                  disabled={!selVariant || qty < 1 || qty > maxAddable}
                  style={{
                    width: '100%', marginTop: '0.625rem', padding: '0.75rem', borderRadius: '0.75rem',
                    border: '1.5px solid #e0dbd0', background: '#fff', color: '#374151',
                    fontWeight: 600, fontSize: '0.875rem', cursor: (!selVariant || qty > maxAddable) ? 'not-allowed' : 'pointer',
                    opacity: (!selVariant || qty > maxAddable) ? 0.5 : 1,
                  }}
                >
                  🛒 Agregar al carrito (envío a domicilio)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Provincias argentinas (Georef IDs) ────────────────────────────────────────
const AR_PROVINCES = [
  { id: '02', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: '06', name: 'Buenos Aires' },
  { id: '10', name: 'Catamarca' },
  { id: '14', name: 'Córdoba' },
  { id: '18', name: 'Corrientes' },
  { id: '22', name: 'Chaco' },
  { id: '26', name: 'Chubut' },
  { id: '30', name: 'Entre Ríos' },
  { id: '34', name: 'Formosa' },
  { id: '38', name: 'Jujuy' },
  { id: '42', name: 'La Pampa' },
  { id: '46', name: 'La Rioja' },
  { id: '50', name: 'Mendoza' },
  { id: '54', name: 'Misiones' },
  { id: '58', name: 'Neuquén' },
  { id: '62', name: 'Río Negro' },
  { id: '66', name: 'Salta' },
  { id: '70', name: 'San Juan' },
  { id: '74', name: 'San Luis' },
  { id: '78', name: 'Santa Cruz' },
  { id: '82', name: 'Santa Fe' },
  { id: '86', name: 'Santiago del Estero' },
  { id: '90', name: 'Tucumán' },
  { id: '94', name: 'Tierra del Fuego' },
]

const GEOREF = 'https://apis.datos.gob.ar/georef/api'

// ── Checkout inline ───────────────────────────────────────────────────────────
function Checkout({ cart, products, refCode, onBack, onSuccess }: {
  cart: CartItem[]
  products: PublicProduct[]
  refCode: string
  onBack: () => void
  onSuccess: (result: CreatedOrder, waLink: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<PublicConfig | null>(null)

  // Cargar config al montar (necesaria para defaults de peso/dims en cotización)
  useEffect(() => {
    getPublicConfig().then(setConfig).catch(() => {/* silencioso */})
  }, []) // eslint-disable-line

  // Cotización Zipnova
  const [quotes, setQuotes] = useState<ZipnovaQuote[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [quotesFallback, setQuotesFallback] = useState<string | null>(null)
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Autocomplete — Georef Argentina
  const [selectedProvinceId, setSelectedProvinceId] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const cityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const addressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    buyerName: '', buyerWhatsapp: '', buyerEmail: '',
    shippingType: 'LOCAL_PICKUP' as 'LOCAL_PICKUP' | 'DOMICILIO',
    deliveryMode: 'home' as 'home' | 'branch',   // solo aplica cuando shippingType === 'DOMICILIO'
    shippingAddress: '', shippingCity: '', shippingProvince: '', shippingZip: '',
    buyerNote: '',
  })

  // Total a transferir = solo productos. El envío se confirma por WhatsApp.
  const productTotal = cart.reduce((a, i) => a + i.unitPrice * i.quantity, 0)
  const isDomicilio  = form.shippingType === 'DOMICILIO'
  const isBranch     = isDomicilio && form.deliveryMode === 'branch'

  // Filtra quotes según el modo elegido:
  // - sucursal  → serviceType === 'pickup_point'
  // - domicilio → cualquier otro (standard_delivery, express_delivery, etc.)
  // Si no hay quotes del tipo exacto, cae al más barato global como fallback
  const cheapestQuote = (() => {
    if (!quotes.length) return null
    if (isBranch) {
      const filtered = quotes.filter(q => q.serviceType === 'pickup_point')
      return filtered.length > 0 ? filtered[0] : quotes[0]
    } else {
      const filtered = quotes.filter(q => q.serviceType !== 'pickup_point')
      return filtered.length > 0 ? filtered[0] : quotes[0]
    }
  })()

  // ── Helpers de dimensiones ────────────────────────────────────────────────
  // Mapa productId → producto para acceder a peso y dims del carrito
  const productMap = new Map(products.map(p => [p.productId, p]))

  function calcShippingDims() {
    // Fallbacks del admin, luego hardcodeados
    const defWeight = config?.defaultWeightGrams ?? 500
    const defH      = config?.defaultDimH        ?? 10
    const defW      = config?.defaultDimW        ?? 15
    const defL      = config?.defaultDimL        ?? 20

    let totalWeight = 0
    let maxH = defH, maxW = defW, maxL = defL

    for (const item of cart) {
      const prod = productMap.get(item.productId)
      totalWeight += (prod?.weightGrams ?? defWeight) * item.quantity
      if (prod?.dimH && prod.dimH > maxH) maxH = prod.dimH
      if (prod?.dimW && prod.dimW > maxW) maxW = prod.dimW
      if (prod?.dimL && prod.dimL > maxL) maxL = prod.dimL
    }

    return { totalWeight: Math.max(1, Math.round(totalWeight)), dimH: maxH, dimW: maxW, dimL: maxL }
  }

  // ── Cotización Zipnova (debounce 600ms al cambiar zip) ────────────────────
  function triggerQuote(zip: string) {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    setQuotes([])
    setQuotesFallback(null)
    if (zip.length < 4) return
    // Capturar todo en este momento (puede cambiar antes de que corra el timeout)
    const city  = form.shippingCity
    const state = form.shippingProvince
    const { totalWeight, dimH, dimW, dimL } = calcShippingDims()
    setQuotesLoading(true)
    quoteTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          zipDestino:    zip,
          weightGrams:   String(totalWeight),
          declaredValue: String(productTotal),
          dimH:          String(dimH),
          dimW:          String(dimW),
          dimL:          String(dimL),
        })
        if (city)  params.set('city',  city)
        if (state) params.set('state', state)
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/public/shipping/calculate?${params}`)
        const json = await res.json()
        if (json.success) {
          if (json.data.quotes?.length > 0) {
            // Ordenamos por cost ascendente para garantizar que [0] sea siempre el más barato
            const sorted = (json.data.quotes as ZipnovaQuote[]).slice().sort((a, b) => a.cost - b.cost)
            setQuotes(sorted)
          } else {
            setQuotesFallback(json.data.message ?? 'El costo de envío no pudo calcularse. Te lo informaremos por WhatsApp.')
          }
        }
      } catch {
        setQuotesFallback('El costo de envío no pudo calcularse. Te lo informaremos por WhatsApp.')
      }
      setQuotesLoading(false)
    }, 600)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleShippingType(type: 'LOCAL_PICKUP' | 'DOMICILIO') {
    setForm(prev => ({ ...prev, shippingType: type, deliveryMode: 'home', shippingAddress: '', shippingCity: '', shippingProvince: '', shippingZip: '' }))
    setSelectedProvinceId('')
    setQuotes([])
    setQuotesFallback(null)
    setCitySuggestions([])
    setAddressSuggestions([])
  }

  function handleDeliveryMode(mode: 'home' | 'branch') {
    setForm(prev => ({ ...prev, deliveryMode: mode, shippingAddress: '', shippingCity: '', shippingProvince: '', shippingZip: '' }))
    setSelectedProvinceId('')
    setQuotes([])
    setQuotesFallback(null)
    setCitySuggestions([])
    setAddressSuggestions([])
  }

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id   = e.target.value
    const name = AR_PROVINCES.find(p => p.id === id)?.name ?? ''
    setSelectedProvinceId(id)
    setForm(prev => ({ ...prev, shippingProvince: name, shippingCity: '', shippingAddress: '', shippingZip: '' }))
    setCitySuggestions([])
    setAddressSuggestions([])
    setQuotes([])
    setQuotesFallback(null)
  }

  function handleCityInput(value: string) {
    setForm(prev => ({ ...prev, shippingCity: value }))
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current)
    setCityOpen(false)
    if (value.length < 2) { setCitySuggestions([]); return }
    cityTimerRef.current = setTimeout(async () => {
      setCityLoading(true)
      try {
        const params = new URLSearchParams({ nombre: value, campos: 'nombre', max: '8', orden: 'nombre' })
        if (selectedProvinceId) params.set('provincia', selectedProvinceId)
        const res  = await fetch(`${GEOREF}/localidades?${params}`)
        const json = await res.json()
        const names: string[] = (json.localidades ?? []).map((l: { nombre: string }) => l.nombre)
        setCitySuggestions(names)
        setCityOpen(names.length > 0)
      } catch { /* silently ignore */ }
      setCityLoading(false)
    }, 350)
  }

  function handleAddressInput(value: string) {
    setForm(prev => ({ ...prev, shippingAddress: value }))
    if (addressTimerRef.current) clearTimeout(addressTimerRef.current)
    setAddressOpen(false)
    if (value.length < 4) { setAddressSuggestions([]); return }
    addressTimerRef.current = setTimeout(async () => {
      setAddressLoading(true)
      try {
        const params = new URLSearchParams({ direccion: value, max: '6' })
        if (selectedProvinceId) params.set('provincia', selectedProvinceId)
        const res  = await fetch(`${GEOREF}/direcciones?${params}`)
        const json = await res.json()
        const suggestions: string[] = [...new Set(
          (json.direcciones ?? [])
            .map((d: { nomenclatura?: string }) => d.nomenclatura?.split(',')[0]?.trim())
            .filter(Boolean) as string[]
        )]
        setAddressSuggestions(suggestions)
        setAddressOpen(suggestions.length > 0)
      } catch { /* silently ignore */ }
      setAddressLoading(false)
    }, 400)
  }

  function handleZip(e: React.ChangeEvent<HTMLInputElement>) {
    const zip = e.target.value.replace(/\D/g, '').slice(0, 8)
    setForm(prev => ({ ...prev, shippingZip: zip }))
    triggerQuote(zip)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.buyerName || !form.buyerWhatsapp) { setError('Nombre y WhatsApp son obligatorios'); return }
    if (isDomicilio) {
      if (!form.shippingProvince)            { setError('Seleccioná la provincia'); return }
      if (!form.shippingCity)                { setError('Ingresá la localidad'); return }
      if (!isBranch && !form.shippingAddress){ setError('Ingresá la dirección'); return }
      if (!form.shippingZip)                 { setError('Ingresá el código postal'); return }
    }
    setError('')
    setSubmitting(true)
    try {
      // Si config no cargó aún al montar, lo intentamos ahora
      if (!config) {
        const cfg = await getPublicConfig()
        setConfig(cfg)
      }
      setStep(2)
    } catch { setError('Error al cargar datos de pago') }
    setSubmitting(false)
  }

  async function handleConfirm() {
    if (!config) return
    setSubmitting(true)
    setError('')
    try {
      const shippingMethod = isDomicilio
        ? (cheapestQuote?.shippingMethod ?? 'OTHER_CARRIER')
        : 'LOCAL_PICKUP'

      const result = await createPublicOrder({
        refCode,
        buyerName:         form.buyerName,
        buyerWhatsapp:     form.buyerWhatsapp,
        buyerEmail:        form.buyerEmail || undefined,
        shippingMethod,
        ...(isDomicilio && {
          shippingAddress:  isBranch ? 'Entrega en sucursal' : form.shippingAddress,
          shippingCity:     form.shippingCity,
          shippingProvince: form.shippingProvince,
          shippingZip:      form.shippingZip,
        }),
        // shippingCost NO se envía → total del pedido = solo productos
        // shippingQuoteData guarda el estimado como referencia para el admin
        ...(cheapestQuote && {
          shippingQuoteData: JSON.stringify({
            estimated:    true,
            carrierId:    cheapestQuote.carrierId,
            carrierName:  cheapestQuote.carrierName,
            serviceType:  cheapestQuote.serviceType,
            logisticType: cheapestQuote.logisticType,
            estimatedCost: cheapestQuote.cost,
          }),
        }),
        ...(form.buyerNote.trim() && { buyerNote: form.buyerNote.trim() }),
        items: cart.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      })
      // Total en WA = solo productos (envío se confirma después)
      const waLink = linkYaTransferi(result.payment.whatsapp, {
        orderNumber: result.order.orderNumber,
        buyerName:   form.buyerName,
        total:       productTotal,
      })
      onSuccess(result, waLink)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } }
      setError(err?.response?.data?.error?.message ?? 'Error al procesar el pedido')
    }
    setSubmitting(false)
  }

  const carrierLabel = isDomicilio ? 'Envío a domicilio' : 'Retiro local'

  // ── Estilos helper para autocomplete ──────────────────────────────────────
  const SUG_DROPDOWN: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
    background: '#fff', borderRadius: '0 0 0.625rem 0.625rem',
    border: '1.5px solid #b8922a', borderTop: 'none',
    maxHeight: '200px', overflowY: 'auto',
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
  }
  const SUG_ITEM: React.CSSProperties = {
    padding: '0.6rem 0.875rem', cursor: 'pointer',
    fontSize: '0.875rem', color: '#111',
    borderBottom: '1px solid #f0ece4',
  }

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

          {/* Tipo de entrega */}
          <div>
            <p style={LABEL}>Tipo de entrega *</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {(['LOCAL_PICKUP', 'DOMICILIO'] as const).map(type => (
                <button key={type} type="button" onClick={() => handleShippingType(type)}
                  style={{ padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    border: `2px solid ${form.shippingType === type ? '#111' : '#e0dbd0'}`,
                    background: form.shippingType === type ? '#111' : '#fff',
                    color: form.shippingType === type ? '#fff' : '#6b7280',
                  }}>
                  {type === 'LOCAL_PICKUP' ? '🏪 Retiro local' : '🚚 Envío a domicilio'}
                </button>
              ))}
            </div>
          </div>

          {isDomicilio && (
            <>
              {/* Sub-opción: a domicilio o en sucursal */}
              <div>
                <p style={LABEL}>¿Cómo querés recibirlo? *</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {(['home', 'branch'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => handleDeliveryMode(mode)}
                      style={{ padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                        border: `2px solid ${form.deliveryMode === mode ? GOLD : '#e0dbd0'}`,
                        background: form.deliveryMode === mode ? '#fef9ec' : '#fff',
                        color: form.deliveryMode === mode ? GOLD : '#6b7280',
                      }}>
                      {mode === 'home' ? '🏠 A mi domicilio' : '🏪 En sucursal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provincia */}
              <div>
                <label style={LABEL}>Provincia *</label>
                <select
                  value={selectedProvinceId}
                  onChange={handleProvinceChange}
                  required
                  style={{ ...INP, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%239ca3af\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.875rem center', paddingRight: '2.25rem' } as React.CSSProperties}
                >
                  <option value="">Seleccioná tu provincia...</option>
                  {AR_PROVINCES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Localidad con autocomplete */}
              <div style={{ position: 'relative' }}>
                <label style={LABEL}>Localidad / Ciudad *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.shippingCity}
                    onChange={e => handleCityInput(e.target.value)}
                    onFocus={() => citySuggestions.length > 0 && setCityOpen(true)}
                    onBlur={() => setTimeout(() => setCityOpen(false), 180)}
                    style={INP}
                    placeholder={selectedProvinceId ? 'Escribí tu localidad...' : 'Primero elegí la provincia'}
                    disabled={!selectedProvinceId}
                    required
                    autoComplete="off"
                  />
                  {cityLoading && (
                    <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.75rem' }}>•••</span>
                  )}
                  {cityOpen && citySuggestions.length > 0 && (
                    <div style={SUG_DROPDOWN}>
                      {citySuggestions.map(s => (
                        <div key={s} onMouseDown={() => { setForm(prev => ({ ...prev, shippingCity: s })); setCityOpen(false) }}
                          style={SUG_ITEM}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección con autocomplete — solo para entrega a domicilio */}
              {!isBranch && <div style={{ position: 'relative' }}>
                <label style={LABEL}>Calle y número *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.shippingAddress}
                    onChange={e => handleAddressInput(e.target.value)}
                    onFocus={() => addressSuggestions.length > 0 && setAddressOpen(true)}
                    onBlur={() => setTimeout(() => setAddressOpen(false), 180)}
                    style={INP}
                    placeholder="Ej: Av. Italia 610"
                    disabled={!selectedProvinceId}
                    required
                    autoComplete="off"
                  />
                  {addressLoading && (
                    <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.75rem' }}>•••</span>
                  )}
                  {addressOpen && addressSuggestions.length > 0 && (
                    <div style={SUG_DROPDOWN}>
                      {addressSuggestions.map(s => (
                        <div key={s} onMouseDown={() => { setForm(prev => ({ ...prev, shippingAddress: s })); setAddressOpen(false) }}
                          style={SUG_ITEM}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>}

              {/* Código postal */}
              <div>
                <label style={LABEL}>{isBranch ? 'Código postal de tu zona *' : 'Código postal *'}</label>
                <input
                  value={form.shippingZip}
                  onChange={handleZip}
                  placeholder="Ej: 4000"
                  style={INP}
                  inputMode="numeric"
                  required
                  autoComplete="off"
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {isBranch ? 'Lo usamos para estimar el costo de envío a sucursal' : 'Se usa para calcular el costo de envío'}
                </p>
              </div>

              {/* Estimado de envío Zipnova */}
              {form.shippingZip.length >= 4 && (
                <div>
                  {quotesLoading && (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', background: CREAM, border: '1px solid #e0dbd0', fontSize: '0.875rem', color: '#6b7280', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Calculando estimado de envío...
                    </div>
                  )}

                  {!quotesLoading && cheapestQuote && (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', margin: '0 0 0.25rem' }}>
                        📦 Envío estimado
                      </p>
                      <p style={{ fontSize: '0.9375rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                        Envío estimado: <strong>${cheapestQuote.cost.toLocaleString('es-AR')}</strong>
                      </p>
                      <p style={{ fontSize: '0.775rem', color: '#6b7280', margin: '0.3rem 0 0' }}>
                        Solo transferís el total de productos. El costo final lo confirmamos por WhatsApp.
                      </p>
                    </div>
                  )}

                  {!quotesLoading && quotesFallback && (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.875rem' }}>
                      <span>💬</span>
                      <span style={{ color: '#92400e' }}>{quotesFallback}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Nota del pedido */}
          <div>
            <label style={LABEL}>Nota del pedido <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
            <textarea
              value={form.buyerNote}
              onChange={e => setForm(prev => ({ ...prev, buyerNote: e.target.value }))}
              style={{ ...INP, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9375rem' } as React.CSSProperties}
              placeholder="Ej: Dejar en portería, horario preferido de entrega, aclaraciones sobre el pedido..."
              maxLength={500}
            />
            {form.buyerNote.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
                {form.buyerNote.length}/500
              </p>
            )}
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onBack} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Volver</button>
            <button type="submit" disabled={submitting} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: CREAM, fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? 'Cargando...' : `Continuar · $${productTotal.toLocaleString('es-AR')}`}
            </button>
          </div>
        </form>
      )}

      {step === 2 && config && (
        <div>
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: GOLD, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos para transferir</p>

            {/* Desglose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.875rem', paddingBottom: '0.875rem', borderBottom: '1px dashed #e0dbd0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>Subtotal productos</span>
                <span style={{ fontWeight: 600 }}>${productTotal.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: '#6b7280' }}>{carrierLabel}</span>
                  {isDomicilio && (
                    <span style={{ fontSize: '0.65rem', background: '#fef9ec', color: '#92400e', border: '1px solid #fde68a', borderRadius: '99px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>
                      ESTIMADO
                    </span>
                  )}
                </div>
                {!isDomicilio
                  ? <span style={{ fontWeight: 600, color: '#166534' }}>Retiro local</span>
                  : cheapestQuote
                    ? <span style={{ color: '#92400e', fontSize: '0.875rem', fontStyle: 'italic' }}>est. ${cheapestQuote.cost.toLocaleString('es-AR')}</span>
                    : <span style={{ color: '#92400e', fontSize: '0.8rem', fontStyle: 'italic' }}>A confirmar por WhatsApp</span>
                }
              </div>
            </div>

            {/* Total a transferir = solo productos */}
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.125rem' }}>
                Total a transferir hoy
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111', margin: 0 }}>
                ${productTotal.toLocaleString('es-AR')}
              </p>
              {isDomicilio && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.125rem 0 0' }}>
                  El envío se abona por separado — te lo confirmamos por WhatsApp
                </p>
              )}
            </div>

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

          {/* Aviso de envío — siempre visible cuando es domicilio */}
          {isDomicilio && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start', fontSize: '0.875rem' }}>
              <span>💬</span>
              <span style={{ color: '#92400e', lineHeight: 1.5 }}>
                <strong>No incluyas el envío en la transferencia.</strong>{' '}
                {cheapestQuote
                  ? <>Envío estimado: <strong>${cheapestQuote.cost.toLocaleString('es-AR')}</strong>. El precio final te lo confirmamos por WhatsApp antes de despachar.</>
                  : <>El costo de envío te lo informamos por WhatsApp antes de despachar.</>
                }
              </span>
            </div>
          )}

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
  // Carrito clásico con envío a domicilio — oculto salvo que el admin active "Envíos activos"
  const [shippingEnabled, setShippingEnabled] = useState(false)

  useEffect(() => {
    if (!refCode) { setNotFound(true); setLoading(false); return }
    setCart(loadCart(refCode))
    getPublicCatalog(refCode)
      .then(setCatalog)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
    getPublicConfig().then(c => setShippingEnabled(c.shippingEnabled)).catch(() => {/* por defecto oculto */})
  }, [refCode])

  function addToCart(item: CartItem, variantStock: number) {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === item.variantId)
      const currentQty = existing?.quantity ?? 0
      const newQty = Math.min(currentQty + item.quantity, variantStock) // nunca supera el stock
      const next = existing
        ? prev.map(i => i.variantId === item.variantId ? { ...i, quantity: newQty } : i)
        : [...prev, { ...item, quantity: newQty }]
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

          {shippingEnabled && cartCount > 0 && (
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
                  {filtered.map(p => (
                    <ProductCard
                      key={p.productId}
                      product={p}
                      resellerWhatsapp={catalog.reseller.whatsapp}
                      storeName={catalog.reseller.storeName}
                      shippingEnabled={shippingEnabled}
                      cart={cart}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
            }
          </>
        )}

        {view === 'checkout' && shippingEnabled && (
          <Checkout
            cart={cart}
            products={catalog?.products ?? []}
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

      {/* Drawer del carrito clásico (envío a domicilio) */}
      {shippingEnabled && cartOpen && view === 'catalog' && (
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
