
import { useState, useEffect, useCallback } from 'react';
import { Plant, HomeProfile } from '../types';
import { StorageService } from '../lib/storage-service';
import { getCurrentSeason } from '../lib/season';

export const useAppState = () => {
  const [view, setView] = useState<'doctor' | 'inventory' | 'settings'>('inventory');
  const [plants, setPlants] = useState<Plant[]>(StorageService.getPlants());
  const [homeProfile, setHomeProfile] = useState<HomeProfile>(() => {
    const saved = StorageService.getHomeProfile();
    // Use saved hemisphere to determine season, defaulting to Northern if not set (legacy)
    const hemisphere = saved.hemisphere || 'Northern';
    return { ...saved, hemisphere, seasonMode: getCurrentSeason(hemisphere) };
  });
  const [rehabTarget, setRehabTarget] = useState<string | null>(null);

  const updateHomeProfile = useCallback((profile: HomeProfile) => {
    // If hemisphere changed, recalculate the season
    const correctSeason = getCurrentSeason(profile.hemisphere);
    setHomeProfile({ ...profile, seasonMode: correctSeason });
  }, []);

  // Persistence
  useEffect(() => {
    StorageService.savePlants(plants);
  }, [plants]);

  useEffect(() => {
    StorageService.saveHomeProfile(homeProfile);
  }, [homeProfile]);

  // Health Simulation: Check-in logic
  useEffect(() => {
    const timer = setInterval(() => {
      setPlants(prev => prev.map(p => {
        if (p.status === 'warning') {
          const lastWatered = new Date(p.lastWateredAt).getTime();
          const dayInMs = 24 * 60 * 60 * 1000;
          if (Date.now() - lastWatered > dayInMs) {
            return { ...p, needsCheckIn: true };
          }
        }
        return p;
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const addPlant = useCallback((newPlant: Plant) => {
    setPlants(prev => {
      // Check if this plant (by ID or species in same location) already exists
      const exists = prev.find(p => p.id === newPlant.id || (p.species === newPlant.species && p.location === newPlant.location));

      if (exists) {
        // Just update metadata if it exists, don't change status from active to pending
        return prev.map(p => p.id === exists.id ? { ...p, ...newPlant, status: p.status } : p);
      }

      // CRITICAL: We do NOT setView here. Detection happens in the background.
      // Newly detected plants are ALWAYS 'pending' until the user "Adopts" them.
      return [{ ...newPlant, status: 'pending' }, ...prev];
    });
  }, []);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePlant = useCallback((id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  }, []);

  const waterPlant = useCallback((id: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, lastWateredAt: new Date().toISOString(), status: 'healthy', needsCheckIn: false };
    }));
  }, []);

  const adoptPlant = useCallback((id: string) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, status: 'healthy', lastWateredAt: new Date().toISOString() } : p));
  }, []);

  const handleOpenRehab = useCallback((id: string) => {
    setRehabTarget(id);
    setView('doctor');
  }, []);

  const handleSetView = useCallback((newView: 'doctor' | 'inventory' | 'settings') => {
    if (newView !== 'doctor') setRehabTarget(null);
    setView(newView);
  }, []);

  return {
    view,
    setView: handleSetView,
    plants,
    homeProfile,
    setHomeProfile: updateHomeProfile,
    rehabTarget,
    addPlant,
    updatePlant,
    removePlant,
    waterPlant,
    adoptPlant,
    handleOpenRehab
  };
};
