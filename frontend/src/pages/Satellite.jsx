import { useEffect, useState, useRef } from 'react'
import { Satellite, Play, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, MapPin, FileImage } from 'lucide-react'
import { getSatelliteMaps, analyzeSatellite } from '../api'

const BASE = 'http://localhost:8000'

export default function SatellitePage() {
  const [maps, setMaps]               = useState([])
  const [selected, setSelected]       = useState('')
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [mapsLoading, setMapsLoading] = useState(true)
  const wrapRef = useRef(null)

  useEffect(() => {
    getSatelliteMaps()
      .then(d => setMaps(d.maps || []))
      .catch(() => setError('Cannot reach backend at localhost:8000'))
      .finally(() => setMapsLoading(false))
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  async function handleAnalyze() {
    if (!selected || loading) return
    setLoading(true); setError(null); setResult(null)
    try { setResult(await analyzeSatellite(selected)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const rawScore = result?.similarity_score ?? 0
  const matchPct = result?.similarity_score != null ? (result.similarity_score * 100).toFixed(1) : null
  const scoreGood = rawScore >= 0.40
  const changes  = result?.changes_detected ?? 0

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeUp 0.3s ease both' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: 100, padding: '4px 12px 4px 8px', marginBottom: 14,
        }}>
          <Satellite size={13} color="#4ade80" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Module 01</span>
        </span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f3', marginBottom: 6 }}>Satellite Analysis</h1>
        <p style={{ fontSize: 14, color: '#8899b8' }}>
          Select a sector map to run ORB-aligned SSIM change detection.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          color: '#f87171', fontSize: 13,
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Controls card */}
      <div style={{
        background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)',
        padding: '20px 22px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Sector Map
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

          {/* Dropdown wrapper — inline, z-index on the list only */}
          <div ref={wrapRef} style={{ flex: 1, position: 'relative' }}>

            {/* Trigger */}
            <button
              disabled={mapsLoading}
              onClick={() => !mapsLoading && setOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12,
                background: '#1c2333',
                border: `1.5px solid ${open ? '#7eb8f7' : 'rgba(147,196,255,0.15)'}`,
                color: selected ? '#e2e8f3' : '#8899b8',
                fontSize: 14, fontFamily: 'inherit', cursor: mapsLoading ? 'not-allowed' : 'pointer',
                outline: 'none', textAlign: 'left',
                transition: 'border-color 0.15s ease',
              }}
            >
              <MapPin size={14} color="#8899b8" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                {mapsLoading ? 'Loading maps…' : selected || (maps.length === 0 ? 'No maps found' : 'Select sector map')}
              </span>
              <ChevronDown
                size={14} color="#8899b8"
                style={{ flexShrink: 0, transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Dropdown list */}
            {open && maps.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#1c2333', border: '1.5px solid rgba(147,196,255,0.2)',
                borderRadius: 12, zIndex: 1000,
                maxHeight: 220, overflowY: 'auto',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                padding: '4px',
              }}>
                {maps.map(m => (
                  <button
                    key={m}
                    onClick={() => { setSelected(m); setResult(null); setOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8, border: 'none',
                      background: selected === m ? 'rgba(126,184,247,0.12)' : 'transparent',
                      color: selected === m ? '#7eb8f7' : '#c8d3e8',
                      fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                      fontWeight: selected === m ? 600 : 400,
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => { if (selected !== m) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (selected !== m) e.currentTarget.style.background = 'transparent' }}
                  >
                    <FileImage size={12} color="#8899b8" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{m}</span>
                    {selected === m && <CheckCircle size={13} color="#7eb8f7" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Run Analysis button */}
          <button
            onClick={handleAnalyze}
            disabled={!selected || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 12, flexShrink: 0,
              background: !selected || loading ? 'rgba(126,184,247,0.15)' : '#7eb8f7',
              color: !selected || loading ? '#8899b8' : '#003258',
              border: 'none', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit', cursor: !selected || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              transform: 'translateY(0)',
              boxShadow: selected && !loading ? '0 4px 16px rgba(126,184,247,0.3)' : 'none',
            }}
            onMouseEnter={e => { if (selected && !loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
              : <><Play size={14} fill={!selected ? '#8899b8' : '#003258'} /> Run Analysis</>
            }
          </button>
        </div>

        {/* Loading bar */}
        {loading && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8899b8', marginBottom: 8 }}>
              <span>Processing orbital imagery…</span>
              <span style={{ color: '#7eb8f7' }}>SSIM → ORB → Edge</span>
            </div>
            <div style={{ height: 4, background: 'rgba(126,184,247,0.1)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '45%', background: '#7eb8f7', borderRadius: 100,
                animation: 'progressSlide 1.5s ease infinite',
                boxShadow: '0 0 12px rgba(126,184,247,0.5)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.35s ease both' }}>

          {/* Score cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <StatCard label="Match Score" accent={parseFloat(matchPct) >= 85 ? '#4ade80' : '#f87171'}>
              <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: scoreGood ? '#4ade80' : '#f87171' }}>
                {matchPct}<span style={{ fontSize: 20, opacity: 0.6 }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: '#8899b8', marginTop: 6 }}>SSIM structural similarity</div>
            </StatCard>

            <StatCard label="Anomalies">
              <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: changes === 0 ? '#4ade80' : '#fb923c' }}>
                {changes}
              </div>
              <div style={{ fontSize: 12, color: '#8899b8', marginTop: 6 }}>Structural changes detected</div>
            </StatCard>

            <StatCard label="Verdict">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {changes === 0
                  ? <><CheckCircle size={20} color="#4ade80" /><span style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>Sector Clear</span></>
                  : <><AlertTriangle size={20} color="#fb923c" /><span style={{ fontSize: 14, fontWeight: 600, color: '#fb923c' }}>Anomaly Detected</span></>
                }
              </div>
              <div style={{ fontSize: 12, color: '#8899b8', marginTop: 8 }}>{selected}</div>
            </StatCard>
          </div>

          {/* Image comparison */}
          <div style={{ background: '#161b24', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Image Comparison
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: result.diff_image_url ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
              <SatImg src={`${BASE}/data/satellite/im1/${selected}`} label="Baseline" sub="im1 · reference" accent="#4ade80" />
              <SatImg src={`${BASE}/data/satellite/im2/${selected}`} label="Current"  sub="im2 · latest"    accent="#7eb8f7" />
              {result.diff_image_url && (
                <SatImg src={`${BASE}${result.diff_image_url}`} label="Change Map" sub={`${changes} ${changes === 1 ? 'anomaly' : 'anomalies'} flagged`} accent="#fb923c" />
              )}
            </div>
            {!result.diff_image_url && changes === 0 && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#8899b8', marginTop: 12 }}>
                No change map generated — sector is clear.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, children }) {
  return (
    <div style={{ background: '#1c2333', borderRadius: 16, border: '1px solid rgba(147,196,255,0.1)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#8899b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function SatImg({ src, label, sub, accent }) {
  const [err, setErr] = useState(false)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{label}</span>
        <span style={{ fontSize: 12, color: '#8899b8' }}>{sub}</span>
      </div>
      {err
        ? <div style={{ aspectRatio: '1', borderRadius: 12, background: '#1c2333', border: '1px solid rgba(147,196,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8899b8', fontSize: 12 }}>Not available</div>
        : <img src={src} alt={label} onError={() => setErr(true)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(147,196,255,0.1)', display: 'block' }} />
      }
    </div>
  )
}
