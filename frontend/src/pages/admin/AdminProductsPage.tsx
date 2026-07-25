import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, updateCategory,
  type Product, type Category,
} from '../../api/admin'
import { Modal } from '../../components/ui/Modal'

// ── Estilos base ──────────────────────────────────────────────────────────────
const INP: React.CSSProperties = { padding: '0.6rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }
const ERR: React.CSSProperties = { fontSize: '0.775rem', color: '#dc2626', marginTop: '0.2rem' }
const BTN = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): React.CSSProperties => ({
  padding: '0.55rem 1.125rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
  ...(variant === 'primary' && { background: '#111', color: '#f5f3ef' }),
  ...(variant === 'secondary' && { background: '#f5f3ef', color: '#111', border: '1px solid #e0dbd0' }),
  ...(variant === 'danger' && { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }),
})

// ── Schema del formulario de producto ─────────────────────────────────────────
const VariantSchema = z.object({
  id:    z.string().optional(),  // presente en variantes existentes al editar
  size:  z.string().min(1, 'Talle requerido'),
  color: z.string().min(1, 'Color requerido'),
  stock: z.coerce.number().int().min(0, 'Stock ≥ 0'),
})

const ProductSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive('Precio inválido'),
  commissionPct: z.coerce.number().min(1).max(100),
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
  weightGrams: z.coerce.number().int().positive().optional().or(z.literal('')),
  dimH: z.coerce.number().positive().optional().or(z.literal('')),
  dimW: z.coerce.number().positive().optional().or(z.literal('')),
  dimL: z.coerce.number().positive().optional().or(z.literal('')),
  variants: z.array(VariantSchema).min(1, 'Agregá al menos una variante'),
})

type ProductForm = z.infer<typeof ProductSchema>

// ── Componente principal ──────────────────────────────────────────────────────
export function AdminProductsPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  // Modal de producto
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [deletePhotos, setDeletePhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Modal de categoría
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catOrder, setCatOrder] = useState(0)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(ProductSchema),
    defaultValues: { variants: [{ size: '', color: '', stock: 0 }], commissionPct: 20 },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await getProducts({
        page, limit: LIMIT,
        search: search || undefined,
        categoryId: filterCat || undefined,
        isActive: filterActive === '' ? undefined : filterActive === 'true',
      })
      setProducts(res.items)
      setTotal(res.total)
    } catch { /* silenciar */ }
    setLoading(false)
  }

  async function loadCategories() {
    try {
      setCategories(await getCategories())
    } catch { /* silenciar */ }
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { loadProducts() }, [page, filterCat, filterActive]) // eslint-disable-line
  useEffect(() => { setPage(1); loadProducts() }, [search]) // eslint-disable-line

  function openCreate() {
    setEditingProduct(null)
    setPhotoFiles([]); setPhotoPreviews([]); setDeletePhotos([])
    reset({ name: '', description: '', basePrice: undefined, commissionPct: 20, categoryId: '', weightGrams: undefined, dimH: undefined, dimW: undefined, dimL: undefined, variants: [{ size: '', color: '', stock: 0 }] })
    setProductModal(true)
  }

  function openEdit(p: Product) {
    setEditingProduct(p)
    setPhotoFiles([]); setPhotoPreviews([]); setDeletePhotos([])
    reset({
      name: p.name, description: p.description ?? '',
      basePrice: parseFloat(p.basePrice),
      commissionPct: parseFloat(p.commissionPct),
      categoryId: p.categoryId,
      weightGrams: p.weightGrams ?? ('' as unknown as undefined),
      dimH: p.dimH != null ? parseFloat(p.dimH) : ('' as unknown as undefined),
      dimW: p.dimW != null ? parseFloat(p.dimW) : ('' as unknown as undefined),
      dimL: p.dimL != null ? parseFloat(p.dimL) : ('' as unknown as undefined),
      variants: p.variants.map(v => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
    })
    setProductModal(true)
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotoFiles(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviews(prev => [...prev, ...previews])
  }

  function removeNewPhoto(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  function toggleDeleteExistingPhoto(url: string) {
    setDeletePhotos(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url])
  }

  async function onSubmitProduct(values: ProductForm) {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', values.name)
      fd.append('description', values.description ?? '')
      fd.append('basePrice', String(values.basePrice))
      fd.append('commissionPct', String(values.commissionPct))
      fd.append('categoryId', values.categoryId)
      if (values.weightGrams) fd.append('weightGrams', String(values.weightGrams))
      if (values.dimH) fd.append('dimH', String(values.dimH))
      if (values.dimW) fd.append('dimW', String(values.dimW))
      if (values.dimL) fd.append('dimL', String(values.dimL))
      // Incluir id de variante existente para upsert inteligente en el backend
      fd.append('variants', JSON.stringify(values.variants.map(v => ({
        ...(v.id ? { id: v.id } : {}),
        size: v.size, color: v.color, stock: v.stock,
      }))))
      if (deletePhotos.length) fd.append('deletePhotos', JSON.stringify(deletePhotos))
      photoFiles.forEach(f => fd.append('photos', f))

      if (editingProduct) {
        await updateProduct(editingProduct.id, fd)
      } else {
        await createProduct(fd)
      }
      setProductModal(false)
      loadProducts()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      alert(msg ?? 'Error al guardar producto')
    }
    setSubmitting(false)
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    try {
      await deleteProduct(id)
      loadProducts()
    } catch { alert('Error al eliminar') }
  }

  async function handleToggleActive(p: Product) {
    const fd = new FormData()
    fd.append('isActive', String(!p.isActive))
    await updateProduct(p.id, fd)
    loadProducts()
  }

  // Categorías
  function openCreateCat() { setEditingCat(null); setCatName(''); setCatOrder(categories.length); setCatModal(true) }
  function openEditCat(c: Category) { setEditingCat(c); setCatName(c.name); setCatOrder(c.order); setCatModal(true) }

  async function onSubmitCat() {
    if (!catName.trim()) return
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catName, order: catOrder })
      } else {
        await createCategory({ name: catName, order: catOrder })
      }
      setCatModal(false)
      loadCategories()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      alert(msg ?? 'Error al guardar categoría')
    }
  }

  async function handleToggleCatActive(c: Category) {
    await updateCategory(c.id, { isActive: !c.isActive })
    loadCategories()
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/admin" style={{ color: '#b8922a' }}>Admin</Link> › Productos
        </p>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Productos
          </h1>
          <button onClick={openCreate} style={BTN('primary')}>+ Crear producto</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#e8e3d5', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
          {(['products', 'categories'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#111' : '#6b7280',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {t === 'products' ? 'Productos' : 'Categorías'}
            </button>
          ))}
        </div>

        {/* ── TAB PRODUCTOS ──────────────────────────────────── */}
        {tab === 'products' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                style={{ ...INP, maxWidth: '280px' }}
              />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...INP, maxWidth: '180px', cursor: 'pointer' }}>
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ ...INP, maxWidth: '140px', cursor: 'pointer' }}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0' }}>
                No hay productos. <button onClick={openCreate} style={{ color: '#b8922a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Crear el primero</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', opacity: p.isActive ? 1 : 0.65 }}>
                    {/* Foto */}
                    <div style={{ height: '160px', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.photos[0]
                        ? <img src={p.photos[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>👗</span>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', lineHeight: 1.3 }}>{p.name}</p>
                        <span style={{ fontSize: '0.7rem', background: p.isActive ? '#d1fae5' : '#f3f4f6', color: p.isActive ? '#065f46' : '#6b7280', padding: '0.2rem 0.5rem', borderRadius: '99px', flexShrink: 0, fontWeight: 600 }}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>{p.category.name}</p>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#b8922a', marginBottom: '0.25rem' }}>
                        ${parseFloat(p.basePrice).toLocaleString('es-AR')}
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}> · {p.commissionPct}% com.</span>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.875rem' }}>
                        {p.variants.length} variante{p.variants.length !== 1 ? 's' : ''} · en {p._count?.catalogItems ?? 0} catálogo{(p._count?.catalogItems ?? 0) !== 1 ? 's' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(p)} style={{ ...BTN('secondary'), flex: 1 }}>Editar</button>
                        <button onClick={() => handleToggleActive(p)} style={{ ...BTN('secondary') }}>{p.isActive ? 'Desact.' : 'Activar'}</button>
                        <button onClick={() => handleDeleteProduct(p.id)} style={BTN('danger')}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={BTN('secondary')}>← Anterior</button>
                <span style={{ padding: '0.55rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={BTN('secondary')}>Siguiente →</button>
              </div>
            )}
          </>
        )}

        {/* ── TAB CATEGORÍAS ─────────────────────────────────── */}
        {tab === 'categories' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={openCreateCat} style={BTN('primary')}>+ Nueva categoría</button>
            </div>
            <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
              {categories.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Sin categorías</p>
              ) : categories.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < categories.length - 1 ? '1px solid #e0dbd0' : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#111' }}>{c.name}</span>
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>{c._count?.products ?? 0} productos</span>
                    {!c.isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.4rem', borderRadius: '99px' }}>Inactiva</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditCat(c)} style={BTN('secondary')}>Editar</button>
                    <button onClick={() => handleToggleCatActive(c)} style={BTN('secondary')}>{c.isActive ? 'Desact.' : 'Activar'}</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL PRODUCTO ────────────────────────────────────── */}
      <Modal
        open={productModal}
        onClose={() => setProductModal(false)}
        title={editingProduct ? 'Editar producto' : 'Crear producto'}
        maxWidth="720px"
      >
        <form onSubmit={handleSubmit(onSubmitProduct)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Nombre */}
            <div>
              <label style={LABEL}>Nombre *</label>
              <input {...register('name')} style={INP} placeholder="Remera básica" />
              {errors.name && <p style={ERR}>{errors.name.message}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label style={LABEL}>Descripción</label>
              <textarea {...register('description')} style={{ ...INP, minHeight: '72px', resize: 'vertical' }} placeholder="Descripción del producto..." />
            </div>

            {/* Precio + Comisión + Categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>Precio base (ARS) *</label>
                <input {...register('basePrice')} type="number" min="0" step="0.01" style={INP} />
                {errors.basePrice && <p style={ERR}>{errors.basePrice.message}</p>}
              </div>
              <div>
                <label style={LABEL}>Comisión % *</label>
                <input {...register('commissionPct')} type="number" min="1" max="100" style={INP} />
                {errors.commissionPct && <p style={ERR}>{errors.commissionPct.message}</p>}
              </div>
              <div>
                <label style={LABEL}>Categoría *</label>
                <select {...register('categoryId')} style={{ ...INP, cursor: 'pointer' }}>
                  <option value="">Seleccioná...</option>
                  {categories.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p style={ERR}>{errors.categoryId.message}</p>}
              </div>
            </div>

            {/* Peso y dimensiones para cálculo de envío */}
            <div>
              <p style={{ ...LABEL, marginBottom: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                📦 Datos de envío <span style={{ fontWeight: 400 }}>(opcionales — se usan para cotizar el flete)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={LABEL}>Peso (g)</label>
                  <input {...register('weightGrams')} type="number" min="1" style={INP} placeholder="250" />
                </div>
                <div>
                  <label style={LABEL}>Alto (cm)</label>
                  <input {...register('dimH')} type="number" min="0.1" step="0.1" style={INP} placeholder="10" />
                </div>
                <div>
                  <label style={LABEL}>Ancho (cm)</label>
                  <input {...register('dimW')} type="number" min="0.1" step="0.1" style={INP} placeholder="15" />
                </div>
                <div>
                  <label style={LABEL}>Largo (cm)</label>
                  <input {...register('dimL')} type="number" min="0.1" step="0.1" style={INP} placeholder="20" />
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div>
              <label style={{ ...LABEL, marginBottom: '0.5rem' }}>Variantes *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {fields.map((field, i) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 36px', gap: '0.5rem', alignItems: 'start' }}>
                    <div>
                      {i === 0 && <span style={{ ...LABEL, marginBottom: '0.25rem' }}>Talle</span>}
                      <input {...register(`variants.${i}.size`)} style={INP} placeholder="S, M, L, XL..." />
                      {errors.variants?.[i]?.size && <p style={ERR}>{errors.variants[i]!.size!.message}</p>}
                    </div>
                    <div>
                      {i === 0 && <span style={{ ...LABEL, marginBottom: '0.25rem' }}>Color</span>}
                      <input {...register(`variants.${i}.color`)} style={INP} placeholder="Blanco, Negro..." />
                      {errors.variants?.[i]?.color && <p style={ERR}>{errors.variants[i]!.color!.message}</p>}
                    </div>
                    <div>
                      {i === 0 && <span style={{ ...LABEL, marginBottom: '0.25rem' }}>Stock</span>}
                      <input {...register(`variants.${i}.stock`)} type="number" min="0" style={INP} />
                    </div>
                    <div style={{ paddingTop: i === 0 ? '1.35rem' : 0 }}>
                      <button type="button" onClick={() => fields.length > 1 && remove(i)}
                        style={{ width: '36px', height: '36px', border: 'none', borderRadius: '0.5rem', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => append({ size: '', color: '', stock: 0 })}
                  style={{ alignSelf: 'flex-start', background: '#f5f3ef', border: '1px dashed #c0bab0', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontSize: '0.8125rem', color: '#6b7280', cursor: 'pointer' }}>
                  + Agregar variante
                </button>
              </div>
              {errors.variants?.root && <p style={ERR}>{errors.variants.root.message}</p>}
            </div>

            {/* Fotos existentes (en edición) */}
            {editingProduct && editingProduct.photos.length > 0 && (
              <div>
                <label style={LABEL}>Fotos actuales</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {editingProduct.photos.map(url => (
                    <div key={url} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: deletePhotos.includes(url) ? '2px solid #dc2626' : '2px solid #e0dbd0' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: deletePhotos.includes(url) ? 0.4 : 1 }} />
                      <button type="button" onClick={() => toggleDeleteExistingPhoto(url)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {deletePhotos.includes(url) ? '↩' : '×'}
                      </button>
                    </div>
                  ))}
                </div>
                {deletePhotos.length > 0 && <p style={{ ...ERR, color: '#92400e' }}>Se eliminarán {deletePhotos.length} foto(s) al guardar</p>}
              </div>
            )}

            {/* Nuevas fotos */}
            <div>
              <label style={LABEL}>Agregar fotos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #e0dbd0' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeNewPhoto(i)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ width: '80px', height: '80px', border: '2px dashed #c0bab0', borderRadius: '0.5rem', background: '#f5f3ef', color: '#6b7280', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  +
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPhotoChange} />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>JPG, PNG o WebP · máx. 8 MB por imagen</p>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button type="button" onClick={() => setProductModal(false)} style={BTN('secondary')}>Cancelar</button>
              <button type="submit" disabled={submitting} style={BTN('primary')}>
                {submitting ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODAL CATEGORÍA ───────────────────────────────────── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title={editingCat ? 'Editar categoría' : 'Nueva categoría'} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={LABEL}>Nombre *</label>
            <input value={catName} onChange={e => setCatName(e.target.value)} style={INP} placeholder="Remeras" />
          </div>
          <div>
            <label style={LABEL}>Orden</label>
            <input value={catOrder} onChange={e => setCatOrder(Number(e.target.value))} type="number" min="0" style={{ ...INP, maxWidth: '100px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setCatModal(false)} style={BTN('secondary')}>Cancelar</button>
            <button onClick={onSubmitCat} style={BTN('primary')}>{editingCat ? 'Guardar' : 'Crear'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
