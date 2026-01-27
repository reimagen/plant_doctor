'use client'

import { useState, useEffect, useMemo } from 'react'
import { RescueTask } from '@/types'

interface Props {
  tasks: RescueTask[]
}

export const FirstAidStepOverlay: React.FC<Props> = ({ tasks }) => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [hideCelebration, setHideCelebration] = useState(false)

  // Sort all tasks by sequencing
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.sequencing ?? 0) - (b.sequencing ?? 0))
  }, [tasks])

  const completedCount = sortedTasks.filter(task => task.completed).length
  const totalCount = sortedTasks.length
  const allComplete = totalCount > 0 && completedCount === totalCount

  // Find the current (next incomplete) task
  const currentTaskIndex = sortedTasks.findIndex(task => !task.completed)
  const currentTask = currentTaskIndex >= 0 ? sortedTasks[currentTaskIndex] : null

  // Handle celebration when all tasks complete
  useEffect(() => {
    if (allComplete && !showCelebration && !hideCelebration) {
      setShowCelebration(true)
      const timer = setTimeout(() => {
        setHideCelebration(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, showCelebration, hideCelebration])

  // Don't render if no tasks
  if (totalCount === 0) {
    return null
  }

  // Don't render after celebration is done
  if (hideCelebration) {
    return null
  }

  // Show celebration message
  if (showCelebration) {
    return (
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl animate-slide-up">
        <div className="bg-green-500/90 backdrop-blur-xl border border-green-400/60 rounded-3xl px-5 py-4 shadow-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🌱</span>
            <div className="text-center">
              <p className="text-sm font-black text-white">
                First Aid Complete!
              </p>
              <p className="text-xs font-bold text-white/80 mt-1">
                Your plant is on the road to recovery
              </p>
            </div>
            <span className="text-2xl">✨</span>
          </div>
        </div>
      </div>
    )
  }

  // No current task means we shouldn't show anything (shouldn't happen if not allComplete)
  if (!currentTask) {
    return null
  }

  const currentStepNumber = currentTaskIndex + 1

  return (
    <div
      key={currentTask.id}
      className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl animate-slide-up"
    >
      <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl px-5 py-4 shadow-2xl">
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
            First Aid Step {currentStepNumber}/{totalCount}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {sortedTasks.map((task, index) => {
              const isCompleted = task.completed
              const isCurrent = index === currentTaskIndex

              return (
                <div
                  key={task.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-stone-300'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Current step description */}
        <p className="text-sm font-bold text-stone-800">
          {currentTask.description}
        </p>

        {/* Optional details */}
        <div className="flex flex-wrap gap-3 mt-2">
          {currentTask.duration && (
            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
              ⏱ {currentTask.duration}
            </span>
          )}
          {currentTask.successCriteria && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✓ {currentTask.successCriteria}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
