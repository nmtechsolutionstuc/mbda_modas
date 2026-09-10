import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'
import { getPublicTestimonials, type PublicTestimonial } from '../../api/public'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

function TestimonialCard({ quote, name, city }: { quote: string; name: string; city: string }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[340px] snap-start bg-white rounded-2xl p-7 md:p-8 border border-[var(--land-beige)]">
      <Quote size={28} strokeWidth={1.5} color="var(--land-terracota)" className="mb-5" />
      <p className="text-[var(--land-dark)] text-base leading-relaxed mb-6">{quote}</p>
      <p className="text-sm font-semibold text-[var(--land-dark)]">{name} <span className="font-normal text-[var(--land-dark)]/50">· {city}</span></p>
    </div>
  )
}

function SkeletonCard() {
  return <div className="flex-shrink-0 w-[280px] sm:w-[340px] h-[220px] rounded-2xl bg-white border border-[var(--land-beige)] animate-pulse" />
}

export function HomeTestimonials() {
  const [testimonials, setTestimonials] = useState<PublicTestimonial[] | null>(null)
  const heading = useRevealOnScroll<HTMLDivElement>()

  useEffect(() => {
    getPublicTestimonials().then(setTestimonials).catch(() => setTestimonials([]))
  }, [])

  if (testimonials?.length === 0) return null

  return (
    <section className="bg-[var(--land-cream-soft)] py-20 md:py-28">
      <div ref={heading.ref} className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''} max-w-6xl mx-auto px-6 mb-10 md:mb-12`}>
        <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.1] font-normal text-[var(--land-dark)]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Voces de la comunidad
        </h2>
      </div>

      <div className="flex gap-4 md:gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {testimonials === null
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : testimonials.map(t => <TestimonialCard key={t.id} {...t} />)
        }
      </div>
    </section>
  )
}
