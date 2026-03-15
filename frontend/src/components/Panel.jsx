export default function Panel({ children, className = '', accent = false, style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
        ...(accent ? { borderTopColor: 'var(--accent)', borderTopWidth: 1 } : {}),
        ...style,
      }}
    >
      {/* Scan-line texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(88,166,255,0.008) 2px, rgba(88,166,255,0.008) 4px)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
