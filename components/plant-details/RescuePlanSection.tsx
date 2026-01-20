'use client'

import { Plant } from '@/types'
import { RescueTimeline } from '@/components/plant-details/RescueTimeline'

interface Props {
  plant: Plant
  isRescueGenerating: boolean
  onGenerate: () => Promise<void>
  onTaskComplete: (taskId: string, completed: boolean) => void
}

export const RescuePlanSection: React.FC<Props> = ({
  plant,
  isRescueGenerating,
  onGenerate,
  onTaskComplete,
}) => (
  <RescueTimeline
    plant={plant}
    isGenerating={isRescueGenerating}
    onGenerate={onGenerate}
    onTaskComplete={onTaskComplete}
  />
)
