import { Link } from 'react-router-dom'
import { Satellite, Video, ArrowRight, Cpu, GitBranch, Layers, ShieldCheck } from 'lucide-react'

const modules = [
  {
    code:'MOD-01', icon:Satellite, title:'Satellite Analysis',
    desc:'ORB-aligned SSIM comparison with edge-aware morphological change detection. Identifies new constructions, cleared terrain, and structural anomalies.',
    to:'/satellite', color:'var(--md-green)', bg:'rgba(109,213,140,0.1)',
    tags:['SSIM','ORB Align','Edge Detection','Morphology'],
  },
  {
    code:'MOD-02', icon:Video, title:'Video Analytics',
    desc:'YOLOv8n + ByteTrack real-time tracking with virtual tripwire, loitering detection, and probabilistic risk scoring with escalation logic.',
    to:'/video', color:'var(--md-primary)', bg:'rgba(208,188,255,0.1)',
    tags:['YOLOv8n','ByteTrack','Risk Fusion','Loitering'],
  },
]

const stack = [
  { icon:Cpu,         label:'Detection', value:'YOLOv8n'      },
  { icon:Layers,      label:'Tracker',   value:'ByteTrack'    },
  { icon:GitBranch,   label:'Backend',   value:'FastAPI'       },
  { icon:ShieldCheck, label:'Frontend',  value:'React + Vite'  },
]

export default function Overview() {
  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:32 }}>
        <div className="section-label" style={{ marginBottom:8 }}>System · Overview</div>
        <h1 style={{ fontSize:38, fontWeight:700, color:'var(--md-text)', lineHeight:1.15, marginBottom:10 }}>Command Center</h1>
        <p style={{ fontSize:14, color:'var(--md-text-dim)', maxWidth:540, lineHeight:1.75 }}>
          AI-powered border surveillance combining satellite change detection with ground-level tactical video analytics and risk scoring.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {stack.map(({ icon:Icon, label, value }) => (
          <div key={label} className="m3-card anim-fade-up" style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <Icon size={14} color="var(--md-text-dim)" />
              <span className="section-label">{label}</span>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--md-text)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
        {modules.map(({ code, icon:Icon, title, desc, to, color, bg, tags }, i) => (
          <Link key={to} to={to} style={{ textDecoration:'none' }}>
            <div
              className="m3-card anim-fade-up"
              style={{ padding:'24px', cursor:'pointer', animationDelay:`${i*80}ms`, borderTop:`2px solid ${color}`, position:'relative', overflow:'hidden', transition:'transform 0.2s var(--spring-1)' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <div className="state-layer" />
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div className="section-label">{code}</div>
                    <div style={{ fontSize:16, fontWeight:600, color:'var(--md-text)', marginTop:2 }}>{title}</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--md-text-dim)" style={{ marginTop:4, flexShrink:0 }} />
              </div>
              <p style={{ fontSize:13, color:'var(--md-text-dim)', lineHeight:1.7, marginBottom:16 }}>{desc}</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {tags.map(t => (
                  <span key={t} className="m3-chip" style={{ fontSize:10, padding:'2px 10px', color, background:bg, borderColor:`${color}40` }}>{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="m3-card anim-fade-up" style={{ padding:'20px 24px', animationDelay:'200ms' }}>
        <div className="section-label" style={{ marginBottom:12 }}>Data Pipeline</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {['React :5173','FastAPI :8000','YOLOv8n + ByteTrack','Risk Fusion Engine','outputs/change_maps'].map((node, i, arr) => (
            <div key={node} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", padding:'6px 12px', borderRadius:8, background:'var(--md-surface-2)', border:'1px solid var(--md-outline)', color:'var(--md-text)' }}>{node}</span>
              {i < arr.length - 1 && <span style={{ color:'var(--md-text-dim)' }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
