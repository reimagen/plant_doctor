import type { RefObject } from 'react'

interface VideoCaptureOptions {
  stream: MediaStream
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  onFrame: (base64: string) => void
  intervalMs?: number
  width?: number
  quality?: number
  shouldSendFrame?: () => boolean
}

export const startVideoFrameCapture = ({
  stream,
  videoRef,
  canvasRef,
  onFrame,
  intervalMs = 1000,
  width = 320,
  quality = 0.5,
  shouldSendFrame
}: VideoCaptureOptions) => {
  const hasVideo = stream.getVideoTracks().length > 0
  if (!hasVideo || !videoRef.current || !canvasRef.current) {
    return () => {}
  }

  const video = videoRef.current
  const canvas = canvasRef.current

  const intervalId = window.setInterval(() => {
    if (shouldSendFrame && !shouldSendFrame()) return
    if (video.paused) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = width
    canvas.height = (width * video.videoHeight) / video.videoWidth
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        if (base64) onFrame(base64)
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', quality)
  }, intervalMs)

  return () => window.clearInterval(intervalId)
}
