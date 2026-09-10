import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { resellerLogin, adminLogin } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)
  // Cada modo llama a un solo endpoint. Antes se probaba revendedor y, si
  // fallaba, admin — dos intentos de login por click, que consumían el doble
  // del límite de intentos (8 cada 15 min) compartido entre ambos endpoints.
  // Con esto un error de tipeo gasta un solo intento.
  const [mode, setMode] = useState<'reseller' | 'admin'>('reseller')

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    setServerError(null)
    try {
      const result = mode === 'reseller'
        ? await resellerLogin(values.email, values.password)
        : await adminLogin(values.email, values.password)
      setAuth(result.user, result.accessToken)
      navigate(mode === 'reseller' ? '/panel' : '/admin', { replace: true })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status

      if (status === 403) {
        setServerError('Tu cuenta fue desactivada. Contactá al administrador.')
        return
      }
      if (status === 401) {
        setServerError('Email o contraseña incorrectos')
        return
      }
      if (status === 429) {
        setServerError('Demasiados intentos. Esperá unos minutos e intentá de nuevo.')
        return
      }
      setServerError('Ocurrió un error. Intentá de nuevo.')
    }
  }

  const inp: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1.5px solid #e0dbd0',
    width: '100%',
    fontSize: '1rem',
    color: '#111',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: '#f5f3ef' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem' }}>
            Bienvenido
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            {mode === 'reseller' ? 'Ingresá a tu cuenta de revendedora' : 'Ingresá con tu cuenta de MBDA'}
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '2rem', border: '1px solid #e0dbd0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.375rem' }}>
                Email
              </label>
              <input {...register('email')} type="email" autoComplete="email" placeholder="tu@email.com" style={inp} />
              {errors.email && <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.375rem' }}>
                Contraseña
              </label>
              <input {...register('password')} type="password" autoComplete="current-password" placeholder="••••••••" style={inp} />
              {errors.password && <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.password.message}</p>}
            </div>

            {serverError && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? '#555' : '#111',
                color: '#f5f3ef',
                padding: '0.875rem',
                borderRadius: '0.875rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '0.25rem',
                transition: 'background 0.15s',
              }}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {mode === 'reseller' ? (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" style={{ color: '#b8922a', fontWeight: 600, textDecoration: 'none' }}>
              Registrate gratis
            </Link>
          </p>
        ) : null}

        <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
          {mode === 'reseller' ? (
            <button type="button" onClick={() => { setMode('admin'); setServerError(null) }} style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>
              ¿Sos del equipo MBDA? Ingresá acá
            </button>
          ) : (
            <button type="button" onClick={() => { setMode('reseller'); setServerError(null) }} style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>
              ¿Sos revendedora? Ingresá acá
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
