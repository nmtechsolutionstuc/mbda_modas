import { C, SHADOW, ACCENT_ON_DARK } from './tokens'

// Hovers/transiciones reales (":hover" no se puede inline) — el detalle que
// separa un mockup estático de algo vivo. Prefijo "store-" para no chocar con
// ninguna clase global del resto del sitio.
export function StoreGlobalStyles() {
  return (
    <style>{`
      .store-link:hover { color: ${C.accent} !important; }
      .store-link { position: relative; transition: color 0.2s ease; }
      /* Variante para links sobre fondos oscuros propios: el acento del tema  */
      /* puede coincidir con el fondo (tema Minimal), así que el hover usa el  */
      /* mismo tono garantizado-visible que el color de reposo, no el acento crudo. */
      .store-link-dark:hover { color: ${ACCENT_ON_DARK} !important; }
      .store-link::after {
        content: ''; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px;
        background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease;
      }
      .store-link:hover::after { transform: scaleX(1); }

      .store-btn { transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease; }
      .store-btn:hover { transform: translateY(-1px); box-shadow: ${SHADOW.md}; }
      .store-btn:active { transform: translateY(0); }

      .store-icon-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; }
      .store-icon-btn:hover { transform: scale(1.06); box-shadow: ${SHADOW.sm}; }

      .store-tile { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); }
      .store-tile:hover { transform: translateY(-6px) rotate(-0.6deg); }
      .store-tile:hover .store-tile-img { transform: scale(1.08) rotate(0.6deg); }
      .store-tile-img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }

      .store-swatch { transition: transform 0.15s ease; }
      .store-swatch:hover { transform: scale(1.14); }

      .store-hide-scrollbar { scrollbar-width: none; }
      .store-hide-scrollbar::-webkit-scrollbar { display: none; }

      @media (max-width: 760px) {
        .store-howtobuy-steps { flex-direction: column !important; }
        .store-howtobuy-steps > div { width: 100% !important; }
        .store-connector-line { display: none !important; }
        .store-bento-grid { grid-template-columns: 1fr !important; grid-auto-rows: auto !important; }
        .store-bento-item { grid-column: span 1 !important; grid-row: span 1 !important; aspect-ratio: 4 / 5 !important; }
      }

      @media (max-width: 480px) {
        .store-footer-links { grid-template-columns: 1fr !important; }
      }

      /* ── Cinta de marquee (loop infinito, pausa al pasar el mouse) ────────── */
      @keyframes store-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .store-marquee-track { display: flex; width: max-content; animation: store-marquee 26s linear infinite; }
      .store-marquee-track:hover { animation-play-state: paused; }
      @media (prefers-reduced-motion: reduce) { .store-marquee-track { animation: none; } }

      /* ── Spotlight que sigue el cursor sobre la portada ───────────────────── */
      .store-spotlight {
        position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.4s ease;
        background: radial-gradient(circle 340px at var(--sx, 50%) var(--sy, 50%), rgba(255,255,255,0.16), transparent 70%);
      }
      .store-cover:hover .store-spotlight { opacity: 1; }

      /* ── Botón de WhatsApp con anillo de "ping" (en un pseudo-elemento, para  */
      /* no pelear con la animación de entrada "fade-up-enter" del mismo botón) */
      @keyframes store-pulse-ping {
        0% { transform: scale(1); opacity: 0.55; }
        100% { transform: scale(1.35); opacity: 0; }
      }
      .store-pulse { position: relative; }
      .store-pulse::after {
        content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        border: 2px solid ${C.accent}; animation: store-pulse-ping 2.2s ease-out 1.2s infinite;
      }
      @media (prefers-reduced-motion: reduce) { .store-pulse::after { animation: none; } }

      /* ── Línea que se dibuja conectando los pasos de "Cómo comprar" ───────── */
      .store-draw-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; transition: stroke-dashoffset 1.4s ease-out; }
      .store-draw-line.is-visible { stroke-dashoffset: 0; }

      /* ── Números fantasma: pequeño rebote al entrar en pantalla ───────────── */
      @keyframes store-ghost-in {
        from { opacity: 0; transform: translateY(14px) scale(0.94); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .reveal-on-scroll.is-visible .store-ghost-num { animation: store-ghost-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }

      /* ── Parallax de la foto de portada, ligado al scroll con CSS nativo ──── */
      /* Sin listeners de JS: "animation-timeline: view()" liga el keyframe al   */
      /* progreso de scroll de la propia sección directamente en el compositor. */
      @supports (animation-timeline: view()) {
        @media (prefers-reduced-motion: no-preference) {
          @keyframes store-parallax { from { transform: translateY(-6%); } to { transform: translateY(10%); } }
          .store-parallax-img { animation: store-parallax linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
        }
      }

      /* ── Reveal escalonado de tiles (delay individual por índice) ─────────── */
      .store-tile.reveal-on-scroll { transition-delay: var(--stagger, 0ms); }
      .store-stagger.reveal-on-scroll { transition-delay: var(--stagger, 0ms); }

      /* ── Cortina: la imagen se revela de un borde hacia el otro ───────────── */
      .store-curtain { clip-path: inset(0 0 0 100%); transition: clip-path 1.05s cubic-bezier(0.22,1,0.36,1); }
      .store-curtain.is-visible { clip-path: inset(0 0 0 0%); }
      @media (prefers-reduced-motion: reduce) { .store-curtain { clip-path: none !important; transition: none; } }

      /* ── Glow ambiental que se desplaza lento en fondos de color sólido ───── */
      @keyframes store-ambient-drift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      .store-ambient-bg { background-size: 220% 220%; animation: store-ambient-drift 14s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .store-ambient-bg { animation: none; } }

      /* ── Glow que sigue al cursor sobre fondos oscuros (mismo mecanismo de la */
      /* portada, reutilizado en otras secciones sobre --sx/--sy propios) ──────*/
      .store-glow-follow {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle 420px at var(--sx, 50%) var(--sy, 30%), color-mix(in srgb, ${C.accent} 30%, transparent), transparent 70%);
      }

      /* ── Marco que se expande al hacer hover (tarjetas de proceso/confianza) */
      .store-frame { position: relative; }
      .store-frame::before {
        content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        border: 1px solid transparent; transition: border-color 0.3s ease, inset 0.3s ease;
      }
      .store-frame:hover::before { border-color: ${C.accent}; inset: -6px; }

      /* ── Cursor parpadeante del efecto de tipeo ────────────────────────────── */
      @keyframes store-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      .store-caret { display: inline-block; width: 2px; height: 0.85em; background: currentColor; vertical-align: text-bottom; margin-left: 2px; animation: store-blink 1s step-end infinite; }
      @media (prefers-reduced-motion: reduce) { .store-caret { animation: none; } }
    `}</style>
  )
}
