import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase-config'
import { Plant, HomeProfile } from '@/types'
import { DEFAULT_HOME_PROFILE } from './constants'
import { TEST_PLANTS } from './test-data'

function userPlantsCol(userId: string) {
  return collection(getDb(), 'users', userId, 'plants')
}

function userProfileDoc(userId: string) {
  return doc(getDb(), 'users', userId, 'settings', 'homeProfile')
}

export const FirestoreService = {
  // ── Plants ──────────────────────────────────────────────

  async getPlants(userId: string): Promise<Plant[]> {
    const snap = await getDocs(userPlantsCol(userId))
    if (snap.empty) return TEST_PLANTS
    return snap.docs.map((d) => d.data() as Plant)
  },

  async savePlants(userId: string, plants: Plant[]): Promise<void> {
    const batch = writeBatch(getDb())
    // Delete all existing, then write current set
    const existing = await getDocs(userPlantsCol(userId))
    existing.docs.forEach((d) => batch.delete(d.ref))
    plants.forEach((p) => {
      const ref = doc(userPlantsCol(userId), p.id)
      batch.set(ref, p)
    })
    await batch.commit()
  },

  subscribePlants(userId: string, cb: (plants: Plant[]) => void): Unsubscribe {
    return onSnapshot(userPlantsCol(userId), (snap) => {
      if (snap.empty) {
        cb(TEST_PLANTS)
        return
      }
      cb(snap.docs.map((d) => d.data() as Plant))
    })
  },

  // ── Home Profile ────────────────────────────────────────

  async getHomeProfile(userId: string): Promise<HomeProfile> {
    const snap = await getDoc(userProfileDoc(userId))
    return snap.exists() ? (snap.data() as HomeProfile) : DEFAULT_HOME_PROFILE
  },

  async saveHomeProfile(userId: string, profile: HomeProfile): Promise<void> {
    await setDoc(userProfileDoc(userId), profile)
  },

  // ── Migration: localStorage → Firestore ─────────────────

  async migrateFromLocalStorage(userId: string): Promise<{ plants: Plant[]; profile: HomeProfile } | null> {
    if (typeof window === 'undefined') return null

    const migrationKey = `firestore_migrated_${userId}`
    if (localStorage.getItem(migrationKey)) return null

    const savedPlants = localStorage.getItem('plants')
    const savedProfile = localStorage.getItem('homeProfile')

    if (!savedPlants && !savedProfile) {
      localStorage.setItem(migrationKey, 'true')
      return null
    }

    let plants: Plant[] | null = null
    let profile: HomeProfile | null = null

    if (savedPlants) {
      try {
        const parsed = JSON.parse(savedPlants)
        if (Array.isArray(parsed) && parsed.length > 0) {
          plants = parsed
          await this.savePlants(userId, parsed)
        }
      } catch { /* ignore bad data */ }
    }

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        if (parsed && typeof parsed === 'object') {
          profile = parsed
          await this.saveHomeProfile(userId, parsed)
        }
      } catch { /* ignore bad data */ }
    }

    localStorage.setItem(migrationKey, 'true')
    return (plants || profile) ? { plants: plants || TEST_PLANTS, profile: profile || DEFAULT_HOME_PROFILE } : null
  },
}
