import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { getCategories } from '../../api/admin'
import type { Category } from '../../api/admin'
import {
  getMyCatalog,
  getAvailableProducts,
  addToCatalog,
  updateCatalogItem,
  removeCatalogItem,
  type CatalogItem,
  type AvailableProduct,
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

// ── Subcomponent: precio editable en el catálogo ──────────────────────────────
function EditPriceRow({ item, onSaved, onRemove }: {
  item: CatalogItem
  onSaved: (updated: CatalogItem) => void
  onRemove: (id: string) => void
}) {
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(Number(item.sellingPrice))
  const [saving, setSaving] = useState(false)
  const base = Number(item.product.basePrice)
  const commission = Number(item.product.commissionPct)
  const inputRef = useRef<HTMLInputElement>(null)

  const gananciaPreview = price < base
    ? null
    : price === base
    ? parseFloat((base * (commission / 100)).toFixed(2))
    : parseFloat((price - base).toFixed(2))

  async function save() {
    if (!price || price < base) {
      showToast('El precio no puede ser menor al precio base', 'error')
      return
    }
    setSaving(true)
    try {
      const updated = await updateCatalogItem(item.id, price)
      onSaved(updated)
      setEditing(false)
      showToast('Precio actualizado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${item.product.name}" de tu catálogo?`)) return
    setSaving(true)
    try {
      await removeCatalogItem(item.id)
      onRemove(item.id)
      showToast('Producto eliminado del catálogo', 'success')
    } catch {
      showToast('Error al eliminar', 'error')
    }
    setSaving(false)
  }

  const photo = item.product.photos[0]
  const totalStock = item.product.variants.reduce((a, v) => a + v.stock, 0)

  return (
    <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1px solid #e0dbd0', overflow: 'hidden', display: 'flex', gap: 0 }}>
      {/* Foto */}
      <div style={{ width: '80px', flexShrink: 0, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo
          ? <img src={photoUrl(photo)} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.75rem' }}>🧥</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{item.product.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {item.product.category.name} · {totalStock} en stock
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setEditing(!editing); setTimeout(() => inputRef.current?.focus(), 50) }}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#111' }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={remove}
              disabled={saving}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #fde8e8', background: '#fff5f5', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}
            >
              Quitar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.1rem' }}>Precio base</p>
            <p style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>${Number(item.product.basePrice).toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.1rem' }}>Tu precio</p>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>${Number(item.sellingPrice).toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.1rem' }}>Tu ganancia</p>
            <p style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.875rem' }}>+${Number(item.ganancia).toLocaleString('es-AR')}</p>
          </div>
        </div>

        {editing && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#faf9f6', borderRadius: '0.625rem', border: '1px solid #e8e3d5' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.375rem' }}>
              Nuevo precio de venta (mínimo ${Number(item.product.basePrice).toLocaleString('es-AR')})
            </p>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                ref={inputRef}
                type="number"
                value={price}
                min={base}
                step="any"
                onChange={e => setPrice(Number(e.target.value))}
                style={{ ...INP, width: '130px' }}
              />
              {gananciaPreview !== null && (
                <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>
                  Ganás +${gananciaPreview.toLocaleString('es-AR')}
                </span>
              )}
              {gananciaPreview === null && price < base && (
                <span style={{ fontSize: '0.8125rem', color: '#dc2626' }}>Precio inválido</span>
              )}
              <button
                onClick={save}
                disabled={saving || price < base}
                style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: (saving || price < base) ? 0.5 : 1 }}
              >
                {saving ? '...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(false); setPrice(Number(item.sellingPrice)) }}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
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
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const base = Number(product.basePrice)
  const commission = Number(product.commissionPct)
  const priceNum = parseFloat(price)

  const gananciaPreview = price && !isNaN(priceNum) && priceNum >= base
    ? priceNum === base
      ? parseFloat((base * (commission / 100)).toFixed(2))
      : parseFloat((priceNum - base).toFixed(2))
    : null

  async function add() {
    if (!price || isNaN(priceNum) || priceNum < base) {
      showToast('El precio no puede ser menor al precio base', 'error')
      return
    }
    setSaving(true)
    try {
      const item = await addToCatalog(product.id, priceNum)
      onAdded(item)
      showToast(`"${product.name}" agregado a tu catálogo`, 'success')
      setShowForm(false)
      setPrice('')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al agregar', 'error')
    }
    setSaving(false)
  }

  const photo = product.photos[0]
  const totalStock = product.variants.reduce((a, v) => a + v.stock, 0)

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
      {/* Foto */}
      <div style={{ background: '#f5f3ef', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {photo
          ? <img src={photoUrl(photo)} alt={product.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
          : <span style={{ fontSize: '2.5rem' }}>🧥</span>
        }
        {product.inCatalog && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '99px' }}>
            En catálogo
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{product.name}</p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          {product.category.name} · {totalStock} en stock
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Precio base</p>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>${Number(product.basePrice).toLocaleString('es-AR')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Comisión mín.</p>
            <p style={{ fontWeight: 600, color: '#b8922a', fontSize: '0.875rem' }}>{Number(product.commissionPct)}%</p>
          </div>
        </div>

        {!product.inCatalog && !showForm && (
          <button
            onClick={() => { setShowForm(true); setPrice(String(base)) }}
            style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + Agregar al catálogo
          </button>
        )}

        {product.inCatalog && (
          <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>✓ Ya está en tu catálogo</p>
            {product.sellingPrice && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                Precio: ${Number(product.sellingPrice).toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}

        {showForm && (
          <div style={{ padding: '0.75rem', background: '#faf9f6', borderRadius: '0.625rem', border: '1px solid #e8e3d5', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.5rem' }}>
              ¿A qué precio lo querés vender?
            </p>
            <input
              type="number"
              value={price}
              min={base}
              step="any"
              placeholder={`Mínimo $${base.toLocaleString('es-AR')}`}
              onChange={e => setPrice(e.target.value)}
              style={INP}
              autoFocus
            />
            {gananciaPreview !== null && (
              <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.375rem' }}>
                Vas a ganar +${gananciaPreview.toLocaleString('es-AR')} por venta
              </p>
            )}
            {price && !isNaN(priceNum) && priceNum < base && (
              <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.375rem' }}>
                Mínimo: ${base.toLocaleString('es-AR')}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
              <button
                onClick={add}
                disabled={saving || !price || isNaN(priceNum) || priceNum < base}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: (saving || !price || isNaN(priceNum) || priceNum < base) ? 0.5 : 1 }}
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
              <button
                onClick={() => { setShowForm(false); setPrice('') }}
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
  const [categories, setCategories] = useState<Category[]>([])
  const [available, setAvailable] = useState<AvailableProduct[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    Promise.all([
      getMyCatalog(),
      getCategories(),
    ]).then(([items, cats]) => {
      setCatalogItems(items)
      setCategories(cats.filter(c => c.isActive))
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

  function handleCatalogItemSaved(updated: CatalogItem) {
    setCatalogItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  function handleCatalogItemRemoved(id: string) {
    setCatalogItems(prev => prev.filter(i => i.id !== id))
  }

  function handleProductAdded(newItem: CatalogItem) {
    setCatalogItems(prev => [newItem, ...prev])
    setAvailable(prev => prev.map(p =>
      p.id === newItem.product.id
        ? { ...p, inCatalog: true, catalogItemId: newItem.id, sellingPrice: newItem.sellingPrice }
        : p
    ))
  }

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/panel" style={{ color: '#b8922a' }}>Panel</Link> › Mi Catálogo
        </p>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
              Mi Catálogo
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {catalogItems.map(item => (
                  <EditPriceRow
                    key={item.id}
                    item={item}
                    onSaved={handleCatalogItemSaved}
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
