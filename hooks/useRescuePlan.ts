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

    const updates: Partial<Plant> = { rescuePlanTasks: updatedTasks }

    // If watering task is completed, update last watered date
    if (completed && isWateringTask) {
      console.log(`[RESCUE] Watering task completed for ${plant.name} - updating lastWateredAt`)
      updates.lastWateredAt = new Date().toISOString()
    }

    // Check if all phase-1 tasks are now complete
    const phase1Tasks = updatedTasks.filter(t => t.phase === 'phase-1')
    const allPhase1Complete = phase1Tasks.length > 0 && phase1Tasks.every(t => t.completed)

    // Only flip to warning after ALL phase-1 tasks are completed
    if (allPhase1Complete && plant.status === 'critical' && completed) {
      console.log(`[RESCUE] All phase-1 tasks completed for ${plant.name} - flipping status from critical to warning`)
      updates.status = 'warning'
    }

    console.log(`[RESCUE] Task toggle for ${plant.name}: completed=${completed}, allPhase1=${allPhase1Complete}, isWatering=${isWateringTask}, status change=${updates.status ? 'yes' : 'no'}`)
    onUpdate(plant.id, updates)
  }, [plant.rescuePlanTasks, plant.status, plant.id, onUpdate])

  return { handleTaskComplete }
}
