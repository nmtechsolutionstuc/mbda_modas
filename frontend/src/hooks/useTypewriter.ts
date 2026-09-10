import { useEffect, useState } from 'react'

/** Revela "text" caracter a caracter mientras "active" es true (pensado para
 * dispararse con un reveal-on-scroll, no con un timer de carga de página). */
export function useTypewriter(text: string, active: boolean, speed = 35) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!active) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, active, speed])

  return { displayed, done: displayed.length === text.length }
}
