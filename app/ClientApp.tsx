'use client'

import { useState, Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useAppState } from '@/hooks/useAppState'
import { useMediaStream } from '@/hooks/useMediaStream'
import { InventoryPage } from '@/components/pages/InventoryPage'
import { DoctorPage } from '@/components/pages/DoctorPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { PlantDetailPage } from '@/components/pages/PlantDetailPage'

export function ClientApp() {
  const pathname = usePathname()
  const router = useRouter()
  const state = useAppState()
  const { stream, start, stop } = useMediaStream()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleStartStream = async (video: boolean) => {
    if (isConnecting || stream) return
    setIsConnecting(true)
    try {
      await start(video)
      if (pathname !== '/doctor') {
        router.push('/doctor')
      }
    } catch (error) {
      console.error(`Failed to start ${video ? 'video' : 'audio'} stream:`, error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleStopStream = () => {
    stop()
    setIsConnecting(false)
  }

  const currentView = () => {
    if (pathname === '/doctor') return 'doctor'
    if (pathname === '/settings') return 'settings'
    if (pathname?.startsWith('/plants/')) return 'plant-detail'
    return 'inventory'
  }

  // Extract plant ID from /plants/[id] route
  const getPlantIdFromPath = () => {
    if (pathname?.startsWith('/plants/')) {
      return pathname.split('/plants/')[1]
    }
    return null
  }

  const selectedPlantId = getPlantIdFromPath()
  const selectedPlant = selectedPlantId ? state.plants.find(p => p.id === selectedPlantId) : null

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className="max-w-xl mx-auto pb-24">
        {currentView() === 'inventory' && (
          <InventoryPage
            plants={state.plants}
            homeProfile={state.homeProfile}
            onWater={state.waterPlant}
            onAdopt={state.adoptPlant}
            onDelete={state.removePlant}
            onUpdate={state.updatePlant}
          />
        )}
        {currentView() === 'doctor' && (
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <DoctorPage
              stream={stream}
              homeProfile={state.homeProfile}
              onAutoDetect={state.addPlant}
              onUpdatePlant={state.updatePlant}
              plants={state.plants}
            />
          </Suspense>
        )}
        {currentView() === 'settings' && (
          <SettingsPage
            profile={state.homeProfile}
            onChange={state.setHomeProfile}
          />
        )}
        {currentView() === 'plant-detail' && selectedPlant && (
          <PlantDetailPage
            plant={selectedPlant}
            homeProfile={state.homeProfile}
            onUpdate={state.updatePlant}
            onDelete={state.removePlant}
            onStartStream={handleStartStream}
          />
        )}
      </main>

      <Navigation
        stream={stream}
        isConnecting={isConnecting}
        onStart={handleStartStream}
        onStop={handleStopStream}
      />
    </div>
  )
}
