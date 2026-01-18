'use client'

import { useState, useRef, useCallback } from 'react'
import { Type, FunctionDeclaration } from '@google/genai'
import { HomeProfile, Plant } from '@/types'
import { GeminiLiveSession } from '@/lib/gemini-live'
import { AudioService } from '@/lib/audio-service'
import { ToolCallRateLimiter } from '@/lib/rate-limiter'

export const useRehabSpecialist = (homeProfile: HomeProfile, onUpdate: (id: string, updates: Partial<Plant>) => void) => {
  const [isCalling, setIsCalling] = useState(false)
  const [lastVerifiedId, setLastVerifiedId] = useState<string | null>(null)

  const sessionRef = useRef<GeminiLiveSession | null>(null)
  const audioServiceRef = useRef(new AudioService(24000))
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const muteGainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const toolCallLimiterRef = useRef(new ToolCallRateLimiter(10, 60000))

  const verifyRehabFunction: FunctionDeclaration = {
    name: 'verify_rehab_success',
    parameters: {
      type: Type.OBJECT,
      description: 'Confirms the plant has recovered.',
      properties: {
        success: { type: Type.BOOLEAN },
        newStatus: { type: Type.STRING, enum: ['healthy', 'warning'] },
        recoveryNote: { type: Type.STRING },
        observedSymptoms: { type: Type.STRING, description: 'Any remaining or new visible issues (e.g. still yellow, new growth).' },
        updatedCadence: { type: Type.NUMBER }
      },
      required: ['success', 'newStatus']
    }
  }

  const markRescueTaskCompleteFunction: FunctionDeclaration = {
    name: 'mark_rescue_task_complete',
    parameters: {
      type: Type.OBJECT,
      description: 'Records that the user has completed a rescue plan task. Call this when the user mentions completing any action from the rescue plan.',
      properties: {
        taskDescription: { type: Type.STRING, description: 'The description of the task the user just completed' },
        confirmationMessage: { type: Type.STRING, description: 'A brief acknowledgment message for the user' }
      },
      required: ['taskDescription']
    }
  }

  const stopCall = useCallback(async () => {
    if (!isCalling) return
    setIsCalling(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (workletRef.current) {
      workletRef.current.port.onmessage = null
      workletRef.current.disconnect()
      workletRef.current = null
    }
    if (muteGainRef.current) {
      muteGainRef.current.disconnect()
      muteGainRef.current = null
    }
    sessionRef.current?.close()
    sessionRef.current = null
    await audioServiceRef.current.close()
    if (audioContextRef.current?.state !== 'closed') {
      await audioContextRef.current?.close()
    }
  }, [isCalling])

  const startRehabCall = async (
    stream: MediaStream,
    plant: Plant,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>
  ) => {
    if (isCalling) return
    setIsCalling(true)

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GEMINI_API_KEY not configured')
      setIsCalling(false)
      return
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      await audioCtx.resume()
      audioContextRef.current = audioCtx
      await audioServiceRef.current.ensureContext()

      const systemInstruction = `REHAB CLINIC MODE - PLANT-ONLY FOCUS. You are verifying the recovery of "${plant.name || plant.species}".

CRITICAL RULES:
1. ONLY discuss plant health, recovery, and care. Immediately decline any non-plant topics.
2. If the user asks about anything unrelated to this plant or general plant care, politely redirect: "I'm here to help with your ${plant.name || plant.species}. Let's focus on its recovery."
3. Do NOT engage with requests about other topics.

Plant Context:
- Species: ${plant.species}
- Current Status: ${plant.status}
- Recovery History: It was previously in ${plant.status} condition.
- Current Tasks: ${plant.rescuePlanTasks?.map(t => (t.completed ? `[✓] ${t.description}` : `[ ] ${t.description}`)).join(', ') || 'None'}
 - Location: ${plant.location}
 - Light: ${plant.lightIntensity || 'unknown'} ${plant.lightQuality || ''}
 - Near Window: ${plant.nearWindow ? `Yes (${plant.windowDirection || 'unknown'})` : 'No'}
 - Watering Cadence: every ${plant.cadenceDays} days

Instructions:
- Analyze the video feed for leaves, soil, stems, and overall plant condition
- If the plant appears to have recovered, use verify_rehab_success
- When the user mentions completing any rescue plan task, use mark_rescue_task_complete
- Ask clarifying questions about the plant's appearance and care activities
- Provide encouragement and plant-specific guidance

Home Environment: ${JSON.stringify(homeProfile)}`

      const session = new GeminiLiveSession({
        apiKey,
        model: 'gemini-2.5-flash-preview-native-audio-dialog',
        systemInstruction,
        tools: [{ functionDeclarations: [verifyRehabFunction, markRescueTaskCompleteFunction] }],
        callbacks: {
          onOpen: async () => {
            session.sendInitialGreet(`Hello! I'm here to check on ${plant.name || plant.species}. Please show me its current condition.`)

            const source = audioCtx.createMediaStreamSource(stream)
            await audioCtx.audioWorklet.addModule('/pcm-capture-worklet.js')
            const worklet = new AudioWorkletNode(audioCtx, 'pcm-capture-processor')
            workletRef.current = worklet
            const muteGain = audioCtx.createGain()
            muteGain.gain.value = 0
            muteGainRef.current = muteGain

            worklet.port.onmessage = (event) => {
              if (!session.session) return
              console.log(`[MainThread] Received PCM packet from worklet, length: ${event.data.length}`);
              const pcm = GeminiLiveSession.encodeAudio(event.data as Float32Array)
              session.sendMedia(pcm, 'audio/pcm;rate=' + audioCtx.sampleRate)
            }

            source.connect(worklet)
            worklet.connect(muteGain)
            muteGain.connect(audioCtx.destination)

            const hasVideo = stream.getVideoTracks().length > 0
            if (hasVideo && videoRef.current && canvasRef.current) {
              const video = videoRef.current
              const canvas = canvasRef.current
              intervalRef.current = window.setInterval(() => {
                const ctx = canvas.getContext('2d')
                if (!ctx || !session.session) return

                canvas.width = 320
                canvas.height = (320 * video.videoHeight) / video.videoWidth
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                canvas.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1]
                      session.sendMedia(base64, 'image/jpeg')
                    }
                    reader.readAsDataURL(blob)
                  }
                }, 'image/jpeg', 0.4)
              }, 1000)
            }
          },
          onMessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
            if (audioData) {
              await audioServiceRef.current.playRawChunk(GeminiLiveSession.decodeAudio(audioData))
            }

            if (msg.toolCall?.functionCalls) {
              for (const fc of msg.toolCall.functionCalls) {
                if (!toolCallLimiterRef.current.canCall(fc.name!)) {
                  console.warn(`[RATE_LIMIT] Tool '${fc.name}' exceeded rate limit (max 10 calls/min)`)
                  session.sendToolResponse(fc.id!, fc.name!, {
                    success: false,
                    error: 'Rate limit exceeded for this action. Please try again later.'
                  })
                  continue
                }

                if (fc.name === 'verify_rehab_success') {
                  const args = fc.args as Record<string, unknown>
                  onUpdate(plant.id, {
                    status: args.newStatus as 'healthy' | 'warning',
                    needsCheckIn: !(args.success as boolean),
                    notes: [
                      ...(args.observedSymptoms ? [`Observation: ${args.observedSymptoms}`] : []),
                      ...(args.recoveryNote ? [args.recoveryNote as string] : []),
                      ...(plant.notes || [])
                    ]
                  })
                  setLastVerifiedId(plant.id)
                  session.sendToolResponse(fc.id!, fc.name!, { confirmed: true })
                } else if (fc.name === 'mark_rescue_task_complete') {
                  const args = fc.args as Record<string, unknown>
                  const taskDescription = args.taskDescription as string
                  const updatedTasks = (plant.rescuePlanTasks || []).map(task => {
                    const taskMatch = taskDescription.toLowerCase().includes(task.description.toLowerCase()) ||
                                     task.description.toLowerCase().includes(taskDescription.toLowerCase())
                    return taskMatch ? { ...task, completed: true } : task
                  })
                  onUpdate(plant.id, { rescuePlanTasks: updatedTasks });
                  session.sendToolResponse(fc.id!, fc.name!, {
                    success: true,
                    message: args.confirmationMessage || "Great! I've recorded that task as complete."
                  });
                }
              }
            }
          },
          onError: (e) => {
            console.error('Rehab session error:', e)
            stopCall()
          },
          onClose: stopCall
        }
      })

      sessionRef.current = session
      await session.connect()

    } catch (e) {
      console.error('Rehab Start Failed:', e)
      stopCall()
    }
  }

  return { isCalling, lastVerifiedId, startRehabCall, stopCall }
}
