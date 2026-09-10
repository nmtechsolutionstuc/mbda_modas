import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { isReseller, isAdminLike } from '../../types'
import { LogoMark } from './LogoMark'

const ALL_LINKS = [
  { label: 'Beneficios', href: '#beneficios', key: 'showBenefits' },
  { label: 'Cómo funciona', href: '#como-funciona', key: 'showProcess' },
  { label: 'Colección', href: '#coleccion', key: 'showCollection' },
  { label: 'Preguntas', href: '#preguntas', key: 'showFaq' },
] as const

/**
 * Navbar exclusivo de la Home: transparente y con texto claro sobre el hero
 * full-bleed, pasa a sólido apenas se scrollea. Se activa con un sentinel al
 * pie del hero (IntersectionObserver), no con un listener de scroll continuo.
 */
export function HomeNavbar({ ctaText, loginText, heroSentinelId, showBenefits, showProcess, showCollection, showFaq }: {
  ctaText: string
  loginText: string
  heroSentinelId: string
  showBenefits: boolean
  showProcess: boolean
  showCollection: boolean
  showFaq: boolean
}) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const visibility = { showBenefits, showProcess, showCollection, showFaq }
  const LINKS = ALL_LINKS.filter(l => visibility[l.key])

  useEffect(() => {
    const sentinel = document.getElementById(heroSentinelId)
    if (!sentinel) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => setSolid(!e.isIntersecting)),
      { rootMargin: '-72px 0px 0px 0px' },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [heroSentinelId])

  const accountHref = user
    ? (isReseller(user) ? '/panel' : isAdminLike(user) ? '/admin' : '/')
    : '/login'
  const accountLabel = user ? (isReseller(user) ? 'Mi panel' : 'Admin') : loginText

  const dark = solid || open

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        dark ? 'bg-[var(--land-cream)]/95 backdrop-blur-sm border-b border-[var(--land-beige)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-10 h-[72px]">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark size={24} color={dark ? 'var(--land-terracota)' : '#fff'} />
          <span className={`text-base font-bold tracking-tight ${dark ? 'text-[var(--land-dark)]' : 'text-white'}`}>MBDA</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${dark ? 'text-[var(--land-dark)]/70 hover:text-[var(--land-dark)]' : 'text-white/80 hover:text-white'}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${dark ? 'text-[var(--land-dark)]/70 hover:text-[var(--land-dark)]' : 'text-white/80 hover:text-white'}`}
              >
                {loginText}
              </Link>
              <Link
                to="/registro"
                className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] whitespace-nowrap ${
                  dark ? 'bg-[var(--land-dark)] text-white hover:bg-black' : 'bg-white text-[var(--land-dark)] hover:bg-white/90'
                }`}
              >
                {ctaText}
              </Link>
            </>
          ) : (
            <Link
              to={accountHref}
              className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all ${
                dark ? 'bg-[var(--land-dark)] text-white hover:bg-black' : 'bg-white text-[var(--land-dark)] hover:bg-white/90'
              }`}
            >
              {accountLabel}
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label="Menú"
          onClick={() => setOpen(o => !o)}
          className="lg:hidden w-9 h-9 rounded-full flex flex-col items-center justify-center gap-[5px]"
        >
          <span className={`block w-4 h-[2px] transition-transform duration-300 ${dark ? 'bg-[var(--land-dark)]' : 'bg-white'}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)', transform: open ? 'translateY(3.5px) rotate(45deg)' : 'none' }} />
          <span className={`block w-4 h-[2px] transition-transform duration-300 ${dark ? 'bg-[var(--land-dark)]' : 'bg-white'}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)', transform: open ? 'translateY(-3.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      <div className={`lg:hidden bg-[var(--land-cream)] border-b border-[var(--land-beige)] overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-3 flex flex-col">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-[var(--land-dark)]">
              {l.label}
            </a>
          ))}
          <div className="h-px bg-[var(--land-beige)] my-1" />
          <Link to={accountHref} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-[var(--land-dark)]">
            {accountLabel}
          </Link>
          {!user && (
            <Link to="/registro" onClick={() => setOpen(false)} className="mt-2 mb-1 bg-[var(--land-dark)] text-white text-sm font-semibold px-5 py-3 rounded-full text-center">
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
