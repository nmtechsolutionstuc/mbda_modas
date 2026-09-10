import { useRef } from 'react'
import { MapPin, MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '../../utils/whatsapp'
import { C, F, SHADOW, STROKE } from './tokens'

export function StoreCover({ storeName, storeBio, storePhoto, city, whatsapp, sentinelId }: {
  storeName: string
  storeBio: string | null
  storePhoto: string | null
  city: string | null
  whatsapp: string
  sentinelId: string
}) {
  const sectionRef = useRef<HTMLElement>(null)

  // El spotlight sigue al cursor escribiendo directo sobre el DOM (CSS custom
  // properties vía ref), nunca con useState: un mousemove a 60fps por render
  // colapsaría el árbol de React y el hilo principal en mobile.
  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--sx', `${((e.clientX - rect.left) / rect.width) * 100}%`)
    el.style.setProperty('--sy', `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="store-cover"
      style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {storePhoto ? (
        <img
          className="store-parallax-img"
          src={storePhoto} alt={storeName}
          style={{ position: 'absolute', inset: '-8% 0', width: '100%', height: '116%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${C.bannerFrom} 0%, ${C.bannerTo} 55%, ${C.ink} 130%)` }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.55) 100%)' }} />
      <div className="store-spotlight" />

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-end', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 3rem) clamp(1.25rem, 4vw, 3rem) clamp(2rem, 6vh, 4rem)' }}>
        {/* Tarjeta flotante de vidrio esmerilado: la información vive en un panel */}
        {/* propio, no directamente pegada al fondo con degradé como en un hero clásico. */}
        <div
          className="fade-up-enter"
          style={{
            animationDelay: '120ms', maxWidth: '32rem', width: '100%',
            background: 'rgba(20,16,12,0.38)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.16)', borderRadius: '1.5rem',
            padding: 'clamp(1.5rem, 3vw, 2.25rem)', boxShadow: SHADOW.lg,
          }}
        >
          <h1 style={{ fontFamily: F.display, fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', color: '#fff', margin: '0 0 0.875rem', lineHeight: 1.02 }}>
            {storeName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
            {storeBio || 'Moda que te acompaña todos los días.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            {city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)' }}>
                <MapPin size={15} strokeWidth={STROKE} /> {city}
              </span>
            )}
            <a
              href={linkWhatsApp(whatsapp, `Hola! Vi tu tienda "${storeName}" y quiero consultarte.`)}
              target="_blank" rel="noopener noreferrer"
              className="store-btn store-pulse"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.375rem', borderRadius: '99px', background: '#fff', color: C.ink, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}
            >
              <MessageCircle size={16} strokeWidth={STROKE} color={C.accent} /> WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div id={sentinelId} style={{ position: 'absolute', bottom: 0, height: 1, width: '100%' }} aria-hidden />
    </section>
  )
}
