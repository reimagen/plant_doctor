'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useAppState } from '@/hooks/useAppState'
import { useMediaStream } from '@/hooks/useMediaStream'
import { InventoryPage } from '@/components/pages/InventoryPage'
import { DoctorPage } from '@/components/pages/DoctorPage'
import { SettingsPage } from '@/components/pages/SettingsPage'

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
    return 'inventory'
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className="max-w-xl mx-auto pb-24">
        {currentView() === 'doctor' && (
          <DoctorPage
            stream={stream}
            homeProfile={state.homeProfile}
            onAutoDetect={state.addPlant}
            onUpdatePlant={state.updatePlant}
            plants={state.plants}
            rehabTargetId={state.rehabTarget}
          />
        )}
        {/* ... (rest of the views) */}
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
