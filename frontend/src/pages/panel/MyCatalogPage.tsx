import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import {
  getMyCatalog,
  getResellerCategories,
  getAvailableProducts,
  addToCatalog,
  removeCatalogItem,
  type CatalogItem,
  type AvailableProduct,
  type ResellerCategory,
} from '../../api/reseller'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

function photoUrl(p: string) {
  return p.startsWith('http') ? p : `${API_BASE}${p}`
}

const INP: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  borderRadius: '0.5rem',
  border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem',
  background: '#fff',
  outline: 'none',
  color: '#111',
  width: '100%',
}

// ── Subcomponent: fila de lista del catálogo ──────────────────────────────────
function CatalogListRow({ item, onRemove }: { item: CatalogItem; onRemove: (id: string) => void }) {
  const { showToast } = useToast()
  const [removing, setRemoving] = useState(false)

  async function remove() {
    if (!confirm(`¿Eliminar "${item.product.name}" de tu catálogo?`)) return
    setRemoving(true)
    try {
      await removeCatalogItem(item.id)
      onRemove(item.id)
      showToast('Producto eliminado del catálogo', 'success')
    } catch {
      showToast('Error al eliminar', 'error')
    }
    setRemoving(false)
  }

  const photo = item.product.photos[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e0dbd0' }}>
      <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? <img src={photoUrl(photo)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.25rem' }}>🧥</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>{item.product.name}</p>
      </div>
      <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>${Number(item.sellingPrice).toLocaleString('es-AR')}</span>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '99px', whiteSpace: 'nowrap',
        background: item.visible ? '#16a34a18' : '#f3f4f6', color: item.visible ? '#16a34a' : '#6b7280',
        border: `1px solid ${item.visible ? '#16a34a40' : '#e5e7eb'}`,
      }}>
        {item.visible ? 'Activo' : 'Inactivo'}
      </span>
      <Link to={`/panel/catalogo/${item.id}`} aria-label="Configurar producto" style={{ display: 'flex', color: '#6b7280' }}>
        <Pencil size={16} />
      </Link>
      <button onClick={remove} disabled={removing} aria-label="Eliminar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#dc2626' }}>
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ── Subcomponent: card de producto disponible ─────────────────────────────────
function AvailableProductCard({ product, onAdded }: {
  product: AvailableProduct
  onAdded: (item: CatalogItem) => void
}) {
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState<'oficial' | 'propio'>('oficial')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const base = Number(product.basePrice)
  const commission = Number(product.commissionPct)
  const priceNum = parseFloat(price)

  async function addProduct() {
    const finalPrice = mode === 'oficial' ? base : priceNum
    if (mode === 'propio' && (isNaN(priceNum) || priceNum < base)) {
      showToast('El precio no puede ser menor al precio oficial', 'error')
      return
    }
    setSaving(true)
    try {
      const item = await addToCatalog(product.id, finalPrice, 'ONLINE')
      onAdded(item)
      showToast(`"${product.name}" agregado a tu catálogo`, 'success')
      setShowForm(false)
      setPrice('')
      setMode('oficial')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al agregar', 'error')
    }
    setSaving(false)
  }

  const photo = product.photos[0]
  const totalStock = product.variants.reduce((a, v) => a + v.stock, 0)
  const inCatalog = !!product.onlineCatalogItemId

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
      {/* Foto */}
      <div style={{ background: '#f5f3ef', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {photo
          ? <img src={photoUrl(photo)} alt={product.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
          : <span style={{ fontSize: '2.5rem' }}>🧥</span>
        }
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{product.name}</p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          {product.category.name} · {totalStock} en stock · Precio base ${base.toLocaleString('es-AR')}
        </p>

        <div style={{ marginBottom: '0.5rem' }}>
          {inCatalog
            ? <span style={{ display: 'block', padding: '0.5rem', borderRadius: '0.5rem', background: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>✓ En tu catálogo · ${Number(product.onlineSellingPrice).toLocaleString('es-AR')}</span>
            : <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>+ Agregar a mi catálogo</button>
          }
        </div>

        {showForm && !inCatalog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.625rem', borderRadius: '0.5rem', border: `1.5px solid ${mode === 'oficial' ? 'var(--c-accent)' : '#e0dbd0'}`, background: mode === 'oficial' ? '#faf5eb' : '#faf9f6', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'oficial'} onChange={() => setMode('oficial')} style={{ marginTop: '0.15rem' }} />
              <span>
                <span style={{ display: 'block', fontWeight: 700, color: '#111', fontSize: '0.8125rem' }}>Precio oficial (${base.toLocaleString('es-AR')})</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>Ganás {commission}% (${(base * commission / 100).toLocaleString('es-AR')} por venta)</span>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.625rem', borderRadius: '0.5rem', border: `1.5px solid ${mode === 'propio' ? 'var(--c-accent)' : '#e0dbd0'}`, background: mode === 'propio' ? '#faf5eb' : '#faf9f6', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'propio'} onChange={() => setMode('propio')} style={{ marginTop: '0.15rem' }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700, color: '#111', fontSize: '0.8125rem' }}>Mi propio precio (más alto)</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: mode === 'propio' ? '0.5rem' : 0 }}>Ganás toda la diferencia</span>
                {mode === 'propio' && (
                  <>
                    <input
                      type="number"
                      value={price}
                      min={base} step="any"
                      placeholder={`Mínimo $${base.toLocaleString('es-AR')}`}
                      onChange={e => setPrice(e.target.value)}
                      style={INP}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    {price && !isNaN(priceNum) && (
                      priceNum < base ? (
                        <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.3rem' }}>Mínimo: ${base.toLocaleString('es-AR')}</p>
                      ) : (
                        <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.3rem' }}>Ganás +${(priceNum - base).toLocaleString('es-AR')} por venta</p>
                      )
                    )}
                  </>
                )}
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
              <button
                onClick={addProduct}
                disabled={saving || (mode === 'propio' && (isNaN(priceNum) || priceNum < base))}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: (saving || (mode === 'propio' && (isNaN(priceNum) || priceNum < base))) ? 0.5 : 1 }}
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
              <button
                onClick={() => { setShowForm(false); setPrice(''); setMode('oficial') }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function MyCatalogPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'catalog' | 'add'>('catalog')
  const [loading, setLoading] = useState(true)

  // Mi catálogo
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])

  // Agregar productos
  const [categories, setCategories] = useState<ResellerCategory[]>([])
  const [available, setAvailable] = useState<AvailableProduct[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    Promise.all([
      getMyCatalog(),
      getResellerCategories(),
    ]).then(([items, cats]) => {
      setCatalogItems(items)
      setCategories(cats)
    }).catch(() => showToast('Error al cargar datos', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  // Cargar productos disponibles cuando cambia tab/filtros
  useEffect(() => {
    if (tab !== 'add') return
    setLoadingProducts(true)
    getAvailableProducts({ page, limit: 12, categoryId: categoryId || undefined, search: search || undefined })
      .then(r => {
        setAvailable(r.products)
        setTotalPages(r.totalPages)
      })
      .catch(() => showToast('Error al cargar productos', 'error'))
      .finally(() => setLoadingProducts(false))
  }, [tab, page, categoryId, search]) // eslint-disable-line

  function handleCatalogItemRemoved(id: string) {
    setCatalogItems(prev => prev.filter(i => i.id !== id))
  }

  function handleProductAdded(newItem: CatalogItem) {
    setCatalogItems(prev => [newItem, ...prev])
    setAvailable(prev => prev.map(p =>
      p.id === newItem.product.id
        ? { ...p, onlineCatalogItemId: newItem.id, onlineSellingPrice: newItem.sellingPrice }
        : p
    ))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/panel" style={{ color: 'var(--c-accent)' }}>Panel</Link> › Productos
        </p>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
              Productos
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              {catalogItems.length} {catalogItems.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#e8e3d5', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content', marginBottom: '1.5rem' }}>
          {[
            { key: 'catalog', label: 'Mi Catálogo' },
            { key: 'add', label: '+ Agregar productos' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#111' : '#6b7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Mi Catálogo ── */}
        {tab === 'catalog' && (
          <>
            {catalogItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</p>
                <p style={{ fontWeight: 600, color: '#111', marginBottom: '0.5rem' }}>Tu catálogo está vacío</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Agregá productos de MBDA para empezar a vender.</p>
                <button
                  onClick={() => setTab('add')}
                  style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Agregar productos
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {catalogItems.map(item => (
                  <CatalogListRow
                    key={item.id}
                    item={item}
                    onRemove={handleCatalogItemRemoved}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Agregar productos ── */}
        {tab === 'add' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar productos..."
                style={{ ...INP, width: '220px', flex: '0 0 auto' }}
              />
              <select
                value={categoryId}
                onChange={e => { setCategoryId(e.target.value); setPage(1) }}
                style={{ ...INP, width: '180px', flex: '0 0 auto' }}
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando productos...</div>
            ) : available.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                No se encontraron productos
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {available.map(product => (
                    <AvailableProductCard
                      key={product.id}
                      product={product}
                      onAdded={handleProductAdded}
                    />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600, opacity: page === 1 ? 0.4 : 1 }}
                    >
                      ←
                    </button>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600, opacity: page === totalPages ? 0.4 : 1 }}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
