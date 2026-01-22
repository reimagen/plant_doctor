'use client'

import { useRef, useEffect, useMemo } from 'react'
import { HomeProfile, Plant, LivestreamNotification } from '@/types'
import { usePlantDoctor } from '@/hooks/usePlantDoctor'
import { useRehabSpecialist } from '@/hooks/useRehabSpecialist'

interface Props {
  stream: MediaStream | null
  homeProfile: HomeProfile
  plants: Plant[]
  rehabTargetId?: string | null
  notifications: LivestreamNotification[]
  onAutoDetect: (plant: Plant) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  onNotification: (n: LivestreamNotification) => void
}

export const Doctor: React.FC<Props> = ({
  stream,
  homeProfile,
  plants,
  rehabTargetId,
  notifications,
  onAutoDetect,
  onUpdatePlant,
  onNotification
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const {
    startCall: startDiscoveryCall,
    stopCall: stopDiscoveryCall,
  } = usePlantDoctor(homeProfile, onAutoDetect, onNotification)

  const {
    startRehabCall,
    stopCall: stopRehabCall,
  } = useRehabSpecialist(homeProfile, onUpdatePlant, onNotification)

  const activeMode = rehabTargetId ? 'rehab' : 'discovery'
  const isCalling = stream !== null
  const rehabPlant = useMemo(() => {
    return rehabTargetId ? plants.find(p => p.id === rehabTargetId) : null
  }, [rehabTargetId, plants])

  // Effect to sync stream to video element (runs on mount and when stream changes)
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Effect to handle starting and stopping calls based on stream presence
  // Note: startCall/stopCall are now stable (memoized with no deps), so they won't trigger re-runs
  useEffect(() => {
    if (stream) {
      // Assign stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Start the appropriate call (guards inside hooks prevent duplicate calls)
      if (rehabTargetId && rehabPlant) {
        startRehabCall(stream, rehabPlant, videoRef, canvasRef)
      } else if (!rehabTargetId) {
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
  }, [stream, rehabTargetId, rehabPlant, startDiscoveryCall, stopDiscoveryCall, startRehabCall, stopRehabCall])

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col font-sans">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isCalling ? 'opacity-90' : 'opacity-30'
          }`}
      />

      <canvas ref={canvasRef} className="hidden" />

      {isCalling && notifications.length > 0 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-3 pointer-events-none max-w-[200px]">
          {notifications.map((notification, i) => {
            const bgClass = notification.type === 'task_complete'
              ? 'bg-green-500/60'
              : notification.type === 'status_change'
                ? 'bg-amber-500/60'
                : 'bg-black/60'
            return (
              <div
                key={notification.id}
                className={`${bgClass} backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 animate-slide-up shadow-lg`}
                style={{
                  opacity: Math.max(0, 1 - i * 0.15),
                  transform: `translateX(${i * 4}px) scale(${1 - i * 0.05})`,
                }}
              >
                <span className="text-base flex-shrink-0">{notification.emoji}</span>
                <span className="text-white font-black text-[9px] uppercase tracking-widest truncate">
                  {notification.message}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        {isCalling && (
          <header className="flex justify-between items-start pt-4">
            <div className="bg-black/40 backdrop-blur-xl px-5 py-3 rounded-[24px] border border-white/10">
              <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                {activeMode === 'rehab' ? `Target: ${rehabPlant?.name || 'Plant'}` : 'Inventory Sweep'}
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isCalling ? 'bg-green-400 animate-pulse' : 'bg-white/20'
                    }`}
                />
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                  {isCalling ? 'Analyzing Stream...' : 'Camera Standby'}
                </p>
              </div>
            </div>
          </header>
        )}
        <footer className="space-y-6 pb-24 pointer-events-auto flex flex-col items-center">
          {/* The main call button is now in the central Navigation component */}
        </footer>
      </div>
    </div>
  )
}
