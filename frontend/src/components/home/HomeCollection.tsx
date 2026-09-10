import { useEffect, useState } from 'react'
import { getFeaturedProducts, type FeaturedProduct } from '../../api/public'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function imageUrl(p: string) {
  return p.startsWith('http') ? p : `${API_BASE}${p}`
}

function fmt(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  return (
    <div className="group relative flex-shrink-0 w-[220px] sm:w-[260px] md:w-[300px] snap-start">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--land-beige)]">
        <img
          src={imageUrl(product.photos[0]!)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pt-10 pb-4 px-4">
          <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wide mb-0.5">{product.category.name}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-white text-sm font-semibold leading-snug">{product.name}</p>
            <p className="text-white text-sm font-bold whitespace-nowrap">{fmt(product.basePrice)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[300px] aspect-[3/4] rounded-2xl bg-[var(--land-beige)] animate-pulse" />
}

export function HomeCollection() {
  const [products, setProducts] = useState<FeaturedProduct[] | null>(null)
  const heading = useRevealOnScroll<HTMLDivElement>()

  useEffect(() => {
    getFeaturedProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  if (products?.length === 0) return null

  return (
    <section id="coleccion" className="bg-[var(--land-cream)] py-20 md:py-28">
      <div
        ref={heading.ref}
        className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''} max-w-6xl mx-auto px-6 flex items-end justify-between gap-6 mb-10 md:mb-12`}
      >
        <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.1] font-normal text-[var(--land-dark)] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
          Una colección<br />que se vende sola
        </h2>
        <p className="hidden md:block text-[var(--land-dark)]/60 text-sm max-w-[220px] mb-1">
          Parte del catálogo real que ya podés ofrecer a tus clientas.
        </p>
      </div>

      <div className="flex gap-4 md:gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products === null
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </section>
  )
}
