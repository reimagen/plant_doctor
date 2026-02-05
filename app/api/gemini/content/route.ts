import { NextRequest, NextResponse } from 'next/server'
import geminiConfig from '@/functions/shared/gemini-config.json'

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const { cloudFunctionRegion, cloudFunctionName } = geminiConfig.api

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Call the Firebase Cloud Function
    const functionUrl = `https://${cloudFunctionRegion}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/${cloudFunctionName}`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate content' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API_ROUTE] /api/gemini/content error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
