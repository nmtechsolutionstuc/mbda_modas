import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminListings, approveListing, rejectListing, deleteListing,
  type AdminListing, type ListingStatus,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const TABS: { label: string; value: ListingStatus }[] = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
]

function fmt(v: string) { return `$${Number(v).toLocaleString('es-AR')}` }

function ListingCard({ listing, onChanged, onDeleted }: {
  listing: AdminListing
  onChanged: (l: AdminListing) => void
  onDeleted: (id: string) => void
}) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  async function approve() {
    setSaving(true)
    try { onChanged(await approveListing(listing.id)); showToast('Prenda aprobada', 'success') }
    catch (e: any) { showToast(e?.response?.data?.message ?? 'Error', 'error') }
    setSaving(false)
  }

  async function reject() {
    if (!confirm(`¿Rechazar "${listing.name}"?`)) return
    setSaving(true)
    try { onChanged(await rejectListing(listing.id)); showToast('Prenda rechazada', 'success') }
    catch (e: any) { showToast(e?.response?.data?.message ?? 'Error', 'error') }
    setSaving(false)
  }

  async function remove() {
    if (!confirm(`¿Eliminar definitivamente "${listing.name}" del feed? Esta acción no se puede deshacer.`)) return
    setSaving(true)
    try { await deleteListing(listing.id); onDeleted(listing.id); showToast('Prenda eliminada', 'success') }
    catch (e: any) { showToast(e?.response?.data?.error?.message ?? 'Error al eliminar', 'error') }
    setSaving(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: '100px', flexShrink: 0, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {listing.photos[0]
          ? <img src={listing.photos[0]} alt={listing.name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.75rem' }}>🧥</span>
        }
      </div>
      <div style={{ flex: 1, padding: '0.875rem 1rem' }}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>{listing.name}</p>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>{listing.reseller.storeName} · {listing.reseller.whatsapp}</p>
        {listing.description && <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>{listing.description}</p>}
        <p style={{ fontWeight: 700, color: '#b8922a', fontSize: '1rem', marginBottom: '0.625rem' }}>{fmt(listing.price)}{listing.sold && ' · Vendida'}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {listing.status === 'PENDING' && (
            <>
              <button onClick={approve} disabled={saving} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none', background: '#16a34a', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>✓ Aprobar</button>
              <button onClick={reject} disabled={saving} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1.5px solid #fde8e8', background: '#fff5f5', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>✕ Rechazar</button>
            </>
          )}
          <button onClick={remove} disabled={saving} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1.5px solid #e0dbd0', background: '#fff', color: '#6b7280', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>🗑️ Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export function AdminListingsPage() {
  const { showToast } = useToast()
  const [status, setStatus] = useState<ListingStatus>('PENDING')
  const [listings, setListings] = useState<AdminListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getAdminListings({ status, limit: 50 })
      setListings(r.listings)
      setTotal(r.total)
    } catch {
      showToast('Error al cargar prendas', 'error')
    } finally {
      setLoading(false)
    }
  }, [status, showToast])

  useEffect(() => { load() }, [load])

  function handleChanged(updated: AdminListing) {
    setListings(prev => prev.filter(l => l.id !== updated.id))
    setTotal(t => Math.max(0, t - 1))
  }

  function handleDeleted(id: string) {
    setListings(prev => prev.filter(l => l.id !== id))
    setTotal(t => Math.max(0, t - 1))
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Panel</Link> / Prendas del feed
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>Prendas de tiendas externas</h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: '#e8e3d5', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content', marginBottom: '1.25rem' }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => setStatus(t.value)} style={{
              padding: '0.5rem 1.1rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
              background: status === t.value ? '#fff' : 'transparent',
              color: status === t.value ? '#111' : '#6b7280',
              boxShadow: status === t.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No hay prendas en este estado</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} onChanged={handleChanged} onDeleted={handleDeleted} />)}
          </div>
        )}
      </div>
    </div>
  )
}
