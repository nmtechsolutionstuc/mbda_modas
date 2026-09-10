import { MessageCircle, Trash2 } from 'lucide-react'
import type { PublicStore } from '../../api/public'
import { linkWhatsApp } from '../../utils/whatsapp'
import { useFavoritesStore } from '../../store/favoritesStore'
import { StoreDrawer } from './StoreDrawer'
import { C, STROKE, fmt } from './tokens'

export function StoreFavoritesDrawer({ store, onClose }: { store: PublicStore; onClose: () => void }) {
  const items = useFavoritesStore(s => s.getItems(store.reseller.storeSlug))
  const remove = useFavoritesStore(s => s.remove)

  function sendSelection() {
    const lines = items.map((i, idx) => `${idx + 1}. ${i.name} - Color: ${i.color} - Talle: ${i.size} - Precio: ${fmt(i.price)}`)
    const msg = `Hola, me interesan estos productos de tu tienda:\n${lines.join('\n')}\n¿Me confirmás disponibilidad?`
    window.open(linkWhatsApp(store.reseller.whatsapp, msg), '_blank')
  }

  return (
    <StoreDrawer
      title={`Mis favoritos (${items.length})`}
      onClose={onClose}
      footer={items.length > 0 ? (
        <button
          onClick={sendSelection}
          className="store-btn"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}
        >
          <MessageCircle size={18} strokeWidth={STROKE} /> Enviar selección por WhatsApp
        </button>
      ) : undefined}
    >
      {items.length === 0 ? (
        <p style={{ color: C.muted, textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          Todavía no agregaste productos a tus favoritos.
        </p>
      ) : items.map((item, idx) => (
        <div key={item.variantId} style={{ display: 'flex', gap: '0.875rem', padding: '1rem 0', borderTop: idx === 0 ? 'none' : `1px solid ${C.line}` }}>
          {item.photo && <img src={item.photo} alt={item.name} style={{ width: '4.25rem', height: '5.5rem', objectFit: 'cover', borderRadius: '0.625rem', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: C.ink, lineHeight: 1.3 }}>{item.name}</p>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: C.accent, margin: '0.35rem 0 0.5rem' }}>{fmt(item.price)}</p>
            <p style={{ fontSize: '0.75rem', color: C.muted }}>Talle: {item.size} · Color: {item.color}</p>
          </div>
          <button onClick={() => remove(store.reseller.storeSlug, item.variantId)} aria-label={`Quitar ${item.name}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', alignSelf: 'flex-end', padding: 0 }}>
            <Trash2 size={16} strokeWidth={STROKE} color={C.muted} />
          </button>
        </div>
      ))}
    </StoreDrawer>
  )
}
