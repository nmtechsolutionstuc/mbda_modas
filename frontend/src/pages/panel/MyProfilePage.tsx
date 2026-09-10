import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../context/ToastContext'
import { isReseller, type StoreTheme } from '../../types'
import { updateProfile } from '../../api/reseller'
import { STORE_THEMES, STORE_THEME_ORDER } from '../../theme/storeThemes'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

function photoUrl(p: string) {
  return p.startsWith('http') ? p : `${API_BASE}${p}`
}

const INP: React.CSSProperties = {
  padding: '0.65rem 0.875rem',
  borderRadius: '0.625rem',
  border: '1.5px solid #e0dbd0',
  width: '100%',
  fontSize: '0.9375rem',
  background: '#fff',
  outline: 'none',
  color: '#111',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#1e1914',
  marginBottom: '0.25rem',
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ ...INP, background: '#f5f3ef', color: '#6b7280', cursor: 'default' }}>{value}</div>
    </div>
  )
}

export function MyProfilePage() {
  const { user, setUser } = useAuthStore()
  const { showToast } = useToast()

  const reseller = user && isReseller(user) ? user : null

  const [storeName, setStoreName]   = useState(reseller?.storeName ?? '')
  const [storeBio, setStoreBio]     = useState(reseller?.storeBio ?? '')
  const [whatsapp, setWhatsapp]     = useState(reseller?.whatsapp ?? '')
  const [cbu, setCbu]               = useState(reseller?.cbu ?? '')
  const [alias, setAlias]           = useState(reseller?.alias ?? '')
  const [address, setAddress]       = useState(reseller?.address ?? '')
  const [city, setCity]             = useState(reseller?.city ?? '')
  const [postalCode, setPostalCode] = useState(reseller?.postalCode ?? '')
  const [storeTheme, setStoreTheme] = useState<StoreTheme>(reseller?.storeTheme ?? 'ELEGANTE')
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'SHIPPING'>(reseller?.deliveryMethod ?? 'SHIPPING')
  const [saving, setSaving]         = useState(false)

  const normalizedCity = city.trim().toLowerCase()
  const isConcepcion = normalizedCity === 'concepción' || normalizedCity === 'concepcion'

  // Foto
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!storeName.trim()) {
      showToast('El nombre de la tienda es obligatorio', 'error')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      if (storeName !== reseller?.storeName)     fd.append('storeName', storeName)
      if (storeBio !== (reseller?.storeBio ?? '')) fd.append('storeBio', storeBio)
      if (whatsapp !== reseller?.whatsapp)       fd.append('whatsapp', whatsapp)
      if (cbu !== (reseller?.cbu ?? ''))         fd.append('cbu', cbu)
      if (alias !== (reseller?.alias ?? ''))     fd.append('alias', alias)
      if (address !== (reseller?.address ?? '')) fd.append('address', address)
      if (city !== (reseller?.city ?? ''))       fd.append('city', city)
      if (postalCode !== (reseller?.postalCode ?? '')) fd.append('postalCode', postalCode)
      if (storeTheme !== reseller?.storeTheme) fd.append('storeTheme', storeTheme)
      if (deliveryMethod !== reseller?.deliveryMethod) fd.append('deliveryMethod', deliveryMethod)
      if (photoFile) fd.append('storePhoto', photoFile)

      const updated = await updateProfile(fd)

      // Actualizar store
      if (user && isReseller(user)) {
        setUser({
          ...user,
          storeName: updated.storeName,
          storeBio: updated.storeBio,
          whatsapp: updated.whatsapp,
          storePhoto: updated.storePhoto,
          address: updated.address,
          city: updated.city,
          postalCode: updated.postalCode,
          deliveryMethod: updated.deliveryMethod,
          storeTheme: updated.storeTheme,
        })
      }

      setPhotoFile(null)
      showToast('Perfil actualizado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  const currentPhoto = photoPreview ?? (reseller?.storePhoto ? photoUrl(reseller.storePhoto) : null)

  if (!reseller) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/panel" style={{ color: '#b8922a' }}>Panel</Link> › Mi Perfil
        </p>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '1.75rem' }}>
          Mi Perfil
        </h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Foto de tienda ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Foto de tienda
              </h2>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f5f3ef', border: '2px solid #e0dbd0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {currentPhoto
                  ? <img src={currentPhoto} alt="Foto tienda" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem' }}>🏪</span>
                }
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{ padding: '0.5rem 1.125rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#111' }}
                >
                  {currentPhoto ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.375rem' }}>
                  JPG, PNG o WebP · Máx. 8 MB
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          {/* ── Estilo de tienda ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Estilo de tienda
              </h2>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem' }}>
                Elegí la paleta de colores y la tipografía de tu tienda pública.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {STORE_THEME_ORDER.map(key => {
                  const t = STORE_THEMES[key]
                  const active = storeTheme === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStoreTheme(key)}
                      style={{
                        textAlign: 'left', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer',
                        border: active ? `2px solid ${t.colors.accent}` : '1.5px solid #e0dbd0',
                        background: active ? t.colors.soft : '#fff',
                      }}
                    >
                      <div style={{
                        height: '2.25rem', borderRadius: '0.5rem', marginBottom: '0.625rem',
                        background: `linear-gradient(100deg, ${t.colors.bannerFrom} 0%, ${t.colors.bannerTo} 100%)`,
                        border: `1px solid ${t.colors.line}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 0.5rem',
                      }}>
                        <span style={{ width: '1rem', height: '1rem', borderRadius: '99px', background: t.colors.accent }} />
                      </div>
                      <p style={{ fontFamily: t.fonts.display, fontSize: '1.0625rem', color: t.colors.ink, margin: '0 0 0.15rem' }}>Aa</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', margin: 0 }}>{t.label}</p>
                      <p style={{ fontSize: '0.6875rem', color: '#9ca3af', margin: '0.15rem 0 0' }}>{t.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Datos de la tienda ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Datos de la tienda
              </h2>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={LABEL}>Nombre de la tienda *</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} style={INP} required />
              </div>
              <div>
                <label style={LABEL}>Frase de tu tienda</label>
                <textarea
                  value={storeBio}
                  onChange={e => setStoreBio(e.target.value.slice(0, 200))}
                  style={{ ...INP, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Ej: Moda que te acompaña todos los días."
                  maxLength={200}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Se muestra debajo del nombre en tu tienda pública. {storeBio.length}/200
                </p>
              </div>
              <div>
                <label style={LABEL}>WhatsApp (con código de país)</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={INP} placeholder="5493812345678" />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Formato: 549 + número</p>
              </div>
            </div>
          </div>

          {/* ── Datos de cobro ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                💳 Datos de cobro
              </h2>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                MBDA transferirá tus comisiones a estos datos.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={LABEL}>CBU</label>
                  <input value={cbu} onChange={e => setCbu(e.target.value)} style={INP} placeholder="22 dígitos" maxLength={22} />
                </div>
                <div>
                  <label style={LABEL}>Alias</label>
                  <input value={alias} onChange={e => setAlias(e.target.value)} style={INP} placeholder="mi.alias.mp" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Dirección para despacho ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                📍 Dirección
              </h2>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Se usa para despachar tus pedidos si no sos de Concepción.
              </p>
              <div>
                <label style={LABEL}>Dirección</label>
                <input value={address} onChange={e => setAddress(e.target.value)} style={INP} placeholder="Av. Siempre Viva 742" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={LABEL}>Ciudad</label>
                  <input value={city} onChange={e => setCity(e.target.value)} style={INP} placeholder="Concepción" />
                </div>
                <div>
                  <label style={LABEL}>Código postal</label>
                  <input value={postalCode} onChange={e => setPostalCode(e.target.value)} style={INP} placeholder="4111" />
                </div>
              </div>

              {isConcepcion ? (
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                  Al ser de Concepción, siempre retirás los pedidos confirmados en el local.
                </p>
              ) : (
                <div>
                  <label style={LABEL}>¿Cómo preferís recibir tus pedidos?</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {([
                      { key: 'SHIPPING', label: 'Que me lo envíen' },
                      { key: 'PICKUP', label: 'Prefiero retirarlo yo' },
                    ] as { key: 'PICKUP' | 'SHIPPING'; label: string }[]).map(o => (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setDeliveryMethod(o.key)}
                        style={{
                          flex: 1, padding: '0.55rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                          border: deliveryMethod === o.key ? '2px solid var(--c-accent)' : '1.5px solid #e0dbd0',
                          background: deliveryMethod === o.key ? '#faf5eb' : '#fff', color: deliveryMethod === o.key ? 'var(--c-accent)' : '#6b7280',
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Datos de cuenta (solo lectura) ── */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Cuenta
              </h2>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <ReadOnly label="Nombre" value={reseller.firstName} />
                <ReadOnly label="Apellido" value={reseller.lastName} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <ReadOnly label="Email" value={reseller.email} />
                <ReadOnly label="DNI" value={reseller.dni ?? '—'} />
              </div>

              {/* Código de referido destacado */}
              <div>
                <label style={LABEL}>Tu código de revendedor</label>
                <div style={{ ...INP, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#b8922a', fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                    {reseller.referralCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/tienda/${reseller.storeSlug}`)
                        .then(() => showToast('Link de tu tienda copiado', 'success'))
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #e0dbd0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#111' }}
                  >
                    Copiar link
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '0.7rem 2rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
