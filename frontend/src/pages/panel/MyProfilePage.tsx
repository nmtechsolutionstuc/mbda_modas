import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../context/ToastContext'
import { isReseller } from '../../types'
import { updateProfile } from '../../api/reseller'

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

  const [storeName, setStoreName] = useState(reseller?.storeName ?? '')
  const [whatsapp, setWhatsapp]   = useState(reseller?.whatsapp ?? '')
  const [cbu, setCbu]             = useState(reseller?.cbu ?? '')
  const [alias, setAlias]         = useState(reseller?.alias ?? '')
  const [saving, setSaving]       = useState(false)

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
      if (storeName !== reseller?.storeName) fd.append('storeName', storeName)
      if (whatsapp !== reseller?.whatsapp)   fd.append('whatsapp', whatsapp)
      if (cbu !== (reseller?.cbu ?? ''))     fd.append('cbu', cbu)
      if (alias !== (reseller?.alias ?? '')) fd.append('alias', alias)
      if (photoFile) fd.append('storePhoto', photoFile)

      const updated = await updateProfile(fd)

      // Actualizar store
      if (user && isReseller(user)) {
        setUser({
          ...user,
          storeName: updated.storeName,
          whatsapp: updated.whatsapp,
          storePhoto: updated.storePhoto,
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
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
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
              <ReadOnly label="Email" value={reseller.email} />

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
                      navigator.clipboard.writeText(`${window.location.origin}/catalogo?ref=${reseller.referralCode}`)
                        .then(() => showToast('Link copiado al portapapeles', 'success'))
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
