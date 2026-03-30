import { createContext, useContext, useState } from 'react'

const VideoContext = createContext()

export function VideoProvider({ children }) {
  const [file, setFile]       = useState(null)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError]     = useState(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setUploadPct(0)
  }

  return (
    <VideoContext.Provider value={{
      file, setFile,
      result, setResult,
      loading, setLoading,
      uploadPct, setUploadPct,
      error, setError,
      reset,
    }}>
      {children}
    </VideoContext.Provider>
  )
}

export const useVideo = () => useContext(VideoContext)
