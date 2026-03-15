import { useState, useRef } from 'react'
import { Video, Upload, Play, AlertTriangle, Users, Car, RefreshCw, ChevronRight, Download, Film } from 'lucide-react'
import RiskGauge from '../components/RiskGauge'
import { analyzeVideo } from '../api'

const BASE = 'http://localhost:8000'

function levelColor(level) {
  if (level === 'CRITICAL ALARM' || level === 'HIGH THREAT') return 'var(--md-red-hi)'
  if (level === 'SUSPICIOUS BEHAVIOR' || level === 'SUBJECT DETECTED') return 'var(--md-yellow)'
  return 'var(--md-green)'
}

function levelChip(level) {
  if (level === 'CRITICAL ALARM' || level === 'HIGH THREAT') return 'm3-chip-red'
  if (level === 'SUSPICIOUS BEHAVIOR' || level === 'SUBJECT DETECTED') return 'm3-chip-yellow'
  return 'm3-chip-green'
}

export default function VideoPage() {
  const [file, setFile]           = useState(null)
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) { setFile(f); setResult(null); setError(null) }
  }

  function handleSelect(e) {
    const f = e.target.files[0]
    if (f) { setFile(f); setResult(null); setError(null) }
  }

  async function handleAnalyze() {
    if (!file || loading) return
    setLoading(true); setError(null); setResult(null); setUploadPct(0)
    try {
      const data = await analyzeVideo(file, pct => setUploadPct(pct))
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div className="section-label" style={{ marginBottom:8 }}>Module · 02</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:36, fontWeight:700, color:'var(--md-text)', lineHeight:1 }}>Video Analytics</h1>
          <div style={{ width:42, height:42, borderRadius:12, background:'rgba(208,188,255,0.1)', border:'1px solid rgba(208,188,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Video size={18} color="var(--md-primary)" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', marginBottom:20, background:'rgba(255,84,73,0.08)', border:'1px solid rgba(255,84,73,0.2)', borderRadius:12, color:'var(--md-red-hi)', fontSize:13 }}>
          <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }} /><span>{error}</span>
        </div>
      )}

      {/* Upload card */}
      <div className="m3-card" style={{ padding:'20px 22px', marginBottom:16 }}>
        <div className="section-label" style={{ marginBottom:12 }}>Feed Upload</div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border:`2px dashed ${dragging ? 'var(--md-primary)' : 'var(--md-outline-var)'}`,
            borderRadius:12, padding:'32px 20px', textAlign:'center', cursor:'pointer',
            background: dragging ? 'rgba(208,188,255,0.05)' : 'rgba(255,255,255,0.01)',
            transition:'all 0.2s var(--ease-std)',
          }}
        >
          <input ref={inputRef} type="file" accept="video/*" style={{ display:'none' }} onChange={handleSelect} />
          {file ? (
            <>
              <Film size={24} color="var(--md-primary)" style={{ margin:'0 auto 10px' }} />
              <div style={{ fontSize:14, fontWeight:500, color:'var(--md-text)' }}>{file.name}</div>
              <div style={{ fontSize:12, color:'var(--md-text-dim)', marginTop:4 }}>{(file.size/1e6).toFixed(1)} MB · Click to replace</div>
            </>
          ) : (
            <>
              <Upload size={24} color="var(--md-text-dim)" style={{ margin:'0 auto 10px' }} />
              <div style={{ fontSize:14, color:'var(--md-text-dim)' }}>
                Drop feed here or <span style={{ color:'var(--md-primary)', fontWeight:500 }}>browse files</span>
              </div>
              <div style={{ fontSize:12, color:'var(--md-text-dim)', opacity:0.5, marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>MP4 · AVI · MOV</div>
            </>
          )}
        </div>

        {/* Analyze button */}
        {file && !loading && (
          <button
            onClick={handleAnalyze}
            className="m3-btn m3-btn-tonal"
            style={{ marginTop:12, width:'100%', justifyContent:'center', borderRadius:12, padding:'12px' }}
          >
            <Play size={14} /> Process & Analyze Feed
          </button>
        )}

        {/* Progress */}
        {loading && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, color:'var(--md-text-dim)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <RefreshCw size={12} style={{ animation:'spin 1s linear infinite' }} />
                {uploadPct < 100 ? `Uploading… ${uploadPct}%` : 'Running YOLOv8 inference…'}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--md-primary)' }}>
                {uploadPct < 100 ? 'UPLOAD' : 'YOLOv8 · ByteTrack · Risk'}
              </span>
            </div>
            <div className="m3-progress-track">
              {uploadPct < 100
                ? <div className="m3-progress-fill" style={{ width:`${uploadPct}%` }} />
                : <div className="m3-progress-indeterminate" />
              }
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }} className="anim-scale-in">

          {/* Gauge + stats */}
          <div style={{ display:'grid', gridTemplateColumns:'190px 1fr', gap:12 }}>
            {/* Gauge card */}
            <div className="m3-card" style={{ padding:'20px 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <RiskGauge score={result.risk_score} level={result.risk_level} size={150} />
            </div>

            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { label:'People',     value:result.class_counts?.people   ?? 0, icon:<Users size={13}/>, color:'var(--md-text)' },
                { label:'Vehicles',   value:result.class_counts?.vehicles ?? 0, icon:<Car size={13}/>,   color:'var(--md-text)' },
                { label:'Incidents',  value:result.incident_count ?? 0,          icon:null, color:result.incident_count > 0 ? 'var(--md-orange)' : 'var(--md-green)' },
                { label:'Frames',     value:result.total_frames ?? '—',          icon:<Film size={13}/>, color:'var(--md-text)' },
                { label:'Risk Score', value:`${result.risk_score}/100`,          icon:null, color:levelColor(result.risk_level) },
                { label:'Threat',     value:result.risk_level,                   icon:null, color:levelColor(result.risk_level), small:true },
              ].map(({ label, value, icon, color, small }) => (
                <div key={label} className="m3-card" style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    {icon && <span style={{ color:'var(--md-text-dim)', display:'flex' }}>{icon}</span>}
                    <span className="section-label">{label}</span>
                  </div>
                  <div style={{ fontSize:small?11:26, fontWeight:small?500:700, color, lineHeight:1, fontFamily:small?"'JetBrains Mono',monospace":undefined }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk factors */}
          {result.reasons?.length > 0 && (
            <div className="m3-card" style={{ padding:'20px 22px' }}>
              <div className="section-label" style={{ marginBottom:14 }}>
                Risk Intelligence · {result.reasons.length} factor{result.reasons.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'flex-start', gap:12,
                    padding:'10px 14px', borderRadius:10,
                    background:'var(--md-surface-2)',
                    borderLeft:`3px solid var(--md-orange)`,
                    animationDelay:`${i*50}ms`,
                  }} className="anim-fade-up">
                    <ChevronRight size={13} color="var(--md-orange)" style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontSize:13, color:'var(--md-text)', lineHeight:1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed video */}
          <div className="m3-card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="section-label">Processed Feed</div>
              <a
                href={`${BASE}${result.video_url}`}
                download="processed_tactical.mp4"
                style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--md-primary)', textDecoration:'none', fontWeight:500 }}
              >
                <Download size={13} /> Download
              </a>
            </div>
            <video
              src={`${BASE}${result.video_url}`}
              controls
              style={{ width:'100%', borderRadius:10, border:'1px solid var(--md-outline)', background:'#000', display:'block' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
