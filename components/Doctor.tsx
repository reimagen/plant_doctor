'use client'

import { useRef, useEffect, useState } from 'react'
import { HomeProfile, Plant } from '@/types'
import { Icons } from '@/lib/constants'
import { usePlantDoctor } from '@/hooks/usePlantDoctor'
import { useRehabSpecialist } from '@/hooks/useRehabSpecialist'

interface Props {
  stream: MediaStream | null
  homeProfile: HomeProfile
  rehabPlant: Plant | null | undefined
  onAutoDetect: (plant: Plant) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  onStatusChange?: (isGeneratingPlan: boolean) => void
  onGeminiActiveChange?: (isActive: boolean) => void
}

export const Doctor: React.FC<Props> = ({
  stream,
  homeProfile,
  rehabPlant,
  onAutoDetect,
  onUpdatePlant,
  onStatusChange,
  onGeminiActiveChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isAudioOnly, setIsAudioOnly] = useState(false)

  const {
    startCall: startDiscoveryCall,
    stopCall: stopDiscoveryCall,
    isCalling: isDiscoveryCalling,
    discoveryLog
  } = usePlantDoctor(homeProfile, onAutoDetect)

  const {
    startRehabCall,
    stopCall: stopRehabCall,
    isCalling: isRehabCalling,
    isGeneratingPlan
  } = useRehabSpecialist(homeProfile, onUpdatePlant)

  const activeMode = rehabPlant ? 'rehab' : 'discovery'
  const isCalling = stream !== null

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(isGeneratingPlan)
  }, [isGeneratingPlan, onStatusChange])

  // Notify parent when Gemini becomes active
  useEffect(() => {
    const isGeminiActive = isDiscoveryCalling || isRehabCalling
    onGeminiActiveChange?.(isGeminiActive)
  }, [isDiscoveryCalling, isRehabCalling, onGeminiActiveChange])

  // Effect to handle starting and stopping calls based on stream presence
  // Note: startCall/stopCall are now stable (memoized with no deps), so they won't trigger re-runs
  useEffect(() => {
    if (stream) {
      // Assign stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsAudioOnly(stream.getVideoTracks().length === 0)

      // Start the appropriate call (guards inside hooks prevent duplicate calls)
      if (rehabPlant) {
        startRehabCall(stream, rehabPlant, videoRef, canvasRef)
      } else {
        startDiscoveryCall(stream, videoRef, canvasRef)
      }
    } else {
      // Clear video source and stop all calls
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      stopDiscoveryCall()
      stopRehabCall()
    }
  }, [stream, rehabPlant, startDiscoveryCall, stopDiscoveryCall, startRehabCall, stopRehabCall])

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col font-sans">
      {isAudioOnly ? (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black gap-4">
          <div className="text-green-400 animate-pulse">
            <Icons.Microphone />
          </div>
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
            Audio Stream Active
          </p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isCalling ? 'opacity-90' : 'opacity-30'
          }`}
        />
      )}

      {!isAudioOnly && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className={`relative w-[40vmin] h-[40vmin] max-w-[320px] max-h-[320px] rounded-full ${isGeneratingPlan ? 'animate-pulse' : ''}`}>
            <div className={`absolute inset-0 rounded-full border ${isGeneratingPlan ? 'border-amber-400/70' : 'border-white/50'}`} />
            <div className={`absolute inset-3 rounded-full border ${isGeneratingPlan ? 'border-amber-400/30' : 'border-white/20'}`} />
            <div className={`absolute inset-0 rounded-full ${isGeneratingPlan ? 'shadow-[0_0_40px_rgba(251,191,36,0.4)]' : 'shadow-[0_0_30px_rgba(255,255,255,0.25)]'}`} />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {isCalling && discoveryLog.length > 0 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-3 pointer-events-none max-w-[180px]">
          {discoveryLog.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 animate-slide-up shadow-lg"
              style={{
                opacity: Math.max(0, 1 - i * 0.15),
                transform: `translateX(${i * 4}px) scale(${1 - i * 0.05})`,
              }}
            >
              <span className="text-base flex-shrink-0">🌿</span>
              <span className="text-white font-black text-[9px] uppercase tracking-widest truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        <header className="flex justify-between items-start pt-36">
        </header>
        <footer className="pb-24 pointer-events-auto">
        </footer>
      </div>

      </div>
  )
}
