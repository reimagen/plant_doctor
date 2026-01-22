export class AudioService {
  private ctx: AudioContext | null = null
  private nextStartTime: number = 0
  private activeSources: Set<AudioBufferSourceNode> = new Set()
  private sampleRate: number

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate
  }

  async ensureContext() {
    if (typeof window === 'undefined') return null

    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
      })
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    return this.ctx
  }

  async playRawChunk(data: Uint8Array) {
    try {
      const ctx = await this.ensureContext()
      if (!ctx) return

      const dataInt16 = new Int16Array(data.buffer)
      const frameCount = dataInt16.length
      if (frameCount === 0) return

      const buffer = ctx.createBuffer(1, frameCount, this.sampleRate)
      const channelData = buffer.getChannelData(0)

      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)

      this.nextStartTime = Math.max(this.nextStartTime, ctx.currentTime)
      source.start(this.nextStartTime)
      this.nextStartTime += buffer.duration

      this.activeSources.add(source)
      source.onended = () => this.activeSources.delete(source)
    } catch (e) {
      console.warn('Audio playback error (non-critical):', e)
    }
  }

  stopAll() {
    this.activeSources.forEach(s => { try { s.stop() } catch { } })
    this.activeSources.clear()
    this.nextStartTime = 0
  }

  async close() {
    this.stopAll()
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close()
      this.ctx = null
    }
  }
}
