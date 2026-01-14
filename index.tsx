
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DoctorPage } from './pages/DoctorPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navigation } from './components/Navigation';
import { Plant, HomeProfile } from './types';
import { StorageService } from './lib/storage-service';

const App = () => {
  const [view, setView] = useState<'doctor' | 'inventory' | 'settings'>('inventory');
  const [plants, setPlants] = useState<Plant[]>(StorageService.getPlants);
  const [homeProfile, setHomeProfile] = useState<HomeProfile>(StorageService.getHomeProfile);

  useEffect(() => {
    StorageService.savePlants(plants);
  }, [plants]);

  useEffect(() => {
    StorageService.saveHomeProfile(homeProfile);
  }, [homeProfile]);

  // Automatic "Graduation" from Monitoring status
  useEffect(() => {
    const timer = setInterval(() => {
      setPlants(prev => prev.map(p => {
        if (p.status === 'warning') {
          const lastWatered = new Date(p.lastWateredAt).getTime();
          const dayInMs = 24 * 60 * 60 * 1000;
          if (Date.now() - lastWatered > dayInMs) {
            // Instead of just healthy, we flag for verification
            return { ...p, status: 'healthy', needsCheckIn: true };
          }
        }
        return p;
      }));
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const addPlant = (plant: Plant) => {
    setPlants(prev => {
      // If we are adding a plant that was already in the jungle, 
      // it means the user just did a check-in scan.
      const existing = prev.find(p => p.species === plant.species && p.status !== 'pending');
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, needsCheckIn: false, lastWateredAt: new Date().toISOString() } : p);
      }
      
      const exists = prev.find(p => p.species === plant.species && p.status === 'pending');
      if (exists) return prev;
      return [plant, ...prev];
    });
  };

  const updatePlantStatus = (id: string, status: Plant['status']) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const updatePlant = (id: string, updates: Partial<Plant>) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePlant = (id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  };

  const waterPlant = (id: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p;

      const lastDate = new Date(p.lastWateredAt);
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + p.cadenceDays);
      const daysOverdue = (Date.now() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
      
      let newStatus: Plant['status'] = 'healthy';
      if (daysOverdue > 3 || p.status === 'critical') {
        newStatus = 'warning';
      }

      return { 
        ...p, 
        lastWateredAt: new Date().toISOString(),
        status: newStatus,
        needsCheckIn: false // Reset check-in on manual water if it was pending
      };
    }));
  };

  return (
    <div className="min-h-screen pb-24 bg-stone-50 overflow-x-hidden selection:bg-green-200">
      <div className="max-w-md mx-auto min-h-screen relative">
        {view === 'doctor' && <DoctorPage homeProfile={homeProfile} onAutoDetect={addPlant} />}
        {view === 'inventory' && (
          <InventoryPage 
            plants={plants} 
            homeProfile={homeProfile}
            onWater={waterPlant} 
            onAdopt={(id) => updatePlantStatus(id, 'healthy')}
            onDelete={removePlant}
            onUpdate={updatePlant}
            onOpenDoctor={() => setView('doctor')}
          />
        )}
        {view === 'settings' && <SettingsPage profile={homeProfile} onChange={setHomeProfile} />}
        <Navigation currentView={view} setView={setView} />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
