import { useEffect, useRef, useState } from 'react'

/**
 * Revela un elemento (clase `is-visible`) la primera vez que entra en viewport.
 * CSS puro (ver `.reveal-on-scroll` / `.reveal-on-scroll-x` en index.css) — evita
 * depender de una librería de animación por JS para un efecto de scroll simple.
 */
export function useRevealOnScroll<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }),
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}
