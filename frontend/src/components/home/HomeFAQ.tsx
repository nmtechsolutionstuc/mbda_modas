import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { getPublicFaq, type PublicFaqItem } from '../../api/public'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[var(--land-beige)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left"
      >
        <span className="text-base md:text-lg font-semibold text-[var(--land-dark)]">{q}</span>
        <Plus size={20} strokeWidth={1.75} color="var(--land-terracota)" className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </button>
      <div className={`grid overflow-hidden transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="text-[var(--land-dark)]/65 text-sm md:text-base leading-relaxed max-w-xl">{a}</p>
        </div>
      </div>
    </div>
  )
}

export function HomeFAQ() {
  const [faqs, setFaqs] = useState<PublicFaqItem[] | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const heading = useRevealOnScroll<HTMLDivElement>()

  useEffect(() => {
    getPublicFaq().then(setFaqs).catch(() => setFaqs([]))
  }, [])

  if (faqs?.length === 0) return null

  return (
    <section id="preguntas" className="bg-[var(--land-cream)] py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div ref={heading.ref} className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''} mb-10 md:mb-14`}>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.1] font-normal text-[var(--land-dark)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Preguntas frecuentes
          </h2>
        </div>

        {faqs === null
          ? <div className="h-64 rounded-2xl bg-white/60 animate-pulse" />
          : faqs.map((f, i) => (
              <FAQItem key={f.id} q={f.question} a={f.answer} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            ))
        }
      </div>
    </section>
  )
}
