'use client'

import { useCallback } from 'react'
import { Plant } from '@/types'

export const useRescueTaskManager = (
  plant: Plant,
  onUpdate: (id: string, updates: Partial<Plant>) => void
) => {

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

  return { handleTaskComplete }
}
