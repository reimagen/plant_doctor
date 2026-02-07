const getAudioContextConstructor = () => {
  const webkit = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return window.AudioContext || webkit
}

let sharedContext: AudioContext | null = null
let sharedSampleRate: number | null = null
let activeUsers = 0

export const createCaptureContext = async (sampleRate: number = 16000): Promise<AudioContext> => {
  const AudioContextCtor = getAudioContextConstructor()
  if (!AudioContextCtor) {
    throw new Error('AudioContext is not available in this browser.')
  }

  if (sharedContext && sharedContext.state !== 'closed') {
    if (sharedSampleRate !== sampleRate) {
      console.warn('[AudioCapture] Requested sample rate differs from shared context.')
    }
    activeUsers += 1
    if (sharedContext.state === 'suspended') {
      await sharedContext.resume()
    }
    return sharedContext
  }

  sharedContext = new AudioContextCtor({ sampleRate })
  sharedSampleRate = sampleRate
  activeUsers = 1
  await sharedContext.resume()
  return sharedContext
}

export const closeCaptureContext = async (ctx: AudioContext | null) => {
  if (!ctx) return

  if (ctx === sharedContext) {
    activeUsers = Math.max(0, activeUsers - 1)
    if (activeUsers === 0 && sharedContext.state !== 'closed') {
      await sharedContext.close()
      sharedContext = null
      sharedSampleRate = null
    }
    return
  }

  if (ctx.state !== 'closed') {
    await ctx.close()
  }
}
