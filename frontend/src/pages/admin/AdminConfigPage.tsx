import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getConfig, updateConfig, type Config } from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = { padding: '0.65rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  )
}

export function AdminConfigPage() {
  const { showToast } = useToast()
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Campos locales
  const [cbu, setCbu] = useState('')
  const [alias, setAlias] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [dispatchDays, setDispatchDays] = useState(3)
  const [stockReserveHours, setStockReserveHours] = useState(24)
  const [defaultCommissionPct, setDefaultCommissionPct] = useState('')
  const [termsContent, setTermsContent] = useState('')

  useEffect(() => {
    getConfig().then(c => {
      setConfig(c)
      setCbu(c.cbu)
      setAlias(c.alias)
      setWhatsapp(c.whatsapp)
      setDispatchDays(c.dispatchDays)
      setStockReserveHours(c.stockReserveHours)
      setDefaultCommissionPct(c.defaultCommissionPct ?? '')
      setTermsContent(c.termsContent ?? '')
    }).catch(() => showToast('Error al cargar configuración', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function saveSection(section: string, payload: Partial<Config>) {
    setSaving(section)
    try {
      const updated = await updateConfig(payload)
      setConfig(updated)
      showToast('Guardado correctamente', 'success')
    } catch {
      showToast('Error al guardar', 'error')
    }
    setSaving(null)
  }

  if (loading) return <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Cargando...</div>

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/admin" style={{ color: '#b8922a' }}>Admin</Link> › Configuración
        </p>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '1.75rem' }}>
          Configuración
        </h1>

        {/* ── Datos de pago ──────────────────────────────── */}
        <Section title="💳 Datos de pago">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>CBU</label>
                <input value={cbu} onChange={e => setCbu(e.target.value)} style={INP} placeholder="0000000000000000000000" />
              </div>
              <div>
                <label style={LABEL}>Alias</label>
                <input value={alias} onChange={e => setAlias(e.target.value)} style={INP} placeholder="mbda.modas.mp" />
              </div>
            </div>
            <div>
              <label style={LABEL}>WhatsApp de MBDA (con código de país)</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={INP} placeholder="5493812345678" />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Formato: 549 + número (ej: 5493812345678)</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'payment'}
                onClick={() => saveSection('payment', { cbu, alias, whatsapp })}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {saving === 'payment' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Pedidos ────────────────────────────────────── */}
        <Section title="📦 Pedidos y stock">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>Días de despacho</label>
                <input value={dispatchDays} onChange={e => setDispatchDays(Number(e.target.value))} type="number" min="1" max="30" style={INP} />
              </div>
              <div>
                <label style={LABEL}>Reserva de stock (horas)</label>
                <input value={stockReserveHours} onChange={e => setStockReserveHours(Number(e.target.value))} type="number" min="1" max="168" style={INP} />
              </div>
              <div>
                <label style={LABEL}>Comisión por defecto (%)</label>
                <input value={defaultCommissionPct} onChange={e => setDefaultCommissionPct(e.target.value)} type="number" min="1" max="100" style={INP} placeholder="20" />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Pedidos con status PENDING sin confirmación en {stockReserveHours}h son cancelados automáticamente y el stock se libera.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'orders'}
                onClick={() => saveSection('orders', {
                  dispatchDays,
                  stockReserveHours,
                  defaultCommissionPct: defaultCommissionPct ? defaultCommissionPct as unknown as null : null,
                })}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {saving === 'orders' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── T&C ───────────────────────────────────────── */}
        <Section title="📋 Términos y Condiciones">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {config?.termsUpdatedAt && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Última actualización: {new Date(config.termsUpdatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
            <div>
              <label style={LABEL}>Contenido (Markdown)</label>
              <textarea
                value={termsContent}
                onChange={e => setTermsContent(e.target.value)}
                style={{ ...INP, minHeight: '240px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="# Términos y Condiciones..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'terms'}
                onClick={() => saveSection('terms', { termsContent })}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {saving === 'terms' ? 'Guardando...' : 'Guardar T&C'}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
