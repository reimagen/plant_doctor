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

  // Grace period: daysDiff >= -1 means not overdue yet (includes watering day and 1-day grace)
  const isWateringDay = daysDiff !== null && (daysDiff === 0 || daysDiff === -1)
  const isOverdue = daysDiff !== null && daysDiff < -1  // Overdue starts at -2 (after 1-day grace)

  // Dynamic thresholds from Gemini (with defaults)
  const minorThreshold = plant.overdueThresholdMinor ?? 2
  const majorThreshold = plant.overdueThresholdMajor ?? 5
  const daysOverdue = daysDiff !== null && daysDiff < -1 ? Math.abs(daysDiff) - 1 : 0  // -2 = 1 day overdue

  const isMinorOverdue = daysOverdue > 0 && daysOverdue <= minorThreshold
  const isMajorOverdue = daysOverdue > minorThreshold && daysOverdue <= majorThreshold
  const isEmergency = isCritical || daysOverdue > majorThreshold

  const getStatusConfig = () => {
    if (isPending) return {
      label: 'New Discovery',
      dot: 'bg-stone-300',
      pill: 'bg-stone-100 text-stone-500',
    }
    if (isEmergency) return {
      label: 'Emergency',
      dot: 'bg-red-500',
      pill: 'bg-red-100 text-red-700',
    }
    // Watering day check BEFORE overdue checks
    if (isWateringDay) return {
      label: 'Healthy',
      dot: 'bg-green-500',
      pill: 'bg-blue-100 text-blue-700',
    }
    if (isCheckInNeeded || isMajorOverdue || isMinorOverdue || isMonitoring) return {
      label: 'Monitoring',
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
        <span className={`w-2 h-2 rounded-full ${config.dot} ${isEmergency ? 'animate-pulse' : ''}`} />
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
