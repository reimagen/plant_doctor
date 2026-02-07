'use client'

import { useApp } from '@/contexts/AppContext'
import { SettingsPage as SettingsPageComponent } from '@/components/pages/SettingsPage'

export default function SettingsPage() {
  const { homeProfile, setHomeProfile } = useApp()

  return (
    <div className="pb-24">
      <SettingsPageComponent
        profile={homeProfile}
        onChange={setHomeProfile}
      />
    </div>
  )
}
