import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import { useToast } from '../../context/ToastContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Commission {
  id: string
  amount: string
  status: 'PENDING' | 'PAID'
  paidAt: string | null
  createdAt: string
  order: {
    orderNumber: string
    buyerName: string
    createdAt: string
  }
}

interface CommissionsResponse {
  commissions: Commission[]
  total: number
  page: number
  totalPages: number
  summary: {
    pending: number
    paid: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number | string) {
  return `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

// ── Página ────────────────────────────────────────────────────────────────────

export function MyCommissionsPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<CommissionsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'' | 'PENDING' | 'PAID'>('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await axiosClient.get<{ success: true; data: CommissionsResponse }>('/reseller/commissions', {
        params: { page, limit: 20, status: statusFilter || undefined },
      })
      setData(res.data)
    } catch {
      showToast('Error al cargar comisiones', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, showToast])

  useEffect(() => { load() }, [load])

  function handleFilter(val: '' | 'PENDING' | 'PAID') {
    setStatusFilter(val)
    setPage(1)
  }

  const commissions = data?.commissions ?? []
  const totalPages  = data?.totalPages ?? 1
  const summary     = data?.summary ?? { pending: 0, paid: 0 }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/panel" style={{ color: '#b8922a', textDecoration: 'none' }}>Mi panel</Link> / Mis comisiones
        </p>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '1.5rem' }}>
          Mis comisiones
        </h1>

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Pendiente de cobro', value: fmt(summary.pending), color: '#f59e0b', icon: '⏳' },
            { label: 'Total cobrado', value: fmt(summary.paid), color: '#10b981', icon: '✅' },
            { label: 'Total ganado', value: fmt(summary.pending + summary.paid), color: '#b8922a', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e0dbd0' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Todas', value: '' as const },
            { label: 'Pendientes', value: 'PENDING' as const },
            { label: 'Cobradas', value: 'PAID' as const },
          ].map(f => (
            <button key={f.value} onClick={() => handleFilter(f.value)} style={{
              padding: '0.375rem 0.875rem', borderRadius: '99px', border: '1px solid',
              borderColor: statusFilter === f.value ? '#b8922a' : '#e0dbd0',
              background: statusFilter === f.value ? '#b8922a' : '#fff',
              color: statusFilter === f.value ? '#fff' : '#6b7280',
              fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
          ) : commissions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              {!statusFilter && (data?.total ?? 0) === 0 ? (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</p>
                  <p style={{ fontWeight: 600, color: '#111' }}>Todavía no ganaste comisiones</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Cuando se confirme el pago de una venta, tu comisión aparecerá acá.</p>
                </>
              ) : (
                'No hay comisiones con este estado.'
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0dbd0', background: '#faf9f7' }}>
                    {['Pedido', 'Comprador', 'Comisión', 'Estado', 'Fecha venta', 'Fecha cobro'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f5f3ef' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#b8922a' }}>{c.order.orderNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{c.order.buyerName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{fmt(c.amount)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                          background: c.status === 'PAID' ? '#10b98120' : '#f59e0b20',
                          color: c.status === 'PAID' ? '#10b981' : '#f59e0b',
                          border: `1px solid ${c.status === 'PAID' ? '#10b98140' : '#f59e0b40'}`,
                        }}>
                          {c.status === 'PAID' ? '✓ Cobrada' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(c.order.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {c.paidAt ? new Date(c.paidAt).toLocaleDateString('es-AR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Anterior</button>
            <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem', color: '#6b7280', alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Siguiente →</button>
          </div>
        )}

        {/* Nota informativa */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center' }}>
          Las comisiones se generan cuando el admin confirma el pago de un pedido. El cobro se acredita cuando el admin las marca como pagadas.
        </p>
      </div>
    </div>
  )
}
