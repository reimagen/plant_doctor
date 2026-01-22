'use client'

import { useCallback, useRef } from 'react'

/**
 * useMediaStream - Utility hook for managing media stream acquisition and cleanup
 * Returns imperative start/stop functions without managing state
 * State management is handled by the consumer (e.g., ClientApp)
 */
export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'environment' }
      })
      streamRef.current = newStream
      return newStream
    } catch (err) {
      console.error('Hardware access denied:', err)
      throw err
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      streamRef.current = null
    }
  }, [])

  return { start, stop }
}
