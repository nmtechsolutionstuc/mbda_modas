import { useEffect, useRef, useState } from 'react'

/** Como useRevealOnScroll, pero no se desconecta al entrar: vuelve a "false" si
 * el elemento sale de vista scrolleando hacia arriba, para efectos que deben
 * poder deshacerse (ej. una línea que se dibuja y se desdibuja). */
export function useBidirectionalReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => setVisible(e.isIntersecting)),
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}
