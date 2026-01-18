'use client'

import { useState } from 'react'
import { Icons } from '@/lib/constants'

interface RescueTask {
  id: string
  description: string
  completed: boolean
}

interface Props {
  plant: {
    id: string
    name: string
    species: string
    rescuePlanTasks?: RescueTask[]
  }
  isGenerating: boolean
  onGenerate: () => Promise<void>
  onTaskComplete: (taskId: string, completed: boolean) => void
}

export const RescueTimeline: React.FC<Props> = ({
  plant,
  isGenerating,
  onGenerate,
  onTaskComplete,
}) => {
  const tasks = plant.rescuePlanTasks || []
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  return (
    <section className="bg-red-50/40 p-5 rounded-3xl border border-red-100/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <label className="text-[10px] font-black text-red-600/60 uppercase tracking-[0.2em] mb-2 block">
            Rescue Plan
          </label>
          {totalCount > 0 && (
            <p className="text-[9px] font-bold text-red-600/50 uppercase tracking-widest">
              {completedCount} of {totalCount} tasks completed
            </p>
          )}
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="text-[10px] font-black text-red-600 uppercase tracking-widest disabled:opacity-50 hover:text-red-700 transition-colors"
        >
          {isGenerating ? 'Generating...' : totalCount > 0 ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {totalCount > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex gap-4 items-start">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center pt-1">
                <button
                  onClick={() => onTaskComplete(task.id, !task.completed)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-stone-300 hover:border-red-400'
                  }`}
                >
                  {task.completed && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {index < tasks.length - 1 && (
                  <div
                    className={`w-1 flex-1 mt-2 ${
                      task.completed ? 'bg-green-200' : 'bg-stone-200'
                    }`}
                    style={{ minHeight: '2rem' }}
                  />
                )}
              </div>

              {/* Task content */}
              <div className="flex-1 pb-2 pt-0.5">
                <p
                  className={`text-xs font-bold leading-relaxed ${
                    task.completed
                      ? 'text-stone-400 line-through'
                      : 'text-stone-700'
                  }`}
                >
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-red-100 rounded-3xl text-center">
          <p className="text-[10px] font-black text-red-300 uppercase">
            No rescue plan generated yet
          </p>
          <p className="text-[9px] text-red-400/60 mt-2">
            Click "Generate" to create a personalized recovery plan for {plant.name}
          </p>
        </div>
      )}
    </section>
  )
}
