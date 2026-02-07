'use client'

import Image from 'next/image'
import { HomeProfile } from '@/types'

interface Props {
  profile: HomeProfile
  onChange: (profile: HomeProfile) => void
}

export const SettingsPage: React.FC<Props> = ({ profile, onChange }) => {
  const update = (key: keyof HomeProfile, value: HomeProfile[keyof HomeProfile]) => {
    onChange({ ...profile, [key]: value })
  }

  const renderOptionGroup = <T extends string>(
    label: string,
    options: readonly T[],
    value: T,
    onSelect: (next: T) => void
  ) => (
    <div>
      <h3 className="font-bold text-stone-800 mb-4">{label}</h3>
      <div className={`grid gap-2 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {options.map(option => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`py-4 rounded-2xl text-xs font-black capitalize border transition-all ${value === option ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-500 border-stone-100'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6 pb-24 space-y-4 animate-fade-in min-h-screen bg-stone-50">
      <div className="space-y-3">
        <header className="text-center">
          <div className="flex justify-center mb-1">
            <div className="relative h-12 w-28 overflow-hidden">
              <Image
                src="/pd-logo.png"
                alt="Plant Daddy logo"
                fill
                sizes="112px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-black text-stone-800">Home Profile</h1>
          <p className="text-stone-500">Creates custom care plans based on your home environment.</p>
        </header>

        <div className="bg-green-50 p-6 rounded-[32px] border border-green-100">
          <p className="text-green-800 text-sm leading-relaxed">
            <span className="font-black">Expert Tip:</span> During <span className="font-bold">{profile.seasonMode}</span>, plants typically need {profile.seasonMode === 'Summer' ? 'increased' : 'reduced'} water frequency. Your Plant Doctor uses these factors for every diagnosis.
          </p>
        </div>
      </div>

      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-stone-100 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-800">Heated Home</h3>
            <p className="text-xs text-stone-400">Dry air from radiators/AC</p>
          </div>
          <button
            onClick={() => update('heatedHome', !profile.heatedHome)}
            className={`w-14 h-8 rounded-full transition-colors relative ${profile.heatedHome ? 'bg-green-500' : 'bg-stone-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${profile.heatedHome ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {renderOptionGroup('Humidity Level', ['dry', 'normal', 'humid'] as const, profile.humidity, (v) => update('humidity', v))}

        {renderOptionGroup('Hemisphere', ['Northern', 'Southern'] as const, profile.hemisphere, (v) => update('hemisphere', v))}

        <div>
          <h3 className="font-bold text-stone-800 mb-4">Seasonal Mode</h3>
          <div className="w-full py-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between px-6">
            <span className="font-black text-green-800 text-lg">{profile.seasonMode}</span>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider bg-white px-3 py-1 rounded-full">Auto-Detected</span>
          </div>
        </div>

        {renderOptionGroup('Natural Light', ['low', 'medium', 'bright'] as const, profile.light, (v) => update('light', v))}
      </section>

    </div>
  )
}
