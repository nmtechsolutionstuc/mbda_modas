import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

export interface Pillar {
  title: string
  desc: string
}

function Row({ index, title, desc }: { index: number; title: string; desc: string }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.25)
  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${visible ? 'is-visible' : ''} grid grid-cols-[auto_1fr] gap-6 md:gap-10 items-start py-7 border-b border-[var(--land-beige)] last:border-0`}
    >
      <span className="text-2xl md:text-3xl font-normal text-[var(--land-terracota)]/40 tabular-nums" style={{ fontFamily: "'Playfair Display', serif" }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-[var(--land-dark)] mb-1.5">{title}</h3>
        <p className="text-[var(--land-dark)]/65 text-sm md:text-base leading-relaxed max-w-md">{desc}</p>
      </div>
    </div>
  )
}

export function HomeBenefits({ aboutText, pillars }: { aboutText: string; pillars: Pillar[] }) {
  const intro = useRevealOnScroll<HTMLDivElement>()

  return (
    <section id="beneficios" className="bg-[var(--land-cream)] py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-20">
        <div ref={intro.ref} className={`reveal-on-scroll ${intro.visible ? 'is-visible' : ''} lg:sticky lg:top-28 self-start`}>
          <p className="text-[var(--land-terracota)] text-xs md:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
            La propuesta
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.12] font-normal text-[var(--land-dark)] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Todo lo que necesitás para emprender, ya resuelto
          </h2>
          <p className="text-[var(--land-dark)]/70 text-base md:text-lg leading-relaxed max-w-md">
            {aboutText}
          </p>
        </div>

        <div>
          {pillars.map((p, i) => <Row key={p.title} index={i} title={p.title} desc={p.desc} />)}
        </div>
      </div>
    </section>
  )
}
