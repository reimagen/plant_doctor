'use client'

import { RescueTask } from '@/types'

interface Props {
  tasks: RescueTask[]
}

export const RescueTimelineOverlay: React.FC<Props> = ({ tasks }) => {
  // Only show phase-1 "First Aid" tasks
  const phase1Tasks = tasks.filter(task => task.phase === 'phase-1')

  // Check if all phase-1 tasks are completed
  const allPhase1Complete = phase1Tasks.length > 0 && phase1Tasks.every(task => task.completed)

  // Don't render if no phase-1 tasks or all are complete
  if (phase1Tasks.length === 0 || allPhase1Complete) {
    return null
  }

  // Find the next incomplete task
  const nextIncompleteIndex = phase1Tasks.findIndex(task => !task.completed)

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none opacity-30">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 max-w-[240px]">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          First Aid Tasks
        </p>
        <div className="space-y-3">
          {phase1Tasks.map((task, index) => {
            const isNext = index === nextIncompleteIndex
            const isCompleted = task.completed

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 ${isNext ? 'scale-105' : ''}`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                    isCompleted
                      ? 'border-gray-500 bg-gray-500/20'
                      : isNext
                      ? 'border-gray-300'
                      : 'border-gray-600'
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    isCompleted
                      ? 'text-gray-600 line-through'
                      : isNext
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  {task.description}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
