import { Link } from 'react-router'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

export function HomeCTA({ ctaText }: { ctaText: string }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.4)

  return (
    <section className="relative bg-[var(--land-dark)] py-24 md:py-36 px-6 text-center overflow-hidden">
      <div ref={ref} className={`reveal-on-scroll ${visible ? 'is-visible' : ''} relative max-w-2xl mx-auto`}>
        <h2
          className="text-white uppercase font-normal leading-[1.05] mb-9"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
        >
          ¿Lista para empezar?<br />
          <em className="italic">Tu próximo emprendimiento empieza hoy.</em>
        </h2>
        <Link
          to="/registro"
          className="inline-flex items-center bg-[var(--land-terracota)] text-white text-base font-bold px-10 py-4.5 rounded-full hover:bg-[var(--land-terracota-dark)] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  )
}
