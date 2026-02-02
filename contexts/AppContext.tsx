'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useMediaStream } from '@/hooks/useMediaStream'
import { Plant, HomeProfile } from '@/types'

interface AppContextValue {
  plants: Plant[]
  homeProfile: HomeProfile
  setHomeProfile: (profile: HomeProfile) => void
  addPlant: (plant: Plant, options?: { forceNew?: boolean }) => void
  updatePlant: (id: string, updates: Partial<Plant>) => void
  removePlant: (id: string) => void
  waterPlant: (id: string) => void
  adoptPlant: (id: string) => void
  isHydrated: boolean
  stream: MediaStream | null
  streamMode: 'video' | null
  isConnecting: boolean
  handleStartStream: () => Promise<void>
  handleStopStream: () => void
  isStreamActive: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState()
  const { start, stop } = useMediaStream()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [streamMode, setStreamMode] = useState<'video' | null>(null)

  const handleStartStream = async () => {
    if (isConnecting || stream || streamMode !== null) return
    setIsConnecting(true)
    setStreamMode('video')
    try {
      const newStream = await start()
      setStream(newStream)
    } catch (error) {
      console.error('Failed to start video stream:', error)
      setStreamMode(null)
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

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    stream,
    streamMode,
    isConnecting,
    handleStartStream,
    handleStopStream,
    isStreamActive: stream !== null || isConnecting,
  }), [state, stream, streamMode, isConnecting])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
