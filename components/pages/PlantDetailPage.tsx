'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plant, HomeProfile } from '@/types'
import { Icons } from '@/lib/constants'
import { Manager } from '@/components/Manager'

interface Props {
  plant: Plant
  homeProfile: HomeProfile
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onDelete: (id: string) => void
  onStartStream: (mode: 'video' | 'audio') => void
}

export const PlantDetailPage: React.FC<Props> = ({ plant, homeProfile, onUpdate, onDelete, onStartStream }) => {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nickname, setNickname] = useState(plant.name || '')

  const lastDate = new Date(plant.lastWateredAt)
  const nextDateMs = lastDate.getTime() + plant.cadenceDays * 24 * 60 * 60 * 1000
  const isOverdue = nextDateMs < Date.now()

  useEffect(() => {
    setNickname(plant.name || '')
  }, [plant.name])

  const handleBack = () => {
    router.push('/')
  }

  const handleDelete = (id: string) => {
    onDelete(id)
    router.push('/')
  }

  const handleStartRehab = (mode: 'video' | 'audio') => {
    router.push(`/doctor?plantId=${plant.id}`)
    onStartStream(mode)
  }

  const handleNameChange = (value: string) => {
    setNickname(value)
    onUpdate(plant.id, { name: value })
  }

  return (
    <div className="min-h-screen bg-stone-50 animate-fade-in">
      {/* Header Section */}
      <div className="relative bg-white border-b border-stone-100 p-6">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors"
        >
          <Icons.ChevronLeft />
        </button>

        {/* Rehab Call Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => handleStartRehab('audio')}
            className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
            title="Start audio rehab call"
          >
            <Icons.Microphone />
          </button>
          <button
            onClick={() => handleStartRehab('video')}
            className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
            title="Start video rehab call"
          >
            <Icons.Video />
          </button>
        </div>

        <div className="flex gap-5 items-center pt-8">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 border-4 border-stone-50">
            <img src={plant.photoUrl} className="w-full h-full object-cover" alt={plant.species} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                {isOverdue ? 'Urgent Care' : 'Stable'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditingName ? (
                <input
                  value={nickname}
                  onChange={(event) => handleNameChange(event.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'Escape') {
                      setIsEditingName(false)
                    }
                  }}
                  className="w-full bg-transparent border-b border-stone-300 text-xl font-black text-stone-800 leading-tight focus:outline-none focus:border-stone-500"
                  placeholder="Give it a name..."
                  autoFocus
                />
              ) : (
                <>
                  <h2 className="text-xl font-black text-stone-800 truncate leading-tight">
                    {plant.name || 'Unnamed'}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    title="Edit nickname"
                  >
                    <Icons.Pencil />
                  </button>
                </>
              )}
            </div>

            <p className="text-[11px] font-bold text-stone-400 italic truncate">
              {plant.species}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Manager
          plant={plant}
          homeProfile={homeProfile}
          onUpdate={onUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
