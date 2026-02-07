'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
// Celebration is handled by parent (DoctorPage) to survive unmount
import { RescueTask } from '@/types'

interface Props {
  tasks: RescueTask[]
  onHeightChange?: (height: number) => void
}

const PHASE_CONFIG = {
  'phase-1': {
    title: 'IMMEDIATE ACTION',
    label: 'First Aid Step',
    color: 'red',
    bgClass: 'bg-white/90',
    textClass: 'text-stone-600',
    bulletClass: 'bg-red-500',
    completionMessage: 'First Aid Completed!'
  }
}

export const FirstAidStepOverlay: React.FC<Props> = ({ tasks, onHeightChange }) => {
  const [stepAnimating, setStepAnimating] = useState(false)
  const [recentlyCompletedIndex, setRecentlyCompletedIndex] = useState<number | null>(null)
  const prevTaskIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const config = PHASE_CONFIG['phase-1']

  // Since parent now passes pre-filtered phase-1 tasks, just use them directly
  const phaseTasks = tasks

  // Memoize expensive calculations
  const { totalCount, currentTaskIndex, currentTask } = useMemo(() => {
    const total = phaseTasks.length
    const currentIdx = phaseTasks.findIndex(task => !task.completed)
    const current = currentIdx >= 0 ? phaseTasks[currentIdx] : null

    return {
      totalCount: total,
      currentTaskIndex: currentIdx,
      currentTask: current
    }
  }, [phaseTasks])

  // Detect step changes and trigger transition animation
  useEffect(() => {
    if (!currentTask) return

    const prevId = prevTaskIdRef.current
    if (prevId !== null && prevId !== currentTask.id) {
      // Step changed — find the just-completed dot (the one before current)
      const justCompletedIdx = currentTaskIndex - 1
      if (justCompletedIdx >= 0) {
        setRecentlyCompletedIndex(justCompletedIdx)
        setTimeout(() => setRecentlyCompletedIndex(null), 500)
      }

      // Animate the new step description in
      setStepAnimating(true)
      setTimeout(() => setStepAnimating(false), 300)
    }

    prevTaskIdRef.current = currentTask.id
  }, [currentTask, currentTaskIndex])

  useEffect(() => {
    if (!onHeightChange) return
    const node = containerRef.current
    if (!node) return

    const reportHeight = () => onHeightChange(node.offsetHeight)
    reportHeight()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', reportHeight)
      return () => window.removeEventListener('resize', reportHeight)
    }

    const observer = new ResizeObserver(() => reportHeight())
    observer.observe(node)

    return () => observer.disconnect()
  }, [onHeightChange])

  // Don't render if no tasks or no incomplete task (parent handles celebration)
  if (totalCount === 0 || !currentTask) {
    return null
  }

  const currentStepNumber = currentTaskIndex + 1

  return (
    <div
      ref={containerRef}
      className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl animate-fade-in"
    >
      <div className={`${config.bgClass} backdrop-blur-xl border border-white/60 rounded-3xl px-5 pt-3 pb-4 shadow-2xl`}>
        {/* Header with phase tag and progress */}
        <div className="mb-3 space-y-3 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 px-2 py-1 rounded-full inline-block">
            {config.title}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-800">
                {config.label} {currentStepNumber}/{totalCount}
              </p>
              {currentTask.duration && (
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                  ⏱ {currentTask.duration}
                </span>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {phaseTasks.map((task, index) => {
                const isCompleted = task.completed
                const isCurrent = index === currentTaskIndex
                const justCompleted = index === recentlyCompletedIndex

                return (
                  <div
                    key={task.id}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? `bg-green-500${justCompleted ? ' animate-dot-complete' : ''}`
                        : isCurrent
                        ? `${config.bulletClass} animate-pulse`
                        : 'bg-stone-300'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Current step description */}
        <div className={`transition-all duration-300 ${stepAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} -mt-2`}>
          <p className={`text-sm font-bold ${config.textClass}`}>
            {currentTask.description}
          </p>

          {/* Optional details */}
          <div className="flex flex-wrap gap-3 mt-2">
            {currentTask.successCriteria && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ {currentTask.successCriteria}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
