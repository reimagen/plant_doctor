'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
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
  const { stream, start, stop } = useMediaStream()
  const [isConnecting, setIsConnecting] = useState(false)
  const [streamMode, setStreamMode] = useState<'video' | 'audio' | null>(null)

  // Use refs to persist state across re-renders and navigation
  const streamRef = useRef<MediaStream | null>(null)
  const streamModeRef = useRef<'video' | 'audio' | null>(null)

  // Keep refs in sync with state
  useEffect(() => {
    streamRef.current = stream
  }, [stream])

  useEffect(() => {
    streamModeRef.current = streamMode
  }, [streamMode])

  const handleStartStream = async (mode: 'video' | 'audio') => {
    // Guard: prevent if already connecting, stream active, or mode already claimed
    if (isConnecting || stream || streamMode !== null) return

    setIsConnecting(true)
    setStreamMode(mode)
    try {
      await start(mode === 'video')
      // Navigation to /doctor happens on the Doctor page now, not here
    } catch (error) {
      console.error(`Failed to start ${mode} stream:`, error)
      setStreamMode(null) // Release mode claim on error
    } finally {
      setIsConnecting(false)
    }
  }

  const handleStopStream = () => {
    stop()
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

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className="max-w-xl mx-auto pb-24">
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
              onAutoDetect={state.addPlant}
              onUpdatePlant={state.updatePlant}
              onStartStream={handleStartStream}
              onStopStream={handleStopStream}
              plants={state.plants}
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
              onStartStream={handleStartStream}
            />
          )}
        </div>
      </main>

      <Navigation />
    </div>
  )
}
