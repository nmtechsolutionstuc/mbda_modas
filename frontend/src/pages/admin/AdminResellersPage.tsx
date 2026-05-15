import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminResellers, toggleResellerActive, getAdminCommissions, markCommissionPaid,
  type AdminReseller, type Commission,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { linkWhatsApp } from '../../utils/whatsapp'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | number) {
  return `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '99px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: active ? '#10b98120' : '#ef444420',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? '#10b98140' : '#ef444440'}`,
    }}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

// ── Panel de comisiones ───────────────────────────────────────────────────────

function CommissionsPanel({ resellerId, resellerName }: { resellerId: string; resellerName: string }) {
  const { showToast } = useToast()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminCommissions({ resellerId, limit: 50 })
      setCommissions(res.commissions)
    } catch {
      showToast('Error al cargar comisiones', 'error')
    } finally {
      setLoading(false)
    }
  }, [resellerId, showToast])

  useEffect(() => { load() }, [load])

  async function handleMarkPaid(id: string) {
    setMarkingId(id)
    try {
      await markCommissionPaid(id)
      showToast('Comisión marcada como pagada', 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error', 'error')
    } finally {
      setMarkingId(null)
    }
  }

  const pendingTotal = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((acc, c) => acc + Number(c.amount), 0)
  const paidTotal = commissions
    .filter(c => c.status === 'PAID')
    .reduce((acc, c) => acc + Number(c.amount), 0)

  return (
    <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#111' }}>
        Comisiones de {resellerName}
      </h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {[
          { label: 'Pendiente de pago', value: fmt(pendingTotal), color: '#f59e0b' },
          { label: 'Total pagado', value: fmt(paidTotal), color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#faf9f7', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid #e0dbd0' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Cargando...</p>
      ) : commissions.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Sin comisiones aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {commissions.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#fff', borderRadius: '0.5rem', border: '1px solid #e0dbd0', fontSize: '0.875rem' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#111' }}>{fmt(c.amount)}</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: c.status === 'PAID' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                  {c.status === 'PAID' ? '✓ Pagada' : 'Pendiente'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(c.createdAt).toLocaleDateString('es-AR')}
                </span>
                {c.status === 'PENDING' && (
                  <button
                    onClick={() => handleMarkPaid(c.id)}
                    disabled={markingId === c.id}
                    style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {markingId === c.id ? '...' : 'Marcar pagada'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal detalle de revendedor ───────────────────────────────────────────────

function ResellerModal({ reseller, onClose, onRefresh }: {
  reseller: AdminReseller
  onClose: () => void
  onRefresh: () => void
}) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'detail' | 'commissions'>('detail')

  async function handleToggle() {
    if (!confirm(`¿${reseller.isActive ? 'Desactivar' : 'Activar'} a ${reseller.storeName}?`)) return
    setLoading(true)
    try {
      await toggleResellerActive(reseller.id)
      showToast(`Revendedor ${reseller.isActive ? 'desactivado' : 'activado'}`, 'success')
      onRefresh()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const catalogLink = `${window.location.origin}/catalogo?ref=${reseller.referralCode}`
  const waLink = linkWhatsApp(reseller.whatsapp, `Hola ${reseller.firstName}, te escribimos desde MBDA Modas.`)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>
              {reseller.storeName}
            </h2>
            <Badge active={reseller.isActive} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e0dbd0' }}>
          {(['detail', 'commissions'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: view === v ? '#b8922a' : '#6b7280',
                borderBottom: view === v ? '2px solid #b8922a' : '2px solid transparent',
              }}
            >
              {v === 'detail' ? 'Datos' : 'Comisiones'}
            </button>
          ))}
        </div>

        {view === 'detail' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Nombre', value: `${reseller.firstName} ${reseller.lastName}` },
                { label: 'Email', value: reseller.email },
                { label: 'WhatsApp', value: reseller.whatsapp },
                { label: 'Código referido', value: reseller.referralCode },
                { label: 'CBU', value: reseller.cbu ?? '-' },
                { label: 'Alias', value: reseller.alias ?? '-' },
                { label: 'Productos en catálogo', value: String(reseller._count.catalogItems) },
                { label: 'Pedidos totales', value: String(reseller._count.orders) },
                { label: 'Miembro desde', value: new Date(reseller.createdAt).toLocaleDateString('es-AR') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f5f3ef', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: '#111', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Link del catálogo */}
            <div style={{ background: '#f5f3ef', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Link del catálogo</p>
              <p style={{ fontSize: '0.8125rem', color: '#b8922a', wordBreak: 'break-all' }}>{catalogLink}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(catalogLink); showToast('Link copiado', 'success') }}
                style={{ marginTop: '0.5rem', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #b8922a', background: 'transparent', color: '#b8922a', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Copiar link
              </button>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={waLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#25d366', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  📱 WhatsApp
                </button>
              </a>
              <button
                onClick={handleToggle}
                disabled={loading}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: `1px solid ${reseller.isActive ? '#ef4444' : '#10b981'}`, background: 'transparent', color: reseller.isActive ? '#ef4444' : '#10b981', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {loading ? '...' : reseller.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
              </button>
            </div>
          </div>
        )}

        {view === 'commissions' && (
          <CommissionsPanel
            resellerId={reseller.id}
            resellerName={`${reseller.firstName} ${reseller.lastName}`}
          />
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function AdminResellersPage() {
  const { showToast } = useToast()
  const [resellers, setResellers] = useState<AdminReseller[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminReseller | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: 20 }
      if (activeFilter !== '') params.isActive = activeFilter === 'true'
      const res = await getAdminResellers(params as any)
      setResellers(res.resellers)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch {
      showToast('Error al cargar revendedores', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, showToast])

  useEffect(() => { load() }, [load])

  function handleFilter(val: '' | 'true' | 'false') {
    setActiveFilter(val)
    setPage(1)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Admin</Link> / Revendedores
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Revendedores
          </h1>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{total} registrado{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Todos', value: '' as const },
            { label: 'Activos', value: 'true' as const },
            { label: 'Inactivos', value: 'false' as const },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '99px',
                border: '1px solid',
                borderColor: activeFilter === f.value ? '#b8922a' : '#e0dbd0',
                background: activeFilter === f.value ? '#b8922a' : '#fff',
                color: activeFilter === f.value ? '#fff' : '#6b7280',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando revendedores...</div>
          ) : resellers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No hay revendedores{activeFilter !== '' ? ' con este estado' : ''}.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0dbd0', background: '#faf9f7' }}>
                    {['Tienda', 'Contacto', 'Código', 'Catálogo', 'Pedidos', 'Estado', 'Desde', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resellers.map(r => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #f5f3ef', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setSelected(r)}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{r.storeName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#b8922a', fontWeight: 700 }}>{r.referralCode}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{r._count.catalogItems}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{r._count.orders}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><Badge active={r.isActive} /></td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: '#b8922a', fontWeight: 600, fontSize: '0.8125rem' }}>Ver →</span>
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
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem', color: '#6b7280', alignSelf: 'center' }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <ResellerModal
          reseller={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}
