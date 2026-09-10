import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  getConfig, updateConfig, getConfigAudit,
  getBonusTiers, updateBonusTiers,
  type Config, type ConfigAuditEntry,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { ConfirmPasswordModal } from '../../components/admin/ConfirmPasswordModal'

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
  const [pickupExpiryHours, setPickupExpiryHours] = useState(48)
  const [cityResellerLimitEnabled, setCityResellerLimitEnabled] = useState(false)
  const [cityResellerLimitCount, setCityResellerLimitCount] = useState(5)
  const [helpUrl, setHelpUrl] = useState('')

  // Terms
  const [termsContent, setTermsContent] = useState('')
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState('')
  const [changePolicyContent, setChangePolicyContent] = useState('')
  const [withdrawalRightContent, setWithdrawalRightContent] = useState('')

  // Recompensa por volumen del ciclo
  const [bonusTiers, setBonusTiers] = useState<{ thresholdAmount: string; bonusPct: string }[]>([])
  const [savingBonusTiers, setSavingBonusTiers] = useState(false)

  function updateBonusTierField(index: number, field: 'thresholdAmount' | 'bonusPct', value: string) {
    setBonusTiers(prev => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }
  function addBonusTier() {
    setBonusTiers(prev => [...prev, { thresholdAmount: '', bonusPct: '' }])
  }
  function removeBonusTier(index: number) {
    setBonusTiers(prev => prev.filter((_, i) => i !== index))
  }
  async function saveBonusTiers() {
    setSavingBonusTiers(true)
    try {
      const updated = await updateBonusTiers(bonusTiers.map(t => ({
        thresholdAmount: Number(t.thresholdAmount),
        bonusPct: Number(t.bonusPct),
      })))
      setBonusTiers(updated.map(t => ({ thresholdAmount: t.thresholdAmount, bonusPct: t.bonusPct })))
      showToast('Recompensa por volumen guardada', 'success')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      showToast(e?.response?.data?.error?.message ?? 'Error al guardar', 'error')
    } finally {
      setSavingBonusTiers(false)
    }
  }

  // Password confirm modal
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null)
  const [pendingSection, setPendingSection] = useState<string | null>(null)

  useEffect(() => {
    getBonusTiers()
      .then(tiers => setBonusTiers(tiers.map(t => ({ thresholdAmount: t.thresholdAmount, bonusPct: t.bonusPct }))))
      .catch(() => showToast('Error al cargar la recompensa por volumen', 'error'))

    getConfig()
      .then(c => {
        setConfig(c)
        setCbu(c.cbu)
        setAlias(c.alias)
        setWhatsapp(c.whatsapp)
        setDispatchDays(c.dispatchDays)
        setStockReserveHours(c.stockReserveHours)
        setMaxCashDeliveryDays(c.maxCashDeliveryDays)
        setPickupExpiryHours(c.pickupExpiryHours)
        setCityResellerLimitEnabled(c.cityResellerLimitEnabled)
        setCityResellerLimitCount(c.cityResellerLimitCount)
        setHelpUrl(c.helpUrl)
        setTermsContent(c.termsContent ?? '')
        setPrivacyPolicyContent(c.privacyPolicyContent ?? '')
        setChangePolicyContent(c.changePolicyContent ?? '')
        setWithdrawalRightContent(c.withdrawalRightContent ?? '')
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Cargando...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>Días de despacho</label>
                <input value={dispatchDays} onChange={e => setDispatchDays(Number(e.target.value))} type="number" min="1" max="30" style={INP} />
              </div>
              <div>
                <label style={LABEL}>Reserva de stock (horas)</label>
                <input value={stockReserveHours} onChange={e => setStockReserveHours(Number(e.target.value))} type="number" min="1" max="168" style={INP} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={LABEL}>Tope pago en efectivo (días)</label>
                <input value={maxCashDeliveryDays} onChange={e => setMaxCashDeliveryDays(Number(e.target.value))} type="number" min="1" max="30" style={INP} />
              </div>
              <div>
                <label style={LABEL}>Vencimiento del retiro en el local (horas)</label>
                <input value={pickupExpiryHours} onChange={e => setPickupExpiryHours(Number(e.target.value))} type="number" min="1" max="720" style={INP} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Pedidos PENDING sin confirmación en {stockReserveHours}h son cancelados automáticamente y el stock se libera.
              Cuando un revendedor marca una venta como pagada en efectivo, la fecha de entrega no puede superar los {maxCashDeliveryDays} días.
              Una vez confirmada la venta, si nadie retira la prenda en {pickupExpiryHours}hs el pedido se cancela y el stock vuelve a estar disponible.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'orders'}
                onClick={() => doSave('orders', {
                  dispatchDays,
                  stockReserveHours,
                  maxCashDeliveryDays,
                  pickupExpiryHours,
                })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'orders' ? 0.6 : 1 }}
              >
                {saving === 'orders' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Recompensa por volumen del ciclo ─────────────────────────────── */}
        <Section title="🚀 Recompensa por volumen (por ciclo)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              Al superar cada monto de facturación DENTRO de un mismo ciclo (se reinicia en cada ciclo nuevo), la revendedora
              gana un % extra que sale del margen de MBDA — se suma aparte de su ganancia normal, sin importar el precio que
              ella le haya puesto al producto.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e0dbd0' }}>
                    {['Facturación del ciclo desde', 'Recompensa extra (%)', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.5rem', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bonusTiers.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f3ef' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ color: '#6b7280', marginRight: '0.375rem' }}>$</span>
                        <input
                          value={t.thresholdAmount}
                          onChange={e => updateBonusTierField(i, 'thresholdAmount', e.target.value)}
                          type="number" min="0" style={{ ...INP, width: '160px', display: 'inline-block' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          value={t.bonusPct}
                          onChange={e => updateBonusTierField(i, 'bonusPct', e.target.value)}
                          type="number" min="0" max="100" style={{ ...INP, width: '100px' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <button onClick={() => removeBonusTier(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bonusTiers.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '0.75rem 0.5rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        Sin tramos configurados — nadie recibe recompensa extra todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={addBonusTier} style={{ background: 'none', border: '1.5px dashed #e0dbd0', borderRadius: '0.5rem', padding: '0.5rem 1rem', color: '#6b7280', cursor: 'pointer', fontSize: '0.8125rem' }}>
                + Agregar tramo
              </button>
              <button
                disabled={savingBonusTiers}
                onClick={saveBonusTiers}
                style={{ ...BTN_PRIMARY, opacity: savingBonusTiers ? 0.6 : 1 }}
              >
                {savingBonusTiers ? 'Guardando...' : 'Guardar recompensa'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Límite de revendedoras por ciudad ────────────────────────────── */}
        <Section title="📍 Límite de revendedoras por ciudad">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={cityResellerLimitEnabled} onChange={e => setCityResellerLimitEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>Limitar cantidad de revendedoras activas por ciudad</span>
            </label>
            {cityResellerLimitEnabled && (
              <div>
                <label style={LABEL}>Máximo de revendedoras activas por ciudad</label>
                <input value={cityResellerLimitCount} onChange={e => setCityResellerLimitCount(Number(e.target.value))} type="number" min="1" max="1000" style={{ ...INP, width: '160px' }} />
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Desactivado por defecto. Si lo activás, no se van a poder registrar (ni crear desde admin) nuevas revendedoras en una ciudad que ya alcanzó el máximo.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'city-limit'}
                onClick={() => doSave('city-limit', { cityResellerLimitEnabled, cityResellerLimitCount })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'city-limit' ? 0.6 : 1 }}
              >
                {saving === 'city-limit' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Ayuda ────────────────────────────────────────────────────────── */}
        <Section title="🆘 Ayuda">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={LABEL}>Link de la guía de ayuda</label>
              <input value={helpUrl} onChange={e => setHelpUrl(e.target.value)} style={INP} placeholder="https://... o https://wa.me/..." />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Se muestra como "¿Tenés dudas? Ver guía completa" en el panel de los revendedores.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={saving === 'help'}
                onClick={() => doSave('help', { helpUrl })}
                style={{ ...BTN_PRIMARY, opacity: saving === 'help' ? 0.6 : 1 }}
              >
                {saving === 'help' ? 'Guardando...' : 'Guardar'}
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

        {/* ── Legales adicionales ──────────────────────────────────────────── */}
        <Section title="⚖️ Legales (privacidad, cambios, arrepentimiento)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={LABEL}>Política de Privacidad (Markdown)</label>
              {config?.privacyPolicyUpdatedAt && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                  Última actualización: {new Date(config.privacyPolicyUpdatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              <textarea
                value={privacyPolicyContent}
                onChange={e => setPrivacyPolicyContent(e.target.value)}
                style={{ ...INP, minHeight: '160px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="# Política de Privacidad..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button disabled={saving === 'privacy'} onClick={() => doSave('privacy', { privacyPolicyContent })} style={{ ...BTN_PRIMARY, opacity: saving === 'privacy' ? 0.6 : 1 }}>
                  {saving === 'privacy' ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL}>Política de Cambios (Markdown)</label>
              {config?.changePolicyUpdatedAt && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                  Última actualización: {new Date(config.changePolicyUpdatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              <textarea
                value={changePolicyContent}
                onChange={e => setChangePolicyContent(e.target.value)}
                style={{ ...INP, minHeight: '160px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="# Política de Cambios..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button disabled={saving === 'changes'} onClick={() => doSave('changes', { changePolicyContent })} style={{ ...BTN_PRIMARY, opacity: saving === 'changes' ? 0.6 : 1 }}>
                  {saving === 'changes' ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL}>Derecho de Arrepentimiento (Markdown)</label>
              {config?.withdrawalRightUpdatedAt && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                  Última actualización: {new Date(config.withdrawalRightUpdatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              <textarea
                value={withdrawalRightContent}
                onChange={e => setWithdrawalRightContent(e.target.value)}
                style={{ ...INP, minHeight: '160px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="# Derecho de Arrepentimiento..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button disabled={saving === 'withdrawal'} onClick={() => doSave('withdrawal', { withdrawalRightContent })} style={{ ...BTN_PRIMARY, opacity: saving === 'withdrawal' ? 0.6 : 1 }}>
                  {saving === 'withdrawal' ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Historial de auditoría ──────────────────────────────────────── */}
        <AuditLogSection />

      </div>

      {/* Password confirmation modal */}
      {pendingPayload && pendingSection && (
        <ConfirmPasswordModal
          message="Para modificar CBU, alias o WhatsApp necesitás confirmar tu contraseña de administrador. Cualquier cambio queda registrado en el historial de auditoría."
          onConfirm={handlePasswordConfirm}
          onCancel={() => { setPendingPayload(null); setPendingSection(null) }}
        />
      )}
    </div>
  )
}
