// Tokens compartidos por todos los componentes de la tienda pública nueva
// (frontend/src/components/store/*). Cada tienda elige su propia paleta +
// tipografía (Mi cuenta → Estilo de tienda); estas constantes apuntan a
// variables CSS fijadas una sola vez en el nodo raíz de <StorePage>, así que
// todo lo que las use hereda el tema sin prop drilling.

export const C = {
  page:        'var(--c-page)',
  surface:     'var(--c-surface)',
  bannerFrom:  'var(--c-bannerFrom)',
  bannerTo:    'var(--c-bannerTo)',
  soft:        'var(--c-soft)',
  softAlt:     'var(--c-softAlt)',
  line:        'var(--c-line)',
  ink:         'var(--c-ink)',
  inkSoft:     'var(--c-inkSoft)',
  muted:       'var(--c-muted)',
  accent:      'var(--c-accent)',
  accentDark:  'var(--c-accentDark)',
} as const

export const F = {
  display: 'var(--f-display)',
  body:    'var(--f-body)',
} as const

export const SHADOW = {
  sm: '0 1px 3px rgba(0,0,0,0.07)',
  md: '0 8px 24px rgba(0,0,0,0.10)',
  lg: '0 24px 60px rgba(0,0,0,0.18)',
} as const

export const STROKE = 1.5

// Para texto/íconos "acento" sobre fondos oscuros propios (no los del tema).
// El tema Minimal define accent = ink (#111111, monocromo a propósito), así
// que un texto en C.accent sobre un fondo oscuro se vuelve invisible en ese
// tema puntual. Mezclarlo con blanco garantiza contraste en los 5 temas sin
// perder el tinte de marca en los otros cuatro.
export const ACCENT_ON_DARK = 'color-mix(in srgb, var(--c-accent) 55%, white 45%)'

export function fmt(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}
