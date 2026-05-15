import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getConfig, updateConfig, type Config } from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = { padding: '0.65rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

function Section({ title, onSave, saving, children }: { title: string; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.8125rem' }}
        >
          {saving ? 'Guardando...' : 'Guardar sección'}
        </button>
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>{children}</div>
    </div>
  )
}

export function AdminLandingPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Hero fields
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroDesc, setHeroDesc] = useState('')
  const [cta1Text, setCta1Text] = useState('')
  const [cta2Text, setCta2Text] = useState('')

  // How it works
  const [howTitle, setHowTitle] = useState('')
  const [step1Title, setStep1Title] = useState('')
  const [step1Desc, setStep1Desc] = useState('')
  const [step2Title, setStep2Title] = useState('')
  const [step2Desc, setStep2Desc] = useState('')
  const [step3Title, setStep3Title] = useState('')
  const [step3Desc, setStep3Desc] = useState('')

  useEffect(() => {
    getConfig().then(c => {
      setHeroTitle(c.landingHeroTitle)
      setHeroSubtitle(c.landingHeroSubtitle)
      setHeroDesc(c.landingHeroDesc)
      setCta1Text(c.landingCta1Text)
      setCta2Text(c.landingCta2Text)
      setHowTitle(c.landingHowTitle)
      setStep1Title(c.landingStep1Title)
      setStep1Desc(c.landingStep1Desc)
      setStep2Title(c.landingStep2Title)
      setStep2Desc(c.landingStep2Desc)
      setStep3Title(c.landingStep3Title)
      setStep3Desc(c.landingStep3Desc)
    }).catch(() => showToast('Error al cargar contenido', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function saveHero() {
    setSaving('hero')
    try {
      await updateConfig({
        landingHeroTitle: heroTitle,
        landingHeroSubtitle: heroSubtitle,
        landingHeroDesc: heroDesc,
        landingCta1Text: cta1Text,
        landingCta2Text: cta2Text,
      } as Partial<Config>)
      showToast('Hero guardado', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  async function saveSteps() {
    setSaving('steps')
    try {
      await updateConfig({
        landingHowTitle: howTitle,
        landingStep1Title: step1Title, landingStep1Desc: step1Desc,
        landingStep2Title: step2Title, landingStep2Desc: step2Desc,
        landingStep3Title: step3Title, landingStep3Desc: step3Desc,
      } as Partial<Config>)
      showToast('Pasos guardados', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  if (loading) return <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Cargando...</div>

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/admin" style={{ color: '#b8922a' }}>Admin</Link> › Landing Page
        </p>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>
            Editor de Landing Page
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Los cambios se reflejan en la página de inicio del sistema.{' '}
            <Link to="/" target="_blank" style={{ color: '#b8922a', fontWeight: 600 }}>Ver página →</Link>
          </p>
        </div>

        {/* ── Hero ────────────────────────────────────────── */}
        <Section title="🦸 Sección Hero" onSave={saveHero} saving={saving === 'hero'}>
          <div>
            <label style={LABEL}>Título principal</label>
            <input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} style={INP} placeholder="Tu tienda, tus precios" />
          </div>
          <div>
            <label style={LABEL}>Subtítulo</label>
            <input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} style={INP} placeholder="Armá tu catálogo gratis" />
          </div>
          <div>
            <label style={LABEL}>Descripción</label>
            <textarea value={heroDesc} onChange={e => setHeroDesc(e.target.value)} style={{ ...INP, minHeight: '72px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={LABEL}>Texto botón principal</label>
              <input value={cta1Text} onChange={e => setCta1Text(e.target.value)} style={INP} placeholder="Quiero ser revendedor" />
            </div>
            <div>
              <label style={LABEL}>Texto botón secundario</label>
              <input value={cta2Text} onChange={e => setCta2Text(e.target.value)} style={INP} placeholder="Ya tengo cuenta" />
            </div>
          </div>
        </Section>

        {/* ── Cómo funciona ────────────────────────────────── */}
        <Section title="📖 Sección ¿Cómo funciona?" onSave={saveSteps} saving={saving === 'steps'}>
          <div>
            <label style={LABEL}>Título de la sección</label>
            <input value={howTitle} onChange={e => setHowTitle(e.target.value)} style={INP} placeholder="¿Cómo funciona?" />
          </div>
          {[
            { step: 1, title: step1Title, setTitle: setStep1Title, desc: step1Desc, setDesc: setStep1Desc },
            { step: 2, title: step2Title, setTitle: setStep2Title, desc: step2Desc, setDesc: setStep2Desc },
            { step: 3, title: step3Title, setTitle: setStep3Title, desc: step3Desc, setDesc: setStep3Desc },
          ].map(({ step, title, setTitle, desc, setDesc }) => (
            <div key={step} style={{ padding: '1rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b8922a', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Paso {step}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={LABEL}>Título</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={INP} />
                </div>
                <div>
                  <label style={LABEL}>Descripción</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} style={INP} />
                </div>
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}
