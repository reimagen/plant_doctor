'use client'

import { Plant, IntensityLevel, QualityLevel, WindowDirection } from '@/types'

interface Props {
  plant: Plant
  onUpdate: (id: string, updates: Partial<Plant>) => void
}

export const EnvironmentSettingsSection: React.FC<Props> = ({ plant, onUpdate }) => {
  const amounts: IntensityLevel[] = ['Low', 'Medium', 'Bright']
  const exposures: QualityLevel[] = ['Indirect', 'Direct']
  const directions: WindowDirection[] = ['North', 'South', 'East', 'West']

  return (
    <section>
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block">
        Environment Settings
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Light Intensity
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.lightIntensity ? 'Detected from call' : 'Manual'}
          </p>
          <div className="relative">
            <select
              value={plant.lightIntensity}
              onChange={e => onUpdate(plant.id, { lightIntensity: e.target.value as IntensityLevel })}
              className="w-full bg-white border border-stone-100 rounded-2xl px-4 py-3 pr-12 text-xs font-bold text-stone-700 appearance-none"
            >
              {amounts.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-800" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.086l3.71-3.856a.75.75 0 1 1 1.08 1.04l-4.24 4.405a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Light Exposure
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.lightQuality ? 'Detected from call' : 'Manual'}
          </p>
          <div className="relative">
            <select
              value={plant.lightQuality}
              onChange={e => onUpdate(plant.id, { lightQuality: e.target.value as QualityLevel })}
              className="w-full bg-white border border-stone-100 rounded-2xl px-4 py-3 pr-12 text-xs font-bold text-stone-700 appearance-none"
            >
              {exposures.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-800" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.086l3.71-3.856a.75.75 0 1 1 1.08 1.04l-4.24 4.405a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Water Cycle (Days)
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            AI recommended
          </p>
          <input
            type="number"
            value={plant.cadenceDays}
            onChange={e => onUpdate(plant.id, { cadenceDays: parseInt(e.target.value) || 1 })}
            className="w-full bg-white border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
            style={{ appearance: 'auto' }}
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Location (Optional)
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.location && plant.location !== 'Detected via Inventory Sweep' ? 'Detected from call' : 'Manual Entry'}
          </p>
          <input
            type="text"
            value={plant.location || ''}
            onChange={e => onUpdate(plant.id, { location: e.target.value })}
            className="w-full bg-white border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700 placeholder:text-stone-300"
            placeholder="e.g., Living Room"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Near Window
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {typeof plant.nearWindow === 'boolean' ? 'Detected from call' : 'Manual'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700">
              <input
                type="radio"
                name={`near-window-${plant.id}`}
                checked={plant.nearWindow === true}
                onChange={() => onUpdate(plant.id, {
                  nearWindow: true,
                })}
                className="h-4 w-4 text-green-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700">
              <input
                type="radio"
                name={`near-window-${plant.id}`}
                checked={plant.nearWindow === false}
                onChange={() => onUpdate(plant.id, {
                  nearWindow: false,
                  windowDirection: undefined
                })}
                className="h-4 w-4 text-green-600"
              />
              <span>No</span>
            </label>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Window Direction
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.windowDirection ? 'Detected from call' : 'Manual'}
          </p>
          <div className="relative">
            <select
              value={plant.windowDirection || ''}
              onChange={e => onUpdate(plant.id, { windowDirection: e.target.value as WindowDirection })}
              disabled={!plant.nearWindow}
              className="w-full bg-white border border-stone-100 rounded-2xl px-4 py-3 pr-12 text-xs font-bold text-stone-700 appearance-none disabled:opacity-50"
            >
              <option value="" disabled>
                Select direction
              </option>
              {directions.map(direction => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-800" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.086l3.71-3.856a.75.75 0 1 1 1.08 1.04l-4.24 4.405a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
