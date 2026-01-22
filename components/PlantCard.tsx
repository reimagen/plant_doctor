'use client'

import { Plant } from '@/types'
import { Icons } from '@/lib/constants'
import { PlantStatusBadge } from '@/components/PlantStatusBadge'

interface Props {
  plant: Plant
  onWater: (id: string) => void
  onAdopt?: (id: string) => void
  onDelete?: (id: string) => void
  onReview?: (id: string) => void
  onCheckIn?: (id: string, mode: 'discovery' | 'rehab') => void
  onRescue?: (id: string) => void
}

export const PlantCard: React.FC<Props> = ({ plant, onWater, onAdopt, onDelete, onReview, onCheckIn, onRescue }) => {
  const getNextWaterDate = () => {
    if (!plant.lastWateredAt) return null
    const lastDate = new Date(plant.lastWateredAt)
    const nextDate = new Date(lastDate)
    nextDate.setDate(lastDate.getDate() + (plant.cadenceDays || 7))
    return nextDate
  }

  const getDaysDiff = () => {
    const next = getNextWaterDate()
    if (!next) return null
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
  const isOverdue = daysDiff !== null && daysDiff <= 0

  // Rescue plan states
  const hasRescuePlan = !!plant.rescuePlan && plant.rescuePlan.length > 0
  const hasCompletedTasks = (plant.rescuePlanTasks || []).some(task => task.completed)
  const isRescuePlanPending = hasRescuePlan && !hasCompletedTasks

  const isRed = isCritical || (isOverdue && daysDiff !== null && daysDiff < -2)
  const isYellow = !isRed && (isCheckInNeeded || isOverdue || isMonitoring)

  const getStatusConfig = () => {
    if (isPending) return {
      label: 'New Discovery',
      timeline: '',
      dot: 'bg-stone-300',
      pill: 'bg-stone-100 text-stone-500',
      ring: 'ring-stone-100'
    }
    if (isRed) return {
      label: 'Emergency',
      timeline: daysDiff !== null ? `Watering overdue by ${Math.abs(daysDiff)}d` : 'Needs attention',
      dot: 'bg-red-500',
      pill: 'bg-red-100 text-red-700',
      ring: 'ring-red-200'
    }
    if (isCheckInNeeded) return {
      label: 'Check-up Due',
      timeline: daysDiff !== null ? `Water in ${daysDiff}d` : '',
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
      ring: 'ring-amber-200'
    }
    if (isYellow) return {
      label: isOverdue ? 'Thirsty' : 'Monitoring',
      timeline: daysDiff !== null ? (isOverdue ? `Overdue ${Math.abs(daysDiff)}d` : `Water in ${daysDiff}d`) : '',
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
      ring: 'ring-amber-200'
    }
    return {
      label: 'Healthy',
      timeline: daysDiff !== null ? `Water in ${daysDiff}d` : '',
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
        <button
          onClick={(e) => { e.stopPropagation(); onReview?.(plant.id) }}
          className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          Review Plant
        </button>
      )
    }

    // Emergency states take priority
    if (isRescuePlanPending) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id, 'rehab') }}
          className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
        >
          Complete First Rescue Step
        </button>
      )
    }

    if (isRed) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onRescue?.(plant.id) }}
          className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
        >
          Begin Rescue Protocol
        </button>
      )
    }

    // Checkup states for warning plants
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

    // Monitoring plant with future checkup (water due in 2+ days)
    if (isMonitoring && !isCheckInNeeded && !isOverdue && daysDiff !== null) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id, 'rehab') }}
          className="flex-1 bg-amber-200 text-amber-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Icons.Video />
          Checkup in {daysDiff}d
        </button>
      )
    }

    if (isOverdue) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onWater(plant.id) }}
          className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
          <Icons.WateringCan />
          Water Now
        </button>
      )
    }

    // Healthy plants have no action button - tap card to see details
    return null
  }

  return (
    <div className={`group relative bg-white rounded-[40px] p-5 border transition-all duration-500 ${isRed ? 'border-red-100' : 'border-stone-100 hover:border-green-200 hover:shadow-xl hover:shadow-stone-200/50'}`}>
      {isPending && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(plant.id) }}
          className="absolute top-4 right-4 p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200 hover:text-stone-600 active:scale-95 transition-all z-10"
          title="Release plant"
        >
          <Icons.X />
        </button>
      )}
      <div className="flex gap-5 mb-6">
        <div className={`relative w-24 h-24 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 ring-4 ring-offset-2 ${config.ring} transition-all duration-500 group-hover:scale-105`}>
          <img src={plant.photoUrl} className="w-full h-full object-cover" alt={commonName} />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <PlantStatusBadge plant={plant} size="md" />

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
      </div>
    </div>
  )
}
