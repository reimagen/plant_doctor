export interface HomeProfile {
  heatedHome: boolean;
  humidity: 'dry' | 'normal' | 'humid';
  temp: 'cool' | 'normal' | 'warm';
  light: 'low' | 'medium' | 'bright';
  hemisphere: 'Northern' | 'Southern';
  seasonMode: 'Winter' | 'Spring' | 'Summer' | 'Fall';
}

export type IntensityLevel = 'Low' | 'Medium' | 'Bright';
export type QualityLevel = 'Indirect' | 'Direct';
export type LightLevel = IntensityLevel | QualityLevel;
export type WindowDirection = 'North' | 'South' | 'East' | 'West';

export interface RescueTask {
  id: string;
  description: string;
  completed: boolean;
  phase?: 'phase-1' | 'phase-2' | 'phase-3';
  duration?: string;
  sequencing?: number;
  successCriteria?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  photoUrl: string;
  location: string;
  lastWateredAt?: string;
  cadenceDays: number;
  status: 'pending' | 'healthy' | 'warning' | 'critical';
  needsCheckIn?: boolean;
  careGuide?: string[];
  notes?: string[];
  rescuePlan?: string[];
  rescuePlanTasks?: RescueTask[];
  lightIntensity?: IntensityLevel;
  lightQuality?: QualityLevel;
  nearWindow?: boolean;
  windowDirection?: WindowDirection;
  lightLevel?: string;
  idealConditions?: string;
}

export type NotificationType = 'detection' | 'task_complete' | 'status_change' | 'observation';

export interface LivestreamNotification {
  id: string;
  type: NotificationType;
  message: string;
  emoji: string;
  timestamp: number;
}
