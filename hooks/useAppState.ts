'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plant, HomeProfile } from '@/types'
import { StorageService } from '@/lib/storage-service'
import { getCurrentSeason } from '@/lib/season'
import { DEFAULT_HOME_PROFILE } from '@/lib/constants'

export const useAppState = () => {
  const [plants, setPlants] = useState<Plant[]>([])
  const [homeProfile, setHomeProfile] = useState<HomeProfile>(DEFAULT_HOME_PROFILE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedPlants = StorageService.getPlants()
    const savedProfile = StorageService.getHomeProfile()
    const hemisphere = savedProfile.hemisphere || 'Northern'
    const profileWithSeason = { ...savedProfile, hemisphere, seasonMode: getCurrentSeason(hemisphere) }

    setPlants(savedPlants)
    setHomeProfile(profileWithSeason)
    setIsHydrated(true)
  }, [])

  const updateHomeProfile = useCallback((profile: HomeProfile) => {
    const correctSeason = getCurrentSeason(profile.hemisphere)
    setHomeProfile({ ...profile, seasonMode: correctSeason })
  }, [])

  // Persistence
  useEffect(() => {
    if (isHydrated) {
      StorageService.savePlants(plants)
    }
  }, [plants, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      StorageService.saveHomeProfile(homeProfile)
    }
  }, [homeProfile, isHydrated])

  // Health Simulation: Check-in logic
  useEffect(() => {
    const timer = setInterval(() => {
      setPlants(prev => prev.map(p => {
        if (p.status === 'warning') {
          const lastWatered = new Date(p.lastWateredAt).getTime()
          const dayInMs = 24 * 60 * 60 * 1000
          if (Date.now() - lastWatered > dayInMs) {
            return { ...p, needsCheckIn: true }
          }
        }
        return p
      }))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const addPlant = useCallback((newPlant: Plant) => {
    setPlants(prev => {
      const exists = prev.find(p => p.id === newPlant.id || (p.species === newPlant.species && p.location === newPlant.location))

      if (exists) {
        return prev.map(p => p.id === exists.id ? { ...p, ...newPlant, status: p.status } : p)
      }

      return [{ ...newPlant, status: 'pending' }, ...prev]
    })
  }, [])

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const removePlant = useCallback((id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id))
  }, [])

  const waterPlant = useCallback((id: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p
      return { ...p, lastWateredAt: new Date().toISOString(), status: 'healthy', needsCheckIn: false }
    }))
  }, [])

  const adoptPlant = useCallback((id: string) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, status: 'healthy', lastWateredAt: new Date().toISOString() } : p))
  }, [])

  return {
    plants,
    homeProfile,
    setHomeProfile: updateHomeProfile,
    addPlant,
    updatePlant,
    removePlant,
    waterPlant,
    adoptPlant,
    isHydrated
  }
}
