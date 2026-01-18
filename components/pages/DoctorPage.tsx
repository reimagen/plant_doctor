'use client'

import { HomeProfile, Plant } from '@/types'
import { Doctor } from '@/components/Doctor'
import { Manager } from '@/components/Manager'

interface Props {
  stream: MediaStream | null
  homeProfile: HomeProfile
  onAutoDetect: (plant: Plant) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  plants: Plant[]
  rehabTargetId?: string | null
}

/**
 * DoctorPage - Orchestrator page for livestream modes
 * Coordinates the Doctor component (livestream UI) with state management
 * Future: Will also coordinate with Manager component for plant settings
 */
export const DoctorPage: React.FC<Props> = ({
  stream,
  homeProfile,
  onAutoDetect,
  onUpdatePlant,
  plants,
  rehabTargetId
}) => {
  const rehabPlant = rehabTargetId ? plants.find(plant => plant.id === rehabTargetId) : null

  return (
    <div className="relative min-h-screen bg-black">
      <Doctor
        stream={stream}
        homeProfile={homeProfile}
        plants={plants}
        rehabTargetId={rehabTargetId}
        onAutoDetect={onAutoDetect}
        onUpdatePlant={onUpdatePlant}
      />
      {rehabPlant && (
        <aside className="absolute inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-t-[36px] border-t border-white/60 shadow-2xl">
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                  Plant Manager
                </p>
                <h2 className="text-lg font-black text-stone-800">
                  {rehabPlant.name || rehabPlant.species}
                </h2>
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Rehab Mode
              </span>
            </div>
            <Manager
              plant={rehabPlant}
              homeProfile={homeProfile}
              onUpdate={onUpdatePlant}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
