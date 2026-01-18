'use client'

import { useState, useMemo } from 'react'
import { Plant, HomeProfile } from '@/types'
import { PlantCard } from '@/components/PlantCard'
import { PlantEditModal } from '@/components/PlantEditModal'
import { RescueProtocolView } from '@/components/RescueProtocolView'

interface Props {
  plants: Plant[]
  homeProfile: HomeProfile
  onWater: (id: string) => void
  onAdopt: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onOpenRehab: (id: string) => void
}

type SortOption = 'urgency' | 'watering' | 'name'

export const InventoryPage: React.FC<Props> = ({ plants, homeProfile, onWater, onAdopt, onDelete, onUpdate, onOpenRehab }) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [rescuePlantId, setRescuePlantId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('urgency')

  const pendingPlants = plants.filter(p => p.status === 'pending')
  const junglePlantsRaw = plants.filter(p => p.status !== 'pending')

  const sortedJunglePlants = useMemo(() => {
    const list = [...junglePlantsRaw]

    return list.sort((a, b) => {
      if (sortBy === 'urgency') {
        const score = (p: Plant) => {
          if (p.status === 'critical') return 0
          if (p.status === 'warning') return 1
          if (p.needsCheckIn) return 2
          return 3
        }
        const res = score(a) - score(b)
        if (res !== 0) return res
        return (a.name || a.species).localeCompare(b.name || b.species)
      }

      if (sortBy === 'watering') {
        const getNext = (p: Plant) => {
          const d = new Date(p.lastWateredAt)
          d.setDate(d.getDate() + p.cadenceDays)
          return d.getTime()
        }
        return getNext(a) - getNext(b)
      }

      if (sortBy === 'name') {
        return (a.name || a.species).localeCompare(b.name || b.species)
      }

      return 0
    })
  }, [junglePlantsRaw, sortBy])

  const selectedPlant = plants.find(p => p.id === selectedPlantId)
  const rescuePlant = plants.find(p => p.id === rescuePlantId)

  return (
    <div className="p-6 animate-fade-in pb-24 min-h-screen bg-stone-50">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-stone-800 tracking-tight">My Jungle</h1>
        <p className="text-stone-500 font-medium">You have {junglePlantsRaw.length} active companions</p>
      </header>

      {pendingPlants.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">Pending Adoption ({pendingPlants.length})</h2>
          </div>
          <div className="grid gap-4">
            {pendingPlants.map((plant) => (
              <div key={plant.id} onClick={() => setSelectedPlantId(plant.id)} className="cursor-pointer">
                <PlantCard
                  plant={plant}
                  onWater={onWater}
                  onAdopt={onAdopt}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">The Jungle</h2>
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sort by:</span>
          </div>

          {/* Sorting Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['urgency', 'watering', 'name'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === option
                    ? 'bg-stone-800 text-white shadow-lg shadow-stone-200'
                    : 'bg-white text-stone-400 border border-stone-100 hover:bg-stone-50'
                }`}
              >
                {option === 'urgency' ? 'Urgency' : option === 'watering' ? 'Watering' : 'Name'}
              </button>
            ))}
          </div>
        </div>

        {sortedJunglePlants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[40px] border border-stone-100 shadow-sm">
            <div className="text-5xl mb-6">P</div>
            <h3 className="font-black text-stone-700 text-xl">Empty Jungle</h3>
            <p className="text-stone-400 max-w-[200px] mx-auto text-sm mt-2 leading-relaxed font-medium">Use the Doctor to find and adopt your plants.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedJunglePlants.map((plant) => (
              <div key={plant.id} onClick={() => setSelectedPlantId(plant.id)} className="cursor-pointer">
                <PlantCard
                  plant={plant}
                  onWater={onWater}
                  onDelete={onDelete}
                  onCheckIn={() => onOpenRehab(plant.id)}
                  onRescue={(id) => setRescuePlantId(id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedPlant && (
        <PlantEditModal
          plant={selectedPlant}
          homeProfile={homeProfile}
          onClose={() => setSelectedPlantId(null)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}

      {rescuePlant && (
        <RescueProtocolView
          plant={rescuePlant}
          homeProfile={homeProfile}
          onClose={() => setRescuePlantId(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}
