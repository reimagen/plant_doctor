'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plant, HomeProfile } from '@/types'
import { StorageService } from '@/lib/storage-service'
import { getCurrentSeason } from '@/lib/season'
import { DEFAULT_HOME_PROFILE } from '@/lib/constants'

export const useAppState = () => {
  const [plants, setPlants] = useState<Plant[]>([])
  const [homeProfile, setHomeProfile] = useState<HomeProfile>(DEFAULT_HOME_PROFILE)
  const [isHydrated, setIsHydrated] = useState(false)
  const careGuideRequestsRef = useRef(new Set<string>())

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
  // Show "Check-up Due" when plant is in warning status AND water is due within 24 hours (daysDiff <= 1)
  useEffect(() => {
    const timer = setInterval(() => {
      setPlants(prev => prev.map(p => {
        if (p.status === 'warning' && p.lastWateredAt) {
          // Calculate next watering date
          const lastDate = new Date(p.lastWateredAt)
          const nextDate = new Date(lastDate)
          nextDate.setDate(lastDate.getDate() + (p.cadenceDays || 7))

          // Calculate days until next watering
          const now = new Date()
          nextDate.setHours(0, 0, 0, 0)
          now.setHours(0, 0, 0, 0)
          const daysDiff = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          // Set needsCheckIn when water is due within 24 hours
          if (daysDiff <= 1) {
            return { ...p, needsCheckIn: true }
          } else {
            return { ...p, needsCheckIn: false }
          }
        }
        return p
      }))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const requestCareGuide = useCallback(async (plant: Plant) => {
    if (!plant.species) return
    if (careGuideRequestsRef.current.has(plant.id)) return
    careGuideRequestsRef.current.add(plant.id)
    try {
      const response = await fetch('/api/gemini/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'care-guide',
          plant,
          homeProfile
        }),
      })

      if (!response.ok) {
        throw new Error(`API error generating care guide: ${response.status}`)
      }

      const data = await response.json()
      if (data.tips && data.tips.length > 0) {
        setPlants(currentPlants =>
          currentPlants.map(p =>
            p.id === plant.id ? { ...p, careGuide: data.tips, careGuideGeneratedAt: new Date().toISOString() } : p
          )
        )
      } else if (data.error) {
        console.error(`Care guide generation API error: ${data.error}`)
      }
    } catch (e) {
      console.error('Failed to generate care guide on add:', e)
    } finally {
      careGuideRequestsRef.current.delete(plant.id)
    }
  }, [homeProfile])

  useEffect(() => {
    plants.forEach((plant) => {
      if (plant.status !== 'pending') return
      if (plant.careGuide && plant.careGuide.length > 0) return
      if (careGuideRequestsRef.current.has(plant.id)) return
      requestCareGuide(plant)
    })
  }, [plants, requestCareGuide])

  const addPlant = useCallback((newPlant: Plant, options?: { forceNew?: boolean }) => {
    setPlants(prev => {
      const forceNew = options?.forceNew ?? false
      const exists = forceNew
        ? null
        : prev.find(p =>
          p.id === newPlant.id
          || (p.status === 'pending' && p.species === newPlant.species && p.location === newPlant.location)
        )

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

      // Calculate if this was a major overdue watering
      const getDaysDiff = () => {
        if (!p.lastWateredAt) return null
        const lastDate = new Date(p.lastWateredAt)
        const nextDate = new Date(lastDate)
        nextDate.setDate(lastDate.getDate() + (p.cadenceDays || 7))
        const now = new Date()
        nextDate.setHours(0, 0, 0, 0)
        now.setHours(0, 0, 0, 0)
        return Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      const daysDiff = getDaysDiff()
      const majorThreshold = p.overdueThresholdMajor ?? 5
      // daysOverdue: -2 = 1 day overdue (after 1-day grace period)
      const daysOverdue = daysDiff !== null && daysDiff < -1 ? Math.abs(daysDiff) - 1 : 0
      const wasMajorOverdue = daysOverdue > majorThreshold

      if (wasMajorOverdue && p.status !== 'critical') {
        // Water + flip to monitoring with checkup needed in 3 days
        const checkupDate = new Date()
        checkupDate.setDate(checkupDate.getDate() + 3)
        return {
          ...p,
          lastWateredAt: new Date().toISOString(),
          status: 'warning' as const,
          needsCheckIn: true,
          nextCheckupDate: checkupDate.toISOString()
        }
      }

      // Normal watering - flip to healthy
      return {
        ...p,
        lastWateredAt: new Date().toISOString(),
        status: 'healthy' as const,
        needsCheckIn: false,
        nextCheckupDate: undefined
      }
    }))
  }, [])

  const adoptPlant = useCallback((id: string) => {
    // Immediately update the plant's status for instant UI feedback.
    setPlants(prevPlants => {
      const plantToAdopt = prevPlants.find(p => p.id === id)
      if (!plantToAdopt) {
        console.error("Plant to adopt not found.")
        return prevPlants
      }

      // Guard: must have lastWateredAt set before adoption
      if (!plantToAdopt.lastWateredAt) {
        console.error("Cannot adopt plant without lastWateredAt set.")
        return prevPlants
      }

      // Return the immediately updated list - don't auto-set lastWateredAt
      return prevPlants.map(p =>
        p.id === id ? { ...p, status: 'healthy' } : p
      )
    })
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
