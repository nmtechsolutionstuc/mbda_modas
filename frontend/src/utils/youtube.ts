const PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
]

/** Extrae el video ID de una URL de YouTube. Nunca se usa la URL cruda como src del iframe. */
export function extractYoutubeId(url: string): string | null {
  for (const pattern of PATTERNS) {
    const match = url.trim().match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}
