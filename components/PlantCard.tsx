'use client'

import { Plant } from '@/types'
import { Icons } from '@/lib/constants'

interface Props {
  plant: Plant
  onWater: (id: string) => void
  onAdopt?: (id: string) => void
  onDelete?: (id: string) => void
  onCheckIn?: (id: string, mode: 'discovery' | 'rehab') => void
  onRescue?: (id: string) => void
}

export const PlantCard: React.FC<Props> = ({ plant, onWater, onAdopt, onDelete, onCheckIn, onRescue }) => {
  const getNextWaterDate = () => {
    const lastDate = new Date(plant.lastWateredAt)
    const nextDate = new Date(lastDate)
    nextDate.setDate(lastDate.getDate() + (plant.cadenceDays || 7))
    return nextDate
  }

  const getDaysDiff = () => {
    const next = getNextWaterDate()
    const now = new Date()
    next.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    const diff = next.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const isPending = plant.status === 'pending'
  const isMonitoring = plant.status === 'warning'
  const isCritical = plant.status === 'critical'
  const isCheckInNeeded = !!plant.needsCheckIn
  const daysDiff = getDaysDiff()
  const isOverdue = daysDiff <= 0

  const isRed = isCritical || (isOverdue && daysDiff < -2)
  const isYellow = !isRed && (isCheckInNeeded || isOverdue || isMonitoring)

  const getStatusConfig = () => {
    if (isPending) return {
      label: 'New Discovery',
      timeline: 'Assessment Pending',
      dot: 'bg-stone-300',
      pill: 'bg-stone-100 text-stone-500',
      ring: 'ring-stone-100'
    }
    if (isRed) return {
      label: 'Emergency',
      timeline: `Overdue ${Math.abs(daysDiff)}d`,
      dot: 'bg-red-500',
      pill: 'bg-red-100 text-red-700',
      ring: 'ring-red-200'
    }
    if (isCheckInNeeded) return {
      label: 'Check-up Due',
      timeline: `Analyze Health Now`,
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
      ring: 'ring-amber-200'
    }
    if (isYellow) return {
      label: isOverdue ? 'Thirsty' : 'Monitoring',
      timeline: isOverdue ? `Overdue ${Math.abs(daysDiff)}d` : `Water in ${daysDiff}d`,
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
      ring: 'ring-amber-200'
    }
    return {
      label: 'Healthy',
      timeline: `Water in ${daysDiff}d`,
      dot: 'bg-green-500',
      pill: 'bg-green-100 text-green-700',
      ring: 'ring-green-100'
    }
  }

  const config = getStatusConfig()
  const nickname = plant.name || 'Unnamed Plant'
  const commonName = plant.species

  const renderActionButton = () => {
    if (isPending) {
      return (
        <div className="flex gap-2 w-full">
          <button
            onClick={(e) => { e.stopPropagation(); onAdopt?.(plant.id) }}
            className="flex-[2] bg-stone-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Adopt Plant
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(plant.id) }}
            className="flex-1 bg-stone-100 text-stone-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 active:scale-95 transition-all"
          >
            Release
          </button>
        </div>
      )
    }

    if (isCheckInNeeded) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id, 'rehab') }}
          className="flex-1 bg-amber-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Icons.Video />
          Start Checkup
        </button>
      )
    }

    if (isRed) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onRescue?.(plant.id) }}
          className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
        >
          Rescue Protocol
        </button>
      )
    }

    return (
      <button
        onClick={(e) => { e.stopPropagation(); onWater(plant.id) }}
        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
          isOverdue
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
            : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
        }`}
      >
        <Icons.WateringCan />
        {isOverdue ? 'Water Now' : 'Hydrated'}
      </button>
    )
  }

  return (
    <div className={`group bg-white rounded-[40px] p-5 border transition-all duration-500 ${isRed ? 'border-red-100' : 'border-stone-100 hover:border-green-200 hover:shadow-xl hover:shadow-stone-200/50'}`}>
      <div className="flex gap-5 mb-6">
        <div className={`relative w-24 h-24 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 ring-4 ring-offset-2 ${config.ring} transition-all duration-500 group-hover:scale-105`}>
          <img src={plant.photoUrl} className="w-full h-full object-cover" alt={commonName} />
          {isCheckInNeeded && (
            <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-white p-2 rounded-full shadow-lg text-amber-600">
                <Icons.Video />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${config.pill}`}>
              {config.label}
            </span>
          </div>

          <h3 className="text-xl font-black text-stone-800 truncate mb-1">
            {nickname}
          </h3>
          <p className="text-[11px] font-bold text-stone-400 italic truncate mb-3">
            {commonName}
          </p>

          <div className="bg-stone-50 rounded-xl px-3 py-2 inline-block">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              {config.timeline}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {renderActionButton()}
        {!isPending && (
          <button
            onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id, 'rehab') }}
            className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-400 flex items-center justify-center hover:bg-stone-100 transition-colors"
          >
            <Icons.Camera />
          </button>
        )}
      </div>
    </div>
  )
}
