'use client'

import { useSearchParams } from 'next/navigation'
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
  onAutoDetect: (plant: Plant) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  onStartStream: () => void
  onStopStream: () => void
  plants: Plant[]
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
  onAutoDetect,
  onUpdatePlant,
  onStartStream,
  onStopStream,
  plants
}) => {
  const searchParams = useSearchParams()
  const rehabTargetId = searchParams.get('plantId')
  const mode = searchParams.get('mode')
  const rehabPlant = rehabTargetId ? plants.find(plant => plant.id === rehabTargetId) : null

  // Determine welcome message based on entry route
  const getWelcomeMessage = () => {
    if (rehabTargetId) {
      return 'Begin livestream to start your plant\'s checkup'
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

  return (
    <div className="relative min-h-screen bg-black">
      {/* Top overlay - First Aid Steps OR How to Use */}
      {showRescueOverlay ? (
        <FirstAidStepOverlay tasks={rehabPlant.rescuePlanTasks!} />
      ) : !isActive ? (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl px-5 py-4 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 text-center">
              {getWelcomeMessage()}
            </p>
            {!rehabTargetId && (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 mt-3 text-left">
                  How to Use:
                </p>
                <p className="text-sm font-bold text-stone-800 mt-2">
                  1. First timers, start a video session to inventory all of your plants
                </p>
                <p className="text-sm font-bold text-stone-800 mt-1">
                  2. To chat about a specific plant, go to your plant's card in the Jungle page
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <Doctor
        stream={stream}
        homeProfile={homeProfile}
        plants={plants}
        rehabTargetId={rehabTargetId}
        onAutoDetect={onAutoDetect}
        onUpdatePlant={onUpdatePlant}
      />

      {/* Stream Controls Overlay */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 flex gap-3">
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
      {rehabPlant && !showRescueOverlay && (
        <aside className="absolute inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-t-[36px] border-t border-white/60 shadow-2xl">
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                  Plant Manager
                </p>
                <h2 className="text-lg font-black text-stone-800">
                  {rehabPlant.name || rehabPlant.species}
                </h2>
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Rehab Mode
              </span>
            </div>
            <Manager
              plant={rehabPlant}
              homeProfile={homeProfile}
              onUpdate={onUpdatePlant}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
