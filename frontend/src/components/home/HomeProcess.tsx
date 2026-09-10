import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

export interface ProcessStep {
  title: string
  desc: string
  videoUrl?: string | null
}

function StepBlock({ index, step }: { index: number; step: ProcessStep }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.25)
  return (
    <div ref={ref} className={`reveal-on-scroll ${visible ? 'is-visible' : ''} flex-1`}>
      <span
        className="block text-[var(--land-terracota)]/50 font-normal leading-none select-none"
        style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(4rem, 9vw, 8rem)' }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      {step.videoUrl && (
        <div className="rounded-2xl overflow-hidden aspect-video bg-black/10 -mt-4 mb-5">
          <video className="w-full h-full object-cover" src={step.videoUrl} autoPlay muted loop playsInline />
        </div>
      )}
      <h3 className="text-xl md:text-2xl font-semibold text-white uppercase tracking-tight mt-4 mb-2.5">
        {step.title}
      </h3>
      <p className="text-white/65 text-sm md:text-base leading-relaxed max-w-xs">
        {step.desc}
      </p>
    </div>
  )
}

export function HomeProcess({ title, steps }: { title: string; steps: ProcessStep[] }) {
  const heading = useRevealOnScroll<HTMLDivElement>()

  return (
    <section id="como-funciona" className="bg-[var(--land-dark)] py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div ref={heading.ref} className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''} max-w-2xl mb-14 md:mb-20`}>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.15] font-normal text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-10">
          {steps.map((s, i) => <StepBlock key={i} index={i} step={s} />)}
        </div>
      </div>
    </section>
  )
}
