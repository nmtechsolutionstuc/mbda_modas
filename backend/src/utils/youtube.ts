/**
 * Valida una URL de YouTube y extrae el video ID — nunca se guarda ni se usa
 * la URL cruda para armar el embed: si aceptáramos cualquier string en el
 * src de un <iframe> en la tienda pública, alguien con acceso al panel admin
 * (o un subadmin) podría apuntar a un sitio arbitrario. Se valida server-side
 * y el frontend arma el embed solo a partir del ID ya validado.
 */
const YOUTUBE_ID_RE = /^[\w-]{11}$/

const PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
]

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim()
  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1] && YOUTUBE_ID_RE.test(match[1])) return match[1]
  }
  return null
}

export function validateYoutubeUrl(url: string): { valid: boolean; error?: string } {
  if (!extractYoutubeId(url)) {
    return { valid: false, error: 'Tiene que ser un link válido de YouTube (youtube.com/watch?v=... o youtu.be/...)' }
  }
  return { valid: true }
}
