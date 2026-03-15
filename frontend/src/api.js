const BASE = 'http://localhost:8000'

export async function getSatelliteMaps() {
  const res = await fetch(`${BASE}/satellite-maps`)
  if (!res.ok) throw new Error('Failed to fetch maps')
  return res.json()          // { maps: string[] }
}

export async function analyzeSatellite(filename) {
  const res = await fetch(`${BASE}/analyze-satellite?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Satellite analysis failed')
  return res.json()
  // { similarity_score, changes_detected, diff_image_url }
}

export async function analyzeVideo(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  // Fetch with progress via XHR
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/analyze-video`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try { resolve(JSON.parse(xhr.responseText)) }
        catch { reject(new Error('Invalid response')) }
      } else {
        reject(new Error(`Server error: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}
