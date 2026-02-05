'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Plant, HomeProfile } from '@/types'
import { getNextWaterDate, getWateringDaysDiff } from '@/lib/date-utils'
import { PlantCard } from '@/components/PlantCard'
import { Icons } from '@/lib/constants'

interface Props {
  plants: Plant[]
  homeProfile: HomeProfile
  onWater: (id: string) => void
  onAdopt: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Plant>) => void
}

type SortOption = 'urgency' | 'water schedule' | 'name'

export const InventoryPage: React.FC<Props> = ({ plants, homeProfile, onWater, onAdopt, onDelete, onUpdate }) => {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<SortOption>('urgency')

  const pendingPlants = plants.filter(p => p.status === 'pending')
  const junglePlantsRaw = plants.filter(p => p.status !== 'pending')

  const sortedJunglePlants = useMemo(() => {
    const list = [...junglePlantsRaw]

    return list.sort((a, b) => {
      if (sortBy === 'urgency') {
        const score = (p: Plant) => {
          // 0: Critical status
          if (p.status === 'critical') return 0

          // Check overdue status with grace period
          const daysDiff = getWateringDaysDiff(p.lastWateredAt, p.cadenceDays)
          const isWateringDay = daysDiff !== null && (daysDiff === 0 || daysDiff === -1)
          const isOverdue = daysDiff !== null && daysDiff < -1  // After 1-day grace

          // Dynamic thresholds
          const minorThreshold = p.overdueThresholdMinor ?? 2
          const majorThreshold = p.overdueThresholdMajor ?? 5
          const daysOverdue = daysDiff !== null && daysDiff < -1 ? Math.abs(daysDiff) - 1 : 0

          const isEmergency = daysOverdue > majorThreshold
          const isMajorOverdue = daysOverdue > minorThreshold && daysOverdue <= majorThreshold
          const isMinorOverdue = daysOverdue > 0 && daysOverdue <= minorThreshold

          // 1: Emergency (overdue beyond major threshold)
          if (isEmergency) return 1

          // 2: Major overdue (checkup needed)
          if (isMajorOverdue) return 2

          // 3: Minor overdue (thirsty)
          if (isMinorOverdue) return 3

          // 4: Needs check-in
          if (p.needsCheckIn) return 4

          // 5: Warning status
          if (p.status === 'warning') return 5

          // 6: Watering day (needs attention today)
          if (isWateringDay) return 6

          // 7: Healthy on schedule
          if (p.status === 'healthy' && !isOverdue) return 7

          // 8: No watering date (plants without lastWateredAt go last)
          if (!p.lastWateredAt) return 8

          return 8
        }
        const res = score(a) - score(b)
        if (res !== 0) return res
        // Tiebreaker: sort by days until watering (closest first)
        const getNext = (p: Plant) => {
          const daysDiff = getWateringDaysDiff(p.lastWateredAt, p.cadenceDays)
          if (daysDiff === null) return Infinity
          return daysDiff
        }
        return getNext(a) - getNext(b)
      }

      if (sortBy === 'water schedule') {
        const getNext = (p: Plant) => {
          const next = getNextWaterDate(p.lastWateredAt, p.cadenceDays)
          if (!next) return Infinity
          return next.getTime()
        }
        return getNext(a) - getNext(b)
      }

      if (sortBy === 'name') {
        return (a.name || a.species).localeCompare(b.name || b.species)
      }

      return 0
    })
  }, [junglePlantsRaw, sortBy])

  return (
    <div className="p-6 animate-fade-in pb-16 min-h-screen bg-stone-50">
      <header className="mb-6">
        <div className="flex justify-center mb-0">
          <div className="relative h-12 w-28 overflow-hidden">
            <Image
              src="/pd-logo.png"
              alt="Plant Daddy logo"
              fill
              sizes="112px"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-stone-800 tracking-tight">My Jungle</h1>
            <p className="mt-0 text-stone-500 font-medium">{junglePlantsRaw.length} active companions</p>
          </div>
          <button
            onClick={() => router.push('/doctor?mode=add-plant')}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-2xl text-xs font-bold whitespace-nowrap hover:bg-green-700 transition-all active:scale-95"
          >
            <Icons.Plus />
            Add Plant
          </button>
        </div>
      </header>

      {pendingPlants.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-start mb-6">
            <h2 className="text-base font-black text-stone-900 uppercase tracking-widest">Pending Adoption ({pendingPlants.length})</h2>
          </div>
          <div className="grid gap-4">
            {pendingPlants.map((plant) => (
              <div key={plant.id} onClick={() => router.push(`/plants?id=${plant.id}`)} className="cursor-pointer">
                <PlantCard
                  plant={plant}
                  onWater={onWater}
                  onAdopt={onAdopt}
                  onDelete={onDelete}
                  onReview={(id) => router.push(`/plants?id=${id}`)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-start">
            <div className="flex items-center">
              <h2 className="text-base font-black text-stone-900 uppercase tracking-widest">The Jungle</h2>
            </div>
          </div>

          {/* Sorting Bar */}
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sort by:</span>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['urgency', 'water schedule', 'name'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === option
                  ? 'bg-stone-400 text-white shadow-lg shadow-stone-200'
                  : 'bg-white text-stone-500 border border-stone-100 hover:bg-stone-50'
                  }`}
              >
                {option === 'urgency' ? 'Urgency' : option === 'water schedule' ? 'Water Schedule' : 'Name'}
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
              <div key={plant.id} onClick={() => router.push(`/plants?id=${plant.id}`)} className="cursor-pointer">
                <PlantCard
                  plant={plant}
                  onWater={onWater}
                  onDelete={onDelete}
                  onCheckIn={() => router.push(`/doctor?plantId=${plant.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
