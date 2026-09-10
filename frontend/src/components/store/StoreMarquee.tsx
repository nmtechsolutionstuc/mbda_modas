import { C } from './tokens'

const ITEMS = [
  'Pago seguro por transferencia',
  'Envíos a todo el país',
  'Atención personalizada por WhatsApp',
]

/**
 * Única cinta de marquee de la página (la skill de diseño limita a una por
 * página). Contenido real, no relleno decorativo: son las garantías concretas
 * que ya se explican en el resto del sitio, acá se les da presencia de marca.
 */
export function StoreMarquee() {
  const line = ITEMS.join('   ·   ')

  return (
    <div style={{ background: C.ink, overflow: 'hidden', padding: '0.875rem 0' }} aria-hidden="true">
      <div className="store-marquee-track">
        {[0, 1].map(rep => (
          <span key={rep} style={{ display: 'flex', flexShrink: 0, paddingRight: '2.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}
