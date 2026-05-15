import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    setServerError(null)
    try {
      // Intentar login como revendedor primero
      const result = await resellerLogin(values.email, values.password)
      setAuth(result.user, result.accessToken)
      navigate('/panel', { replace: true })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status

      if (status === 403) {
        setServerError('Tu cuenta fue desactivada. Contactá al administrador.')
        return
      }

      if (status === 401) {
        // Si falló como revendedor, intentar como admin
        try {
          const result = await adminLogin(values.email, values.password)
          setAuth(result.user, result.accessToken)
          navigate('/admin', { replace: true })
          return
        } catch {
          // Falló como admin también
        }
        setServerError('Email o contraseña incorrectos')
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
            Ingresá a tu cuenta de revendedor
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

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" style={{ color: '#b8922a', fontWeight: 600, textDecoration: 'none' }}>
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
