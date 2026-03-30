import { useRef, useState, useEffect } from 'react'
import { Video, Upload, Play, AlertTriangle, Users, Car, RefreshCw, ChevronRight, Download, Film, ShieldAlert, Clock, LogIn, LogOut } from 'lucide-react'
import { useVideo } from '../context/VideoContext'
import RiskGauge from '../components/RiskGauge'
import { analyzeVideo } from '../api'

const BASE = 'http://localhost:8000'

function levelColor(level) {
  if (level === 'CRITICAL ALARM' || level === 'HIGH THREAT')         return '#f87171'
  if (level === 'SUSPICIOUS BEHAVIOR' || level === 'SUBJECT DETECTED') return '#fbbf24'
  return '#4ade80'
}

export default function VideoPage() {
  const { file, setFile, result, setResult, loading, setLoading, uploadPct, setUploadPct, error, setError } = useVideo()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  // Reset loading state on mount — prevents stuck progress bar after navigation
  useEffect(() => {
    setLoading(false)
    setUploadPct(0)
  }, [])

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) { setFile(f); setResult(null); setError(null) }
  }

  async function handleAnalyze() {
    if (!file || loading) return
    setLoading(true); setError(null); setResult(null); setUploadPct(0)
    try { setResult(await analyzeVideo(file, p => setUploadPct(p))) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const col = result ? levelColor(result.risk_level) : '#D0BCFF'

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeUp 0.3s ease both' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(126,184,247,0.1)', border: '1px solid rgba(126,184,247,0.2)',
          borderRadius: 100, padding: '4px 12px 4px 8px', marginBottom: 14,
        }}>
          <Video size={13} color="#D0BCFF" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#D0BCFF' }}>Module 02</span>
        </span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f3', marginBottom: 6 }}>Video Analytics</h1>
        <p style={{ fontSize: 14, color: '#8899b8' }}>Upload drone or CCTV feed for AI-powered detection, tracking and risk scoring.</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          color: '#f87171', fontSize: 13,
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      {/* Upload card */}
      <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Feed Upload</div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#D0BCFF' : 'rgba(147,196,255,0.15)'}`,
            borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(126,184,247,0.05)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f=e.target.files[0]; if(f){setFile(f);setResult(null);setError(null)} }} />
          {file ? (
            <>
              <Film size={22} color="#D0BCFF" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f3' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#8899b8', marginTop: 4 }}>{(file.size/1e6).toFixed(1)} MB · Click to replace</div>
            </>
          ) : (
            <>
              <Upload size={22} color="#4a5568" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, color: '#8899b8' }}>Drop feed here or <span style={{ color: '#D0BCFF' }}>browse</span></div>
              <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4 }}>MP4 · AVI · MOV</div>
            </>
          )}
        </div>

        {file && !loading && (
          <button
            onClick={handleAnalyze}
            style={{
              marginTop: 12, width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12,
              background: '#D0BCFF', color: '#003258', border: 'none',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Play size={14} fill="#003258" /> Process & Analyze Feed
          </button>
        )}

        {loading && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8899b8', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                {uploadPct < 100 ? `Uploading… ${uploadPct}%` : 'Running YOLOv8 + ByteTrack…'}
              </span>
              <span style={{ color: '#D0BCFF', fontWeight: 500 }}>{uploadPct < 100 ? 'UPLOAD' : 'INFERENCE'}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(126,184,247,0.08)', borderRadius: 100, overflow: 'hidden' }}>
              {uploadPct < 100
                ? <div style={{ height: '100%', width: `${uploadPct}%`, background: '#D0BCFF', borderRadius: 100, transition: 'width 0.3s', boxShadow: '0 0 8px #D0BCFF' }} />
                : <div style={{ height: '100%', width: '60%', background: '#D0BCFF', borderRadius: 100, animation: 'progressSlide 1.5s ease infinite', boxShadow: '0 0 8px #D0BCFF' }} />
              }
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.35s ease both' }}>

          {/* Risk row */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
            <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 180 }}>
              <RiskGauge score={result.risk_score} level={result.risk_level} size={148} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'People',    value: result.class_counts?.people ?? 0,   icon: <Users size={13}/>,  color: '#e2e8f3' },
                { label: 'Vehicles',  value: result.class_counts?.vehicles ?? 0, icon: <Car size={13}/>,    color: '#e2e8f3' },
                { label: 'Incidents', value: result.zone_log?.length ?? 0,       icon: null,                color: result.zone_log?.length > 0 ? '#fb923c' : '#4ade80' },
                { label: 'Frames',    value: result.total_frames ?? '—',         icon: <Film size={13}/>,   color: '#e2e8f3' },
                { label: 'Risk Score',value: `${result.risk_score}/100`,         icon: null,                color: col },
                { label: 'Zone Entries', value: result.zone_log?.length ?? 0,    icon: <ShieldAlert size={13}/>, color: result.zone_log?.length > 0 ? '#f87171' : '#4ade80' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ background: '#1c2333', borderRadius: 12, border: '1px solid rgba(147,196,255,0.1)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}{label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Intrusion Log */}
          {result.zone_log && result.zone_log.length > 0 && (
            <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(248,113,113,0.2)', padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShieldAlert size={15} color="#f87171" />
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f87171', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Restricted Zone Intrusion Log · {result.zone_log.length} {result.zone_log.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '70px 120px 90px 100px 100px 120px',
                gap: 8, padding: '6px 12px', marginBottom: 6,
                fontSize: 10, fontWeight: 600, color: '#4a5568',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                <span>ID</span>
                <span>Type</span>
                <span>Entry</span>
                <span>Duration</span>
                <span>Status</span>
                <span>Threat</span>
              </div>

              {/* Table rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {result.zone_log.map((entry, i) => {
                  const isIn      = entry.status === 'IN ZONE'
                  const isLoiter  = entry.duration > 10
                  const rowColor  = isLoiter ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)'
                  const borderCol = isLoiter ? 'rgba(248,113,113,0.3)' : 'rgba(147,196,255,0.08)'

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'grid', gridTemplateColumns: '70px 120px 90px 100px 100px 120px',
                        gap: 8, padding: '10px 12px', borderRadius: 8,
                        background: rowColor, border: `1px solid ${borderCol}`,
                        alignItems: 'center',
                      }}
                    >
                      {/* ID */}
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: '#D0BCFF',
                        background: 'rgba(126,184,247,0.1)', borderRadius: 6,
                        padding: '2px 8px', textAlign: 'center', display: 'inline-block',
                      }}>#{entry.id}</span>

                      {/* Type */}
                      <span style={{ fontSize: 12, color: '#c8d3e8', fontWeight: 500 }}>{entry.label}</span>

                      {/* Entry time */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8899b8' }}>
                        <LogIn size={11} color="#4ade80" />{entry.entry_time}
                      </span>

                      {/* Duration */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isLoiter ? '#f87171' : '#8899b8' }}>
                        <Clock size={11} />{entry.duration}s
                      </span>

                      {/* Status */}
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                        padding: '3px 8px', borderRadius: 100, textAlign: 'center',
                        background: isIn ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.1)',
                        color: isIn ? '#f87171' : '#4ade80',
                        border: `1px solid ${isIn ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.2)'}`,
                      }}>
                        {isIn ? '● IN ZONE' : '○ EXITED'}
                      </span>

                      {/* Threat tag */}
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                        padding: '3px 8px', borderRadius: 100, textAlign: 'center',
                        background: isLoiter ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.1)',
                        color: isLoiter ? '#f87171' : '#fbbf24',
                        border: `1px solid ${isLoiter ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.2)'}`,
                      }}>
                        {isLoiter ? 'LOITERING' : 'INTRUDER'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {result.reasons?.length > 0 && (
            <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '18px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Risk Intelligence · {result.reasons.length} factor{result.reasons.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #fb923c' }}>
                    <ChevronRight size={13} color="#fb923c" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#c8d3e8', lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed video */}
          <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Processed Feed</div>
              <a href={`${BASE}${result.video_url}`} download="processed_tactical.mp4"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#D0BCFF', textDecoration: 'none', fontWeight: 500 }}>
                <Download size={13} /> Download
              </a>
            </div>
            <video src={`${BASE}${result.video_url}`} controls
              style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(147,196,255,0.1)', background: '#000', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  )
}
