import { Routes, Route } from 'react-router-dom'
import Sidebar   from './components/Sidebar'
import LiveClock from './components/LiveClock'
import Overview  from './pages/Overview'
import Satellite from './pages/Satellite'
import VideoPage from './pages/Video'

export default function App() {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--md-bg)' }}>
      <Sidebar />
      <div style={{ marginLeft:240, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        {/* Top App Bar */}
        <header style={{
          position:'sticky', top:0, zIndex:30,
          height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 32px',
          background:'rgba(15,17,23,0.85)',
          backdropFilter:'blur(20px) saturate(180%)',
          WebkitBackdropFilter:'blur(20px) saturate(180%)',
          borderBottom:'1px solid var(--md-outline)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--md-on-surface-var)', letterSpacing:'0.01em' }}>
              Intelligent Border Surveillance · IDS
            </span>
            <span style={{
              fontSize:11, fontWeight:500,
              background:'var(--md-s3)', border:'1px solid var(--md-outline)',
              borderRadius:6, padding:'2px 8px',
              color:'var(--md-on-surface-var)',
            }}>v1.2.0</span>
          </div>
          <LiveClock />
        </header>
        <main style={{ flex:1, padding:'32px 40px 48px', maxWidth:1400 }}>
          <Routes>
            <Route path="/"          element={<Overview />}  />
            <Route path="/satellite" element={<Satellite />} />
            <Route path="/video"     element={<VideoPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
