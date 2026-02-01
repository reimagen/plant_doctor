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
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  const sessionRef = useRef<GeminiLiveSession | null>(null)
  const audioServiceRef = useRef(new AudioService(24000))
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

  // Live-updated rescue tasks ref to avoid stale closure in mark_rescue_task_complete
  const rescueTasksRef = useRef<Plant['rescuePlanTasks']>(undefined)

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

  const createRescuePlanFunction: FunctionDeclaration = {
    name: 'create_rescue_plan',
    parameters: {
      type: Type.OBJECT,
      description: 'Generates a detailed rescue plan with specific tasks for the plant based on assessment. Call this after you have assessed the plant and identified what needs to be done.',
      properties: {
        summary: { type: Type.STRING, description: 'Brief summary of the plant\'s condition and why the plan is needed' }
      },
      required: ['summary']
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
    await audioServiceRef.current.close()
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
    rescueTasksRef.current = plant.rescuePlanTasks

    const proxyUrl = process.env.NEXT_PUBLIC_CLOUD_RUN_URL
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!proxyUrl && !apiKey) {
      console.error('NEXT_PUBLIC_CLOUD_RUN_URL or NEXT_PUBLIC_GEMINI_API_KEY must be configured')
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

GREETING PROTOCOL:
- Wait for the user to greet you. Acknowledge their greeting warmly before beginning any assessment.

Instructions:
- Analyze the video feed for leaves, soil, stems, and overall plant condition
- If there is no rescue plan yet (Current Tasks: None), assess the plant and then use create_rescue_plan to generate a detailed recovery plan
- If the plant appears to have recovered, use verify_rehab_success
- When the user mentions completing any rescue plan task, use mark_rescue_task_complete
- When all Phase 1 (First Aid) tasks are completed, congratulate the user and tell them: "Your first aid is complete! Check your Plant Detail page for the monitoring steps to continue your plant's recovery."
- Ask clarifying questions about the plant's appearance and care activities
- Provide encouragement and plant-specific guidance

Home Environment: ${JSON.stringify(homeProfileRef.current)}`

      const session = new GeminiLiveSession({
        ...(proxyUrl ? { proxyUrl: `${proxyUrl}/rehab-specialist` } : { apiKey }),
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        systemInstruction,
        tools: [{ functionDeclarations: [createRescuePlanFunction, verifyRehabFunction, markRescueTaskCompleteFunction] }],
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
                  const sessionNotes = [
                    ...(args.observedSymptoms ? [`Observation: ${args.observedSymptoms}`] : []),
                    ...(args.recoveryNote ? [args.recoveryNote as string] : [])
                  ].slice(0, 3)
                  const existingSessions = plant.notesSessions || (plant.notes ? [plant.notes] : [])
                  const notesSessions = [sessionNotes, ...existingSessions].slice(0, 3)
                  onUpdateRef.current(plant.id, {
                    status: args.newStatus as 'healthy' | 'warning',
                    needsCheckIn: !(args.success as boolean),
                    notes: notesSessions.flat(),
                    notesSessions,
                    notesUpdatedAt: new Date().toISOString()
                  })
                  setLastVerifiedId(plant.id)
                  session.sendToolResponse(fc.id!, fc.name!, { confirmed: true })
                } else if (fc.name === 'mark_rescue_task_complete') {
                  const args = fc.args as Record<string, unknown>
                  const taskDescription = args.taskDescription as string

                  // Find the single best-matching task (not already completed)
                  let bestMatch: { task: any; score: number } | null = null
                  const taskLower = taskDescription.toLowerCase()

                  const currentTasks = rescueTasksRef.current || plant.rescuePlanTasks || []
                  for (const task of currentTasks) {
                    if (task.completed) continue // Skip already-completed tasks

                    const descLower = task.description.toLowerCase()
                    let matchScore = 0

                    // Exact match (highest priority)
                    if (taskLower === descLower) {
                      matchScore = 1000
                    }
                    // Contains entire task description (high priority)
                    else if (taskLower.includes(descLower)) {
                      matchScore = 100
                    }
                    // Task contains entire AI description (high priority)
                    else if (descLower.includes(taskLower)) {
                      matchScore = 100
                    }
                    // Significant word overlap (medium priority)
                    else {
                      const aiWords = taskLower.split(/\s+/)
                      const taskWords = descLower.split(/\s+/)
                      const matchedWords = aiWords.filter(word => taskWords.some(tw => tw.includes(word) || word.includes(tw)))
                      if (matchedWords.length >= Math.min(aiWords.length, taskWords.length) * 0.5) {
                        matchScore = 50
                      }
                    }

                    if (matchScore > (bestMatch?.score || 0)) {
                      bestMatch = { task, score: matchScore }
                    }
                  }

                  const completedTask = bestMatch?.task
                  const updatedTasks = currentTasks.map(task =>
                    task.id === completedTask?.id ? { ...task, completed: true } : task
                  )
                  rescueTasksRef.current = updatedTasks

                  const updates: Partial<Plant> = { rescuePlanTasks: updatedTasks }

                  // Check if this is a watering task (phase-1 watering-related task)
                  const isWateringTask = completedTask &&
                    completedTask.phase === 'phase-1' &&
                    /water|hydrat|soak|drench/.test(completedTask.description.toLowerCase())

                  // If watering task is completed, update last watered date
                  if (isWateringTask) {
                    console.log(`[RESCUE] Watering task completed for ${plant.name} - updating lastWateredAt`)
                    updates.lastWateredAt = new Date().toISOString()
                  }

                  // Check if all phase-1 tasks are now complete
                  const phase1Tasks = updatedTasks.filter(t => t.phase === 'phase-1')
                  const allPhase1Complete = phase1Tasks.length > 0 && phase1Tasks.every(t => t.completed)

                  // Only flip to warning after ALL phase-1 tasks are completed
                  if (allPhase1Complete && plant.status === 'critical') {
                    console.log(`[RESCUE] All phase-1 tasks completed for ${plant.name} - flipping status from critical to warning`)
                    updates.status = 'warning'
                  }

                  onUpdateRef.current(plant.id, updates);
                  session.sendToolResponse(fc.id!, fc.name!, {
                    success: true,
                    message: args.confirmationMessage || "Great! I've recorded that task as complete."
                  });
                } else if (fc.name === 'create_rescue_plan') {
                  console.log(`[RESCUE_PLAN] Starting rescue plan creation for plant: ${plant.name || plant.species} (ID: ${plant.id})`)
                  console.log(`[RESCUE_PLAN] onUpdateRef.current:`, typeof onUpdateRef.current, onUpdateRef.current)
                  console.log(`[RESCUE_PLAN] homeProfileRef.current:`, homeProfileRef.current)
                  let keepaliveInterval;
                  try {
                    setIsGeneratingPlan(true)
                    // Send keepalive pings to prevent WebSocket timeout during long API call
                    keepaliveInterval = window.setInterval(() => {
                      if (session.session) {
                        try {
                          session.session.sendRealtimeInput({ parts: [{ text: ' ' }] })
                        } catch { /* ignore keepalive failures */ }
                      }
                    }, 15000)

                    console.log(`[RESCUE_PLAN] Making API request to /api/gemini/content`)
                    const response = await fetch('/api/gemini/content', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'rescue-plan',
                        plant,
                        homeProfile: homeProfileRef.current
                      })
                    })

                    console.log(`[RESCUE_PLAN] API response status:`, response.status, response.statusText)

                    if (response.ok) {
                      const data = await response.json()
                      console.log(`[RESCUE_PLAN] API response data:`, data)

                      if (data.steps && data.steps.length > 0) {
                        console.log(`[RESCUE_PLAN] Processing ${data.steps.length} steps`)
                        const tasks = data.steps.map((step: any, index: number) => ({
                          id: `task-${Date.now()}-${index}`,
                          description: typeof step === 'string' ? step : step.action || step.description || 'Unknown step',
                          completed: false,
                          phase: step.phase,
                          duration: step.duration,
                          sequencing: step.sequencing || index + 1,
                          successCriteria: step.successCriteria
                        }))

                        console.log(`[RESCUE_PLAN] Generated tasks:`, tasks)
                        console.log(`[RESCUE_PLAN] Calling onUpdateRef.current with plant ID ${plant.id}`)

                        rescueTasksRef.current = tasks
                        onUpdateRef.current(plant.id, { rescuePlanTasks: tasks })

                        console.log(`[RESCUE_PLAN] onUpdateRef.current called successfully`)

                        session.sendToolResponse(fc.id!, fc.name!, {
                          success: true,
                          taskCount: tasks.length,
                          message: `Rescue plan created with ${tasks.length} tasks`
                        })
                      } else {
                        console.log(`[RESCUE_PLAN] ERROR: No steps in API response or empty steps array`)
                        console.log(`[RESCUE_PLAN] data.steps:`, data.steps)
                        session.sendToolResponse(fc.id!, fc.name!, {
                          success: false,
                          error: 'Failed to generate rescue plan steps'
                        })
                      }
                    } else {
                      console.log(`[RESCUE_PLAN] ERROR: API request failed with status ${response.status}`)
                      const errorText = await response.text()
                      console.log(`[RESCUE_PLAN] Error response:`, errorText)
                      session.sendToolResponse(fc.id!, fc.name!, {
                        success: false,
                        error: 'API error generating rescue plan'
                      })
                    }
                  } catch (error) {
                    console.error(`[RESCUE_PLAN] EXCEPTION:`, error)
                    session.sendToolResponse(fc.id!, fc.name!, {
                      success: false,
                      error: 'Error generating rescue plan'
                    })
                  } finally {
                    clearInterval(keepaliveInterval)
                    setIsGeneratingPlan(false)
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

  return { isCalling, lastVerifiedId, isGeneratingPlan, startRehabCall, stopCall }
}
