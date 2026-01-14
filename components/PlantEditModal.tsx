import React, { useState } from 'react';
import { Plant, IntensityLevel, QualityLevel, WindowDirection } from '../types';
import { Icons } from '../constants';
import { GeminiContentService } from '../lib/gemini-content';
import { StorageService } from '../lib/storage-service';

interface Props {
  plant: Plant;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Plant>) => void;
}

export const PlantEditModal: React.FC<Props> = ({ plant, onClose, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNote, setNewNote] = useState('');

  const amounts: IntensityLevel[] = ['Low', 'Medium', 'Bright'];
  const exposures: QualityLevel[] = ['Indirect', 'Direct'];
  const directions: WindowDirection[] = ['North', 'South', 'East', 'West'];

  const lastDate = new Date(plant.lastWateredAt);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + plant.cadenceDays);
  const isOverdue = nextDate.getTime() < Date.now();

  const handleGenerateTips = async () => {
    if (!plant.species) return;
    setIsGenerating(true);
    try {
      const service = new GeminiContentService(process.env.API_KEY!);
      const tips = await service.generateCareGuide(plant, StorageService.getHomeProfile());
      if (tips.length > 0) {
        onUpdate(plant.id, { careGuide: tips });
      }
    } catch (err) {
      console.error("Failed to generate tips", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const notes = plant.notes || [];
    onUpdate(plant.id, { notes: [newNote, ...notes] });
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
        
        {/* Fixed Header with Side-by-Side Image and Info */}
        <div className="relative flex-shrink-0 bg-stone-50 border-b border-stone-100 p-6 flex gap-5 items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 border-4 border-white">
            <img src={plant.photoUrl} className="w-full h-full object-cover" alt={plant.species} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
               <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
               <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                }`}>
                  {isOverdue ? 'Thirsty' : 'Healthy'}
                </span>
            </div>
            <h2 className="text-xl font-black text-stone-800 truncate leading-tight">
              {plant.name || plant.species}
            </h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest truncate mt-0.5">
              {plant.species}
            </p>
            
            <div className="flex gap-2 mt-3">
               <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-100 shadow-sm">
                 <span className="text-[10px] font-black text-stone-600">💧 {plant.cadenceDays}d</span>
               </div>
               <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-100 shadow-sm">
                 <span className="text-[10px] font-black text-stone-600">☀️ {plant.lightIntensity || 'Med'}</span>
               </div>
            </div>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200 transition-colors">
            <Icons.X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
          {/* Identity Section */}
          <section className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Display Name</label>
              <input 
                value={plant.name}
                onChange={(e) => onUpdate(plant.id, { name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="Name your plant..."
              />
            </div>
          </section>

          {/* Environment Section */}
          <section>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block">Environment Settings</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Light Intensity</label>
                <select 
                  value={plant.lightIntensity}
                  onChange={(e) => onUpdate(plant.id, { lightIntensity: e.target.value as IntensityLevel })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                >
                  {amounts.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Light Quality</label>
                <select 
                  value={plant.lightQuality || 'Indirect'}
                  onChange={(e) => onUpdate(plant.id, { lightQuality: e.target.value as QualityLevel })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                >
                  {exposures.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Placement</label>
                <select 
                  value={plant.nearWindow ? 'Near Window' : 'In Room'}
                  onChange={(e) => onUpdate(plant.id, { nearWindow: e.target.value === 'Near Window' })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-xs font-bold text-stone-700"
                >
                  <option value="Near Window">Near Window</option>
                  <option value="In Room">In Room</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Water Cycle</label>
                <div className="flex items-center bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 gap-2">
                  <input 
                    type="number"
                    value={plant.cadenceDays}
                    onChange={(e) => onUpdate(plant.id, { cadenceDays: parseInt(e.target.value) || 1 })}
                    className="w-full bg-transparent text-xs font-bold text-stone-700 focus:outline-none"
                  />
                  <span className="text-[10px] font-black text-stone-300">DAYS</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI Care Guide Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">AI Care Insights</label>
              <button 
                onClick={handleGenerateTips}
                disabled={isGenerating}
                className="text-[10px] font-black text-green-600 uppercase tracking-widest disabled:opacity-50"
              >
                {isGenerating ? 'Analyzing...' : 'Refresh Protocol'}
              </button>
            </div>
            <div className="space-y-3">
              {!plant.careGuide || plant.careGuide.length === 0 ? (
                <button 
                  onClick={handleGenerateTips}
                  className="w-full p-6 border-2 border-dashed border-stone-100 rounded-[32px] text-stone-400 hover:border-green-100 hover:text-green-500 transition-all flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🪄</span>
                  <span className="text-[10px] font-black uppercase">Generate specialized care plan</span>
                </button>
              ) : (
                plant.careGuide.map((tip, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="w-6 h-6 bg-white border border-stone-200 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-[10px] text-stone-400">
                      {i + 1}
                    </div>
                    <p className="text-xs font-bold text-stone-600 leading-relaxed">{tip}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Care Journal Section */}
          <section>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 block">Care Journal</label>
            <div className="flex gap-2 mb-4">
              <input 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNote()}
                placeholder="Saw a new leaf today..."
                className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold text-stone-700"
              />
              <button 
                onClick={addNote}
                className="px-6 bg-stone-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Add
              </button>
            </div>
            <div className="space-y-3">
              {plant.notes?.map((note, i) => (
                <div key={i} className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                  <p className="text-xs font-medium text-stone-600 leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};