'use client'

import { useEffect, useState } from 'react'
import { Plant } from '@/types'

interface Props {
  plant: Plant
  isOverdue: boolean
  nextDate: Date
  onUpdate: (id: string, updates: Partial<Plant>) => void
}

export const LastWateredSection: React.FC<Props> = ({
  plant,
  isOverdue,
  nextDate,
  onUpdate,
}) => {
  const [localDate, setLocalDate] = useState('')

  useEffect(() => {
    if (plant.lastWateredAt) {
      setLocalDate(new Date(plant.lastWateredAt).toISOString().split('T')[0])
    }
  }, [plant.lastWateredAt])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalDate(val)

    if (val) {
      const newDate = new Date(val)
      newDate.setHours(12, 0, 0, 0)
      onUpdate(plant.id, { lastWateredAt: newDate.toISOString() })
    }
  }

  return (
    <section className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
      <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">
        Last Watered Date
      </label>
      <input
        type="date"
        value={localDate}
        onChange={handleDateChange}
        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
          Schedule: Every {plant.cadenceDays} days
        </p>
        <p className={`text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-green-600'}`}>
          Next: {nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </section>
  )
}
