'use client'

import { useState, useEffect } from 'react'
import { Plant, IntensityLevel, QualityLevel, HomeProfile, RescueTask, WindowDirection } from '@/types'
import { Icons } from '@/lib/constants'
import { StorageService } from '@/lib/storage-service'
import { RescueTimeline } from './RescueTimeline'

interface Props {
  plant: Plant
  homeProfile: HomeProfile
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onDelete?: (id: string) => void
  onClose?: () => void
}

/**
 * Manager Component - Pure plant settings and management UI
 * Handles all plant configuration, care guide generation, rescue planning
 * Can be used in modal context, individual pages, or side-by-side with livestream
 */
export const Manager: React.FC<Props> = ({
  plant,
  homeProfile,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRescueGenerating, setIsRescueGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [localDate, setLocalDate] = useState('')

  useEffect(() => {
    if (plant.lastWateredAt) {
      setLocalDate(new Date(plant.lastWateredAt).toISOString().split('T')[0])
    }
  }, [plant.lastWateredAt])

  const amounts: IntensityLevel[] = ['Low', 'Medium', 'Bright']
  const exposures: QualityLevel[] = ['Indirect', 'Direct']
  const directions: WindowDirection[] = ['North', 'South', 'East', 'West']

  const lastDate = new Date(plant.lastWateredAt)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + plant.cadenceDays)
  const isOverdue = nextDate.getTime() < Date.now()

  // Update last watered date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalDate(val)

    if (val) {
      const newDate = new Date(val)
      newDate.setHours(12, 0, 0, 0)
      onUpdate(plant.id, { lastWateredAt: newDate.toISOString() })
    }
  }

  // Generate AI care guide tips
  const handleGenerateTips = async () => {
    if (!plant.species) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      console.log(`[API_REQUEST] Generating care guide for ${plant.species}`)
      const response = await fetch('/api/gemini/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'care-guide',
          plant,
          homeProfile
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.tips && data.tips.length > 0) {
        onUpdate(plant.id, { careGuide: data.tips })
        console.log(`[SUCCESS] Care guide generated: ${data.tips.length} tips`)
      } else if (data.error) {
        setGenerateError(data.error)
        console.error(`[GENERATION_ERROR] ${data.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate tips'
      console.error(`[GENERATION_ERROR] ${errorMsg}`)
      setGenerateError(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate AI rescue plan
  const handleGenerateRescuePlan = async () => {
    if (!plant.species) return
    setIsRescueGenerating(true)
    setGenerateError(null)
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
        setGenerateError(data.error)
        console.error(`[GENERATION_ERROR] ${data.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate rescue plan'
      console.error(`[GENERATION_ERROR] ${errorMsg}`)
      setGenerateError(errorMsg)
    } finally {
      setIsRescueGenerating(false)
    }
  }

  // Mark rescue task as complete/incomplete
  const handleTaskComplete = (taskId: string, completed: boolean) => {
    const updatedTasks = (plant.rescuePlanTasks || []).map(task =>
      task.id === taskId ? { ...task, completed } : task
    )
    onUpdate(plant.id, { rescuePlanTasks: updatedTasks })
  }

  // Delete plant with confirmation
  const handleDelete = () => {
    if (confirm(`Remove ${plant.name || plant.species} from your jungle?`)) {
      onDelete?.(plant.id)
      onClose?.()
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Last Watered History */}
      <section className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">
          Last Watered Date
        </label>
        <input
          type="date"
          value={localDate}
          onChange={handleDateChange}
          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
            Schedule: Every {plant.cadenceDays} days
          </p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-green-600'}`}>
            Next: {nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Plant Identity */}
      <section>
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">
          Nickname
        </label>
        <input
          value={plant.name}
          onChange={e => onUpdate(plant.id, { name: e.target.value })}
          className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-green-100"
          placeholder="Give it a name..."
        />
      </section>

      {/* Rescue Plan - shown if plant is unhealthy */}
      {(isOverdue || plant.status === 'warning' || plant.status === 'critical') && (
        <RescueTimeline
          plant={plant}
          isGenerating={isRescueGenerating}
          onGenerate={handleGenerateRescuePlan}
          onTaskComplete={handleTaskComplete}
        />
      )}

      {/* Ideal Conditions */}
      <section className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100/50">
        <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-2 block">
          Ideal Conditions
        </label>
        <p className="text-xs font-bold text-emerald-800/80 leading-relaxed italic">
          {plant.idealConditions || 'Scanning botanical requirements...'}
        </p>
      </section>

      {/* Health Notes */}
      <section className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50">
        <label className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2 block">
          Health Notes
        </label>
        {plant.notes && plant.notes.length > 0 ? (
          <ul className="space-y-2">
            {plant.notes.map((note, i) => (
              <li key={i} className="text-xs font-bold text-amber-800/80 leading-relaxed flex gap-2">
                <span className="opacity-50">-</span> {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] font-medium text-amber-800/40 italic">No health issues detected yet.</p>
        )}
      </section>

      {/* Environment Settings */}
      <section>
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block">
          Environment Settings
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Light Intensity
            </label>
            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
              {plant.lightIntensity ? 'Detected from call' : 'Manual'}
            </p>
            <select
              value={plant.lightIntensity}
              onChange={e => onUpdate(plant.id, { lightIntensity: e.target.value as IntensityLevel })}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
            >
              {amounts.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Light Exposure
            </label>
            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
              {plant.lightQuality ? 'Detected from call' : 'Manual'}
            </p>
            <select
              value={plant.lightQuality}
              onChange={e => onUpdate(plant.id, { lightQuality: e.target.value as QualityLevel })}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
            >
              {exposures.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Water Cycle (Days)
            </label>
            <input
              type="number"
              value={plant.cadenceDays}
              onChange={e => onUpdate(plant.id, { cadenceDays: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Location
            </label>
            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
              {plant.location && plant.location !== 'Detected via Inventory Sweep' ? 'Detected from call' : 'Manual'}
            </p>
            <input
              type="text"
              value={plant.location || ''}
              onChange={e => onUpdate(plant.id, { location: e.target.value })}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
              placeholder="e.g., Living Room Window"
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Near Window
            </label>
            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
              {typeof plant.nearWindow === 'boolean' ? 'Detected from call' : 'Manual'}
            </p>
            <label className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                checked={Boolean(plant.nearWindow)}
                onChange={e => onUpdate(plant.id, {
                  nearWindow: e.target.checked,
                  windowDirection: e.target.checked ? plant.windowDirection : undefined
                })}
                className="h-4 w-4 text-green-600 rounded"
              />
              <span>{plant.nearWindow ? 'Yes' : 'No'}</span>
            </label>
          </div>
          <div>
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
              Window Direction
            </label>
            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
              {plant.windowDirection ? 'Detected from call' : 'Manual'}
            </p>
            <select
              value={plant.windowDirection || ''}
              onChange={e => onUpdate(plant.id, { windowDirection: e.target.value as WindowDirection })}
              disabled={!plant.nearWindow}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700 disabled:opacity-50"
            >
              <option value="" disabled>
                Select direction
              </option>
              {directions.map(direction => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {generateError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-600">{generateError}</p>
        </div>
      )}

      {/* AI Expert Tips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            AI Expert Tips
          </label>
          <button
            onClick={handleGenerateTips}
            disabled={isGenerating}
            className="text-[10px] font-black text-green-600 uppercase tracking-widest disabled:opacity-50 hover:text-green-700 transition-colors"
          >
            {isGenerating ? 'Analyzing...' : 'Refresh Protocol'}
          </button>
        </div>
        <div className="space-y-3">
          {plant.careGuide && plant.careGuide.length > 0 ? (
            plant.careGuide.map((tip, i) => (
              <div key={i} className="flex gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs font-bold text-stone-600 leading-relaxed">{tip}</p>
              </div>
            ))
          ) : (
            <div className="p-8 border-2 border-dashed border-stone-100 rounded-3xl text-center">
              <p className="text-[10px] font-black text-stone-300 uppercase">No active protocol</p>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone - Delete Button */}
      {onDelete && (
        <section className="pt-8 border-t border-stone-100 flex justify-center">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-[10px] font-black text-stone-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors p-4"
          >
            <Icons.X />
            Remove from Jungle
          </button>
        </section>
      )}
    </div>
  )
}
