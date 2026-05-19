export function Footer() {
  return (
    <footer
      style={{
        background: '#111',
        color: '#9ca3af',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8125rem',
        marginTop: 'auto',
      }}
    >
      <p style={{ fontFamily: "'Playfair Display', serif", color: '#f5f3ef', fontSize: '1rem', marginBottom: '0.5rem' }}>
        MBDA
      </p>
      <p>© {new Date().getFullYear()} MBDA Modas. Todos los derechos reservados.</p>
    </footer>
  )
}
