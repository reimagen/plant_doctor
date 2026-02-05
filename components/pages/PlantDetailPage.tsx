'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Plant, HomeProfile } from '@/types'
import { Icons } from '@/lib/constants'
import { Manager } from '@/components/Manager'
import { PlantStatusBadge } from '@/components/PlantStatusBadge'

interface Props {
  plant: Plant
  homeProfile: HomeProfile
  onUpdate: (id: string, updates: Partial<Plant>) => void
  onDelete: (id: string) => void
  onAdopt: (id: string) => void
  onStartStream: () => void
  streamError?: string | null
  onClearStreamError?: () => void
}

export const PlantDetailPage: React.FC<Props> = ({
  plant,
  homeProfile,
  onUpdate,
  onDelete,
  onAdopt,
  onStartStream,
  streamError,
  onClearStreamError
}) => {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nickname, setNickname] = useState(plant.name || '')

  const isPending = plant.status === 'pending'
  const canAdopt = isPending && !!plant.lastWateredAt

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

  const handleStartRehab = () => {
    router.push(`/doctor?plantId=${plant.id}`)
    onStartStream()
  }

  const handleNameChange = (value: string) => {
    setNickname(value)
    onUpdate(plant.id, { name: value })
  }

  const handleAdopt = () => {
    if (canAdopt) {
      onAdopt(plant.id)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 animate-fade-in">
      {streamError && (
        <div className="mx-6 mt-4">
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/60 rounded-3xl px-5 py-4 shadow-2xl flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-white">
              {streamError}
            </p>
            <button
              onClick={() => onClearStreamError?.()}
              className="text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="relative bg-white border-b border-stone-100 px-6 pt-4 pb-6">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <button
          onClick={handleStartRehab}
          className="absolute top-4 right-4 p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
          title="Start video rehab call"
        >
          <Icons.Video />
        </button>

        <div className="flex justify-center mb-4">
          <div className="relative h-10 w-24 overflow-hidden">
            <Image
              src="/pd-logo.png"
              alt="Plant Daddy logo"
              fill
              sizes="96px"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>

        <div className="flex gap-5 items-center pt-2">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 border-4 border-stone-50">
            <img src={plant.photoUrl} className="w-full h-full object-cover" alt={plant.species} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <PlantStatusBadge plant={plant} size="sm" />
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

      {/* Pending Adoption Banner */}
      {isPending && (
        <div className="mx-6 mt-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">
                Pending Adoption
              </p>
              {!plant.lastWateredAt || plant.lastWateredAt === '' ? (
                <p className="text-sm font-bold text-amber-700">
                  Set the last watered date below to enable adoption
                </p>
              ) : (
                <p className="text-sm font-bold text-green-700">
                  Ready to join your jungle! Give your plant a nickname, select the last watered date, and review the environment settings.
                </p>
              )}
            </div>
            <button
              onClick={handleAdopt}
              disabled={!canAdopt}
              className={`self-start sm:self-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${canAdopt
                ? 'bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700 active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
            >
              Adopt Plant
            </button>
          </div>
        </div>
      )}

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
