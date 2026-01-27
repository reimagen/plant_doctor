'use client'

import { Icons } from '@/lib/constants'

interface RescueTask {
  id: string
  description: string
  completed: boolean
  phase?: 'phase-1' | 'phase-2' | 'phase-3'
  duration?: string
  sequencing?: number
  successCriteria?: string
}

interface Props {
  plant: {
    id: string
    name: string
    species: string
    rescuePlanTasks?: RescueTask[]
  }
  onTaskComplete: (taskId: string, completed: boolean) => void
}

const PHASE_INFO = {
  'phase-1': {
    title: 'Phase 1: First Aid',
    description: 'Complete these immediately to stabilize the plant'
  },
  'phase-2': {
    title: 'Phase 2: Recovery',
    description: 'Follow up within 1-2 days to support recovery'
  },
  'phase-3': {
    title: 'Phase 3: Monitor',
    description: 'Ongoing maintenance for 2+ weeks'
  }
}

export const RescueTimeline: React.FC<Props> = ({
  plant,
  onTaskComplete,
}) => {
  const tasks = (plant.rescuePlanTasks || []).sort((a, b) => (a.sequencing || 0) - (b.sequencing || 0))
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  // Group tasks by phase
  const tasksByPhase = {
    'phase-1': tasks.filter(t => t.phase === 'phase-1'),
    'phase-2': tasks.filter(t => t.phase === 'phase-2'),
    'phase-3': tasks.filter(t => t.phase === 'phase-3')
  }

  const renderPhaseGroup = (phaseKey: 'phase-1' | 'phase-2' | 'phase-3') => {
    const phaseTasks = tasksByPhase[phaseKey]
    if (phaseTasks.length === 0) return null

    const phaseInfo = PHASE_INFO[phaseKey]
    const phaseCompleted = phaseTasks.filter(t => t.completed).length

    return (
      <div key={phaseKey} className="space-y-3 mb-6">
        {/* Phase header */}
        <div className={`p-4 rounded-2xl border ${
          phaseKey === 'phase-1' ? 'bg-red-50 border-red-100' :
          phaseKey === 'phase-2' ? 'bg-amber-50 border-amber-100' :
          'bg-blue-50 border-blue-100'
        }`}>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
            phaseKey === 'phase-1' ? 'text-red-600' :
            phaseKey === 'phase-2' ? 'text-amber-600' :
            'text-blue-600'
          }`}>
            {phaseInfo.title}
          </h4>
          <p className={`text-[9px] font-medium ${
            phaseKey === 'phase-1' ? 'text-red-500' :
            phaseKey === 'phase-2' ? 'text-amber-500' :
            'text-blue-500'
          }`}>
            {phaseInfo.description}
          </p>
          {phaseTasks.length > 1 && (
            <p className={`text-[8px] font-bold uppercase tracking-widest mt-2 ${
              phaseKey === 'phase-1' ? 'text-red-400' :
              phaseKey === 'phase-2' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              {phaseCompleted} of {phaseTasks.length} tasks
            </p>
          )}
        </div>

        {/* Phase tasks */}
        <div className="space-y-3 ml-2">
          {phaseTasks.map((task, index) => (
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
                {index < phaseTasks.length - 1 && (
                  <div
                    className={`w-1 flex-1 mt-2 ${
                      task.completed ? 'bg-green-200' : 'bg-stone-200'
                    }`}
                    style={{ minHeight: '2rem' }}
                  />
                )}
              </div>

              {/* Task content */}
              <div className="flex-1 pb-2 pt-0.5 space-y-1">
                <p
                  className={`text-xs font-bold leading-relaxed ${
                    task.completed
                      ? 'text-stone-400 line-through'
                      : 'text-stone-700'
                  }`}
                >
                  {task.description}
                </p>
                {/* Duration badge */}
                {task.duration && (
                  <div className="flex gap-2">
                    <span className="text-[9px] font-bold text-stone-500 px-2 py-1 bg-stone-100 rounded-full">
                      {task.duration}
                    </span>
                  </div>
                )}
                {/* Success criteria */}
                {task.successCriteria && (
                  <p className="text-[9px] text-stone-500 italic">
                    ✓ {task.successCriteria}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="bg-red-50/40 p-5 rounded-3xl border border-red-100/50">
      <div className="mb-4">
        <label className="text-[10px] font-black text-red-600/60 uppercase tracking-[0.2em] mb-2 block">
          Rescue Plan
        </label>
        {totalCount > 0 && (
          <p className="text-[9px] font-bold text-red-600/50 uppercase tracking-widest">
            {completedCount} of {totalCount} tasks completed
          </p>
        )}
      </div>

      {totalCount > 0 ? (
        <div className="space-y-6">
          {renderPhaseGroup('phase-1')}
          {renderPhaseGroup('phase-2')}
          {renderPhaseGroup('phase-3')}
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-red-100 rounded-3xl text-center">
          <p className="text-[10px] font-black text-red-300 uppercase">
            No rescue plan yet
          </p>
          <p className="text-[9px] text-red-400/60 mt-2">
            Start a livestream checkup with the Plant Doctor to generate a personalized rescue plan
          </p>
        </div>
      )}
    </section>
  )
}
