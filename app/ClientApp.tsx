'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { useAppState } from '@/hooks/useAppState'
import { InventoryPage } from '@/components/pages/InventoryPage'
import { DoctorPage } from '@/components/pages/DoctorPage'
import { SettingsPage } from '@/components/pages/SettingsPage'

export function ClientApp() {
  const pathname = usePathname()
  const state = useAppState()

  // Determine current view based on pathname
  const getView = () => {
    if (pathname === '/doctor') return 'doctor'
    if (pathname === '/settings') return 'settings'
    return 'inventory'
  }

  const currentView = getView()

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className="max-w-xl mx-auto pb-24">
        {currentView === 'doctor' && (
          <DoctorPage
            homeProfile={state.homeProfile}
            onAutoDetect={state.addPlant}
            onUpdatePlant={state.updatePlant}
            plants={state.plants}
            rehabTargetId={state.rehabTarget}
          />
        )}
        {currentView === 'inventory' && (
          <InventoryPage
            plants={state.plants}
            homeProfile={state.homeProfile}
            onWater={state.waterPlant}
            onAdopt={state.adoptPlant}
            onDelete={state.removePlant}
            onUpdate={state.updatePlant}
            onOpenRehab={state.handleOpenRehab}
          />
        )}
        {currentView === 'settings' && (
          <SettingsPage
            profile={state.homeProfile}
            onChange={state.setHomeProfile}
          />
        )}
      </main>

      <Navigation currentView={currentView} />
    </div>
  )
}
