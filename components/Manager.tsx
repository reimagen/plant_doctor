'use client'

import { Plant, HomeProfile } from '@/types'
import { useCareGuide } from '@/hooks/useCareGuide'
import { useRescuePlan } from '@/hooks/useRescuePlan'
import { CareGuideSection } from '@/components/plant-details/CareGuideSection'
import { DangerZoneSection } from '@/components/plant-details/DangerZoneSection'
import { EnvironmentSettingsSection } from '@/components/plant-details/EnvironmentSettingsSection'
import { HealthNotesSection } from '@/components/plant-details/HealthNotesSection'
import { IdealConditionsSection } from '@/components/plant-details/IdealConditionsSection'
import { LastWateredSection } from '@/components/plant-details/LastWateredSection'
import { RescuePlanSection } from '@/components/plant-details/RescuePlanSection'

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
  const isPending = plant.status === 'pending'
  const lastDate = plant.lastWateredAt ? new Date(plant.lastWateredAt) : null
  const nextDate = lastDate ? new Date(lastDate) : null
  if (nextDate && lastDate) {
    nextDate.setDate(lastDate.getDate() + plant.cadenceDays)
  }
  const isOverdue = nextDate ? nextDate.getTime() < Date.now() : false

  const { isGenerating, error: careGuideError, generateTips } = useCareGuide(
    plant,
    homeProfile,
    onUpdate
  )

  const {
    isRescueGenerating,
    error: rescueError,
    generateRescuePlan,
    handleTaskComplete,
  } = useRescuePlan(plant, homeProfile, onUpdate)

  const handleDelete = () => {
    if (confirm(`Remove ${plant.name || plant.species} from your jungle?`)) {
      onDelete?.(plant.id)
      onClose?.()
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <LastWateredSection
        plant={plant}
        isOverdue={isOverdue}
        nextDate={nextDate}
        onUpdate={onUpdate}
        isRequired={isPending}
      />

      {(plant.status === 'warning' || plant.status === 'critical' || (plant.rescuePlan && plant.rescuePlan.length > 0)) && (
        <RescuePlanSection
          plant={plant}
          isRescueGenerating={isRescueGenerating}
          onGenerate={generateRescuePlan}
          onTaskComplete={handleTaskComplete}
        />
      )}

      <IdealConditionsSection idealConditions={plant.idealConditions} />

      <HealthNotesSection notes={plant.notes} />

      <EnvironmentSettingsSection plant={plant} onUpdate={onUpdate} />

      {(careGuideError || rescueError) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          {careGuideError && (
            <p className="text-xs font-bold text-red-600">{careGuideError}</p>
          )}
          {rescueError && (
            <p className="text-xs font-bold text-red-600">{rescueError}</p>
          )}
        </div>
      )}

      <CareGuideSection
        careGuide={plant.careGuide}
        isGenerating={isGenerating}
        onGenerate={generateTips}
      />

      {onDelete && <DangerZoneSection onDelete={handleDelete} />}
    </div>
  )
}
