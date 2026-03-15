export default function PageHeader({ module, title, icon: Icon, accentColor = 'var(--accent)' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingBottom: 20,
      borderBottom: '1px solid var(--border)',
      marginBottom: 24,
    }}>
      <div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, letterSpacing: '0.2em',
          color: 'var(--text-dim)', textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {module}
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 32, letterSpacing: '0.06em',
          color: 'var(--text-hi)', lineHeight: 1,
        }}>
          {title}
        </h1>
      </div>
      <div style={{
        width: 38, height: 38,
        border: `1px solid ${accentColor}30`,
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${accentColor}0d`,
        flexShrink: 0,
      }}>
        <Icon size={16} color={accentColor} />
      </div>
    </div>
  )
}
