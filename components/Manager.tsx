'use client'

import { Plant, HomeProfile } from '@/types'
import { useCareGuide } from '@/hooks/useCareGuide'
import { useRescueTaskManager } from '@/hooks/useRescuePlan'
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

  const { handleTaskComplete } = useRescueTaskManager(plant, onUpdate)

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

      {(plant.status === 'warning' || plant.status === 'critical' || (plant.rescuePlan && plant.rescuePlan.length > 0) || (plant.rescuePlanTasks && plant.rescuePlanTasks.length > 0)) && (
        <RescuePlanSection
          plant={plant}
          onTaskComplete={handleTaskComplete}
        />
      )}

      <IdealConditionsSection idealConditions={plant.idealConditions} />

      <HealthNotesSection notes={plant.notes} notesSessions={plant.notesSessions} notesUpdatedAt={plant.notesUpdatedAt} />

      <div className="bg-white rounded-3xl border border-stone-100 p-5">
        <EnvironmentSettingsSection plant={plant} onUpdate={onUpdate} />
      </div>

      {careGuideError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-red-600">{careGuideError}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-100 p-5">
        <CareGuideSection
          careGuide={plant.careGuide}
          careGuideGeneratedAt={plant.careGuideGeneratedAt}
          isGenerating={isGenerating}
          onGenerate={generateTips}
        />
      </div>

      {onDelete && <DangerZoneSection onDelete={handleDelete} />}
    </div>
  )
}
