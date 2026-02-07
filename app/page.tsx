'use client'

import { useApp } from '@/contexts/AppContext'
import { InventoryPage } from '@/components/pages/InventoryPage'

export default function HomePage() {
  const { plants, homeProfile, waterPlant, adoptPlant, removePlant, updatePlant } = useApp()

  return (
    <div className="pb-24">
      <InventoryPage
        plants={plants}
        homeProfile={homeProfile}
        onWater={waterPlant}
        onAdopt={adoptPlant}
        onDelete={removePlant}
        onUpdate={updatePlant}
      />
    </div>
  )
}
