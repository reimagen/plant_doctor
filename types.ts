
export interface HomeProfile {
  heatedHome: boolean;
  humidity: 'dry' | 'normal' | 'humid';
  temp: 'cool' | 'normal' | 'warm';
  light: 'low' | 'medium' | 'bright';
  seasonMode: 'Winter' | 'Spring' | 'Summer' | 'Fall';
}

export type IntensityLevel = 'Low' | 'Medium' | 'Bright';
export type QualityLevel = 'Indirect' | 'Direct';
export type LightLevel = IntensityLevel | QualityLevel;
export type WindowDirection = 'North' | 'South' | 'East' | 'West';

export interface Plant {
  id: string;
  name: string;
  species: string;
  photoUrl: string;
  location: string;
  lastWateredAt: string;
  cadenceDays: number;
  status: 'pending' | 'healthy' | 'warning' | 'critical';
  needsCheckIn?: boolean; // Flag for post-rehab verification
  careGuide?: string[]; 
  notes?: string[];     
  rescuePlan?: string[]; 
  lightIntensity?: IntensityLevel;
  lightQuality?: QualityLevel;
  nearWindow?: boolean;
  windowDirection?: WindowDirection;
  lightLevel?: string;
}

export interface AppState {
  view: 'doctor' | 'inventory' | 'settings';
  homeProfile: HomeProfile;
  plants: Plant[];
}
