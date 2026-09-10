import { useState, useEffect, useCallback, Fragment } from 'react'
import { Link } from 'react-router'
import axiosClient from '../../api/axiosClient'
import { useToast } from '../../context/ToastContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubAdmin {
  id: string
  name: string
  email: string
  role: 'SUBADMIN'
  isActive: boolean
  createdAt: string
}

// ── Formulario de creación ────────────────────────────────────────────────────

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'error')
      return
    }
    setLoading(true)
    try {
      await axiosClient.post('/admin/subadmins', form)
      showToast(`Subadmin ${form.name} creado`, 'success')
      setForm({ name: '', email: '', password: '' })
      onCreated()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error al crear', 'error')
    } finally {
      setLoading(false)
    }
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e0dbd0',
    borderRadius: '0.625rem', fontSize: '0.9375rem', background: '#fff', color: '#111',
    boxSizing: 'border-box',
  }
  const LBL: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem',
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#111', marginBottom: '1.25rem' }}>
        Crear nuevo subadmin
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={LBL}>Nombre completo</label>
          <input required value={form.name} onChange={set('name')} placeholder="Ej: María García" style={INP} />
        </div>
        <div>
          <label style={LBL}>Email</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="maria@mbdamodas.com" style={INP} />
        </div>
        <div>
          <label style={LBL}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              required
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Mínimo 8 caracteres"
              style={{ ...INP, paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem' }}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Creando...' : '+ Crear subadmin'}
      </button>
    </form>
  )
}

// ── Edición ───────────────────────────────────────────────────────────────────

function EditForm({ subadmin, onDone }: { subadmin: SubAdmin; onDone: () => void }) {
  const { showToast } = useToast()
  const [name, setName] = useState(subadmin.name)
  const [email, setEmail] = useState(subadmin.email)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e0dbd0',
    borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fff', color: '#111',
    boxSizing: 'border-box',
  }

  async function save() {
    setSaving(true)
    try {
      await axiosClient.patch(`/admin/subadmins/${subadmin.id}`, {
        ...(name !== subadmin.name && { name }),
        ...(email !== subadmin.email && { email }),
        ...(password && { password }),
      })
      showToast('Subadmin actualizado', 'success')
      onDone()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr style={{ background: '#faf9f6' }}>
      <td colSpan={5} style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" style={INP} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={INP} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva contraseña (opcional)" type="password" style={INP} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={save} disabled={saving} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#111', color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onDone} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function AdminSubAdminsPage() {
  const { showToast } = useToast()
  const [subadmins, setSubadmins] = useState<SubAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get<{ success: true; data: SubAdmin[] }>('/admin/subadmins')
      setSubadmins(data.data)
    } catch {
      showToast('Error al cargar subadmins', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  async function handleToggle(sa: SubAdmin) {
    if (!confirm(`¿${sa.isActive ? 'Desactivar' : 'Activar'} a ${sa.name}?`)) return
    setTogglingId(sa.id)
    try {
      await axiosClient.patch(`/admin/subadmins/${sa.id}/toggle`)
      showToast(`${sa.name} ${sa.isActive ? 'desactivado' : 'activado'}`, 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message ?? 'Error', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(sa: SubAdmin) {
    if (!confirm(`¿Eliminar a ${sa.name} definitivamente? Esta acción no se puede deshacer.`)) return
    setDeletingId(sa.id)
    try {
      await axiosClient.delete(`/admin/subadmins/${sa.id}`)
      showToast(`${sa.name} eliminado`, 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.error?.message ?? 'Error al eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <Link to="/admin" style={{ color: '#b8922a', textDecoration: 'none' }}>Admin</Link> / Subadmins
        </p>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Gestión de Subadmins
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Los subadmins pueden crear, editar y eliminar productos, pero no tienen acceso a pedidos, revendedores ni configuración.
          </p>
        </div>

        {/* Formulario */}
        <CreateForm onCreated={load} />

        {/* Lista */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e0dbd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>
              Subadmins registrados
            </h2>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{subadmins.length} usuario{subadmins.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
          ) : subadmins.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔑</p>
              <p style={{ fontWeight: 600, color: '#111' }}>Todavía no creaste subadmins</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Completá el formulario de arriba para agregar uno.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0dbd0', background: '#faf9f7' }}>
                  {['Nombre', 'Email', 'Estado', 'Creado', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subadmins.map(sa => (
                  <Fragment key={sa.id}>
                    <tr style={{ borderBottom: '1px solid #f5f3ef' }}>
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f5f3ef', border: '1px solid #e0dbd0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#b8922a', flexShrink: 0 }}>
                            {sa.name.charAt(0).toUpperCase()}
                          </span>
                          {sa.name}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: '#6b7280' }}>{sa.email}</td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                          background: sa.isActive ? '#10b98120' : '#ef444420',
                          color: sa.isActive ? '#10b981' : '#ef4444',
                          border: `1px solid ${sa.isActive ? '#10b98140' : '#ef444440'}`,
                        }}>
                          {sa.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: '#6b7280', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {new Date(sa.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setEditingId(editingId === sa.id ? null : sa.id)}
                            style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #e0dbd0', background: 'transparent', color: '#111' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(sa)}
                            disabled={togglingId === sa.id}
                            style={{
                              padding: '0.375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${sa.isActive ? '#ef4444' : '#10b981'}`,
                              background: 'transparent',
                              color: sa.isActive ? '#ef4444' : '#10b981',
                            }}
                          >
                            {togglingId === sa.id ? '...' : sa.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => handleDelete(sa)}
                            disabled={deletingId === sa.id}
                            style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444' }}
                          >
                            {deletingId === sa.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === sa.id && (
                      <EditForm subadmin={sa} onDone={() => { setEditingId(null); load() }} />
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
