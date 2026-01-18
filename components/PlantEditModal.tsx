'use client'

import { Plant, HomeProfile } from '@/types'
import { Icons } from '@/lib/constants'
import { Manager } from '@/components/Manager'

interface Props {
  plant: Plant
  homeProfile: HomeProfile
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onDelete?: (id: string) => void
}

export const PlantEditModal: React.FC<Props> = ({ plant, homeProfile, onClose, onUpdate, onDelete }) => {
  const lastDate = new Date(plant.lastWateredAt)
  const nextDateMs = lastDate.getTime() + plant.cadenceDays * 24 * 60 * 60 * 1000
  const isOverdue = nextDateMs < Date.now()

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
        <div className="flex-1 overflow-y-auto p-6">
          <Manager
            plant={plant}
            homeProfile={homeProfile}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
