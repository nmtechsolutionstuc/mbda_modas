import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

export function HomeResellerStory({ manifesto, backgroundImage }: { manifesto: string; backgroundImage?: string | null }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.3)

  return (
    <section className="relative bg-[var(--land-terracota)] py-24 md:py-36 px-6 overflow-hidden">
      {backgroundImage && (
        <>
          <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[var(--land-terracota)]/85" aria-hidden />
        </>
      )}
      <div
        ref={ref}
        className={`reveal-on-scroll ${visible ? 'is-visible' : ''} relative max-w-3xl mx-auto text-center`}
      >
        <h2
          className="text-white uppercase font-normal leading-[1.05] mb-8"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5.5vw, 3.5rem)' }}
        >
          Más que vender ropa.<br /><em className="italic">Creá tu propio camino.</em>
        </h2>
        <p className="text-white/90 text-lg md:text-xl leading-relaxed">
          {manifesto}
        </p>
      </div>
    </section>
  )
}
