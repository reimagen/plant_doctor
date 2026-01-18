'use client'

import { useRef, useEffect } from 'react'
import { HomeProfile, Plant } from '@/types'
import { Icons } from '@/lib/constants'
import { usePlantDoctor } from '@/hooks/usePlantDoctor'
import { useRehabSpecialist } from '@/hooks/useRehabSpecialist'

interface Props {
  homeProfile: HomeProfile
  onAutoDetect: (plant: Plant) => void
  onUpdatePlant: (id: string, updates: Partial<Plant>) => void
  plants: Plant[]
  rehabTargetId?: string | null
}

export const DoctorPage: React.FC<Props> = ({ homeProfile, onAutoDetect, onUpdatePlant, plants, rehabTargetId }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const discovery = usePlantDoctor(homeProfile, onAutoDetect)
  const rehab = useRehabSpecialist(homeProfile, onUpdatePlant)

  const activeMode = rehabTargetId ? 'rehab' : 'discovery'
  const isCalling = discovery.isCalling || rehab.isCalling
  const rehabPlant = rehabTargetId ? plants.find(p => p.id === rehabTargetId) : null

  useEffect(() => {
    if (rehabTargetId && !rehab.isCalling && rehabPlant) {
      const timer = setTimeout(() => {
        if (videoRef.current && canvasRef.current) {
          rehab.startRehabCall(videoRef.current, canvasRef.current, rehabPlant)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [rehabTargetId, rehabPlant, rehab])

  const toggleCall = async () => {
    if (isCalling) {
      discovery.stopCall()
      rehab.stopCall()
    } else {
      if (videoRef.current && canvasRef.current) {
        if (rehabTargetId && rehabPlant) {
          await rehab.startRehabCall(videoRef.current, canvasRef.current, rehabPlant)
        } else {
          await discovery.startCall(videoRef.current, canvasRef.current)
        }
      }
    }
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col font-sans">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isCalling ? 'opacity-90' : 'opacity-30'}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Discovery Log - Positioned to the right side */}
      {isCalling && discovery.discoveryLog.length > 0 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-3 pointer-events-none max-w-[180px]">
          {discovery.discoveryLog.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 animate-slide-up shadow-lg"
              style={{
                opacity: Math.max(0, 1 - (i * 0.15)),
                transform: `translateX(${i * 4}px) scale(${1 - (i * 0.05)})`,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <span className="text-base flex-shrink-0">L</span>
              <span className="text-white font-black text-[9px] uppercase tracking-widest truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        <header className="flex justify-between items-start pt-4">
          <div className="bg-black/40 backdrop-blur-xl px-5 py-3 rounded-[24px] border border-white/10">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-1">
              {activeMode === 'rehab' ? `Target: ${rehabPlant?.name || 'Plant'}` : 'Inventory Sweep'}
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isCalling ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                {isCalling ? 'Analyzing Stream...' : 'Camera Standby'}
              </p>
            </div>
          </div>
        </header>

        <footer className="space-y-6 pb-24 pointer-events-auto flex flex-col items-center">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={toggleCall}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_0_50px_rgba(255,255,255,0.1)] ${
                isCalling
                  ? 'bg-red-500 ring-8 ring-red-500/20'
                  : 'bg-white ring-8 ring-white/10'
              }`}
            >
              {isCalling ? (
                <div className="w-8 h-8 bg-white rounded-md shadow-inner" />
              ) : (
                <div className="text-green-600 scale-150"><Icons.Camera /></div>
              )}
            </button>
            <div className="text-center">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-1">
                {isCalling ? 'End Tour' : 'Start Sweep'}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
