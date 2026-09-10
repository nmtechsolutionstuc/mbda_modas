import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { resellerRegister } from '../../api/auth'

const schema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  passwordConfirm: z.string().min(1, 'Confirmá tu contraseña'),
  whatsapp: z.string().min(8, 'Número inválido'),
  storeName: z.string().min(1, 'El nombre de tu tienda es requerido'),
  address: z.string().min(3, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  postalCode: z.string().min(3, 'El código postal es requerido'),
  acceptTerms: z.boolean().refine(v => v === true, 'Debés aceptar los Términos y Condiciones'),
}).refine(d => d.password === d.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    setServerError(null)
    try {
      const result = await resellerRegister({
        firstName: values.firstName,
        lastName: values.lastName,
        dni: values.dni,
        email: values.email,
        password: values.password,
        whatsapp: values.whatsapp,
        storeName: values.storeName,
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        acceptTerms: true,
      })
      setPendingMessage(result.message)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      if (status === 409) {
        setServerError('El email ya está registrado. ¿Querés ingresar?')
      } else if (message) {
        setServerError(message)
      } else {
        setServerError('Ocurrió un error. Intentá de nuevo.')
      }
    }
  }

  const inp: React.CSSProperties = {
    padding: '0.7rem 0.875rem',
    borderRadius: '0.625rem',
    border: '1.5px solid #e0dbd0',
    width: '100%',
    fontSize: '0.9375rem',
    color: '#111',
    background: '#fff',
    outline: 'none',
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem' }
  const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: 600, color: '#1e1914' }
  const errStyle: React.CSSProperties = { fontSize: '0.775rem', color: '#dc2626' }

  if (pendingMessage) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: '#f5f3ef' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '1.25rem', padding: '2.25rem 1.75rem', border: '1px solid #e0dbd0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🕒</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>
            Solicitud enviada
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>{pendingMessage}</p>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.875rem', border: 'none', background: '#111', color: '#f5f3ef', fontWeight: 600, cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: '#f5f3ef' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111', marginBottom: '0.375rem' }}>
            Creá tu cuenta gratis
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            Armá tu catálogo y empezá a vender
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.75rem', border: '1px solid #e0dbd0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Nombre y apellido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Nombre</label>
                <input {...register('firstName')} placeholder="Lucía" style={inp} />
                {errors.firstName && <span style={errStyle}>{errors.firstName.message}</span>}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Apellido</label>
                <input {...register('lastName')} placeholder="García" style={inp} />
                {errors.lastName && <span style={errStyle}>{errors.lastName.message}</span>}
              </div>
            </div>

            {/* DNI */}
            <div style={fieldStyle}>
              <label style={labelStyle}>DNI</label>
              <input {...register('dni')} placeholder="30123456" style={inp} />
              {errors.dni && <span style={errStyle}>{errors.dni.message}</span>}
            </div>

            {/* Email */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input {...register('email')} type="email" autoComplete="email" placeholder="lucia@gmail.com" style={inp} />
              {errors.email && <span style={errStyle}>{errors.email.message}</span>}
            </div>

            {/* WhatsApp */}
            <div style={fieldStyle}>
              <label style={labelStyle}>WhatsApp</label>
              <input {...register('whatsapp')} type="tel" placeholder="3812345678" style={inp} />
              {errors.whatsapp && <span style={errStyle}>{errors.whatsapp.message}</span>}
            </div>

            {/* Nombre de tienda */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Nombre de tu tienda</label>
              <input {...register('storeName')} placeholder="Lucía Moda" style={inp} />
              {errors.storeName && <span style={errStyle}>{errors.storeName.message}</span>}
            </div>

            {/* Dirección */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Dirección</label>
              <input {...register('address')} placeholder="Av. Siempre Viva 742" style={inp} />
              {errors.address && <span style={errStyle}>{errors.address.message}</span>}
            </div>

            {/* Ciudad y código postal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Ciudad</label>
                <input {...register('city')} placeholder="Concepción" style={inp} />
                {errors.city && <span style={errStyle}>{errors.city.message}</span>}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Código postal</label>
                <input {...register('postalCode')} placeholder="4111" style={inp} />
                {errors.postalCode && <span style={errStyle}>{errors.postalCode.message}</span>}
              </div>
            </div>

            {/* Contraseña */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Contraseña</label>
              <input {...register('password')} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" style={inp} />
              {errors.password && <span style={errStyle}>{errors.password.message}</span>}
            </div>

            {/* Confirmar contraseña */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input {...register('passwordConfirm')} type="password" autoComplete="new-password" placeholder="••••••••" style={inp} />
              {errors.passwordConfirm && <span style={errStyle}>{errors.passwordConfirm.message}</span>}
            </div>

            {/* T&C */}
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', padding: '0.875rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5' }}>
              <input
                {...register('acceptTerms')}
                type="checkbox"
                id="acceptTerms"
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#b8922a', cursor: 'pointer', flexShrink: 0 }}
              />
              <label htmlFor="acceptTerms" style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5, cursor: 'pointer' }}>
                Acepto los{' '}
                <Link to="/terminos" style={{ color: '#b8922a', fontWeight: 600, textDecoration: 'underline' }}>
                  Términos y Condiciones
                </Link>{' '}
                del programa de revendedores de MBDA Modas.
              </label>
            </div>
            {errors.acceptTerms && <span style={errStyle}>{errors.acceptTerms.message}</span>}

            {serverError && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
                {serverError}
                {serverError.includes('ingresar') && (
                  <>{' '}<Link to="/login" style={{ color: '#991b1b', fontWeight: 600, textDecoration: 'underline' }}>Ingresá acá</Link></>
                )}
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
              }}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#b8922a', fontWeight: 600, textDecoration: 'none' }}>
            Ingresá acá
          </Link>
        </p>
      </div>
    </div>
  )
}
