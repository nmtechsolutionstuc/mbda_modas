import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Heart, MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '../../utils/whatsapp'
import { C, F, STROKE } from './tokens'

/**
 * Nav mínimo de la tienda: transparente y con texto claro sobre la foto de
 * portada, pasa a sólido apenas se scrollea más allá de la portada. Se activa
 * con un sentinel al pie de <StoreCover /> (IntersectionObserver), no con un
 * listener de scroll continuo.
 */
export function StoreNav({ storeName, whatsapp, favCount, onOpenFavorites, coverSentinelId }: {
  storeName: string
  whatsapp: string
  favCount: number
  onOpenFavorites: () => void
  coverSentinelId: string
}) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById(coverSentinelId)
    if (!sentinel) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => setSolid(!e.isIntersecting)),
      { rootMargin: '-64px 0px 0px 0px' },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [coverSentinelId])

  return (
    <header
      style={{
        position: 'fixed', top: 0, insetInline: 0, zIndex: 30,
        background: solid ? C.surface : 'transparent',
        borderBottom: solid ? `1px solid ${C.line}` : '1px solid transparent',
        backdropFilter: solid ? 'blur(10px)' : 'none',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontFamily: F.display, fontSize: '1.25rem', color: solid ? C.ink : '#fff', transition: 'color 0.3s ease' }}>
            {storeName}
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={onOpenFavorites}
            className="store-icon-btn"
            aria-label="Mis favoritos"
            style={{
              position: 'relative', width: '2.5rem', height: '2.5rem', borderRadius: '99px', cursor: 'pointer',
              border: solid ? `1.5px solid ${C.line}` : '1.5px solid rgba(255,255,255,0.5)',
              background: solid ? C.surface : 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
          >
            <Heart size={17} strokeWidth={STROKE} color={solid ? C.ink : '#fff'} />
            {favCount > 0 && (
              <span style={{
                position: 'absolute', top: '-0.3rem', right: '-0.3rem', background: C.accent, color: '#fff',
                borderRadius: '99px', fontSize: '0.6875rem', fontWeight: 700, minWidth: '1.15rem', height: '1.15rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.2rem', border: `2px solid ${solid ? C.surface : 'transparent'}`,
              }}>
                {favCount}
              </span>
            )}
          </button>
          <a
            href={linkWhatsApp(whatsapp, `Hola! Vi tu tienda "${storeName}" y quiero consultarte.`)}
            target="_blank" rel="noopener noreferrer"
            className="store-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '99px', textDecoration: 'none',
              background: C.accent, color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
            }}
          >
            <MessageCircle size={16} strokeWidth={STROKE} /> WhatsApp
          </a>
        </div>
      </div>
    </header>
  )
}
