import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicTerms } from '../../api/public'

// ── Renderizador de Markdown básico ───────────────────────────────────────────
// Soporta: # h1, ## h2, ### h3, **bold**, *italic*, - listas, líneas en blanco

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={key++} style={{ margin: '0.5rem 0 1rem 1.5rem', paddingLeft: '0.5rem' }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '0.25rem' }}>
            {inlineFormat(item)}
          </li>
        ))}
      </ul>,
    )
    listItems = []
  }

  function inlineFormat(text: string): React.ReactNode {
    // Bold **text** and italic *text*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={i} style={{ color: '#111' }}>{p.slice(2, -2)}</strong>
      if (p.startsWith('*') && p.endsWith('*'))
        return <em key={i}>{p.slice(1, -1)}</em>
      return p
    })
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('### ')) {
      flushList()
      nodes.push(
        <h3 key={key++} style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: '1.5rem 0 0.5rem' }}>
          {line.slice(4)}
        </h3>,
      )
    } else if (line.startsWith('## ')) {
      flushList()
      nodes.push(
        <h2 key={key++} style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#111', margin: '2rem 0 0.5rem', borderBottom: '1px solid #e0dbd0', paddingBottom: '0.375rem' }}>
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith('# ')) {
      flushList()
      nodes.push(
        <h1 key={key++} style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.625rem', fontWeight: 700, color: '#111', margin: '0 0 1rem' }}>
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
    } else if (line.trim() === '') {
      flushList()
      nodes.push(<div key={key++} style={{ height: '0.5rem' }} />)
    } else {
      flushList()
      nodes.push(
        <p key={key++} style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.75, margin: '0 0 0.75rem' }}>
          {inlineFormat(line)}
        </p>,
      )
    }
  }

  flushList()
  return nodes
}

// ── Contenido por defecto si no hay T&C configurados ─────────────────────────

const DEFAULT_CONTENT = `# Términos y Condiciones

## Programa de Revendedores MBDA Modas

Bienvenido al programa de revendedores de MBDA Modas. Al registrarte, aceptás los siguientes términos.

## 1. Sobre el programa

El programa de revendedores permite a personas físicas o jurídicas comercializar productos de MBDA Modas a través de un catálogo digital propio con precios definidos por cada revendedor.

## 2. Comisiones

La comisión se calcula como la diferencia entre el precio de venta definido por el revendedor y el precio base de MBDA Modas. El revendedor puede fijar el precio que desee, siempre que sea igual o superior al precio base.

## 3. Procesamiento de pedidos

Todos los pedidos son gestionados y despachados por MBDA Modas. El comprador final no sabrá que el proveedor es MBDA Modas a menos que el revendedor lo indique.

## 4. Pagos

Los compradores realizan el pago directamente a MBDA Modas. Las comisiones se transfieren a los revendedores según los datos bancarios registrados en su perfil.

## 5. Responsabilidades

El revendedor es responsable de la atención post-venta a sus clientes. MBDA Modas gestiona el stock y el despacho.

## 6. Modificaciones

MBDA Modas se reserva el derecho de modificar estos términos con previo aviso.`

// ── Página ────────────────────────────────────────────────────────────────────

export function TermsPage() {
  const [content, setContent] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicTerms()
      .then(data => {
        setContent(data.content)
        setUpdatedAt(data.updatedAt)
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  const text = content && content.trim() ? content : DEFAULT_CONTENT

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: '#b8922a', textDecoration: 'none' }}>Inicio</Link>
          {' › '}
          <Link to="/registro" style={{ color: '#b8922a', textDecoration: 'none' }}>Registro</Link>
          {' › '}
          <span>Términos y Condiciones</span>
        </p>

        {/* Card */}
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

        {/* Volver al registro */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            to="/registro"
            style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: '0.875rem', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none' }}
          >
            ← Volver al registro
          </Link>
        </div>

      </div>
    </div>
  )
}
