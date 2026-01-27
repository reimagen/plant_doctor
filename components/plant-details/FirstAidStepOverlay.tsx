'use client'

import { useState, useEffect, useMemo } from 'react'
import { RescueTask } from '@/types'

type PhaseType = 'phase-1' | 'phase-2' | 'phase-3'

interface Props {
  tasks: RescueTask[]
  phase: PhaseType
}

const PHASE_CONFIG = {
  'phase-1': {
    title: 'IMMEDIATE ACTION',
    label: 'First Aid Step',
    color: 'red',
    bgClass: 'bg-white/90',
    textClass: 'text-stone-800',
    bulletClass: 'bg-red-500',
    completionMessage: 'First Aid Complete!'
  },
  'phase-2': {
    title: 'RECOVERY SUPPORT',
    label: 'Recovery Step',
    color: 'amber',
    bgClass: 'bg-white/90',
    textClass: 'text-stone-800',
    bulletClass: 'bg-amber-500',
    completionMessage: 'Recovery Phase Complete!'
  },
  'phase-3': {
    title: 'ONGOING MONITORING',
    label: 'Maintenance Step',
    color: 'blue',
    bgClass: 'bg-white/90',
    textClass: 'text-stone-800',
    bulletClass: 'bg-blue-500',
    completionMessage: 'Monitoring Phase Complete!'
  }
}

export const FirstAidStepOverlay: React.FC<Props> = ({ tasks, phase }) => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [hideCelebration, setHideCelebration] = useState(false)

  const config = PHASE_CONFIG[phase]

  // Filter tasks for this phase and sort by sequencing
  const phaseTasks = useMemo(() => {
    return tasks
      .filter(task => task.phase === phase)
      .sort((a, b) => (a.sequencing ?? 0) - (b.sequencing ?? 0))
  }, [tasks, phase])

  const completedCount = phaseTasks.filter(task => task.completed).length
  const totalCount = phaseTasks.length
  const allComplete = totalCount > 0 && completedCount === totalCount

  // Find the current (next incomplete) task
  const currentTaskIndex = phaseTasks.findIndex(task => !task.completed)
  const currentTask = currentTaskIndex >= 0 ? phaseTasks[currentTaskIndex] : null

  // Handle celebration when all tasks in this phase complete
  useEffect(() => {
    if (allComplete && !showCelebration && !hideCelebration) {
      setShowCelebration(true)
      const timer = setTimeout(() => {
        setHideCelebration(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, showCelebration, hideCelebration])

  // Don't render if no tasks in this phase
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
                {config.completionMessage}
              </p>
              <p className="text-xs font-bold text-white/80 mt-1">
                Great progress on your plant's recovery
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
      <div className={`${config.bgClass} backdrop-blur-xl border border-white/60 rounded-3xl px-5 py-4 shadow-2xl`}>
        {/* Header with phase tag and progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {config.title}
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
              {config.label} {currentStepNumber}/{totalCount}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {phaseTasks.map((task, index) => {
              const isCompleted = task.completed
              const isCurrent = index === currentTaskIndex

              return (
                <div
                  key={task.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? `${config.bulletClass} animate-pulse`
                      : 'bg-stone-300'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Current step description */}
        <p className={`text-sm font-bold ${config.textClass}`}>
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
