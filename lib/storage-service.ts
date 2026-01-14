import { Plant, HomeProfile } from '../types';
import { DEFAULT_HOME_PROFILE } from '../constants';
import { TEST_PLANTS } from './test-data';

const KEYS = {
  PLANTS: 'plants',
  HOME_PROFILE: 'homeProfile'
};

export const StorageService = {
  getPlants: (): Plant[] => {
    try {
      const saved = localStorage.getItem(KEYS.PLANTS);
      if (!saved) return TEST_PLANTS;
      const parsed = JSON.parse(saved);
      return parsed.length === 0 ? TEST_PLANTS : parsed;
    } catch {
      return TEST_PLANTS;
    }
  },

  savePlants: (plants: Plant[]) => {
    localStorage.setItem(KEYS.PLANTS, JSON.stringify(plants));
  },

  getHomeProfile: (): HomeProfile => {
    try {
      const saved = localStorage.getItem(KEYS.HOME_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_HOME_PROFILE;
    } catch {
      return DEFAULT_HOME_PROFILE;
    }
  },

  saveHomeProfile: (profile: HomeProfile) => {
    localStorage.setItem(KEYS.HOME_PROFILE, JSON.stringify(profile));
  }
};