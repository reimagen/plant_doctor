const express = require('express')
const http = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const { GoogleGenAI, Modality } = require('@google/genai')
const geminiConfig = require('../functions/shared/gemini-config.json')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, apiVersion: 'v1beta' })
const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Endpoint configs
const ENDPOINT_CONFIGS = Object.fromEntries(
  Object.values(geminiConfig.liveEndpoints).map((endpoint) => [
    endpoint.path,
    { model: geminiConfig.models[endpoint.modelKey] },
  ])
)

wss.on('connection', async (clientWs, req) => {
  const path = req.url?.split('?')[0] || ''
  const endpointConfig = ENDPOINT_CONFIGS[path]

  if (!endpointConfig) {
    clientWs.close(4000, `Unknown endpoint: ${path}`)
    return
  }

  console.log(`[WS] Client connected to ${path}`)

  let geminiSession = null
  let closed = false

  function cleanup() {
    if (closed) return
    closed = true
    console.log(`[WS] Cleaning up session for ${path}`)
    if (geminiSession) {
      try { geminiSession.close?.() } catch {}
      geminiSession = null
    }
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close()
    }
  }

  clientWs.on('close', cleanup)
  clientWs.on('error', (err) => {
    console.error(`[WS] Client error on ${path}:`, err.message)
    cleanup()
  })

  clientWs.on('message', async (raw) => {
    if (closed) return

    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      console.warn('[WS] Invalid JSON from client')
      return
    }

    // First message must be 'setup' with config
    if (msg.type === 'setup') {
      try {
        geminiSession = await ai.live.connect({
          model: endpointConfig.model,
          config: {
            responseModalities: [Modality.AUDIO],
            tools: msg.tools || undefined,
            systemInstruction: msg.systemInstruction || undefined,
          },
          callbacks: {
            onopen: () => {
              console.log(`[WS] Gemini session opened for ${path}`)
              if (!closed) {
                clientWs.send(JSON.stringify({ type: 'open' }))
              }
            },
            onclose: (e) => {
              console.log(`[WS] Gemini session closed for ${path}: ${e.code} ${e.reason}`)
              if (!closed) {
                clientWs.send(JSON.stringify({ type: 'close', code: e.code, reason: e.reason }))
              }
              cleanup()
            },
            onerror: (e) => {
              console.error(`[WS] Gemini error for ${path}:`, e)
              if (!closed) {
                clientWs.send(JSON.stringify({ type: 'error', message: String(e) }))
              }
            },
            onmessage: (serverMsg) => {
              if (!closed && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'message', data: serverMsg }))
              }
            },
          },
        })
      } catch (err) {
        console.error(`[WS] Failed to connect to Gemini for ${path}:`, err)
        if (!closed) {
          clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to connect to Gemini' }))
          clientWs.close(4001, 'Gemini connection failed')
        }
      }
      return
    }

    if (!geminiSession) {
      console.warn('[WS] Message received before setup complete')
      return
    }

    try {
      if (msg.type === 'realtimeInput') {
        geminiSession.sendRealtimeInput(msg.data)
      } else if (msg.type === 'toolResponse') {
        geminiSession.sendToolResponse(msg.data)
      }
    } catch (err) {
      console.warn(`[WS] Failed to forward message to Gemini:`, err.message)
    }
  })
})

const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`WebSocket proxy listening on port ${PORT}`)
})
