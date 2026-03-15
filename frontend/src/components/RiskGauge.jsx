import { useEffect, useState } from 'react'

const LEVELS = {
  'NORMAL':              { color:'#6dd58c', label:'Normal',             chipClass:'m3-chip-green'  },
  'SUBJECT DETECTED':    { color:'#f6c90e', label:'Subject Detected',   chipClass:'m3-chip-yellow' },
  'SUSPICIOUS BEHAVIOR': { color:'#ffb77a', label:'Suspicious',         chipClass:'m3-chip-orange' },
  'HIGH THREAT':         { color:'#ff5449', label:'High Threat',        chipClass:'m3-chip-red'    },
  'CRITICAL ALARM':      { color:'#ff5449', label:'Critical Alarm',     chipClass:'m3-chip-red'    },
}

export default function RiskGauge({ score = 0, level = 'NORMAL', size = 140 }) {
  const [animated, setAnimated] = useState(0)
  const cfg = LEVELS[level] || LEVELS['NORMAL']
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <svg width={size} height={size} viewBox="0 0 104 104">
        {/* Glow bg */}
        <circle cx="52" cy="52" r="52" fill={`${cfg.color}08`} />
        {/* Track */}
        <circle cx="52" cy="52" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        {/* Arc */}
        <circle cx="52" cy="52" r={r} fill="none"
          stroke={cfg.color}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transformOrigin:'52px 52px',
            transform:'rotate(-90deg)',
            transition:'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease',
            filter:`drop-shadow(0 0 8px ${cfg.color}88)`,
          }}
        />
        {/* Score */}
        <text x="52" y="48" textAnchor="middle" fill="var(--md-text)"
          style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:700 }}>
          {animated}
        </text>
        <text x="52" y="60" textAnchor="middle" fill="var(--md-text-dim)"
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8 }}>
          / 100
        </text>
      </svg>
      <span className={`m3-chip ${cfg.chipClass}`} style={{ fontSize:11 }}>
        {cfg.label}
      </span>
    </div>
  )
}
