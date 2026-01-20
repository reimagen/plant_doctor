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
          <select
            value={plant.lightIntensity}
            onChange={e => onUpdate(plant.id, { lightIntensity: e.target.value as IntensityLevel })}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
          >
            {amounts.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Light Exposure
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.lightQuality ? 'Detected from call' : 'Manual'}
          </p>
          <select
            value={plant.lightQuality}
            onChange={e => onUpdate(plant.id, { lightQuality: e.target.value as QualityLevel })}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
          >
            {exposures.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Water Cycle (Days)
          </label>
          <input
            type="number"
            value={plant.cadenceDays}
            onChange={e => onUpdate(plant.id, { cadenceDays: parseInt(e.target.value) || 1 })}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Location
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.location && plant.location !== 'Detected via Inventory Sweep' ? 'Detected from call' : 'Manual'}
          </p>
          <input
            type="text"
            value={plant.location || ''}
            onChange={e => onUpdate(plant.id, { location: e.target.value })}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
            placeholder="e.g., Living Room Window"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Near Window
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {typeof plant.nearWindow === 'boolean' ? 'Detected from call' : 'Manual'}
          </p>
          <label className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(plant.nearWindow)}
              onChange={e => onUpdate(plant.id, {
                nearWindow: e.target.checked,
                windowDirection: e.target.checked ? plant.windowDirection : undefined
              })}
              className="h-4 w-4 text-green-600 rounded"
            />
            <span>{plant.nearWindow ? 'Yes' : 'No'}</span>
          </label>
        </div>
        <div>
          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">
            Window Direction
          </label>
          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-2">
            {plant.windowDirection ? 'Detected from call' : 'Manual'}
          </p>
          <select
            value={plant.windowDirection || ''}
            onChange={e => onUpdate(plant.id, { windowDirection: e.target.value as WindowDirection })}
            disabled={!plant.nearWindow}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700 disabled:opacity-50"
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
        </div>
      </div>
    </section>
  )
}
