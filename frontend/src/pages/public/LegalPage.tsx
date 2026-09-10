import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { renderMarkdown } from './TermsPage'

interface LegalPageProps {
  title: string
  fetchContent: () => Promise<{ content: string | null; updatedAt: string | null }>
  defaultContent: string
}

export function LegalPage({ title, fetchContent, defaultContent }: LegalPageProps) {
  const [content, setContent] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
      .then(data => {
        setContent(data.content)
        setUpdatedAt(data.updatedAt)
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [fetchContent])

  const text = content && content.trim() ? content : defaultContent

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: '#b8922a', textDecoration: 'none' }}>Inicio</Link>
          {' › '}
          <span>{title}</span>
        </p>

        <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e0dbd0', padding: '2.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: '#9ca3af' }}>
              Cargando...
            </div>
          ) : (
            <>
              {renderMarkdown(text)}
              {updatedAt && (
                <p style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e0dbd0', fontSize: '0.8rem', color: '#9ca3af' }}>
                  Última actualización: {new Date(updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
