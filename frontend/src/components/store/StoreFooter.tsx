import { Link } from 'react-router'
import { MessageCircle } from 'lucide-react'
import type { PublicStore } from '../../api/public'
import { linkWhatsApp } from '../../utils/whatsapp'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import { useTypewriter } from '../../hooks/useTypewriter'
import { C, F, STROKE, ACCENT_ON_DARK } from './tokens'

const CLOSING_LINE = 'Contame y te lo guardo.'

export function StoreFooter({ store }: { store: PublicStore }) {
  const year = new Date().getFullYear()
  const reveal = useRevealOnScroll<HTMLDivElement>(0.3)
  const { displayed, done } = useTypewriter(CLOSING_LINE, reveal.visible)
  const shortName = store.reseller.storeName.replace(/^Local de\s+/i, '')

  return (
    <>
      {/* Banda de cierre (CTA): oscura, con movimiento, claramente distinta del footer utilitario de abajo */}
      <section
        className="store-ambient-bg"
        style={{ position: 'relative', background: `linear-gradient(120deg, ${C.ink} 0%, ${C.accentDark} 55%, ${C.ink} 100%)`, overflow: 'hidden' }}
      >
        <div className="store-glow-follow" style={{ '--sx': '80%', '--sy': '20%' } as React.CSSProperties} />
        <div ref={reveal.ref} className={`reveal-on-scroll ${reveal.visible ? 'is-visible' : ''}`} style={{ position: 'relative', maxWidth: '38rem', margin: '0 auto', padding: 'clamp(4rem, 10vh, 6.5rem) 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: F.display, fontSize: 'clamp(2.25rem, 6vw, 4rem)', margin: '0 0 1.75rem', fontWeight: 400, lineHeight: 1.15 }}>
            <span style={{ display: 'block', color: '#fff' }}>¿Ya elegiste algo?</span>
            <span style={{ display: 'block', color: ACCENT_ON_DARK, fontStyle: 'italic', minHeight: '1.15em' }}>
              {displayed}
              {!done && <span className="store-caret" aria-hidden="true" />}
            </span>
          </h2>
          <a
            href={linkWhatsApp(store.reseller.whatsapp, `Hola! Vi tu tienda "${store.reseller.storeName}" y quiero consultarte.`)}
            target="_blank" rel="noopener noreferrer"
            className="store-btn store-pulse"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.95rem 1.85rem', borderRadius: '99px', background: C.accent, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem' }}
          >
            <MessageCircle size={18} strokeWidth={STROKE} /> Escribile a {shortName}
          </a>
        </div>
      </section>

      {/* Footer utilitario: fondo claro a propósito, para que se lea como una sección distinta del banner de arriba */}
      <footer style={{ background: C.surface }}>
        <div className="store-footer-links" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Explorar</p>
            <div style={{ fontSize: '0.8125rem', color: C.inkSoft, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#coleccion" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Colección</a>
              <a href="#como-comprar" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Cómo comprar</a>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Legal</p>
            <div style={{ fontSize: '0.8125rem', color: C.inkSoft, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/terminos" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Términos y condiciones</Link>
              <Link to="/privacidad" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Privacidad</Link>
              <Link to="/politica-de-cambios" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Cambios</Link>
              <Link to="/derecho-de-arrepentimiento" className="store-link" style={{ color: 'inherit', textDecoration: 'none', width: 'fit-content' }}>Arrepentimiento</Link>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.line}`, padding: '1.25rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: C.muted }}>© {year} {store.reseller.storeName}</p>
        </div>
      </footer>
    </>
  )
}
