
import React, { useState } from 'react';
import { Plant, HomeProfile } from '../types';
import { Icons } from '../constants';
import { GeminiContentService } from '../lib/gemini-content';

interface Props {
  plant: Plant;
  homeProfile: HomeProfile;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Plant>) => void;
}

export const RescueProtocolView: React.FC<Props> = ({ plant, homeProfile, onClose, onUpdate }) => {
  const [isRescuing, setIsRescuing] = useState(false);

  const lastDate = new Date(plant.lastWateredAt);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + plant.cadenceDays);
  const isOverdue = nextDate.getTime() < Date.now();

  const handleRescueTrigger = async () => {
    setIsRescuing(true);
    try {
      const service = new GeminiContentService(process.env.API_KEY!);
      const steps = await service.generateRescuePlan(plant, homeProfile);
      onUpdate(plant.id, { rescuePlan: steps });
    } catch (err) {
      console.error("Rescue plan generation failed", err);
    } finally {
      setIsRescuing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white animate-slide-up flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center animate-pulse ${isOverdue ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
            {isOverdue ? <Icons.WaterDrop /> : <span className="text-xl">⚠️</span>}
          </div>
          <div>
            <h2 className="font-black text-stone-800 uppercase tracking-tight">Rescue: {plant.name}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-blue-500' : 'text-red-500'}`}>
              {isOverdue ? 'Hydration Recovery' : 'Health Emergency'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-stone-50 text-stone-400 rounded-full">
          <Icons.X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section className={`p-6 rounded-[32px] border ${isOverdue ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100'}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isOverdue ? 'text-blue-600' : 'text-red-600'}`}>
            Vitals Assessment
          </h3>
          <p className="text-sm font-medium text-stone-700 leading-relaxed">
            {isOverdue 
              ? `Your ${plant.species} is severely dehydrated. It's past its watering window and is struggling to maintain cellular pressure.`
              : `Your ${plant.species} is showing physical signs of stress (Status: ${plant.status}). We need to investigate potential issues like overwatering, pests, or light shock.`
            }
          </p>
        </section>

        {!plant.rescuePlan || plant.rescuePlan.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">{isOverdue ? '💧' : '🩺'}</div>
            <h3 className="font-black text-stone-800 text-xl mb-2">No Plan Active</h3>
            <p className="text-stone-500 text-sm mb-6 max-w-[240px] mx-auto">
              Generate a specialized AI recovery roadmap for {plant.name} based on its current {isOverdue ? 'dryness' : 'symptoms'}.
            </p>
            <button 
              onClick={handleRescueTrigger}
              disabled={isRescuing}
              className={`w-full max-w-xs py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl disabled:opacity-50 transition-colors ${
                isOverdue ? 'bg-blue-600 shadow-blue-100' : 'bg-stone-900 shadow-stone-200'
              }`}
            >
              {isRescuing ? 'Analyzing Vitals...' : 'Start Rescue Mission'}
            </button>
          </div>
        ) : (
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Recovery Roadmap</h3>
            {plant.rescuePlan.map((step, i) => (
              <div key={i} className="flex gap-4 p-5 bg-stone-50 rounded-3xl border border-stone-100 group transition-all hover:border-green-200">
                <div className="w-8 h-8 bg-white border border-stone-200 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs text-stone-400">
                  {i + 1}
                </div>
                <p className="text-xs font-bold text-stone-700 leading-relaxed">{step}</p>
              </div>
            ))}
            <button 
              onClick={handleRescueTrigger}
              className="w-full py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest"
            >
              Regenerate Plan
            </button>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-stone-100 bg-stone-50/50">
        <p className="text-[10px] text-stone-400 font-medium leading-relaxed italic text-center">
          "Plans adapt to {homeProfile.seasonMode} dormancy/growth cycles and your local {homeProfile.humidity} humidity."
        </p>
      </div>
    </div>
  );
};
