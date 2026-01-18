'use client'

import { useState, useEffect } from 'react'
import { Plant, IntensityLevel, QualityLevel, HomeProfile } from '@/types'
import { Icons } from '@/lib/constants'
import { StorageService } from '@/lib/storage-service'

interface Props {
  plant: Plant
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onDelete?: (id: string) => void
}

export const PlantEditModal: React.FC<Props> = ({ plant, onClose, onUpdate, onDelete }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [localDate, setLocalDate] = useState('')

  useEffect(() => {
    if (plant.lastWateredAt) {
      setLocalDate(new Date(plant.lastWateredAt).toISOString().split('T')[0])
    }
  }, [plant.lastWateredAt])

  const amounts: IntensityLevel[] = ['Low', 'Medium', 'Bright']
  const exposures: QualityLevel[] = ['Indirect', 'Direct']

  const lastDate = new Date(plant.lastWateredAt)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + plant.cadenceDays)
  const isOverdue = nextDate.getTime() < Date.now()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalDate(val)

    if (val) {
      const newDate = new Date(val)
      newDate.setHours(12, 0, 0, 0)
      onUpdate(plant.id, { lastWateredAt: newDate.toISOString() })
    }
  }

  const handleGenerateTips = async () => {
    if (!plant.species) return
    setIsGenerating(true)
    try {
      const homeProfile = StorageService.getHomeProfile()
      const response = await fetch('/api/gemini/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'care-guide',
          plant,
          homeProfile
        })
      })
      const data = await response.json()
      if (data.tips && data.tips.length > 0) {
        onUpdate(plant.id, { careGuide: data.tips })
      }
    } catch (err) {
      console.error('Failed to generate tips', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Remove ${plant.name || plant.species} from your jungle?`)) {
      onDelete?.(plant.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col animate-slide-up shadow-2xl">

        {/* Header Section */}
        <div className="relative flex-shrink-0 bg-stone-50 border-b border-stone-100 p-6 flex gap-5 items-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 border-4 border-white">
            <img src={plant.photoUrl} className="w-full h-full object-cover" alt={plant.species} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                {isOverdue ? 'Urgent Care' : 'Stable'}
              </span>
            </div>

            <h2 className="text-xl font-black text-stone-800 truncate leading-tight">
              {plant.name || 'Unnamed'}
            </h2>

            <p className="text-[11px] font-bold text-stone-400 italic truncate">
              {plant.species}
            </p>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-stone-200/50 text-stone-500 rounded-full hover:bg-stone-300 transition-colors">
            <Icons.X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">

          {/* Last Watered History */}
          <section className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">Last Watered Date</label>
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

          {/* Identity */}
          <section>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Nickname</label>
            <input
              value={plant.name}
              onChange={(e) => onUpdate(plant.id, { name: e.target.value })}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-green-100"
              placeholder="Give it a name..."
            />
          </section>

          {/* Ideal Conditions */}
          <section className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100/50">
            <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-2 block">Ideal Conditions</label>
            <p className="text-xs font-bold text-emerald-800/80 leading-relaxed italic">
              {plant.idealConditions || 'Scanning botanical requirements...'}
            </p>
          </section>

          {/* Health Notes */}
          <section className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50">
            <label className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2 block">Health Notes</label>
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
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block">Environment Settings</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Light Intensity</label>
                <select
                  value={plant.lightIntensity}
                  onChange={(e) => onUpdate(plant.id, { lightIntensity: e.target.value as IntensityLevel })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                >
                  {amounts.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Light Exposure</label>
                <select
                  value={plant.lightQuality}
                  onChange={(e) => onUpdate(plant.id, { lightQuality: e.target.value as QualityLevel })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                >
                  {exposures.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Water Cycle (Days)</label>
                <input
                  type="number"
                  value={plant.cadenceDays}
                  onChange={(e) => onUpdate(plant.id, { cadenceDays: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                />
              </div>
            </div>
          </section>

          {/* AI Expert Tips */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">AI Expert Tips</label>
              <button
                onClick={handleGenerateTips}
                disabled={isGenerating}
                className="text-[10px] font-black text-green-600 uppercase tracking-widest disabled:opacity-50"
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

          {/* Danger Zone */}
          <section className="pt-8 border-t border-stone-100 flex justify-center">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-[10px] font-black text-stone-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors p-4"
            >
              <Icons.X />
              Remove from Jungle
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
