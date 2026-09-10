import { Heart } from 'lucide-react'
import type { StoreProduct } from '../../api/public'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useToast } from '../../context/ToastContext'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import { C, F, SHADOW, fmt } from './tokens'

function remainingStock(product: StoreProduct) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0)
}

// Patrón de tamaños del bento: el primer producto es la pieza grande (2x2), a
// partir de ahí cada 5º ítem es una franja ancha (2x1) para romper la grilla
// pareja; el resto son celdas simples. grid-auto-flow: dense rellena los
// huecos, así nunca queda una celda vacía sin importar cuántos productos haya.
function spanFor(index: number): { col: number; row: number } {
  if (index === 0) return { col: 2, row: 2 }
  if (index % 5 === 0) return { col: 2, row: 1 }
  return { col: 1, row: 1 }
}

function LookbookTile({ product, storeSlug, index, onOpenDetail }: {
  product: StoreProduct; storeSlug: string; index: number; onOpenDetail: () => void
}) {
  const { showToast } = useToast()
  const add = useFavoritesStore(s => s.add)
  const remove = useFavoritesStore(s => s.remove)
  const isFav = useFavoritesStore(s => s.isFavorite(storeSlug, product.variants[0]?.id ?? ''))
  const stock = remainingStock(product)
  const reveal = useRevealOnScroll<HTMLDivElement>(0.1)
  const span = spanFor(index)
  const stagger = Math.min(index * 60, 300)

  function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const variant = product.variants.find(v => v.stock > 0) ?? product.variants[0]
    if (!variant) return
    if (isFav) {
      remove(storeSlug, variant.id)
    } else {
      add(storeSlug, {
        variantId: variant.id, catalogItemId: product.catalogItemId, productId: product.productId,
        name: product.name, photo: product.photos[0] ?? null, price: product.sellingPrice,
        color: variant.color, size: variant.size,
      })
      showToast('Agregado a favoritos', 'success')
    }
  }

  return (
    <div
      ref={reveal.ref}
      className={`store-bento-item store-tile reveal-on-scroll ${reveal.visible ? 'is-visible' : ''}`}
      style={{
        gridColumn: `span ${span.col}`, gridRow: `span ${span.row}`,
        position: 'relative', borderRadius: '1.125rem', overflow: 'hidden', background: C.softAlt, cursor: 'pointer',
        ['--stagger' as string]: `${stagger}ms`,
      }}
      onClick={onOpenDetail}
    >
      {product.photos[0] && (
        <img
          className={`store-tile-img store-curtain ${reveal.visible ? 'is-visible' : ''}`}
          src={product.photos[0]} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <button
        onClick={toggleFavorite}
        className="store-icon-btn"
        aria-label="Agregar a favoritos"
        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '2.25rem', height: '2.25rem', borderRadius: '99px', border: 'none', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}
      >
        <Heart size={16} color={isFav ? C.accent : '#9ca3af'} fill={isFav ? C.accent : 'none'} />
      </button>
      {stock === 0 && (
        <span style={{ position: 'absolute', top: '0.875rem', left: '0.875rem', background: C.ink, color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '99px' }}>Sin stock</span>
      )}
      {stock > 0 && stock <= 2 && (
        <span style={{ position: 'absolute', top: '0.875rem', left: '0.875rem', background: C.accent, color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '99px' }}>Últimas unidades</span>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: span.col > 1 || span.row > 1 ? '1.5rem' : '1rem' }}>
        <p style={{ color: '#fff', fontSize: span.row > 1 ? '1.375rem' : '0.9375rem', fontFamily: span.row > 1 ? F.display : undefined, fontWeight: span.row > 1 ? 400 : 700, lineHeight: 1.2, marginBottom: '0.25rem' }}>{product.name}</p>
        <p style={{ color: '#fff', fontSize: span.row > 1 ? '1.125rem' : '0.9375rem', fontWeight: 700 }}>{fmt(product.sellingPrice)}</p>
      </div>
    </div>
  )
}

export function StoreLookbook({ products, storeSlug, onOpenDetail, categories, selectedCategory, onCategoryChange, hasProductsAtAll }: {
  products: StoreProduct[]
  storeSlug: string
  onOpenDetail: (p: StoreProduct) => void
  categories: { id: string; name: string }[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  hasProductsAtAll: boolean
}) {
  const heading = useRevealOnScroll<HTMLDivElement>()

  return (
    <section id="coleccion" style={{ padding: 'clamp(4rem, 8vh, 6rem) 0', background: C.page }}>
      <div
        ref={heading.ref}
        className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''}`}
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <p style={{ color: C.accent, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Colección</p>
          <h2 style={{ fontFamily: F.display, fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', color: C.ink, margin: 0, fontWeight: 400, maxWidth: '20ch' }}>Lo que tengo para vos, en una sola vista</h2>
        </div>
        {categories.length > 1 && (
          <select
            value={selectedCategory}
            onChange={e => onCategoryChange(e.target.value)}
            aria-label="Filtrar por categoría"
            style={{
              padding: '0.65rem 2.25rem 0.65rem 1rem', borderRadius: '99px', border: `1.5px solid ${C.line}`,
              background: C.surface, color: C.ink, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center',
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {products.length === 0 ? (
        <p style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', color: C.muted }}>
          {hasProductsAtAll ? 'No hay productos en esta categoría.' : 'Todavía no hay productos en esta tienda.'}
        </p>
      ) : (
        <div
          className="store-bento-grid"
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '190px', gridAutoFlow: 'dense', gap: '1rem' }}
        >
          {products.map((p, i) => (
            <LookbookTile key={p.catalogItemId} product={p} storeSlug={storeSlug} index={i} onOpenDetail={() => onOpenDetail(p)} />
          ))}
        </div>
      )}
    </section>
  )
}
