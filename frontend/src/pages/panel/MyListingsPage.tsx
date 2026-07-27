import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useToast } from '../../context/ToastContext'
import {
  getMyListings, createListing, markListingSold, removeListing,
  type MyListing, type ListingStatus,
} from '../../api/reseller'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function photoUrl(p: string) { return p.startsWith('http') ? p : `${API_BASE}${p}` }

const INP: React.CSSProperties = {
  padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0',
  fontSize: '0.9rem', background: '#fff', outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

const STATUS_LABEL: Record<ListingStatus, string> = { PENDING: 'Pendiente de aprobación', APPROVED: 'Publicada', REJECTED: 'Rechazada' }
const STATUS_COLOR: Record<ListingStatus, string> = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }

function fmt(v: string) { return `$${Number(v).toLocaleString('es-AR')}` }

// ── Formulario de alta ─────────────────────────────────────────────────────────
function CreateListingForm({ onCreated }: { onCreated: (l: MyListing) => void }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    setPhotos(Array.from(files).slice(0, 2))
  }

  async function submit() {
    const priceNum = parseFloat(price)
    if (!name || !priceNum || priceNum <= 0) {
      showToast('Completá el nombre y un precio válido', 'error')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      if (description) fd.append('description', description)
      fd.append('price', String(priceNum))
      photos.forEach(f => fd.append('photos', f))
      const listing = await createListing(fd)
      onCreated(listing)
      showToast('Prenda publicada — queda a la espera de aprobación', 'success')
      setName(''); setDescription(''); setPrice(''); setPhotos([])
      if (fileRef.current) fileRef.current.value = ''
      setOpen(false)
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al publicar', 'error')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, cursor: 'pointer', marginBottom: '1.25rem' }}
      >
        + Publicar una prenda propia
      </button>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: '0.875rem' }}>Nueva prenda</p>
      <label style={LABEL}>Nombre</label>
      <input value={name} onChange={e => setName(e.target.value)} style={{ ...INP, marginBottom: '0.75rem' }} placeholder="Ej: Campera de jean talle M" />
      <label style={LABEL}>Descripción (opcional)</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...INP, minHeight: '60px', resize: 'vertical', marginBottom: '0.75rem' } as React.CSSProperties} />
      <label style={LABEL}>Precio</label>
      <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="1" style={{ ...INP, marginBottom: '0.75rem' }} />
      <label style={LABEL}>Fotos (máximo 2)</label>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ ...INP, marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
        <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '0.65rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}

// ── Fila de prenda ───────────────────────────────────────────────────────────
function ListingRow({ listing, onChanged, onRemoved }: {
  listing: MyListing
  onChanged: (l: MyListing) => void
  onRemoved: (id: string) => void
}) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  async function sold() {
    if (!confirm(`¿Marcar "${listing.name}" como vendida?`)) return
    setSaving(true)
    try { onChanged(await markListingSold(listing.id)); showToast('Marcada como vendida', 'success') }
    catch (e: any) { showToast(e?.response?.data?.message ?? 'Error', 'error') }
    setSaving(false)
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${listing.name}"?`)) return
    setSaving(true)
    try { await removeListing(listing.id); onRemoved(listing.id); showToast('Prenda eliminada', 'success') }
    catch { showToast('Error al eliminar', 'error') }
    setSaving(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1px solid #e0dbd0', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: '80px', flexShrink: 0, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {listing.photos[0]
          ? <img src={photoUrl(listing.photos[0])} alt={listing.name} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.75rem' }}>🧥</span>
        }
      </div>
      <div style={{ flex: 1, padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>{listing.name}</p>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '99px', background: STATUS_COLOR[listing.status] + '18', color: STATUS_COLOR[listing.status], border: `1px solid ${STATUS_COLOR[listing.status]}40` }}>
            {listing.sold ? 'Vendida' : STATUS_LABEL[listing.status]}
          </span>
        </div>
        <p style={{ fontWeight: 700, color: '#b8922a', fontSize: '1rem', marginTop: '0.25rem' }}>{fmt(listing.price)}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
          {listing.status === 'APPROVED' && !listing.sold && (
            <button onClick={sold} disabled={saving} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Marcar vendida</button>
          )}
          <button onClick={remove} disabled={saving} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #fde8e8', background: '#fff5f5', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export function MyListingsPage() {
  const { showToast } = useToast()
  const [listings, setListings] = useState<MyListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyListings().then(setListings).catch(() => showToast('Error al cargar tus prendas', 'error')).finally(() => setLoading(false))
  }, []) // eslint-disable-line

  function handleCreated(l: MyListing) { setListings(prev => [l, ...prev]) }
  function handleChanged(updated: MyListing) { setListings(prev => prev.map(l => l.id === updated.id ? updated : l)) }
  function handleRemoved(id: string) { setListings(prev => prev.filter(l => l.id !== id)) }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/panel" style={{ color: '#b8922a' }}>Panel</Link> › Mis prendas
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>Mis prendas</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Publicá tus propias prendas en la vitrina pública. La venta se coordina directo por WhatsApp con quien te contacte.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : (
          <>
            <CreateListingForm onCreated={handleCreated} />
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎽</p>
                <p style={{ fontWeight: 600, color: '#111' }}>Todavía no publicaste ninguna prenda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {listings.map(l => <ListingRow key={l.id} listing={l} onChanged={handleChanged} onRemoved={handleRemoved} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
