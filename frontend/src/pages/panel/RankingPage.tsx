import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getMyRanking, type MyRanking } from '../../api/reseller'
import { useToast } from '../../context/ToastContext'

const LEVEL_LABEL: Record<string, string> = { INICIAL: 'Inicial', BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro' }
const LEVEL_COLOR: Record<string, string> = { INICIAL: '#9ca3af', BRONCE: '#b45309', PLATA: '#6b7280', ORO: 'var(--c-accent)' }

const MONTH_NAME = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

export function RankingPage() {
  const { showToast } = useToast()
  const [ranking, setRanking] = useState<MyRanking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyRanking()
      .then(setRanking)
      .catch(() => showToast('Error al cargar el ranking', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/panel" style={{ color: 'var(--c-accent)', textDecoration: 'none' }}>Mi panel</Link> / Ranking
        </p>

        <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '0.25rem' }}>
          🏆 Ranking del mes
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
          {MONTH_NAME}
        </p>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
        ) : !ranking || ranking.top.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</p>
            <p style={{ fontWeight: 600, color: '#111' }}>Todavía no hay ventas confirmadas este mes</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>El ranking se arma con los pedidos que MBDA va confirmando.</p>
          </div>
        ) : (
          <>
            {ranking.myPosition && (
              <div style={{ background: '#111', color: '#f5f3ef', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Tu posición este mes</p>
                  <p style={{ fontFamily: "var(--f-display)", fontSize: '1.5rem', fontWeight: 700 }}>#{ranking.myPosition} de {ranking.totalParticipants}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Tu facturación</p>
                  <p style={{ fontWeight: 700 }}>${ranking.myTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
              {ranking.top.map(entry => (
                <div
                  key={entry.resellerId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid #f5f3ef',
                    background: entry.position === ranking.myPosition ? '#faf6ec' : 'transparent',
                  }}
                >
                  <span style={{ width: '2rem', textAlign: 'center', fontWeight: 700, color: entry.position <= 3 ? 'var(--c-accent)' : '#9ca3af' }}>
                    {entry.position <= 3 ? ['🥇', '🥈', '🥉'][entry.position - 1] : `#${entry.position}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: '#111' }}>{entry.storeName}</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                    color: LEVEL_COLOR[entry.level] ?? '#6b7280',
                    background: (LEVEL_COLOR[entry.level] ?? '#6b7280') + '20',
                  }}>
                    {LEVEL_LABEL[entry.level] ?? entry.level}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
              Por privacidad, solo se muestra tu propia facturación — la del resto de las revendedoras no es pública.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
