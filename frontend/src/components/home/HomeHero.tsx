import { Link } from 'react-router'
import { LogoMark } from './LogoMark'

export function HomeHero({ heroLine1, heroLine2, desc, ctaText, image, video, sentinelId }: {
  heroLine1: string
  heroLine2: string | null
  desc: string
  ctaText: string
  image: string | null
  video: string | null
  sentinelId: string
}) {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[var(--land-dark)]">
      {video ? (
        <video className="absolute inset-0 w-full h-full object-cover" src={video} autoPlay muted loop playsInline />
      ) : image ? (
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        // Sin foto/video cargado desde el admin todavía: campaña tipográfica
        // propia en vez de un placeholder gris — el isotipo gigante y tenue
        // como textura de fondo, no un rectángulo vacío.
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(150deg, var(--land-terracota) 0%, var(--land-terracota-dark) 42%, var(--land-dark) 100%)' }}
        >
          <div className="scale-[6] md:scale-[9] opacity-[0.08]">
            <LogoMark size={200} color="#fff" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

      <div className="relative z-10 min-h-[100dvh] flex flex-col justify-end px-6 md:px-12 lg:px-16 pb-14 md:pb-20">
        <p className="fade-up-enter text-white/85 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-6" style={{ animationDelay: '0s' }}>
          Programa de revendedoras MBDA
        </p>

        <h1
          className="fade-up-enter text-white font-normal leading-[0.95] tracking-tight uppercase"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.75rem, 8vw, 7.5rem)',
            animationDelay: '90ms',
            maxWidth: '16ch',
          }}
        >
          {heroLine1}
          {heroLine2 && <><br /><span className="italic normal-case">{heroLine2}</span></>}
        </h1>

        <p className="fade-up-enter text-white/75 text-base md:text-lg font-medium max-w-md mt-7" style={{ animationDelay: '180ms' }}>
          {desc}
        </p>

        <div className="fade-up-enter flex flex-wrap items-center gap-4 mt-9" style={{ animationDelay: '270ms' }}>
          <Link
            to="/registro"
            className="inline-flex items-center bg-white text-[var(--land-dark)] text-sm font-bold px-8 py-4 rounded-full hover:bg-white/90 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            {ctaText}
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center text-white text-sm font-semibold px-6 py-4 rounded-full border border-white/35 hover:bg-white/10 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            Conocer cómo funciona
          </a>
        </div>
      </div>

      <div id={sentinelId} className="absolute bottom-0 h-px w-full" aria-hidden />
    </section>
  )
}
