import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getMyCourses, type CourseVideo } from '../../api/reseller'
import { extractYoutubeId } from '../../utils/youtube'
import { useToast } from '../../context/ToastContext'

function VideoCard({ video }: { video: CourseVideo }) {
  const youtubeId = extractYoutubeId(video.youtubeUrl)
  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e0dbd0', overflow: 'hidden' }}>
      {youtubeId && (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}
      <div style={{ padding: '1rem 1.25rem' }}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', marginBottom: video.description ? '0.375rem' : 0 }}>{video.title}</p>
        {video.description && <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5 }}>{video.description}</p>}
      </div>
    </div>
  )
}

export function CoursesPage() {
  const { showToast } = useToast()
  const [videos, setVideos] = useState<CourseVideo[] | null>(null)

  useEffect(() => {
    getMyCourses().then(setVideos).catch(() => showToast('Error al cargar los cursos', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          <Link to="/panel" style={{ color: 'var(--c-accent)' }}>Panel</Link> › Cursos
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: '1.875rem', fontWeight: 700, color: '#111' }}>Cursos</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Videos para aprender a sacarle más provecho a tu tienda.
          </p>
        </div>

        {videos === null ? (
          <p style={{ color: '#6b7280' }}>Cargando...</p>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
            <p style={{ fontWeight: 600, color: '#111', marginBottom: '0.5rem' }}>Todavía no hay cursos cargados</p>
            <p style={{ fontSize: '0.9rem' }}>Pronto vas a encontrar acá videos con consejos para vender más.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </div>
    </div>
  )
}
