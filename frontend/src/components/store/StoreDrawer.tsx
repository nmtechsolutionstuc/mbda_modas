import { X } from 'lucide-react'
import { C, SHADOW, STROKE } from './tokens'

/** Shell compartido por el panel de detalle de producto y el de favoritos. */
export function StoreDrawer({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 100vw)', background: C.page,
        zIndex: 41, overflowY: 'auto', boxShadow: SHADOW.lg, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ position: 'sticky', top: 0, background: C.page, zIndex: 1, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontWeight: 700, color: C.ink, fontSize: '0.9375rem' }}>{title}</span>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
            <X size={20} strokeWidth={STROKE} color={C.ink} />
          </button>
        </div>
        <div style={{ flex: 1, padding: '1.5rem' }}>{children}</div>
        {footer && <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${C.line}` }}>{footer}</div>}
      </div>
    </>
  )
}
