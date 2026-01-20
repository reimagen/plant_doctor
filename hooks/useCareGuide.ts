'use client'

import { useCallback, useState } from 'react'
import { HomeProfile, Plant } from '@/types'

export const useCareGuide = (
  plant: Plant,
  homeProfile: HomeProfile,
  onUpdate: (id: string, updates: Partial<Plant>) => void
) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTips = useCallback(async () => {
    if (!plant.species) return
    setIsGenerating(true)
    setError(null)
    try {
      console.log(`[API_REQUEST] Generating care guide for ${plant.species}`)
      const response = await fetch('/api/gemini/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'care-guide',
          plant,
          homeProfile
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.tips && data.tips.length > 0) {
        onUpdate(plant.id, { careGuide: data.tips })
        console.log(`[SUCCESS] Care guide generated: ${data.tips.length} tips`)
      } else if (data.error) {
        setError(data.error)
        console.error(`[GENERATION_ERROR] ${data.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate tips'
      console.error(`[GENERATION_ERROR] ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }, [plant, homeProfile, onUpdate])

  return {
    isGenerating,
    error,
    generateTips,
  }
}
