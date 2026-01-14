
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration } from "@google/genai";

export interface GeminiLiveConfig {
  apiKey: string;
  model: string;
  systemInstruction: string;
  tools?: { functionDeclarations: FunctionDeclaration[] }[];
  callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onMessage?: (msg: LiveServerMessage) => void;
    onError?: (error: any) => void;
  };
}

export class GeminiLiveSession {
  private ai: GoogleGenAI;
  private session: any = null;
  private config: GeminiLiveConfig;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async connect() {
    this.session = await this.ai.live.connect({
      model: this.config.model,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: this.config.tools,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: this.config.systemInstruction,
      },
      callbacks: {
        onopen: () => this.config.callbacks.onOpen?.(),
        onclose: () => this.config.callbacks.onClose?.(),
        onerror: (e) => this.config.callbacks.onError?.(e),
        onmessage: (msg) => this.config.callbacks.onMessage?.(msg),
      },
    });
    return this.session;
  }

  sendMedia(data: string, mimeType: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        media: { data, mimeType }
      });
    }
  }

  sendToolResponse(id: string, name: string, response: any) {
    if (this.session) {
      this.session.sendToolResponse({
        functionResponses: [{ id, name, response }]
      });
    }
  }

  close() {
    if (this.session) {
      // The SDK handles closure via the underlying connection
      this.session = null;
    }
  }

  static encodeAudio(float32Array: Float32Array): string {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static decodeAudio(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
