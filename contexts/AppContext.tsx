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
  streamError: string | null
  clearStreamError: () => void
  globalError: string | null
  reportError: (message: string) => void
  clearGlobalError: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [globalError, setGlobalError] = useState<string | null>(null)
  const reportError = (message: string) => setGlobalError(message)
  const state = useAppState(reportError)
  const { start, stop } = useMediaStream()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [streamMode, setStreamMode] = useState<'video' | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)

  const handleStartStream = async () => {
    if (isConnecting || stream || streamMode !== null) return
    setStreamError(null)
    setIsConnecting(true)
    setStreamMode('video')
    try {
      const newStream = await start()
      setStream(newStream)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start video stream.'
      console.error('Failed to start video stream:', error)
      setStreamError(message)
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
    setStreamError(null)
  }

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    stream,
    streamMode,
    isConnecting,
    handleStartStream,
    handleStopStream,
    isStreamActive: stream !== null || isConnecting,
    streamError,
    clearStreamError: () => setStreamError(null),
    globalError,
    reportError,
    clearGlobalError: () => setGlobalError(null),
  }), [state, stream, streamMode, isConnecting, streamError, globalError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
