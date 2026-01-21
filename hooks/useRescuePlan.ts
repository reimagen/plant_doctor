'use client'

import { useCallback, useEffect, useState } from 'react'
import { HomeProfile, Plant, RescueTask } from '@/types'

export const useRescuePlan = (
  plant: Plant,
  homeProfile: HomeProfile,
  onUpdate: (id: string, updates: Partial<Plant>) => void
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
        const tasks: RescueTask[] = data.steps.map((step: any, index: number) => ({
          id: `task-${Date.now()}-${index}`,
          description: typeof step === 'string' ? step : step.action || step.description || 'Unknown step',
          completed: false,
          phase: step.phase,
          duration: step.duration,
          sequencing: step.sequencing || index + 1,
          successCriteria: step.successCriteria
        }))
        // Extract plain text for rescuePlan array (for backward compatibility)
        const planTexts = data.steps.map((step: any) => typeof step === 'string' ? step : step.action || step.description || '')
        onUpdate(plant.id, {
          rescuePlan: planTexts,
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
    // Only auto-generate rescue plans for critical plants
    const needsRescuePlan =
      plant.status === 'critical' &&
      (!plant.rescuePlanTasks || plant.rescuePlanTasks.length === 0)

    if (!isRescueGenerating && plant.species && needsRescuePlan) {
      generateRescuePlan()
    }
  }, [
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

    // Find the task being completed
    const completedTask = updatedTasks.find(task => task.id === taskId)

    // Check if this is a watering task (phase-1 watering-related task)
    const isWateringTask = completedTask &&
      completedTask.phase === 'phase-1' &&
      /water|hydrat|soak|drench/.test(completedTask.description.toLowerCase())

    // Check if this is the first task being completed
    const hadNoCompletedTasks = !plant.rescuePlanTasks?.some(task => task.completed)
    const nowHasCompletedTasks = updatedTasks.some(task => task.completed)
    const wasFirstTaskCompleted = hadNoCompletedTasks && nowHasCompletedTasks

    const updates: Partial<Plant> = { rescuePlanTasks: updatedTasks }

    // If watering task is completed, update last watered date
    if (completed && isWateringTask) {
      console.log(`[RESCUE] Watering task completed for ${plant.name} - updating lastWateredAt`)
      updates.lastWateredAt = new Date().toISOString()
    }

    // If first task is being completed and plant is still critical, flip to warning (monitoring)
    if (wasFirstTaskCompleted && plant.status === 'critical') {
      console.log(`[RESCUE] First task completed for ${plant.name} - flipping status from critical to warning`)
      updates.status = 'warning'
    }

    console.log(`[RESCUE] Task toggle for ${plant.name}: completed=${completed}, wasFirst=${wasFirstTaskCompleted}, isWatering=${isWateringTask}, status change=${updates.status ? 'yes' : 'no'}`)
    onUpdate(plant.id, updates)
  }, [plant.rescuePlanTasks, plant.status, plant.id, onUpdate])

  return {
    isRescueGenerating,
    error,
    generateRescuePlan,
    handleTaskComplete,
  }
}
