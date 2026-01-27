'use client'

import { Plant } from '@/types'
import { RescueTimeline } from '@/components/plant-details/RescueTimeline'

interface Props {
  plant: Plant
  onTaskComplete: (taskId: string, completed: boolean) => void
}

export const RescuePlanSection: React.FC<Props> = ({
  plant,
  onTaskComplete,
}) => (
  <RescueTimeline
    plant={plant}
    onTaskComplete={onTaskComplete}
  />
)
