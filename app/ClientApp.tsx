'use client'

import { useState, Suspense, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useAppState } from '@/hooks/useAppState'
import { useMediaStream } from '@/hooks/useMediaStream'
import { InventoryPage } from '@/components/pages/InventoryPage'
import { DoctorPage } from '@/components/pages/DoctorPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { PlantDetailPage } from '@/components/pages/PlantDetailPage'

export function ClientApp() {
  const pathname = usePathname()
  const state = useAppState()
  const { start, stop } = useMediaStream()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [streamMode, setStreamMode] = useState<'video' | null>(null)

  const handleStartStream = async () => {
    // Guard: prevent if already connecting, stream active, or mode already claimed
    if (isConnecting || stream || streamMode !== null) return

    setIsConnecting(true)
    setStreamMode('video')
    try {
      const newStream = await start()
      setStream(newStream)
      // Navigation to /doctor happens on the Doctor page now, not here
    } catch (error) {
      console.error('Failed to start video stream:', error)
      setStreamMode(null) // Release mode claim on error
    } finally {
      setIsConnecting(false)
    }
  }

  const handleStopStream = () => {
    stop()
    setStream(null)
    setStreamMode(null)
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

  // Memoize rehab plant for Doctor page to prevent re-renders when other plants change
  const rehabPlantId = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('plantId')
  const rehabPlant = useMemo(() => {
    return rehabPlantId ? state.plants.find(p => p.id === rehabPlantId) : null
  }, [rehabPlantId, state.plants])

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className={`max-w-xl mx-auto ${currentView() === 'doctor' ? '' : 'pb-24'}`}>
        <div className={currentView() === 'inventory' ? 'block' : 'hidden'}>
          <InventoryPage
            plants={state.plants}
            homeProfile={state.homeProfile}
            onWater={state.waterPlant}
            onAdopt={state.adoptPlant}
            onDelete={state.removePlant}
            onUpdate={state.updatePlant}
          />
        </div>

        {/* Doctor page is always mounted to preserve stream state and Gemini sessions */}
        {/* Suspense is needed for useSearchParams(), but we use a minimal fallback to avoid state loss */}
        <Suspense fallback={null}>
          <div className={currentView() === 'doctor' ? 'block' : 'hidden'}>
            <DoctorPage
              stream={stream}
              streamMode={streamMode}
              isConnecting={isConnecting}
              homeProfile={state.homeProfile}
              plants={state.plants}
              onAutoDetect={state.addPlant}
              onUpdatePlant={state.updatePlant}
              onStartStream={handleStartStream}
              onStopStream={handleStopStream}
              rehabPlant={rehabPlant}
            />
          </div>
        </Suspense>

        <div className={currentView() === 'settings' ? 'block' : 'hidden'}>
          <SettingsPage
            profile={state.homeProfile}
            onChange={state.setHomeProfile}
          />
        </div>

        <div className={currentView() === 'plant-detail' && selectedPlant ? 'block' : 'hidden'}>
          {selectedPlant && (
            <PlantDetailPage
              plant={selectedPlant}
              homeProfile={state.homeProfile}
              onUpdate={state.updatePlant}
              onDelete={state.removePlant}
              onAdopt={state.adoptPlant}
              onStartStream={handleStartStream}
            />
          )}
        </div>
      </main>

      <Navigation />
    </div>
  )
}
