import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration } from '@google/genai'

export interface GeminiLiveConfig {
  apiKey: string
  model: string
  systemInstruction: string
  tools?: { functionDeclarations: FunctionDeclaration[] }[]
  callbacks: {
    onOpen?: () => void
    onClose?: () => void
    onMessage?: (msg: LiveServerMessage) => void
    onError?: (error: unknown) => void
  }
}

export class GeminiLiveSession {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public session: any = null
  private config: GeminiLiveConfig
  private isClosing: boolean = false

  constructor(config: GeminiLiveConfig) {
    this.config = config
  }

  async connect() {
    this.isClosing = false
    const ai = new GoogleGenAI({ apiKey: this.config.apiKey })

    try {
      console.log('[GeminiLiveSession] Attempting to connect to Gemini API...');
      const sessionPromise = ai.live.connect({
        model: this.config.model,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: this.config.tools,
          systemInstruction: this.config.systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log('[GeminiLiveSession] WebSocket connection opened successfully!');
            if (this.isClosing) return
            this.config.callbacks.onOpen?.()
          },
          onclose: () => {
            console.log('[GeminiLiveSession] WebSocket connection closed.');
            this.session = null
            this.config.callbacks.onClose?.()
          },
          onerror: (e) => {
            console.error('[GeminiLiveSession] WebSocket error:', e);
            if (this.isClosing) return
            this.config.callbacks.onError?.(e)
          },
          onmessage: (msg) => {
            if (this.isClosing) return
            this.config.callbacks.onMessage?.(msg)
          },
        },
      })

      this.session = await sessionPromise
      console.log('[GeminiLiveSession] Session established.');
      return this.session
    } catch (err) {
      console.error('[GeminiLiveSession] Error during connection attempt:', err);
      this.config.callbacks.onError?.(err)
      throw err
    }
  }

  sendInitialGreet(text: string) {
    if (this.session && !this.isClosing) {
      try {
        this.session.sendRealtimeInput({
          parts: [{ text }]
        })
      } catch (e) {
        console.warn('Failed to send initial greet', e)
      }
    }
  }

  sendMedia(data: string, mimeType: string) {
    if (this.session && !this.isClosing) {
      try {
        this.session.sendRealtimeInput({
          media: { data, mimeType }
        })
      } catch (e) {
        console.warn('Failed to send media', e)
      }
    }
  }

  sendToolResponse(id: string, name: string, response: unknown) {
    if (this.session && !this.isClosing) {
      try {
        this.session.sendToolResponse({
          functionResponses: { id, name, response }
        })
      } catch (e) {
        console.warn('Tool response failed', e)
      }
    }
  }

  close() {
    this.isClosing = true
    if (this.session) {
      this.session = null
    }
  }

  static encodeAudio(float32Array: Float32Array): string {
    const l = float32Array.length
    const int16 = new Int16Array(l)
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    const bytes = new Uint8Array(int16.buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  static decodeAudio(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}
