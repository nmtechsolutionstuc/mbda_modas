import { Link } from 'react-router'
import { Copy, Lock } from 'lucide-react'
import type { PublicStore } from '../../api/public'
import { useToast } from '../../context/ToastContext'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import { useBidirectionalReveal } from '../../hooks/useBidirectionalReveal'
import { C, F, STROKE, ACCENT_ON_DARK } from './tokens'

function Step({ index, title, desc, children }: { index: number; title: string; desc: string; children?: React.ReactNode }) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.25)
  return (
    <div ref={ref} className={`reveal-on-scroll ${visible ? 'is-visible' : ''} flex-1`}>
      <span className="store-ghost-num" style={{ display: 'block', fontFamily: F.display, fontSize: 'clamp(3rem, 6vw, 5rem)', color: ACCENT_ON_DARK, opacity: 0.7, lineHeight: 1 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <p style={{ fontWeight: 700, color: '#fff', fontSize: '1.0625rem', margin: '0.75rem 0 0.4rem' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, marginBottom: children ? '0.75rem' : 0 }}>{desc}</p>
      {children}
    </div>
  )
}

export function StoreHowToBuy({ store }: { store: PublicStore }) {
  const { showToast } = useToast()
  const heading = useRevealOnScroll<HTMLDivElement>()
  const line = useBidirectionalReveal<HTMLDivElement>(0.3)

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => showToast('Copiado', 'success'))
  }

  const shortName = store.reseller.storeName.replace(/^Local de\s+/i, '')

  return (
    <section id="como-comprar" style={{ position: 'relative', background: C.ink, padding: 'clamp(4rem, 9vh, 6.5rem) 0', overflow: 'hidden' }}>
      <div className="store-glow-follow" style={{ '--sx': '15%', '--sy': '10%' } as React.CSSProperties} />
      <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div ref={heading.ref} className={`reveal-on-scroll ${heading.visible ? 'is-visible' : ''}`} style={{ marginBottom: '3rem' }}>
          <p style={{ color: ACCENT_ON_DARK, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cómo comprar</p>
          <h2 style={{ fontFamily: F.display, fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', color: '#fff', margin: 0, fontWeight: 400 }}>Del catálogo a tu placard</h2>
        </div>

        <div ref={line.ref} style={{ position: 'relative' }}>
          <svg className="store-connector-line" width="100%" height="3" style={{ position: 'absolute', top: '2.1rem', left: 0, right: 0, overflow: 'visible' }} aria-hidden="true">
            <line
              x1="4%" y1="1.5" x2="96%" y2="1.5"
              stroke={ACCENT_ON_DARK} strokeWidth="1.5" strokeLinecap="round"
              className={`store-draw-line ${line.visible ? 'is-visible' : ''}`}
            />
          </svg>
          <div className="store-howtobuy-steps" style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem' }}>
            <Step index={0} title="Elegí" desc="Explorá los productos que más te gusten." />
            <Step index={1} title="Consultá" desc={`Escribile a ${shortName} por WhatsApp para confirmar talles y disponibilidad.`} />
            <Step index={2} title="Pagá" desc="Realizá el pago por transferencia al alias o CBU oficial:">
              {(store.payment.alias || store.payment.cbu) && (
                <div className="store-frame" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '0.625rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.14)' }}>
                  {store.payment.alias && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: store.payment.cbu ? '0.3rem' : 0 }}>
                      <span style={{ color: '#fff' }}><strong>Alias:</strong> {store.payment.alias}</span>
                      <button onClick={() => copy(store.payment.alias)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><Copy size={13} strokeWidth={STROKE} color={ACCENT_ON_DARK} /></button>
                    </div>
                  )}
                  {store.payment.cbu && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: '#fff' }}><strong>CBU:</strong> {store.payment.cbu}</span>
                      <button onClick={() => copy(store.payment.cbu)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><Copy size={13} strokeWidth={STROKE} color={ACCENT_ON_DARK} /></button>
                    </div>
                  )}
                </div>
              )}
            </Step>
            <Step index={3} title="Recibí" desc={`${shortName} prepara tu pedido y te lo envía.`} />
          </div>
        </div>

        {(store.payment.alias || store.payment.cbu) && (
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.14)', textAlign: 'center' }}>
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              <Lock size={14} strokeWidth={STROKE} /> Pago únicamente por transferencia al CBU o alias oficial informado por la tienda.
            </p>
            <Link to="/terminos" className="store-link store-link-dark" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8125rem', color: ACCENT_ON_DARK, textDecoration: 'none' }}>
              Ver términos y condiciones
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
