import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import {
  getConfig, updateConfig, uploadLandingImage, removeLandingImage, type Config,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, type Testimonial,
  getFaqItems, createFaqItem, updateFaqItem, deleteFaqItem, type FaqItem,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = { padding: '0.65rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function imageUrl(p: string) { return p.startsWith('http') ? p : `${API_BASE}${p}` }

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

  // Nosotros / manifiesto
  const [aboutText, setAboutText] = useState('')
  const [manifesto, setManifesto] = useState('')

  // Beneficios (4 ítems)
  const [benefits, setBenefits] = useState([
    { title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' },
  ])

  // Visibilidad de secciones
  const [showBenefits, setShowBenefits] = useState(true)
  const [showProcess, setShowProcess] = useState(true)
  const [showCollection, setShowCollection] = useState(true)
  const [showResellerStory, setShowResellerStory] = useState(true)
  const [showTestimonials, setShowTestimonials] = useState(true)
  const [showFaq, setShowFaq] = useState(true)

  // Testimonios y preguntas frecuentes (listas independientes, CRUD propio)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [savingRow, setSavingRow] = useState<string | null>(null)

  // Imagen del hero
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Media (video/imagen) — misma estructura que el spec de Drift
  const [heroVideo, setHeroVideo] = useState('')
  const [featuresImage, setFeaturesImage] = useState('')
  const [step1Video, setStep1Video] = useState('')
  const [step2Video, setStep2Video] = useState('')
  const [step3Video, setStep3Video] = useState('')

  useEffect(() => {
    Promise.all([getConfig(), getTestimonials(), getFaqItems()]).then(([c, t, f]) => {
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
      setAboutText(c.landingAboutText)
      setManifesto(c.landingManifesto)
      setHeroImage(c.landingHeroImage)
      setHeroVideo(c.landingHeroVideo ?? '')
      setFeaturesImage(c.landingFeaturesImage ?? '')
      setStep1Video(c.landingStep1Video ?? '')
      setStep2Video(c.landingStep2Video ?? '')
      setStep3Video(c.landingStep3Video ?? '')
      setBenefits([
        { title: c.landingBenefit1Title, desc: c.landingBenefit1Desc },
        { title: c.landingBenefit2Title, desc: c.landingBenefit2Desc },
        { title: c.landingBenefit3Title, desc: c.landingBenefit3Desc },
        { title: c.landingBenefit4Title, desc: c.landingBenefit4Desc },
      ])
      setShowBenefits(c.landingShowBenefits)
      setShowProcess(c.landingShowProcess)
      setShowCollection(c.landingShowCollection)
      setShowResellerStory(c.landingShowResellerStory)
      setShowTestimonials(c.landingShowTestimonials)
      setShowFaq(c.landingShowFaq)
      setTestimonials(t)
      setFaqs(f)
    }).catch(() => showToast('Error al cargar contenido', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function saveAbout() {
    setSaving('about')
    try {
      await updateConfig({ landingAboutText: aboutText, landingManifesto: manifesto } as Partial<Config>)
      showToast('Sección "Nosotros" guardada', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  async function saveMedia() {
    setSaving('media')
    try {
      await updateConfig({
        landingHeroVideo: heroVideo,
        landingFeaturesImage: featuresImage,
        landingStep1Video: step1Video,
        landingStep2Video: step2Video,
        landingStep3Video: step3Video,
      } as Partial<Config>)
      showToast('Video e imágenes guardados', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const updated = await uploadLandingImage(file)
      setHeroImage(updated.landingHeroImage)
      showToast('Imagen actualizada', 'success')
    } catch {
      showToast('Error al subir la imagen', 'error')
    }
    setUploadingImage(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleImageRemove() {
    if (!confirm('¿Quitar la imagen del hero? Vuelve al degradé por defecto.')) return
    setUploadingImage(true)
    try {
      const updated = await removeLandingImage()
      setHeroImage(updated.landingHeroImage)
      showToast('Imagen quitada', 'success')
    } catch {
      showToast('Error al quitar la imagen', 'error')
    }
    setUploadingImage(false)
  }

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

  async function saveBenefits() {
    setSaving('benefits')
    try {
      await updateConfig({
        landingBenefit1Title: benefits[0]!.title, landingBenefit1Desc: benefits[0]!.desc,
        landingBenefit2Title: benefits[1]!.title, landingBenefit2Desc: benefits[1]!.desc,
        landingBenefit3Title: benefits[2]!.title, landingBenefit3Desc: benefits[2]!.desc,
        landingBenefit4Title: benefits[3]!.title, landingBenefit4Desc: benefits[3]!.desc,
      } as Partial<Config>)
      showToast('Beneficios guardados', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  async function saveVisibility() {
    setSaving('visibility')
    try {
      await updateConfig({
        landingShowBenefits: showBenefits,
        landingShowProcess: showProcess,
        landingShowCollection: showCollection,
        landingShowResellerStory: showResellerStory,
        landingShowTestimonials: showTestimonials,
        landingShowFaq: showFaq,
      } as Partial<Config>)
      showToast('Visibilidad guardada', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSaving(null)
  }

  // ── Testimonios ─────────────────────────────────────────────
  async function addTestimonial() {
    const t = await createTestimonial({ quote: 'Nuevo testimonio...', name: 'Nombre', city: 'Ciudad', order: testimonials.length })
    setTestimonials(prev => [...prev, t])
  }
  async function saveTestimonialRow(t: Testimonial) {
    setSavingRow(t.id)
    try {
      const updated = await updateTestimonial(t.id, { quote: t.quote, name: t.name, city: t.city })
      setTestimonials(prev => prev.map(x => x.id === t.id ? updated : x))
      showToast('Testimonio guardado', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSavingRow(null)
  }
  async function removeTestimonial(id: string) {
    await deleteTestimonial(id)
    setTestimonials(prev => prev.filter(x => x.id !== id))
  }

  // ── Preguntas frecuentes ────────────────────────────────────
  async function addFaq() {
    const f = await createFaqItem({ question: 'Nueva pregunta...', answer: 'Respuesta...', order: faqs.length })
    setFaqs(prev => [...prev, f])
  }
  async function saveFaqRow(f: FaqItem) {
    setSavingRow(f.id)
    try {
      const updated = await updateFaqItem(f.id, { question: f.question, answer: f.answer })
      setFaqs(prev => prev.map(x => x.id === f.id ? updated : x))
      showToast('Pregunta guardada', 'success')
    } catch { showToast('Error al guardar', 'error') }
    setSavingRow(null)
  }
  async function removeFaq(id: string) {
    await deleteFaqItem(id)
    setFaqs(prev => prev.filter(x => x.id !== id))
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
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

        {/* ── Imagen del Hero ─────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>🖼️ Imagen del Hero</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ height: '160px', borderRadius: '0.75rem', overflow: 'hidden', background: heroImage ? undefined : 'linear-gradient(135deg, #C4693F 0%, #2B1B12 100%)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {heroImage
                ? <img src={imageUrl(heroImage)} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>Sin imagen — se muestra un degradé por defecto</span>
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploadingImage} style={{ fontSize: '0.875rem' }} />
              {heroImage && (
                <button onClick={handleImageRemove} disabled={uploadingImage} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}>
                  Quitar imagen
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              {uploadingImage ? 'Subiendo...' : 'Recomendado: foto vertical u horizontal de buena resolución, formato JPG, PNG o WebP.'}
            </p>
          </div>
        </div>

        {/* ── Video/imágenes de fondo ─────────────────────── */}
        <Section title="🎬 Video e imágenes de fondo" onSave={saveMedia} saving={saving === 'media'}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '-0.5rem' }}>
            Opcional. Si cargás un video de fondo del hero, reemplaza a la imagen de arriba. Pegá la URL de un archivo .mp4 alojado (por ejemplo en Cloudinary). Dejalo vacío para usar la imagen o el degradé por defecto.
          </p>
          <div>
            <label style={LABEL}>Video de fondo del hero (URL .mp4)</label>
            <input value={heroVideo} onChange={e => setHeroVideo(e.target.value)} style={INP} placeholder="https://..." />
          </div>
          <div>
            <label style={LABEL}>Imagen de fondo de "¿Cómo funciona?" (URL)</label>
            <input value={featuresImage} onChange={e => setFeaturesImage(e.target.value)} style={INP} placeholder="https://..." />
          </div>
          {[
            { label: 'Video del Paso 1 (URL .mp4)', value: step1Video, set: setStep1Video },
            { label: 'Video del Paso 2 (URL .mp4)', value: step2Video, set: setStep2Video },
            { label: 'Video del Paso 3 (URL .mp4)', value: step3Video, set: setStep3Video },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label style={LABEL}>{label}</label>
              <input value={value} onChange={e => set(e.target.value)} style={INP} placeholder="https://... (vacío = se muestra un ícono)" />
            </div>
          ))}
        </Section>

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

        {/* ── Nosotros / manifiesto ─────────────────────────── */}
        <Section title="💬 Sección Nosotros" onSave={saveAbout} saving={saving === 'about'}>
          <div>
            <label style={LABEL}>Párrafo de presentación</label>
            <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} style={{ ...INP, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={LABEL}>Frase destacada (manifiesto)</label>
            <textarea value={manifesto} onChange={e => setManifesto(e.target.value)} style={{ ...INP, minHeight: '80px', resize: 'vertical' }} placeholder="Creá tu emprendimiento de moda sin invertir un peso..." />
          </div>
        </Section>

        {/* ── Beneficios ────────────────────────────────────── */}
        <Section title="✨ Sección Beneficios" onSave={saveBenefits} saving={saving === 'benefits'}>
          {benefits.map((b, i) => (
            <div key={i} style={{ padding: '1rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b8922a', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Beneficio {i + 1}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={LABEL}>Título</label>
                  <input
                    value={b.title}
                    onChange={e => setBenefits(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                    style={INP}
                  />
                </div>
                <div>
                  <label style={LABEL}>Descripción</label>
                  <input
                    value={b.desc}
                    onChange={e => setBenefits(prev => prev.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))}
                    style={INP}
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* ── Testimonios ───────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>💬 Testimonios</h2>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>Cada fila se guarda por separado. Si no hay ninguno, la sección se oculta sola en la Home.</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {testimonials.map(t => (
              <div key={t.id} style={{ padding: '1rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <label style={LABEL}>Cita</label>
                  <textarea
                    value={t.quote}
                    onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, quote: e.target.value } : x))}
                    style={{ ...INP, minHeight: '56px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={LABEL}>Nombre</label>
                    <input value={t.name} onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} style={INP} />
                  </div>
                  <div>
                    <label style={LABEL}>Ciudad</label>
                    <input value={t.city} onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, city: e.target.value } : x))} style={INP} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => removeTestimonial(t.id)}
                    style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => saveTestimonialRow(t)}
                    disabled={savingRow === t.id}
                    style={{ padding: '0.45rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.8125rem' }}
                  >
                    {savingRow === t.id ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addTestimonial}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: '1.5px dashed #c9c2b3', background: 'transparent', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              + Agregar testimonio
            </button>
          </div>
        </div>

        {/* ── Preguntas frecuentes ──────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0dbd0', background: '#faf9f6' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>❓ Preguntas frecuentes</h2>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>Cada fila se guarda por separado. Si no hay ninguna, la sección se oculta sola en la Home.</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {faqs.map(f => (
              <div key={f.id} style={{ padding: '1rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <label style={LABEL}>Pregunta</label>
                  <input value={f.question} onChange={e => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, question: e.target.value } : x))} style={INP} />
                </div>
                <div>
                  <label style={LABEL}>Respuesta</label>
                  <textarea
                    value={f.answer}
                    onChange={e => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, answer: e.target.value } : x))}
                    style={{ ...INP, minHeight: '56px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => removeFaq(f.id)}
                    style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => saveFaqRow(f)}
                    disabled={savingRow === f.id}
                    style={{ padding: '0.45rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.8125rem' }}
                  >
                    {savingRow === f.id ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addFaq}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: '1.5px dashed #c9c2b3', background: 'transparent', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              + Agregar pregunta
            </button>
          </div>
        </div>

        {/* ── Visibilidad de secciones ──────────────────────── */}
        <Section title="👁️ Visibilidad de secciones" onSave={saveVisibility} saving={saving === 'visibility'}>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '-0.5rem' }}>
            Mostrar u ocultar cada sección de la Home. El Hero y el CTA final siempre se muestran.
          </p>
          {[
            { label: '✨ Beneficios', value: showBenefits, set: setShowBenefits },
            { label: '📖 Cómo funciona', value: showProcess, set: setShowProcess },
            { label: '🛍️ Colección', value: showCollection, set: setShowCollection },
            { label: '📣 Historia de revendedora', value: showResellerStory, set: setShowResellerStory },
            { label: '💬 Testimonios', value: showTestimonials, set: setShowTestimonials },
            { label: '❓ Preguntas frecuentes', value: showFaq, set: setShowFaq },
          ].map(({ label, value, set }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0', borderBottom: '1px solid #f0ede5', cursor: 'pointer', fontSize: '0.9rem', color: '#1e1914', fontWeight: 500 }}>
              <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} style={{ width: '1.05rem', height: '1.05rem' }} />
              {label}
            </label>
          ))}
        </Section>
      </div>
    </div>
  )
}
