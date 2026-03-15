import { NavLink } from 'react-router-dom'
import { LayoutGrid, Satellite, Video, Shield } from 'lucide-react'

const links = [
  { to:'/',          icon:LayoutGrid, label:'Overview'  },
  { to:'/satellite', icon:Satellite,  label:'Satellite' },
  { to:'/video',     icon:Video,      label:'Video'     },
]

export default function Sidebar() {
  return (
    <aside style={{
      position:'fixed', left:0, top:0,
      width:240, height:'100vh',
      background:'#161b24',
      borderRight:'1px solid rgba(147,196,255,0.1)',
      display:'flex', flexDirection:'column',
      zIndex:40,
    }}>
      {/* Brand */}
      <div style={{ padding:'24px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background:'linear-gradient(135deg,#004880,#1c2333)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 12px rgba(126,184,247,0.2)',
            flexShrink:0,
          }}>
            <Shield size={20} color="#7eb8f7" />
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#e2e8f3', lineHeight:1.2 }}>IBS · IDS</div>
            <div style={{ fontSize:11, color:'#8899b8', marginTop:2 }}>Command Center</div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding:'8px 20px 6px' }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#8899b8', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          Modules
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'4px 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {links.map(({ to, icon:Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:12,
              padding:'13px 16px', borderRadius:100,
              textDecoration:'none',
              background: isActive ? '#004880' : 'transparent',
              color: isActive ? '#7eb8f7' : '#8899b8',
              fontWeight: isActive ? 600 : 400,
              fontSize:14,
              transition:'all 200ms ease',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ flexShrink:0 }} />
                <span style={{ flex:1 }}>{label}</span>
                {isActive && (
                  <span style={{
                    width:6, height:6, borderRadius:'50%',
                    background:'#7eb8f7', flexShrink:0,
                  }}/>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div style={{
        margin:'0 12px 20px',
        background:'#1c2333', borderRadius:16,
        padding:'16px',
        border:'1px solid rgba(147,196,255,0.1)',
      }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#8899b8', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>
          System Status
        </div>
        {[['FastAPI',true],['YOLOv8n',true],['ByteTrack',true]].map(([label,ok]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'#c8d3e8' }}>{label}</span>
            <span style={{ fontSize:11, fontWeight:600, color: ok ? '#4ade80' : '#f87171', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background: ok ? '#4ade80' : '#f87171', display:'inline-block' }}/>
              {ok ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}
