'use client'

import { useState, useRef, useCallback } from 'react'
import { Type, FunctionDeclaration } from '@google/genai'
import { HomeProfile, Plant, LivestreamNotification } from '@/types'
import { GeminiLiveSession } from '@/lib/gemini-live'
import { ToolCallRateLimiter } from '@/lib/rate-limiter'

export const useRehabSpecialist = (
  homeProfile: HomeProfile,
  onUpdate: (id: string, updates: Partial<Plant>) => void,
  onNotification?: (n: LivestreamNotification) => void
) => {
  const [isCalling, setIsCalling] = useState(false)
  const [lastVerifiedId, setLastVerifiedId] = useState<string | null>(null)

  const sessionRef = useRef<GeminiLiveSession | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const muteGainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const toolCallLimiterRef = useRef(new ToolCallRateLimiter(10, 60000))
  const isConnectingRef = useRef(false) // Guard against multiple connection attempts

  const homeProfileRef = useRef(homeProfile)
  homeProfileRef.current = homeProfile

  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const onNotificationRef = useRef(onNotification)
  onNotificationRef.current = onNotification

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

  const generateRescuePlanFunction: FunctionDeclaration = {
    name: 'generate_rescue_plan',
    parameters: {
      type: Type.OBJECT,
      description: 'Generates a rescue plan for a plant that needs immediate care. Call this when you identify a plant needs a rescue protocol but does not have one yet.',
      properties: {
        reason: { type: Type.STRING, description: 'Why this plant needs a rescue plan' }
      },
      required: ['reason']
    }
  }

  const stopCall = useCallback(async () => {
    // Use ref check to avoid depending on isCalling state
    if (!sessionRef.current && !isConnectingRef.current) return

    console.log('[useRehabSpecialist] stopCall invoked');
    isConnectingRef.current = false
    setIsCalling(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
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
    if (audioContextRef.current?.state !== 'closed') {
      await audioContextRef.current?.close()
      audioContextRef.current = null
    }
  }, []) // No dependencies - uses refs only

  const startRehabCall = useCallback(async (
    stream: MediaStream,
    plant: Plant,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>
  ) => {
    // Guard against multiple simultaneous connection attempts
    if (isConnectingRef.current || sessionRef.current) {
      console.log('[useRehabSpecialist] startRehabCall blocked - already connecting or connected');
      return
    }

    console.log('[useRehabSpecialist] startRehabCall invoked');
    isConnectingRef.current = true
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

      const systemInstruction = `REHAB CLINIC MODE - PLANT-ONLY FOCUS. You are verifying the recovery of "${plant.name || plant.species}".

CRITICAL RULES:
1. ONLY discuss plant health, recovery, and care. Immediately decline any non-plant topics.
2. If the user asks about anything unrelated to this plant or general plant care, politely redirect: "I'm here to help with your ${plant.name || plant.species}. Let's focus on its recovery."
3. Do NOT engage with requests about other topics.

Plant Context:
- Species: ${plant.species}
- Current Status: ${plant.status}
- Recovery History: It was previously in ${plant.status} condition.
- Has Rescue Plan: ${(plant.rescuePlanTasks && plant.rescuePlanTasks.length > 0) ? 'Yes' : 'No'}
- Current Tasks: ${plant.rescuePlanTasks?.map(t => (t.completed ? `[✓] ${t.description}` : `[ ] ${t.description}`)).join(', ') || 'None'}
 - Location: ${plant.location}
 - Light: ${plant.lightIntensity || 'unknown'} ${plant.lightQuality || ''}
 - Near Window: ${plant.nearWindow ? `Yes (${plant.windowDirection || 'unknown'})` : 'No'}
 - Watering Cadence: every ${plant.cadenceDays} days

Instructions:
- If this plant is in critical or warning status and does NOT have a rescue plan, use generate_rescue_plan to create one before proceeding with rehab verification.
- Analyze the video feed for leaves, soil, stems, and overall plant condition
- If the plant appears to have recovered, use verify_rehab_success
- When the user mentions completing any rescue plan task, use mark_rescue_task_complete
- Ask clarifying questions about the plant's appearance and care activities
- Provide encouragement and plant-specific guidance

Home Environment: ${JSON.stringify(homeProfileRef.current)}`

      const session = new GeminiLiveSession({
        apiKey,
        model: 'gemini-2.0-flash-exp',
        systemInstruction,
        tools: [{ functionDeclarations: [verifyRehabFunction, markRescueTaskCompleteFunction, generateRescuePlanFunction] }],
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
              const pcm = GeminiLiveSession.encodeAudio(event.data as Float32Array)
              session.sendMedia(pcm, 'audio/pcm;rate=' + audioCtx.sampleRate)
            }

            source.connect(worklet)
            worklet.connect(muteGain)
            muteGain.connect(audioCtx.destination)

            if (videoRef.current && canvasRef.current) {
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
                  const newStatus = args.newStatus as 'healthy' | 'warning'
                  onUpdateRef.current(plant.id, {
                    status: newStatus,
                    needsCheckIn: !(args.success as boolean),
                    notes: [
                      ...(args.observedSymptoms ? [`Observation: ${args.observedSymptoms}`] : []),
                      ...(args.recoveryNote ? [args.recoveryNote as string] : []),
                      ...(plant.notes || [])
                    ]
                  })
                  setLastVerifiedId(plant.id)
                  session.sendToolResponse(fc.id!, fc.name!, { confirmed: true })

                  // Emit status change notification
                  onNotificationRef.current?.({
                    id: crypto.randomUUID(),
                    type: 'status_change',
                    message: `Status: ${newStatus}`,
                    emoji: newStatus === 'healthy' ? '💚' : '⚠️',
                    timestamp: Date.now()
                  })
                } else if (fc.name === 'mark_rescue_task_complete') {
                  const args = fc.args as Record<string, unknown>
                  const taskDescription = args.taskDescription as string
                  const updatedTasks = (plant.rescuePlanTasks || []).map(task => {
                    const taskMatch = taskDescription.toLowerCase().includes(task.description.toLowerCase()) ||
                                     task.description.toLowerCase().includes(taskDescription.toLowerCase())
                    return taskMatch ? { ...task, completed: true } : task
                  })
                  onUpdateRef.current(plant.id, { rescuePlanTasks: updatedTasks });
                  session.sendToolResponse(fc.id!, fc.name!, {
                    success: true,
                    message: args.confirmationMessage || "Great! I've recorded that task as complete."
                  });

                  // Emit task complete notification
                  onNotificationRef.current?.({
                    id: crypto.randomUUID(),
                    type: 'task_complete',
                    message: 'Task completed',
                    emoji: '✅',
                    timestamp: Date.now()
                  })
                } else if (fc.name === 'generate_rescue_plan') {
                  const args = fc.args as Record<string, unknown>
                  const reason = args.reason as string

                  // Fetch rescue plan from API
                  try {
                    const response = await fetch('/api/gemini/content', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'rescue-plan',
                        plant,
                        homeProfile: homeProfileRef.current,
                      }),
                    })

                    if (response.ok) {
                      const data = await response.json()
                      if (data.tasks && data.tasks.length > 0) {
                        onUpdateRef.current(plant.id, {
                          rescuePlanTasks: data.tasks,
                          rescuePlan: data.tasks.map((t: { description: string }) => t.description)
                        })

                        // Emit notification about plan generation
                        onNotificationRef.current?.({
                          id: crypto.randomUUID(),
                          type: 'observation',
                          message: 'Rescue plan generated',
                          emoji: '📋',
                          timestamp: Date.now()
                        })

                        session.sendToolResponse(fc.id!, fc.name!, {
                          success: true,
                          message: `Rescue plan created with ${data.tasks.length} tasks. Reason: ${reason}`
                        })
                      } else {
                        session.sendToolResponse(fc.id!, fc.name!, {
                          success: false,
                          error: 'No tasks generated'
                        })
                      }
                    } else {
                      session.sendToolResponse(fc.id!, fc.name!, {
                        success: false,
                        error: 'Failed to generate rescue plan'
                      })
                    }
                  } catch (error) {
                    console.error('Error generating rescue plan:', error)
                    session.sendToolResponse(fc.id!, fc.name!, {
                      success: false,
                      error: 'Error generating rescue plan'
                    })
                  }
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
      console.log('[useRehabSpecialist] Connection established successfully');

    } catch (e) {
      console.error('[useRehabSpecialist] startRehabCall error:', e)
      isConnectingRef.current = false
      stopCall()
    }
  }, [stopCall]) // stopCall is stable (no deps)

  return { isCalling, lastVerifiedId, startRehabCall, stopCall }
}
