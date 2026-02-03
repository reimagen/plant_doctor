import { onRequest } from 'firebase-functions/v2/https'
import { GoogleGenAI, Type } from '@google/genai'
import { defineString } from 'firebase-functions/params'

const geminiApiKey = defineString('GEMINI_API_KEY')

interface Plant {
  species: string
  status: string
  lastWateredAt?: string
  cadenceDays: number
  lightIntensity?: string
  lightQuality?: string
  nearWindow?: boolean
  windowDirection?: string
  idealConditions?: string
  notes?: string[]
}

interface HomeProfile {
  heatedHome: boolean
  humidity: string
  temp: string
  light: string
  hemisphere: string
  seasonMode: string
}

interface RescuePlanStep {
  action: string
  phase: 'phase-1' | 'phase-2' | 'phase-3'
  duration?: string
  sequencing?: number
  successCriteria?: string
}

// Simple rate limiter
let tokens = 10
let lastRefill = Date.now()
function canConsume(): boolean {
  const now = Date.now()
  const elapsed = (now - lastRefill) / 1000
  tokens = Math.min(10, tokens + elapsed * 2)
  lastRefill = now
  if (tokens >= 1) {
    tokens -= 1
    return true
  }
  return false
}

export const geminiContent = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!canConsume()) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
    return
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() })

  try {
    const { type, plant, homeProfile } = req.body as {
      type: 'care-guide' | 'rescue-plan'
      plant: Plant
      homeProfile: HomeProfile
    }

    if (!type || !['care-guide', 'rescue-plan'].includes(type)) {
      res.status(400).json({ error: 'Invalid request type' })
      return
    }

    if (!plant || !plant.species) {
      res.status(400).json({ error: 'Plant data with species is required' })
      return
    }

    if (!homeProfile) {
      res.status(400).json({ error: 'Home profile is required' })
      return
    }

    console.log(`[API_REQUEST] Processing ${type} for plant: ${plant.species}`)

    if (type === 'care-guide') {
      const tips = await generateCareGuide(ai, plant, homeProfile)
      console.log(`[SUCCESS] care-guide generated: ${tips.length} tips`)
      res.json({ tips })
      return
    }

    if (type === 'rescue-plan') {
      const steps = await generateRescuePlan(ai, plant, homeProfile)
      console.log(`[SUCCESS] rescue-plan generated: ${steps.length} steps`)
      res.json({ steps })
      return
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[API_ERROR] /api/gemini/content failed: ${errorMessage}`)
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

async function generateCareGuide(ai: GoogleGenAI, plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
  const microEnv = `Light: ${plant.lightIntensity} ${plant.lightQuality}, Near Window: ${plant.nearWindow ? 'Yes' : 'No'}`
  const healthNotes = plant.notes && plant.notes.length > 0 ? plant.notes.join(' | ') : 'None provided'
  const idealConditions = plant.idealConditions || 'None provided'

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Generate 4 concise care tips for a ${plant.species}.
      Home Environment: ${JSON.stringify(homeProfile)}.
      Specific Placement: ${microEnv}.
      Ideal Conditions: ${idealConditions}.
      Health Notes: ${healthNotes}.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['tips']
      }
    },
  })

  try {
    const data = JSON.parse(response.text || '{"tips":[]}')
    return data.tips
  } catch {
    return ['Keep soil moist', 'Ensure adequate light', 'Avoid drafts', 'Check regularly']
  }
}

async function generateRescuePlan(ai: GoogleGenAI, plant: Plant, homeProfile: HomeProfile): Promise<RescuePlanStep[]> {
  const lastDate = plant.lastWateredAt ? new Date(plant.lastWateredAt) : null
  const nextDate = lastDate ? new Date(lastDate) : null
  if (nextDate && lastDate) {
    nextDate.setDate(lastDate.getDate() + plant.cadenceDays)
  }
  const isOverdue = nextDate ? nextDate.getTime() < Date.now() : false

  const condition = isOverdue
    ? 'Severely Dehydrated (Overdue Water)'
    : `Showing Physical Distress (Status: ${plant.status})`
  const microEnv = `Light: ${plant.lightIntensity} ${plant.lightQuality}, Near Window: ${plant.nearWindow ? 'Yes' : 'No'}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `This ${plant.species} needs a rescue plan.
      CURRENT CONDITION: ${condition}.
      LAST WATERED: ${plant.lastWateredAt} (Cadence: every ${plant.cadenceDays} days).
      HOME ENVIRONMENT: ${JSON.stringify(homeProfile)}.
      PLACEMENT: ${microEnv}.

      CRITICAL INSTRUCTION: If the condition is DEHYDRATED, do NOT mention root rot; focus on gradual rehydration.
      If the condition is PHYSICAL DISTRESS but NOT overdue, consider overwatering/root rot.

      Generate a 3-5 step 'Rescue Protocol' organized into phases:
      - phase-1: Immediate first aid (water, prune damaged leaves, increase humidity)
      - phase-2: Recovery support (relocation, observation, adjustments after 1-2 days)
      - phase-3: Ongoing maintenance (daily/weekly monitoring for 2+ weeks)
      Return structured steps with phase, duration, and success criteria.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                phase: { type: Type.STRING, enum: ['phase-1', 'phase-2', 'phase-3'] },
                duration: { type: Type.STRING },
                sequencing: { type: Type.NUMBER },
                successCriteria: { type: Type.STRING }
              },
              required: ['action', 'phase']
            }
          }
        },
        required: ['steps']
      }
    },
  })

  try {
    const data = JSON.parse(response.text || '{"steps":[]}')
    return data.steps
  } catch {
    return [
      { action: 'Check soil moisture and water if dry', phase: 'phase-1', duration: '5 min', sequencing: 1, successCriteria: 'Soil moist and assessed' },
      { action: 'Remove any dead or yellowing leaves', phase: 'phase-1', duration: '10 min', sequencing: 2, successCriteria: 'Damaged foliage removed' },
      { action: 'Adjust light exposure to bright indirect', phase: 'phase-2', duration: '5 min', sequencing: 3, successCriteria: 'Plant in appropriate light' },
      { action: 'Monitor soil moisture and growth daily', phase: 'phase-3', duration: '2 weeks', sequencing: 4, successCriteria: 'Plant shows new growth, no yellowing' }
    ]
  }
}
