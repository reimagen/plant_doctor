'use client'

import { useCallback, useEffect, useState } from 'react'
import { HomeProfile, Plant, RescueTask } from '@/types'

export const useRescuePlan = (
  plant: Plant,
  homeProfile: HomeProfile,
  onUpdate: (id: string, updates: Partial<Plant>) => void,
  isOverdue: boolean
) => {
  const [isRescueGenerating, setIsRescueGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateRescuePlan = useCallback(async () => {
    if (!plant.species) return
    setIsRescueGenerating(true)
    setError(null)
    try {
      console.log(`[API_REQUEST] Generating rescue plan for ${plant.species}`)
      const response = await fetch('/api/gemini/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rescue-plan',
          plant,
          homeProfile
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.steps && data.steps.length > 0) {
        const tasks: RescueTask[] = data.steps.map((step: string, index: number) => ({
          id: `task-${Date.now()}-${index}`,
          description: step,
          completed: false
        }))
        onUpdate(plant.id, {
          rescuePlan: data.steps,
          rescuePlanTasks: tasks
        })
        console.log(`[SUCCESS] Rescue plan generated: ${data.steps.length} steps`)
      } else if (data.error) {
        setError(data.error)
        console.error(`[GENERATION_ERROR] ${data.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate rescue plan'
      console.error(`[GENERATION_ERROR] ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setIsRescueGenerating(false)
    }
  }, [plant, homeProfile, onUpdate])

  useEffect(() => {
    const needsRescuePlan =
      (isOverdue || plant.status === 'warning' || plant.status === 'critical') &&
      (!plant.rescuePlanTasks || plant.rescuePlanTasks.length === 0)

    if (!isRescueGenerating && plant.species && needsRescuePlan) {
      generateRescuePlan()
    }
  }, [
    isOverdue,
    plant.status,
    plant.species,
    plant.rescuePlanTasks,
    isRescueGenerating,
    generateRescuePlan,
  ])

  const handleTaskComplete = useCallback((taskId: string, completed: boolean) => {
    const updatedTasks = (plant.rescuePlanTasks || []).map(task =>
      task.id === taskId ? { ...task, completed } : task
    )
    onUpdate(plant.id, { rescuePlanTasks: updatedTasks })
  }, [plant.rescuePlanTasks, plant.id, onUpdate])

  return {
    isRescueGenerating,
    error,
    generateRescuePlan,
    handleTaskComplete,
  }
}
