import { useState, useEffect } from 'react'

export default function LiveClock() {
  const [t, setT] = useState(new Date())

  useEffect(() => {
    // Sync to the exact second boundary so it never skips
    const now    = new Date()
    const delay  = 1000 - now.getMilliseconds()
    let interval

    const timeout = setTimeout(() => {
      setT(new Date())
      interval = setInterval(() => setT(new Date()), 1000)
    }, delay)

    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [])

  const hours   = t.getHours()
  const minutes = String(t.getMinutes()).padStart(2, '0')
  const seconds = String(t.getSeconds()).padStart(2, '0')
  const h12     = String(hours % 12 || 12).padStart(2, '0')
  const ampm    = hours >= 12 ? 'PM' : 'AM'
  const dateStr = t.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Live pulse dot */}
      <div style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: '#4ade80', opacity: 0.3,
          animation: 'pulse-ring 2s ease-out infinite',
        }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: '#4ade80',
        }} />
      </div>

      {/* Time display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>

        {/* HH:MM */}
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 17,
          fontWeight: 600,
          color: '#e2e8f3',
          letterSpacing: '0.03em',
          lineHeight: 1,
        }}>
          {h12}
          <span style={{
            color: '#7eb8f7',
            margin: '0 1px',
            animation: 'blink 1s step-end infinite',
          }}>:</span>
          {minutes}
        </span>

        {/* :SS — smaller and dimmer */}
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 400,
          color: '#4a5568',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>
          :{seconds}
        </span>

        {/* AM/PM */}
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: '#7eb8f7',
          letterSpacing: '0.08em',
          lineHeight: 1,
          marginLeft: 2,
        }}>
          {ampm}
        </span>
      </div>

      {/* Divider */}
      <span style={{
        width: 1, height: 20,
        background: 'rgba(147,196,255,0.12)',
      }} />

      {/* Date */}
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10,
        fontWeight: 500,
        color: '#4a5568',
        letterSpacing: '0.06em',
      }}>
        {dateStr}
      </span>
    </div>
  )
}
