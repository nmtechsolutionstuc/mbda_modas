export function LogoMark({ size = 40, color = '#2B1B12' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 3C20 3 29 10 29 20C29 30 20 37 20 37C20 37 11 30 11 20C11 10 20 3 20 3Z" fill={color} opacity="0.85" />
      <path d="M3 20C3 20 10 11 20 11C30 11 37 20 37 20C37 20 30 29 20 29C10 29 3 20 3 20Z" fill={color} opacity="0.45" />
    </svg>
  )
}
