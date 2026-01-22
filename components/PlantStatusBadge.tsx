'use client'

import { Plant } from '@/types'

interface Props {
  plant: Plant
  size?: 'sm' | 'md'
}

export const PlantStatusBadge: React.FC<Props> = ({ plant, size = 'md' }) => {
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

  const isRed = isCritical || (isOverdue && daysDiff !== null && daysDiff < -2)
  const isYellow = !isRed && (isCheckInNeeded || isOverdue || isMonitoring)

  const getStatusConfig = () => {
    if (isPending) return {
      label: 'New Discovery',
      dot: 'bg-stone-300',
      pill: 'bg-stone-100 text-stone-500',
    }
    if (isRed) return {
      label: 'Emergency',
      dot: 'bg-red-500',
      pill: 'bg-red-100 text-red-700',
    }
    if (isCheckInNeeded) return {
      label: 'Check-up Due',
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
    }
    if (isYellow) return {
      label: isOverdue ? 'Thirsty' : 'Monitoring',
      dot: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-700',
    }
    return {
      label: 'Healthy',
      dot: 'bg-green-500',
      pill: 'bg-green-100 text-green-700',
    }
  }

  const config = getStatusConfig()

  if (size === 'sm') {
    // Small version for PlantDetailPage
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot} ${isRed ? 'animate-pulse' : ''}`} />
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${config.pill}`}>
          {config.label}
        </span>
      </div>
    )
  }

  // Medium version for PlantCard
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${config.pill}`}>
        {config.label}
      </span>
    </div>
  )
}
