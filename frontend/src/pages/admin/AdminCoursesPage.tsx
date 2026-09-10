import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  getCourseVideos, createCourseVideo, updateCourseVideo, deleteCourseVideo, type CourseVideo,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const INP: React.CSSProperties = { padding: '0.65rem 0.875rem', borderRadius: '0.625rem', border: '1.5px solid #e0dbd0', width: '100%', fontSize: '0.9375rem', background: '#fff', outline: 'none', color: '#111', boxSizing: 'border-box' }
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1e1914', marginBottom: '0.25rem' }

function VideoRow({ video, onSave, onRemove }: {
  video: CourseVideo
  onSave: (v: CourseVideo) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [title, setTitle] = useState(video.title)
  const [youtubeUrl, setYoutubeUrl] = useState(video.youtubeUrl)
  const [description, setDescription] = useState(video.description ?? '')
  const [isActive, setIsActive] = useState(video.isActive)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave({ ...video, title, youtubeUrl, description, isActive })
    setSaving(false)
  }

  return (
    <div style={{ padding: '1rem', background: '#faf9f6', borderRadius: '0.75rem', border: '1px solid #e8e3d5', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div>
        <label style={LABEL}>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={INP} />
      </div>
      <div>
        <label style={LABEL}>Link de YouTube</label>
        <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={INP} placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <div>
        <label style={LABEL}>Descripción (opcional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...INP, minHeight: '56px', resize: 'vertical' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#374151', cursor: 'pointer' }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
        Visible para las revendedoras
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onRemove(video.id)}
          style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid #e0dbd0', background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
        >
          Eliminar
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{ padding: '0.45rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: '#111', color: '#f5f3ef', fontWeight: 600, fontSize: '0.8125rem' }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

const DRAFT_PREFIX = 'draft-'

export function AdminCoursesPage() {
  const { showToast } = useToast()
  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCourseVideos().then(setVideos).catch(() => showToast('Error al cargar los cursos', 'error')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "+ Agregar video" solo crea una fila local para completar los datos — el
  // link de YouTube es obligatorio y válido en el backend, así que no hay
  // forma de crearla vacía de una: se guarda recién cuando ella toca "Guardar".
  function addVideo() {
    setVideos(prev => [...prev, {
      id: `${DRAFT_PREFIX}${Date.now()}`, title: '', youtubeUrl: '', description: '', order: prev.length, isActive: true,
    }])
  }

  async function saveVideo(v: CourseVideo) {
    const isDraft = v.id.startsWith(DRAFT_PREFIX)
    try {
      if (isDraft) {
        const created = await createCourseVideo({ title: v.title, youtubeUrl: v.youtubeUrl, description: v.description ?? undefined, order: v.order })
        setVideos(prev => prev.map(x => x.id === v.id ? created : x))
      } else {
        const updated = await updateCourseVideo(v.id, { title: v.title, youtubeUrl: v.youtubeUrl, description: v.description ?? undefined, isActive: v.isActive })
        setVideos(prev => prev.map(x => x.id === v.id ? updated : x))
      }
      showToast('Video guardado', 'success')
    } catch (e: any) {
      showToast(e?.response?.data?.error?.message ?? 'Error al guardar', 'error')
    }
  }

  async function removeVideo(id: string) {
    if (id.startsWith(DRAFT_PREFIX)) { setVideos(prev => prev.filter(x => x.id !== id)); return }
    try {
      await deleteCourseVideo(id)
      setVideos(prev => prev.filter(x => x.id !== id))
    } catch {
      showToast('Error al eliminar', 'error')
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/admin" style={{ color: '#b8922a' }}>Admin</Link> › Cursos
        </p>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>Cursos para revendedoras</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Videos de YouTube que ven las revendedoras en su panel, en "Cursos".
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
          {videos.map(v => (
            <VideoRow key={v.id} video={v} onSave={saveVideo} onRemove={removeVideo} />
          ))}
        </div>

        <button
          onClick={addVideo}
          style={{ padding: '0.65rem 1.25rem', borderRadius: '0.625rem', border: '1.5px dashed #c9c2b3', background: 'transparent', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          + Agregar video
        </button>
      </div>
    </div>
  )
}
