import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration } from '@google/genai'

export interface GeminiLiveConfig {
  apiKey?: string
  proxyUrl?: string
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
  private isClosed: boolean = false
  private proxyWs: WebSocket | null = null

  constructor(config: GeminiLiveConfig) {
    this.config = config
  }

  async connect() {
    this.isClosing = false
    this.isClosed = false

    // Use proxy mode if proxyUrl is provided
    if (this.config.proxyUrl) {
      return this.connectViaProxy()
    }

    return this.connectDirect()
  }

  private async connectViaProxy() {
    const url = this.config.proxyUrl!
    console.log('[GeminiLiveSession] Connecting via proxy:', url)

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url)
      this.proxyWs = ws

      ws.onopen = () => {
        console.log('[GeminiLiveSession] Proxy WebSocket opened, sending setup...')
        // Send setup message with config
        ws.send(JSON.stringify({
          type: 'setup',
          systemInstruction: this.config.systemInstruction,
          tools: this.config.tools,
        }))
      }

      ws.onclose = (e) => {
        console.log('[GeminiLiveSession] Proxy WebSocket closed:', e.code, e.reason)
        this.isClosed = true
        this.proxyWs = null
        this.session = null
        this.config.callbacks.onClose?.()
      }

      ws.onerror = (e) => {
        console.error('[GeminiLiveSession] Proxy WebSocket error:', e)
        if (this.isClosing) return
        this.config.callbacks.onError?.(e)
      }

      ws.onmessage = (event) => {
        if (this.isClosing) return

        let msg
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (msg.type === 'open') {
          console.log('[GeminiLiveSession] Gemini session ready via proxy')
          // Create a proxy session object that mimics the SDK session interface
          this.session = {
            sendRealtimeInput: (data: unknown) => {
              if (this.proxyWs?.readyState === WebSocket.OPEN) {
                this.proxyWs.send(JSON.stringify({ type: 'realtimeInput', data }))
              }
            },
            sendToolResponse: (data: unknown) => {
              if (this.proxyWs?.readyState === WebSocket.OPEN) {
                this.proxyWs.send(JSON.stringify({ type: 'toolResponse', data }))
              }
            },
          }
          this.config.callbacks.onOpen?.()
          resolve()
        } else if (msg.type === 'message') {
          this.config.callbacks.onMessage?.(msg.data as LiveServerMessage)
        } else if (msg.type === 'error') {
          this.config.callbacks.onError?.(new Error(msg.message))
        } else if (msg.type === 'close') {
          // Gemini closed server-side; the ws.onclose handler will fire next
        }
      }

      // Timeout after 15s
      setTimeout(() => {
        if (!this.session && !this.isClosed) {
          reject(new Error('Proxy connection timeout'))
          ws.close()
        }
      }, 15000)
    })
  }

  private async connectDirect() {
    if (!this.config.apiKey) {
      throw new Error('apiKey is required for direct connection')
    }

    const ai = new GoogleGenAI({ apiKey: this.config.apiKey, apiVersion: 'v1beta' })

    try {
      console.log('[GeminiLiveSession] Attempting to connect to Gemini API...');

      let wsOpened = false
      let closeEvent: (() => void) | null = null;

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
            wsOpened = true
          },
          onclose: (e: CloseEvent) => {
            console.log('[GeminiLiveSession] WebSocket connection closed. Code:', e.code, 'Reason:', e.reason, 'Clean:', e.wasClean);
            this.isClosed = true
            if (!this.session) {
              closeEvent = () => {
                this.session = null
                this.config.callbacks.onClose?.()
              }
            } else {
              this.session = null
              this.config.callbacks.onClose?.()
            }
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
      console.log('[GeminiLiveSession] Session established, this.session is now set.');

      if (closeEvent) {
        console.log('[GeminiLiveSession] WebSocket closed during connect, firing deferred close.');
        (closeEvent as () => void)()
        return this.session
      }

      if (wsOpened && !this.isClosing) {
        console.log('[GeminiLiveSession] Firing onOpen callback now that session is ready.');
        this.config.callbacks.onOpen?.()
      }

      return this.session
    } catch (err) {
      console.error('[GeminiLiveSession] Error during connection attempt:', err);
      this.config.callbacks.onError?.(err)
      throw err
    }
  }

  sendInitialGreet(text: string) {
    console.log('[GeminiLiveSession] sendInitialGreet called, session:', !!this.session, 'isClosing:', this.isClosing, 'isClosed:', this.isClosed);
    if (this.session && !this.isClosing && !this.isClosed) {
      try {
        this.session.sendRealtimeInput({
          parts: [{ text }]
        })
        console.log('[GeminiLiveSession] Initial greet sent successfully');
      } catch (e) {
        console.warn('[GeminiLiveSession] Failed to send initial greet:', e)
      }
    } else {
      console.warn('[GeminiLiveSession] Cannot send greet - session not ready or closing');
    }
  }

  sendMedia(data: string, mimeType: string) {
    if (this.session && !this.isClosing && !this.isClosed) {
      try {
        this.session.sendRealtimeInput({
          media: { data, mimeType }
        })
      } catch (e) {
        console.warn('[GeminiLiveSession] Failed to send media:', e)
      }
    }
  }

  sendToolResponse(id: string, name: string, response: unknown) {
    if (this.session && !this.isClosing && !this.isClosed) {
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
    this.isClosed = true
    if (this.proxyWs) {
      this.proxyWs.close()
      this.proxyWs = null
    }
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
