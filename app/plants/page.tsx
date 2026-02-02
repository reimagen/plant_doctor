'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { PlantDetailPage } from '@/components/pages/PlantDetailPage'

function PlantDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { plants, homeProfile, updatePlant, removePlant, adoptPlant, handleStartStream } = useApp()

  const plant = id ? plants.find(p => p.id === id) : undefined

  if (!plant) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400 font-medium">Plant not found</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <PlantDetailPage
        plant={plant}
        homeProfile={homeProfile}
        onUpdate={updatePlant}
        onDelete={removePlant}
        onAdopt={adoptPlant}
        onStartStream={handleStartStream}
      />
    </div>
  )
}

export default function PlantPage() {
  return (
    <Suspense fallback={null}>
      <PlantDetailInner />
    </Suspense>
  )
}
