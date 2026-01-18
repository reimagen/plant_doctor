import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { Plant, HomeProfile } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, plant, homeProfile } = body as {
      type: 'care-guide' | 'rescue-plan'
      plant: Plant
      homeProfile: HomeProfile
    }

    if (type === 'care-guide') {
      const tips = await generateCareGuide(plant, homeProfile)
      return NextResponse.json({ tips })
    }

    if (type === 'rescue-plan') {
      const steps = await generateRescuePlan(plant, homeProfile)
      return NextResponse.json({ steps })
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}

async function generateCareGuide(plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
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
  } catch {
    return ['Keep soil moist', 'Ensure adequate light', 'Avoid drafts', 'Check regularly']
  }
}

async function generateRescuePlan(plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
  const lastDate = new Date(plant.lastWateredAt)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + plant.cadenceDays)
  const isOverdue = nextDate.getTime() < Date.now()

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
    Generate a 3-step 'Rescue Protocol' (concise strings).`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
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
    return ['Check soil moisture immediately', 'Remove any dead or yellowing leaves', 'Adjust light exposure']
  }
}
