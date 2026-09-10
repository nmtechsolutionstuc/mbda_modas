import { ShieldCheck, Truck, Video } from 'lucide-react'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import { C, STROKE } from './tokens'

const FACTS = [
  { icon: ShieldCheck, title: 'Pago verificado', desc: 'Transferencia únicamente al alias o CBU oficial de la tienda.' },
  { icon: Truck, title: 'Retiro o envío', desc: 'Coordinás con la revendedora cómo te llega: retiro en persona o envío.' },
  { icon: Video, title: 'Filmá el desembalaje', desc: 'Grabá un video al abrir el paquete ante cualquier reclamo.' },
]

function Fact({ icon: Icon, title, desc, index }: { icon: typeof ShieldCheck; title: string; desc: string; index: number }) {
  const reveal = useRevealOnScroll<HTMLDivElement>(0.3)
  const stagger = index * 90
  return (
    <div
      ref={reveal.ref}
      className={`store-stagger reveal-on-scroll ${reveal.visible ? 'is-visible' : ''}`}
      style={{ flex: 1, display: 'flex', gap: '1rem', padding: '1.75rem 0', ['--stagger' as string]: `${stagger}ms` }}
    >
      <Icon className="store-ghost-num" size={26} strokeWidth={STROKE} color={C.accent} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
      <div>
        <p style={{ fontWeight: 700, color: C.ink, fontSize: '0.9375rem', marginBottom: '0.3rem' }}>{title}</p>
        <p style={{ fontSize: '0.8125rem', color: C.inkSoft, lineHeight: 1.5, maxWidth: '20rem' }}>{desc}</p>
      </div>
    </div>
  )
}

export function StoreTrust() {
  return (
    <section style={{ background: C.surface, padding: '0.5rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {FACTS.map((f, i) => (
            <div key={f.title} style={{ flex: '1 1 220px', borderTop: `1px solid ${C.line}`, borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', paddingLeft: i > 0 ? '2rem' : 0 }}>
              <Fact {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
