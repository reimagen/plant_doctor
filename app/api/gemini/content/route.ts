import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { Plant, HomeProfile } from '@/types'
import { TokenBucketLimiter } from '@/lib/rate-limiter'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const apiRateLimiter = new TokenBucketLimiter(10, 2) // 10 tokens, 2 refill per second

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    if (!apiRateLimiter.canConsume()) {
      console.warn(`[RATE_LIMIT] /api/gemini/content rate limit exceeded`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { type, plant, homeProfile } = body as {
      type: 'care-guide' | 'rescue-plan'
      plant: Plant
      homeProfile: HomeProfile
    }

    // Validate request type
    if (!type || !['care-guide', 'rescue-plan'].includes(type)) {
      console.warn(`[INVALID_REQUEST] Invalid request type: ${type}`)
      return NextResponse.json(
        { error: 'Invalid request type. Must be "care-guide" or "rescue-plan"' },
        { status: 400 }
      )
    }

    // Validate required plant data
    if (!plant || !plant.species) {
      console.warn(`[INVALID_REQUEST] Missing plant data`)
      return NextResponse.json(
        { error: 'Plant data with species is required' },
        { status: 400 }
      )
    }

    // Validate homeProfile
    if (!homeProfile) {
      console.warn(`[INVALID_REQUEST] Missing homeProfile`)
      return NextResponse.json(
        { error: 'Home profile is required' },
        { status: 400 }
      )
    }

    console.log(`[API_REQUEST] Processing ${type} for plant: ${plant.species}`)

    if (type === 'care-guide') {
      const tips = await generateCareGuide(plant, homeProfile)
      console.log(`[SUCCESS] care-guide generated: ${tips.length} tips`)
      return NextResponse.json({ tips })
    }

    if (type === 'rescue-plan') {
      const steps = await generateRescuePlan(plant, homeProfile)
      console.log(`[SUCCESS] rescue-plan generated: ${steps.length} steps`)
      return NextResponse.json({ steps })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[API_ERROR] /api/gemini/content failed: ${errorMessage}`)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

async function generateCareGuide(plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
  try {
    const microEnv = `Light: ${plant.lightIntensity} ${plant.lightQuality}, Near Window: ${plant.nearWindow ? 'Yes' : 'No'}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate 4 concise care tips for a ${plant.species}.
      Home Environment: ${JSON.stringify(homeProfile)}.
      Specific Placement: ${microEnv}.`,
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
    } catch (parseError) {
      console.warn(`[PARSE_ERROR] care-guide response parsing failed for ${plant.species}:`, parseError)
      return ['Keep soil moist', 'Ensure adequate light', 'Avoid drafts', 'Check regularly']
    }
  } catch (error) {
    console.error(`[GENERATION_ERROR] Failed to generate care guide for ${plant.species}:`, error)
    throw error
  }
}

async function generateRescuePlan(plant: Plant, homeProfile: HomeProfile): Promise<any[]> {
  try {
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

    console.log(`[RESCUE_PLAN] Generating for ${plant.species} - condition: ${condition}, overdue: ${isOverdue}`)

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
      // Return structured steps or fallback to simple string format
      return data.steps
    } catch (parseError) {
      console.warn(`[PARSE_ERROR] rescue-plan response parsing failed for ${plant.species}:`, parseError)
      // Fallback to structured step format
      return [
        { action: 'Check soil moisture and water if dry', phase: 'phase-1', duration: '5 min', sequencing: 1, successCriteria: 'Soil moist and assessed' },
        { action: 'Remove any dead or yellowing leaves', phase: 'phase-1', duration: '10 min', sequencing: 2, successCriteria: 'Damaged foliage removed' },
        { action: 'Adjust light exposure to bright indirect', phase: 'phase-2', duration: '5 min', sequencing: 3, successCriteria: 'Plant in appropriate light' },
        { action: 'Monitor soil moisture and growth daily', phase: 'phase-3', duration: '2 weeks', sequencing: 4, successCriteria: 'Plant shows new growth, no yellowing' }
      ]
    }
  } catch (error) {
    console.error(`[GENERATION_ERROR] Failed to generate rescue plan for ${plant.species}:`, error)
    throw error
  }
}
