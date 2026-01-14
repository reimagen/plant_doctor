
import React from 'react';
import { HomeProfile } from '../types';

interface Props {
  profile: HomeProfile;
  onChange: (profile: HomeProfile) => void;
}

export const SettingsPage: React.FC<Props> = ({ profile, onChange }) => {
  const update = (key: keyof HomeProfile, value: any) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-fade-in min-h-screen bg-stone-50">
      <header>
        <h1 className="text-3xl font-black text-stone-800">Home Profile</h1>
        <p className="text-stone-500">How Gemini adapts care to your environment</p>
      </header>

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

        <div>
          <h3 className="font-bold text-stone-800 mb-4">Humidity Level</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['dry', 'normal', 'humid'] as const).map(v => (
              <button
                key={v}
                onClick={() => update('humidity', v)}
                className={`py-4 rounded-2xl text-xs font-black capitalize border transition-all ${profile.humidity === v ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-100'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-stone-800 mb-4">Seasonal Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['Winter', 'Spring', 'Summer', 'Fall'] as const).map(v => (
              <button
                key={v}
                onClick={() => update('seasonMode', v)}
                className={`py-4 rounded-2xl text-xs font-black border transition-all ${profile.seasonMode === v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-500 border-stone-100'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-stone-800 mb-4">Natural Light</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'bright'] as const).map(v => (
              <button
                key={v}
                onClick={() => update('light', v)}
                className={`py-4 rounded-2xl text-xs font-black capitalize border transition-all ${profile.light === v ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-100'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-green-50 p-6 rounded-[32px] border border-green-100">
        <p className="text-green-800 text-sm leading-relaxed">
          <span className="font-black">Expert Tip:</span> During <span className="font-bold">{profile.seasonMode}</span>, plants typically need {profile.seasonMode === 'Summer' ? 'increased' : 'reduced'} water frequency. Your Plant Doctor uses these factors for every diagnosis.
        </p>
      </div>
    </div>
  );
};
