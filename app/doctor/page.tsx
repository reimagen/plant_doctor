'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { DoctorPage as DoctorPageComponent } from '@/components/pages/DoctorPage'

function DoctorPageInner() {
  const searchParams = useSearchParams()
  const {
    stream, streamMode, isConnecting, homeProfile, plants,
    addPlant, updatePlant, handleStartStream, handleStopStream,
    streamError, clearStreamError,
  } = useApp()

  const rehabPlantId = searchParams.get('plantId')
  const rehabPlant = useMemo(
    () => rehabPlantId ? plants.find(p => p.id === rehabPlantId) : null,
    [rehabPlantId, plants]
  )

  // Stop stream when navigating away (unmount)
  useEffect(() => {
    return () => {
      handleStopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DoctorPageComponent
      stream={stream}
      streamMode={streamMode}
      isConnecting={isConnecting}
      homeProfile={homeProfile}
      plants={plants}
      streamError={streamError}
      onClearStreamError={clearStreamError}
      onAutoDetect={addPlant}
      onUpdatePlant={updatePlant}
      onStartStream={handleStartStream}
      onStopStream={handleStopStream}
      rehabPlant={rehabPlant}
    />
  )
}

export default function DoctorPage() {
  return (
    <Suspense fallback={null}>
      <DoctorPageInner />
    </Suspense>
  )
}
