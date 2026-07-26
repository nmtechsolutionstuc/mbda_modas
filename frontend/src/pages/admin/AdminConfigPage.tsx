import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getConfig, updateConfig, getConfigAudit,
  type Config, type ConfigAuditEntry,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

// ── Styles ────────────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  padding: '0.65rem 0.875rem',
  borderRadius: '0.625rem',
  border: '1.5px solid #e0dbd0',
  width: '100%',
  fontSize: '0.9375rem',
  background: '#fff',
  outline: 'none',
  color: '#111',
  boxSizing: 'border-box',
}
const INP_ERR: React.CSSProperties = { ...INP, border: '1.5px solid #dc2626' }
const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#1e1914',
  marginBottom: '0.25rem',
}
const BTN_PRIMARY: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  borderRadius: '0.625rem',
  border: 'none',
  cursor: 'pointer',
  background: '#111',
  color: '#f5f3ef',
  fontWeight: 600,
  fontSize: '0.875rem',
}
const BTN_GHOST: React.CSSProperties = {
  ...BTN_PRIMARY,
  background: 'transparent',
  color: '#6b7280',
  border: '1.5px solid #e0dbd0',
}

// ── CBU client-side validation ────────────────────────────────────────────────

function isValidCbuFormat(cbu: string): boolean {
  return /^\d{22}$/.test(cbu.trim())
}

// ── Section wrapper ───────────────────────────────────────────────────────────

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

// ── Confirm Password Modal ────────────────────────────────────────────────────

interface ConfirmPasswordModalProps {
  onConfirm: (password: string) => void
  onCancel: () => void
}

function ConfirmPasswordModal({ onConfirm, onCancel }: ConfirmPasswordModalProps) {
  const [pwd, setPwd] = useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ background: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, color: '#111', margin: 0 }}>
            🔒 Confirmá tu contraseña
          </h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Para modificar <strong>CBU, alias o WhatsApp</strong> necesitás confirmar tu contraseña de administrador.
            Cualquier cambio queda registrado en el historial de auditoría.
          </p>
          <label style={LABEL}>Contraseña</label>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pwd && onConfirm(pwd)}
            style={INP}
            placeholder="Tu contraseña actual"
            autoFocus
          />
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={BTN_GHOST}>Cancelar</button>
          <button
            onClick={() => pwd && onConfirm(pwd)}
            disabled={!pwd}
            style={{ ...BTN_PRIMARY, opacity: pwd ? 1 : 0.5 }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Audit Log Section ─────────────────────────────────────────────────────────

function AuditLogSection() {
  const [logs, setLogs] = useState<ConfigAuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [field, setField] = useState<'cbu' | 'alias' | 'whatsapp' | ''>('')

  async function load(f?: 'cbu' | 'alias' | 'whatsapp') {
    setLoading(true)
    try {
      const r = await getConfigAudit({ field: f, limit: 30 })
      setLogs(r.logs)
      setTotal(r.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const FIELD_LABEL: Record<string, string> = { cbu: 'CBU', alias: 'Alias', whatsapp: 'WhatsApp' }

  return (
    <Section title="🔍 Historial de cambios sensibles">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['', 'cbu', 'alias', 'whatsapp'] as const).map(f => (
          <button
            key={f || 'all'}
            onClick={() => { setField(f); load(f || undefined) }}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: '1rem',
              border: '1.5px solid',
              borderColor: field === f ? '#b8922a' : '#e0dbd0',
              background: field === f ? '#fdf3e3' : '#fff',
              color: field === f ? '#b8922a' : '#6b7280',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f ? FIELD_LABEL[f] : 'Todos'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#9ca3af', alignSelf: 'center' }}>
          {total} registro{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>Cargando...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
          No hay cambios registrados todavía.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0dbd0' }}>
                {['Fecha', 'Campo', 'Admin', 'Anterior', 'Nuevo', 'IP'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: log.field === 'cbu' ? '#fef3c7' : log.field === 'whatsapp' ? '#d1fae5' : '#ede9fe',
                      color: log.field === 'cbu' ? '#92400e' : log.field === 'whatsapp' ? '#065f46' : '#5b21b6',
                    }}>
                      {FIELD_LABEL[log.field] ?? log.field}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#374151', fontWeight: 500 }}>{log.adminName}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{log.oldValue || '—'}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#111', fontFamily: 'monospace', fontWeight: 600 }}>{log.newValue}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminConfigPage() {
  const { showToast } = useToast()
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Payment fields
  const [cbu, setCbu] = useState('')
  const [alias, setAlias] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cbuError, setCbuError] = useState('')

  // Operational fields
  const [dispatchDays, setDispatchDays] = useState(3)
  const [stockReserveHours, setStockReserveHours] = useState(24)
  const [maxCashDeliveryDays, setMaxCashDeliveryDays] = useState(2)
  const [defaultCommissionPct, setDefaultCommissionPct] = useState('')
  const [zipnovaDiscountPctHome, setZipnovaDiscountPctHome] = useState('')
  const [zipnovaDiscountPctBranch, setZipnovaDiscountPctBranch] = useState('')
  const [shippingEnabled, setShippingEnabled] = useState(false)

  // Terms
  const [termsContent, setTermsContent] = useState('')

  // Password confirm modal
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null)
  const [pendingSection, setPendingSection] = useState<string | null>(null)

  useEffect(() => {
    getConfig()
      .then(c => {
        setConfig(c)
        setCbu(c.cbu)
        setAlias(c.alias)
        setWhatsapp(c.whatsapp)
        setDispatchDays(c.dispatchDays)
        setStockReserveHours(c.stockReserveHours)
        setMaxCashDeliveryDays(c.maxCashDeliveryDays)
        setDefaultCommissionPct(String(c.defaultCommissionPct ?? ''))
        setZipnovaDiscountPctHome(String(c.zipnovaDiscountPctHome ?? '0'))
        setZipnovaDiscountPctBranch(String(c.zipnovaDiscountPctBranch ?? '0'))
        setShippingEnabled(c.shippingEnabled)
        setTermsContent(c.termsContent ?? '')
      })
      .catch(() => showToast('Error al cargar configuración', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function doSave(section: string, payload: Record<string, unknown>, confirmPassword?: string) {
    setSaving(section)
    try {
      const updated = await updateConfig({ ...payload, ...(confirmPassword ? { confirmPassword } : {}) } as Parameters<typeof updateConfig>[0])
      setConfig(updated)
      showToast('Guardado correctamente', 'success')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      const msg = e?.response?.data?.error?.message ?? 'Error al guardar'
      showToast(msg, 'error')
    } finally {
      setSaving(null)
    }
  }

  function requestSavePayment() {
    if (cbu && !isValidCbuFormat(cbu)) {
      setCbuError('El CBU debe tener exactamente 22 dígitos numéricos')
      return
    }
    setCbuError('')
    setPendingPayload({ cbu, alias, whatsapp })
    setPendingSection('payment')
  }

  function handlePasswordConfirm(password: string) {
    if (!pendingPayload || !pendingSection) return
    setPendingPayload(null)
    setPendingSection(null)
    doSave(pendingSection, pendingPayload, password)
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Cargando...
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/admin" style={{ color: '#b8922a' }}>Admin</Link> › Configuración
        </p>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '1.75rem' }}>
          Configuración
        </h1>

        {/* ── Datos de pago ──────────────────────────────────────────────── */}
        <Section title="💳 Datos de pago">
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.625rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#92400e' }}>
            🔒 <strong>Área protegida.</strong> Modificar CBU, alias o WhatsApp requiere confirmar tu contraseña y queda registrado en el historial de auditoría.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>CBU</label>
                <input
                  value={cbu}
                  onChange={e => { setCbu(e.target.value.replace(/\D/g, '').slice(0, 22)); setCbuError('') }}
                  style={cbuError ? INP_ERR : INP}
                  placeholder="0000000000000000000000"
                  maxLength={22}
                  inputMode="numeric"
                />
                {cbuError
                  ? <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>{cbuError}</p>
                  : <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>22 dígitos numéricos</p>
                }
              </div>
              <div>
                <label style={LABEL}>Alias</label>
                <input value={alias} onChange={e => setAlias(e.target.value)} style={INP} placeholder="mbda.modas.mp" />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Alias de Mercado Pago o banco</p>
              </div>
            </div>
            <div>
              <label style={LABEL}>WhatsApp de MBDA (con código de país)</label>
              <input
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 15))}
                style={INP}
                placeholder="5493812345678"
                inputMode="tel"
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Formato: 549 + número (ej: 5493812345678)</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'payment'}
                onClick={requestSavePayment}
                style={{ ...BTN_PRIMARY, opacity: saving === 'payment' ? 0.6 : 1 }}
              >
                {saving === 'payment' ? 'Guardando...' : '🔒 Guardar datos de pago'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Pedidos y stock ──────────────────────────────────────────────── */}
        <Section title="📦 Pedidos y stock">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
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
              <div>
                <label style={LABEL}>Tope pago en efectivo (días)</label>
                <input value={maxCashDeliveryDays} onChange={e => setMaxCashDeliveryDays(Number(e.target.value))} type="number" min="1" max="30" style={INP} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Pedidos PENDING sin confirmación en {stockReserveHours}h son cancelados automáticamente y el stock se libera.
              Cuando un revendedor marca una venta como pagada en efectivo, la fecha de entrega no puede superar los {maxCashDeliveryDays} días.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'orders'}
                onClick={() => doSave('orders', {
                  dispatchDays,
                  stockReserveHours,
                  defaultCommissionPct: defaultCommissionPct ? Number(defaultCommissionPct) : null,
                  maxCashDeliveryDays,
                })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'orders' ? 0.6 : 1 }}
              >
                {saving === 'orders' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Cotización de envíos ─────────────────────────────────────────── */}
        <Section title="🚚 Envíos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={shippingEnabled} onChange={e => setShippingEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>Envíos activos</span>
            </label>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '-0.5rem' }}>
              Por defecto la venta se maneja por reserva y retiro en el local. Activá esto solo si querés ofrecer también envío a domicilio con cotización Zipnova.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', opacity: shippingEnabled ? 1 : 0.5 }}>
              <div>
                <label style={LABEL}>Descuento envío a domicilio (%)</label>
                <input
                  value={zipnovaDiscountPctHome}
                  onChange={e => setZipnovaDiscountPctHome(e.target.value)}
                  type="number" min="0" max="50" step="1"
                  style={INP}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={LABEL}>Descuento envío a sucursal (%)</label>
                <input
                  value={zipnovaDiscountPctBranch}
                  onChange={e => setZipnovaDiscountPctBranch(e.target.value)}
                  type="number" min="0" max="50" step="1"
                  style={INP}
                  placeholder="0"
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>
              Zipnova agrega su margen al precio del transportista. Compará con Correo Argentino directo y ajustá el porcentaje de diferencia.
              Ejemplo: Zipnova domicilio $3.000 → Correo $2.500 = 17% de descuento.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'shipping'}
                onClick={() => doSave('shipping', {
                  shippingEnabled,
                  zipnovaDiscountPctHome:   zipnovaDiscountPctHome   ? Number(zipnovaDiscountPctHome)   : 0,
                  zipnovaDiscountPctBranch: zipnovaDiscountPctBranch ? Number(zipnovaDiscountPctBranch) : 0,
                })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'shipping' ? 0.6 : 1 }}
              >
                {saving === 'shipping' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Términos y Condiciones ───────────────────────────────────────── */}
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
                onClick={() => doSave('terms', { termsContent })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'terms' ? 0.6 : 1 }}
              >
                {saving === 'terms' ? 'Guardando...' : 'Guardar T&C'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Historial de auditoría ──────────────────────────────────────── */}
        <AuditLogSection />

      </div>

      {/* Password confirmation modal */}
      {pendingPayload && pendingSection && (
        <ConfirmPasswordModal
          onConfirm={handlePasswordConfirm}
          onCancel={() => { setPendingPayload(null); setPendingSection(null) }}
        />
      )}
    </div>
  )
}
