'use client'

import { useState, useRef, useCallback, type RefObject } from 'react'
import { Type, FunctionDeclaration } from '@google/genai'
import { HomeProfile, Plant } from '@/types'
import { GeminiLiveSession } from '@/lib/gemini-live'
import { AudioService } from '@/lib/audio-service'
import { ToolCallRateLimiter, MediaThrottler } from '@/lib/rate-limiter'
import { createCaptureContext, closeCaptureContext } from '@/lib/audio-capture'
import { setupLiveMediaPipeline } from '@/lib/live-media'

export const usePlantDoctor = (homeProfile: HomeProfile, onPlantDetected: (p: Plant) => void) => {
  const [isCalling, setIsCalling] = useState(false)
  const [lastDetectedName, setLastDetectedName] = useState<string | null>(null)
  const [discoveryLog, setDiscoveryLog] = useState<string[]>([])

  const sessionRef = useRef<GeminiLiveSession | null>(null)
  const audioServiceRef = useRef(new AudioService(24000))
  const mediaCleanupRef = useRef<(() => void) | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const toolCallLimiterRef = useRef(new ToolCallRateLimiter(15, 60000))
  const mediaThrottlerRef = useRef(new MediaThrottler(1000))
  const isConnectingRef = useRef(false) // Guard against multiple connection attempts
  const keepaliveIntervalRef = useRef<number | null>(null) // Keepalive to prevent proxy timeout

  const onPlantDetectedRef = useRef(onPlantDetected)
  onPlantDetectedRef.current = onPlantDetected

  // Session-level dedup: track species already proposed in this session
  const proposedSpeciesRef = useRef<Set<string>>(new Set())

  const homeProfileRef = useRef(homeProfile)
  homeProfileRef.current = homeProfile

  const proposePlantFunction: FunctionDeclaration = {
    name: 'propose_plant_to_inventory',
    parameters: {
      type: Type.OBJECT,
      description: 'Proposes a plant to the inventory. Can be called multiple times in one session.',
      properties: {
        commonName: { type: Type.STRING },
        scientificName: { type: Type.STRING },
        healthStatus: { type: Type.STRING, enum: ['healthy', 'warning', 'critical'] },
        habitGrade: { type: Type.STRING, description: 'A grade from A to F based on care habits visible (dust, soil moisture, pruning).' },
        habitFeedback: { type: Type.STRING, description: 'Brief reasoning for the grade.' },
        healthIssues: { type: Type.STRING, description: 'Specific visible issues (e.g. yellow leaves, pests, brown tips).' },
        cadenceDays: { type: Type.NUMBER },
        idealConditions: { type: Type.STRING },
        lightIntensity: { type: Type.STRING, enum: ['Low', 'Medium', 'Bright'] },
        lightQuality: { type: Type.STRING, enum: ['Indirect', 'Direct'] },
        nearWindow: { type: Type.BOOLEAN },
        windowDirection: { type: Type.STRING, enum: ['North', 'South', 'East', 'West'] },
        overdueThresholdMinor: { type: Type.NUMBER, description: 'Days past watering before minor stress appears (drought-tolerant=4-5, normal=2-3, tropical=1-2)' },
        overdueThresholdMajor: { type: Type.NUMBER, description: 'Days past watering before checkup required (drought-tolerant=8-10, normal=5-6, tropical=3-4)' }
      },
      required: ['commonName', 'scientificName', 'healthStatus', 'habitGrade', 'habitFeedback', 'healthIssues']
    }
  }

  const stopCall = useCallback(async () => {
    // Use ref check to avoid depending on isCalling state
    if (!sessionRef.current && !isConnectingRef.current) return

    console.log('[usePlantDoctor] stopCall invoked');
    isConnectingRef.current = false
    setIsCalling(false)

    if (mediaCleanupRef.current) {
      mediaCleanupRef.current()
      mediaCleanupRef.current = null
    }
    mediaThrottlerRef.current.reset()
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current)
      keepaliveIntervalRef.current = null
    }
    sessionRef.current?.close()
    sessionRef.current = null
    await audioServiceRef.current.close()
    await closeCaptureContext(audioContextRef.current)
    audioContextRef.current = null
  }, []) // No dependencies - uses refs only

  const startCall = useCallback(async (
    stream: MediaStream,
    videoRef: RefObject<HTMLVideoElement | null>,
    canvasRef: RefObject<HTMLCanvasElement | null>
  ) => {
    // Guard against multiple simultaneous connection attempts
    if (isConnectingRef.current || sessionRef.current) {
      console.log('[usePlantDoctor] startCall blocked - already connecting or connected');
      return
    }

    console.log('[usePlantDoctor] startCall invoked');
    isConnectingRef.current = true
    setIsCalling(true)
    setDiscoveryLog([])
    proposedSpeciesRef.current.clear()
    mediaThrottlerRef.current.reset()

    const proxyUrl = process.env.NEXT_PUBLIC_CLOUD_RUN_URL
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!proxyUrl && !apiKey) {
      console.error('NEXT_PUBLIC_CLOUD_RUN_URL or NEXT_PUBLIC_GEMINI_API_KEY must be configured')
      setIsCalling(false)
      return
    }

    try {
      const audioCtx = await createCaptureContext(16000)
      audioContextRef.current = audioCtx
      await audioServiceRef.current.ensureContext()

      const session = new GeminiLiveSession({
        ...(proxyUrl ? { proxyUrl: `${proxyUrl}/plant-doctor` } : { apiKey }),
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        systemInstruction: `You are the Plant Doctor performing a "Jungle Inventory" - PLANT-ONLY MODE.

CRITICAL RULES:
1. ONLY catalog and discuss visible plants. Immediately decline any non-plant topics.
2. If the user asks about anything unrelated to plants, politely redirect: "Let's focus on cataloging your amazing plants!"
3. Do NOT engage with requests about other topics.
4. When multiple plants are visible, focus on the plant centered in the on-screen targeting reticle.

GREETING PROTOCOL:
- Wait for the user to greet you. Acknowledge their greeting warmly before beginning any assessment.

INVENTORY MODE:
- The user will show you many plants one by one
- For EVERY visible plant, call propose_plant_to_inventory with details
- Grade their care habits (A-F) based on visual evidence (dust, soil moisture, leaf condition, pruning)
- Be conversational and encouraging
- Do NOT stop the session after one plant - keep going!

Environment Context: ${JSON.stringify(homeProfileRef.current)}

Output Format: Always call propose_plant_to_inventory with:
- commonName: the plant's common name
- scientificName: the botanical name (if visible/identifiable)
- healthStatus: healthy, warning, or critical (based on appearance)
- habitGrade: A-F rating for care quality
- habitFeedback: brief reason for the grade
- healthIssues: specific visible issues (yellow leaves, pests, brown tips, etc.)
- cadenceDays: estimated watering frequency in days (if visible from soil condition)
- idealConditions: light and humidity needs based on species
- lightIntensity: Low/Medium/Bright if visible
- lightQuality: Indirect/Direct if visible
- nearWindow: true/false if visible
- windowDirection: North/South/East/West if visible
- overdueThresholdMinor: Days before minor stress appears (based on species drought tolerance)
  * Drought-tolerant (succulents, cacti, snake plants): 4-5 days
  * Normal (pothos, philodendron, spider plants): 2-3 days
  * Tropical/moisture-loving (ferns, calathea, peace lily): 1-2 days
- overdueThresholdMajor: Days before serious risk requiring checkup
  * Drought-tolerant: 8-10 days
  * Normal: 5-6 days
  * Tropical: 3-4 days`,
        tools: [{ functionDeclarations: [proposePlantFunction] }],
        callbacks: {
          onOpen: async () => {
            session.sendInitialGreet("I'm ready for the grand tour! Show me your plants one by one, and I'll catalog your whole jungle.")

            // Start keepalive pings to prevent proxy timeout during setup
            keepaliveIntervalRef.current = window.setInterval(() => {
              if (sessionRef.current?.session) {
                try {
                  sessionRef.current.session.sendRealtimeInput({ parts: [{ text: ' ' }] })
                } catch { /* ignore keepalive failures */ }
              }
            }, 15000)

            mediaCleanupRef.current = await setupLiveMediaPipeline({
              stream,
              audioContext: audioCtx,
              videoRef,
              canvasRef,
              onAudioChunk: (chunk) => {
                if (!sessionRef.current?.session) return
                const pcm = GeminiLiveSession.encodeAudio(chunk)
                sessionRef.current.sendMedia(pcm, 'audio/pcm;rate=' + audioCtx.sampleRate)
              },
              onImageFrame: (base64) => {
                if (sessionRef.current?.session) {
                  sessionRef.current.sendMedia(base64, 'image/jpeg')
                }
              },
              imageWidth: 320,
              imageQuality: 0.5,
              shouldSendFrame: () => mediaThrottlerRef.current.shouldSendFrame()
            })
          },
          onMessage: async (msg) => {
            const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
            if (audio) await audioServiceRef.current.playRawChunk(GeminiLiveSession.decodeAudio(audio))

            if (msg.toolCall?.functionCalls) {
              for (const fc of msg.toolCall.functionCalls) {
                if (!toolCallLimiterRef.current.canCall(fc.name!)) {
                  console.warn(`[RATE_LIMIT] Tool '${fc.name}' exceeded rate limit (max 15 calls/min)`)
                  session.sendToolResponse(fc.id!, fc.name!, {
                    success: false,
                    error: 'Rate limit exceeded. Please slow down the catalog.'
                  })
                  continue
                }

                if (fc.name === 'propose_plant_to_inventory') {
                  const args = fc.args as Record<string, unknown>
                  const speciesKey = (args.commonName as string || '').toLowerCase().trim()
                  if (proposedSpeciesRef.current.has(speciesKey)) {
                    console.warn(`[DEDUP] Skipping duplicate plant: ${args.commonName}`)
                    session.sendToolResponse(fc.id!, fc.name!, { success: true, acknowledged: args.commonName, duplicate: true })
                    continue
                  }
                  proposedSpeciesRef.current.add(speciesKey)

                  let capturedPhoto = ''
                  if (stream.getVideoTracks().length > 0 && videoRef.current && canvasRef.current) {
                    const vid = videoRef.current
                    const can = canvasRef.current
                    const ctx = can.getContext('2d')
                    if (ctx) {
                      can.width = vid.videoWidth
                      can.height = vid.videoHeight
                      ctx.drawImage(vid, 0, 0)
                      capturedPhoto = can.toDataURL('image/jpeg', 0.8)
                    }
                  }

                  session.sendToolResponse(fc.id!, fc.name!, { success: true, acknowledged: args.commonName })
                  setLastDetectedName(args.commonName as string)
                  setDiscoveryLog(prev => [args.commonName as string, ...prev].slice(0, 5))
                  // Validate enum values from Gemini
                  const validIntensities = ['Low', 'Medium', 'Bright']
                  const validQualities = ['Indirect', 'Direct']
                  const validDirections = ['North', 'South', 'East', 'West']

                  const newPlant: Plant = {
                    id: crypto.randomUUID(),
                    name: '',
                    species: args.commonName as string,
                    photoUrl: capturedPhoto || `https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=400&auto=format&fit=crop`,
                    location: '',
                    lastWateredAt: new Date().toISOString(),
                    cadenceDays: (args.cadenceDays as number) || 7,
                    status: 'pending',
                    notes: [`Health: ${args.healthIssues}`, `Habit Grade: ${args.habitGrade}`, args.habitFeedback as string],
                    notesSessions: [[`Health: ${args.healthIssues}`, `Habit Grade: ${args.habitGrade}`, args.habitFeedback as string]],
                    notesUpdatedAt: new Date().toISOString(),
                    overdueThresholdMinor: (args.overdueThresholdMinor as number) || 2,
                    overdueThresholdMajor: (args.overdueThresholdMajor as number) || 5,
                  }

                  // Only add optional fields if they have valid values
                  if (args.idealConditions) newPlant.idealConditions = args.idealConditions as string
                  if (args.lightIntensity && validIntensities.includes(args.lightIntensity as string)) {
                    newPlant.lightIntensity = args.lightIntensity as Plant['lightIntensity']
                  }
                  if (args.lightQuality && validQualities.includes(args.lightQuality as string)) {
                    newPlant.lightQuality = args.lightQuality as Plant['lightQuality']
                  }
                  if (args.nearWindow) newPlant.nearWindow = args.nearWindow as boolean
                  if (args.nearWindow && args.windowDirection && validDirections.includes(args.windowDirection as string)) {
                    newPlant.windowDirection = args.windowDirection as Plant['windowDirection']
                  }

                  onPlantDetectedRef.current(newPlant);
                }
              }
            }
          },
          onError: (e) => {
            console.error('Plant doctor session error:', e)
            stopCall()
          },
          onClose: stopCall
        }
      })

      sessionRef.current = session
      await session.connect()
      console.log('[usePlantDoctor] Connection established successfully');
    } catch (e) {
      console.error('[usePlantDoctor] startCall error:', e);
      isConnectingRef.current = false
      stopCall()
    }
  }, [stopCall]) // stopCall is stable (no deps)

  return { isCalling, lastDetectedName, discoveryLog, startCall, stopCall }
}
