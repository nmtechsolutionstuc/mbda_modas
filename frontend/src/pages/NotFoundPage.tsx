import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f3ef',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '6rem', fontWeight: 700, color: '#e0dbd0', lineHeight: 1 }}>
        404
      </p>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#111', marginTop: '1rem', marginBottom: '0.75rem' }}>
        Página no encontrada
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link
        to="/"
        style={{
          background: '#111',
          color: '#f5f3ef',
          padding: '0.75rem 1.75rem',
          borderRadius: '0.75rem',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.9375rem',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}
