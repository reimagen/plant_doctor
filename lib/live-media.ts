import type { RefObject } from 'react'
import { startVideoFrameCapture } from '@/lib/video-capture'

interface LiveMediaPipelineOptions {
  stream: MediaStream
  audioContext: AudioContext
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  onAudioChunk: (chunk: Float32Array) => void
  onImageFrame: (base64: string) => void
  imageQuality?: number
  imageWidth?: number
  shouldSendFrame?: () => boolean
}

export const setupLiveMediaPipeline = async ({
  stream,
  audioContext,
  videoRef,
  canvasRef,
  onAudioChunk,
  onImageFrame,
  imageQuality = 0.5,
  imageWidth = 320,
  shouldSendFrame
}: LiveMediaPipelineOptions) => {
  const source = audioContext.createMediaStreamSource(stream)
  await audioContext.audioWorklet.addModule('/pcm-capture-worklet.js')
  const worklet = new AudioWorkletNode(audioContext, 'pcm-capture-processor')
  const muteGain = audioContext.createGain()
  muteGain.gain.value = 0

  worklet.port.onmessage = (event) => {
    onAudioChunk(event.data as Float32Array)
  }

  source.connect(worklet)
  worklet.connect(muteGain)
  muteGain.connect(audioContext.destination)

  const stopVideo = startVideoFrameCapture({
    stream,
    videoRef,
    canvasRef,
    onFrame: onImageFrame,
    intervalMs: 1000,
    width: imageWidth,
    quality: imageQuality,
    shouldSendFrame
  })

  return () => {
    stopVideo()
    worklet.port.onmessage = null
    worklet.disconnect()
    muteGain.disconnect()
    source.disconnect()
  }
}
