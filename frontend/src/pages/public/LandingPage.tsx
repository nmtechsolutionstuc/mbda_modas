import { Link } from 'react-router-dom'

const STEPS = [
  {
    num: '1',
    title: 'Registrate gratis',
    desc: 'Creá tu cuenta en minutos. Sin costo, sin compromisos.',
    emoji: '✏️',
  },
  {
    num: '2',
    title: 'Armá tu catálogo',
    desc: 'Elegí productos de MBDA Modas y definí tus precios de venta.',
    emoji: '🛍️',
  },
  {
    num: '3',
    title: 'Compartí y vendé',
    desc: 'Compartí tu link único con tus clientes y recibí pedidos.',
    emoji: '🚀',
  },
]

export function LandingPage() {
  return (
    <div style={{ background: '#f5f3ef', minHeight: 'calc(100vh - 60px)' }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #111 0%, #2a2016 100%)',
          color: '#f5f3ef',
          padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorativo */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,146,42,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <p style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.12em', color: '#b8922a', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Programa de Revendedores
        </p>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '640px',
            margin: '0 auto 1.25rem',
          }}
        >
          Tu tienda,{' '}
          <em style={{ color: '#b8922a', fontStyle: 'italic' }}>tus precios</em>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#c9b99a',
            maxWidth: '520px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.65,
          }}
        >
          Elegí productos de MBDA Modas, poneles tu precio y vendé a tus clientes.
          Armá tu catálogo gratis en minutos.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/registro"
            style={{
              background: '#b8922a',
              color: '#fff',
              padding: '0.875rem 2rem',
              borderRadius: '0.875rem',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
              boxShadow: '0 4px 16px rgba(184,146,42,0.35)',
            }}
          >
            Quiero ser revendedor
          </Link>
          <Link
            to="/login"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f5f3ef',
              padding: '0.875rem 2rem',
              borderRadius: '0.875rem',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'background 0.15s',
            }}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 8vw, 5rem) 1.5rem', maxWidth: '960px', margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: '#111',
            textAlign: 'center',
            marginBottom: '3rem',
          }}
        >
          ¿Cómo funciona?
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {STEPS.map(step => (
            <div
              key={step.num}
              style={{
                background: '#fff',
                borderRadius: '1.25rem',
                padding: '2rem 1.75rem',
                border: '1px solid #e0dbd0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{step.emoji}</div>
              <div
                style={{
                  display: 'inline-block',
                  background: '#f5f3ef',
                  color: '#b8922a',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '99px',
                  marginBottom: '0.75rem',
                  border: '1px solid #e8e3d5',
                }}
              >
                Paso {step.num}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>
                {step.title}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #b8922a 0%, #8f6e1e 100%)',
          padding: 'clamp(3rem, 8vw, 4rem) 1.5rem',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 700, marginBottom: '1rem' }}>
          ¿Listo para empezar?
        </h2>
        <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
          Registrate gratis y empezá a vender hoy mismo.
        </p>
        <Link
          to="/registro"
          style={{
            background: '#fff',
            color: '#b8922a',
            padding: '0.875rem 2.25rem',
            borderRadius: '0.875rem',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          Crear mi cuenta gratis
        </Link>
      </section>
    </div>
  )
}
