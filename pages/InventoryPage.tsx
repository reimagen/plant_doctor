
import React, { useState } from 'react';
import { Plant, HomeProfile } from '../types';
import { PlantCard } from '../components/PlantCard';
import { PlantEditModal } from '../components/PlantEditModal';
import { RescueProtocolView } from '../components/RescueProtocolView';

interface Props {
  plants: Plant[];
  homeProfile: HomeProfile;
  onWater: (id: string) => void;
  onAdopt: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Plant>) => void;
  onOpenDoctor: () => void;
}

export const InventoryPage: React.FC<Props> = ({ plants, homeProfile, onWater, onAdopt, onDelete, onUpdate, onOpenDoctor }) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [rescuePlantId, setRescuePlantId] = useState<string | null>(null);
  
  const pendingPlants = plants.filter(p => p.status === 'pending');
  const junglePlants = plants.filter(p => p.status !== 'pending');
  
  const selectedPlant = plants.find(p => p.id === selectedPlantId);
  const rescuePlant = plants.find(p => p.id === rescuePlantId);

  return (
    <div className="p-6 animate-fade-in pb-24 min-h-screen bg-stone-50">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-stone-800 tracking-tight">My Jungle</h1>
        <p className="text-stone-500 font-medium">You have {junglePlants.length} active companions</p>
      </header>

      {pendingPlants.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">Pending Adoption ({pendingPlants.length})</h2>
          </div>
          <div className="grid gap-4">
            {pendingPlants.map((plant) => (
              <div key={plant.id} onClick={() => setSelectedPlantId(plant.id)} className="cursor-pointer">
                <PlantCard 
                  plant={plant} 
                  onWater={onWater} 
                  onAdopt={onAdopt} 
                  onDelete={onDelete} 
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">The Jungle</h2>
        </div>
        
        {junglePlants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[40px] border border-stone-100 shadow-sm">
            <div className="text-5xl mb-6">🪴</div>
            <h3 className="font-black text-stone-700 text-xl">Empty Jungle</h3>
            <p className="text-stone-400 max-w-[200px] mx-auto text-sm mt-2 leading-relaxed font-medium">Use the Doctor to find and adopt your plants.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {junglePlants.map((plant) => (
              <div key={plant.id} onClick={() => setSelectedPlantId(plant.id)} className="cursor-pointer">
                <PlantCard 
                  plant={plant} 
                  onWater={onWater} 
                  onDelete={onDelete}
                  onCheckIn={onOpenDoctor}
                  onRescue={(id) => setRescuePlantId(id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedPlant && (
        <PlantEditModal 
          plant={selectedPlant} 
          onClose={() => setSelectedPlantId(null)} 
          onUpdate={onUpdate} 
        />
      )}

      {rescuePlant && (
        <RescueProtocolView 
          plant={rescuePlant} 
          homeProfile={homeProfile}
          onClose={() => setRescuePlantId(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};
