import { useState } from 'react'
import { Heart, MessageCircle, Copy } from 'lucide-react'
import type { PublicStore, StoreProduct } from '../../api/public'
import { linkWhatsApp } from '../../utils/whatsapp'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useToast } from '../../context/ToastContext'
import { extractYoutubeId } from '../../utils/youtube'
import { StoreDrawer } from './StoreDrawer'
import { C, F, STROKE, fmt } from './tokens'

export function StoreProductDrawer({ product, store, onClose }: { product: StoreProduct; store: PublicStore; onClose: () => void }) {
  const { showToast } = useToast()
  const colors = [...new Set(product.variants.map(v => v.color))]
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? '')
  const sizesForColor = product.variants.filter(v => v.color === selectedColor)
  const [selectedSize, setSelectedSize] = useState(sizesForColor[0]?.size ?? '')
  const [mainPhoto, setMainPhoto] = useState(product.photos[0] ?? null)
  const add = useFavoritesStore(s => s.add)

  const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize)
  const youtubeId = product.youtubeVideoUrl ? extractYoutubeId(product.youtubeVideoUrl) : null

  function copyPayment(value: string) {
    navigator.clipboard.writeText(value).then(() => showToast('Copiado', 'success'))
  }

  function addFavorite() {
    if (!variant) return
    add(store.reseller.storeSlug, {
      variantId: variant.id, catalogItemId: product.catalogItemId, productId: product.productId,
      name: product.name, photo: product.photos[0] ?? null, price: product.sellingPrice,
      color: variant.color, size: variant.size,
    })
    showToast('Agregado a tus favoritos', 'success')
  }

  return (
    <StoreDrawer
      title="Detalle del producto"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <a
            href={linkWhatsApp(store.reseller.whatsapp, `Hola! Quiero consultarte por "${product.name}"${selectedColor ? ` en color ${selectedColor}` : ''}${selectedSize ? `, talle ${selectedSize}` : ''}.`)}
            target="_blank" rel="noopener noreferrer"
            className="store-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: '0.75rem', background: C.accent, color: '#fff', textDecoration: 'none', fontWeight: 700 }}
          >
            <MessageCircle size={18} strokeWidth={STROKE} /> Consultar por WhatsApp
          </a>
          <button
            onClick={addFavorite}
            disabled={!variant}
            className="store-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: '0.75rem', border: `1.5px solid ${C.accent}`, background: 'transparent', color: C.accent, fontWeight: 700, cursor: variant ? 'pointer' : 'not-allowed', opacity: variant ? 1 : 0.5 }}
          >
            <Heart size={18} strokeWidth={STROKE} /> Agregar a mis favoritos
          </button>
        </div>
      }
    >
      {mainPhoto && <img src={mainPhoto} alt={product.name} style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: '1rem', marginBottom: '0.75rem' }} />}
      {product.photos.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {product.photos.map(p => (
            <button key={p} onClick={() => setMainPhoto(p)} style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <img src={p} style={{ width: '3.25rem', height: '3.25rem', objectFit: 'cover', borderRadius: '0.5rem', border: p === mainPhoto ? `2px solid ${C.accent}` : `1px solid ${C.line}` }} />
            </button>
          ))}
        </div>
      )}

      <h2 style={{ fontFamily: F.display, fontSize: '1.625rem', color: C.ink, margin: '0 0 0.25rem', fontWeight: 400 }}>{product.name}</h2>
      <p style={{ fontWeight: 700, color: C.accent, fontSize: '1.25rem', marginBottom: '1.25rem' }}>{fmt(product.sellingPrice)}</p>

      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Color</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {colors.map(c => (
          <button key={c} onClick={() => { setSelectedColor(c); const first = product.variants.find(v => v.color === c); if (first) setSelectedSize(first.size) }}
            className="store-swatch"
            style={{ width: '2.1rem', height: '2.1rem', borderRadius: '99px', background: c.toLowerCase(), border: c === selectedColor ? `2.5px solid ${C.accent}` : `1.5px solid ${C.line}`, cursor: 'pointer' }} title={c} />
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Talle</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {sizesForColor.map(v => (
          <button key={v.size} onClick={() => setSelectedSize(v.size)} disabled={v.stock === 0}
            style={{
              padding: '0.45rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
              border: v.size === selectedSize ? `2px solid ${C.accent}` : `1.5px solid ${C.line}`,
              background: v.size === selectedSize ? C.accent : 'transparent', color: v.size === selectedSize ? '#fff' : v.stock === 0 ? '#d1d5db' : C.ink,
            }}>
            {v.size}
          </button>
        ))}
      </div>

      {product.description && (
        <p style={{ fontSize: '0.9rem', color: C.inkSoft, marginBottom: '1.5rem', lineHeight: 1.6 }}>{product.description}</p>
      )}

      {youtubeId && (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', marginBottom: '1.5rem', borderRadius: '0.875rem', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={`Video de ${product.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

      <div style={{ background: C.soft, borderRadius: '0.875rem', padding: '1rem' }}>
        <p style={{ fontSize: '0.8125rem', color: C.inkSoft, marginBottom: '0.625rem' }}>
          Pago únicamente por transferencia al CBU o alias oficial informado por la tienda.
        </p>
        {store.payment.alias && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
            <span style={{ color: C.ink }}><strong>Alias:</strong> {store.payment.alias}</span>
            <button onClick={() => copyPayment(store.payment.alias)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Copy size={14} strokeWidth={STROKE} color={C.accent} /></button>
          </div>
        )}
        {store.payment.cbu && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
            <span style={{ color: C.ink }}><strong>CBU:</strong> {store.payment.cbu}</span>
            <button onClick={() => copyPayment(store.payment.cbu)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Copy size={14} strokeWidth={STROKE} color={C.accent} /></button>
          </div>
        )}
      </div>
    </StoreDrawer>
  )
}
