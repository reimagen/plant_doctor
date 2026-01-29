'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import { HomeProfile, Plant } from '@/types'
import { Doctor } from '@/components/Doctor'
import { Manager } from '@/components/Manager'
import { FirstAidStepOverlay } from '@/components/plant-details/FirstAidStepOverlay'
import { Icons } from '@/lib/constants'

interface Props {
  stream: MediaStream | null
  streamMode: 'video' | null
  isConnecting: boolean
  homeProfile: HomeProfile
  plants: Plant[]
  onAutoDetect: (plant: Plant, options?: { forceNew?: boolean }) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  onStartStream: () => void
  onStopStream: () => void
  rehabPlant: Plant | null | undefined
}

/**
 * DoctorPage - Orchestrator page for livestream modes
 * Coordinates the Doctor component (livestream UI) with state management
 * Reads plantId from URL search params for rehab mode
 * Provides start/stop controls for video and audio streams
 */
export const DoctorPage: React.FC<Props> = ({
  stream,
  streamMode,
  isConnecting,
  homeProfile,
  plants,
  onAutoDetect,
  onUpdatePlant,
  onStartStream,
  onStopStream,
  rehabPlant
}) => {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const plantId = searchParams.get('plantId')
  const isAddPlantMode = mode === 'add-plant'
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  // Look up plant by ID directly from plants array
  const currentPlant = plantId ? plants.find(p => p.id === plantId) : null

  const handleAutoDetect = (plant: Plant) => {
    onAutoDetect(plant, { forceNew: isAddPlantMode })
  }

  // Determine welcome message based on entry route
  const getWelcomeMessage = () => {
    if (currentPlant) {
      return `Begin livestream checkup for ${currentPlant.name || currentPlant.species}`
    } else if (mode === 'add-plant') {
      return 'Begin a livestream to add a plant'
    } else {
      return 'The doctor is (always) in'
    }
  }

  // Consider a call active if either stream exists OR streamMode is set
  const isActive = stream !== null || streamMode !== null

  // Check if we should show the rescue timeline overlay
  const showRescueOverlay = rehabPlant && rehabPlant.rescuePlanTasks && rehabPlant.rescuePlanTasks.length > 0

  // Only show Phase 1 (First Aid) tasks during livestream
  // Phase 2 and 3 are only visible in plant details
  const hasIncompletePhase1 = rehabPlant?.rescuePlanTasks?.some(t => t.phase === 'phase-1' && !t.completed) ?? false

  // Memoize phase-1 tasks to prevent unnecessary re-renders of FirstAidStepOverlay
  const phase1Tasks = useMemo(() => {
    if (!rehabPlant?.rescuePlanTasks) return []
    return rehabPlant.rescuePlanTasks
      .filter(task => task.phase === 'phase-1')
      .sort((a, b) => (a.sequencing ?? 0) - (b.sequencing ?? 0))
  }, [rehabPlant?.rescuePlanTasks])

  // Track phase-1 completion for celebration — lives here so it survives overlay unmount
  const allPhase1Complete = phase1Tasks.length > 0 && phase1Tasks.every(t => t.completed)
  const [showCelebration, setShowCelebration] = useState(false)
  const celebrationShownRef = useRef(false)

  useEffect(() => {
    if (allPhase1Complete && !celebrationShownRef.current) {
      celebrationShownRef.current = true
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [allPhase1Complete])

  // If we have a plantId but no plant found, show loading state
  if (plantId && !currentPlant) {
    return (
      <div className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-white/60 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Loading Plant Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Celebration overlay — rendered independently so it survives overlay unmount */}
      {showCelebration && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl animate-slide-up">
          <div className="bg-green-500/90 backdrop-blur-xl border border-green-400/60 rounded-3xl px-5 py-4 shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <p className="text-sm font-black text-white">
                  First Aid Completed!
                </p>
                <p className="text-xs font-bold text-white/80 mt-1">
                  Follow the monitoring steps in your Plant Detail page
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top overlay - First Aid (Phase 1) rescue steps OR How to Use */}
      {showRescueOverlay && hasIncompletePhase1 && !showCelebration ? (
        <FirstAidStepOverlay tasks={phase1Tasks} />
      ) : !showCelebration && !isActive && !plantId ? (
        /* Discovery mode welcome with instructions */
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl px-5 py-4 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 text-center">
              {getWelcomeMessage()}
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 mt-3 text-left">
              How to Use:
            </p>
            <p className="text-sm font-bold text-stone-800 mt-2">
              1. First timers, start a video session to inventory all of your plants
            </p>
            <p className="text-sm font-bold text-stone-800 mt-1">
              2. Focus your camera, showing your plant in the ring below
            </p>
            <p className="text-sm font-bold text-stone-800 mt-1">
              3. The Doctor will assess your plant and add it to your Jungle
            </p>
            <p className="text-sm font-bold text-stone-800 mt-1">
              4. Begin the chat by saying Hello
            </p>
          </div>
        </div>
      ) : !showCelebration && !isActive && plantId ? (
        /* Plant checkup mode - smaller message */
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl px-5 py-3 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 text-center">
              {getWelcomeMessage()}
            </p>
          </div>
        </div>
      ) : null}

      <Doctor
        stream={stream}
        homeProfile={homeProfile}
        rehabPlant={rehabPlant}
        onAutoDetect={handleAutoDetect}
        onUpdatePlant={onUpdatePlant}
        onStatusChange={setIsGeneratingPlan}
      />

      {/* Stream Controls Overlay - 3 column grid */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 grid grid-cols-3 items-center gap-3 min-w-0">
        {/* Left: Plant Nickname or Inventory Sweep */}
        <div className="justify-self-start">
          {plantId ? (
            <div className="bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 pointer-events-none">
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                {currentPlant?.name || currentPlant?.species || 'Plant Checkup'}
              </span>
            </div>
          ) : (
            <div className="bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 pointer-events-none">
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                Inventory Sweep
              </span>
            </div>
          )}
        </div>

        {/* Center: Call Button */}
        <div className="justify-self-center">
          {!isActive ? (
            <button
              onClick={onStartStream}
              disabled={isConnecting || streamMode !== null}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all ${isConnecting || streamMode !== null
                ? 'bg-stone-500/50 cursor-not-allowed opacity-50'
                : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              title="Start video stream"
            >
              <Icons.Video />
              <span className="text-xs font-bold uppercase">Start</span>
            </button>
          ) : (
            /* Stop Button */
            <button
              onClick={onStopStream}
              className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all animate-pulse"
              title="Stop stream"
            >
              <Icons.Stop />
              <span className="text-xs font-bold uppercase">Stop</span>
            </button>
          )}
        </div>

        {/* Right: Status indicator */}
        <div className="justify-self-end">
          {isActive && (
            <div className="bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isGeneratingPlan ? 'bg-amber-400' : 'bg-green-400'} animate-pulse`} />
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  {isGeneratingPlan ? 'Generating Plan...' : 'Analyzing...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
