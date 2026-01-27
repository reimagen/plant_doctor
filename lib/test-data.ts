import { Plant } from '@/types'

const oneDayMs = 24 * 60 * 60 * 1000

export const TEST_PLANTS: Plant[] = [
  // ==================== STATUS SHOWCASE ====================

  // PENDING - New Discovery
  {
    id: 'status-pending',
    name: 'Monstera Mystery',
    species: 'Monstera Deliciosa',
    photoUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop',
    location: 'Entryway',
    lastWateredAt: new Date(Date.now() - oneDayMs).toISOString(),
    cadenceDays: 7,
    status: 'pending',
    lightIntensity: 'Bright',
    lightQuality: 'Indirect',
    nearWindow: false,
    windowDirection: 'East',
    careGuide: [
      'Newly detected - needs to be adopted to your collection.',
      'Tap "Adopt Plant" to add to inventory.',
      'Once adopted, assessments will begin.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (2 * oneDayMs)).toISOString()
  },

  // HEALTHY - Green badge, water in 5 days
  {
    id: 'status-healthy',
    name: 'Peaceful Pothos',
    species: 'Epipremnum Aureum',
    photoUrl: 'https://images.unsplash.com/photo-1589923188900-85dbbfc08db2?q=80&w=800&auto=format&fit=crop',
    location: 'Bookshelf',
    lastWateredAt: new Date(Date.now() - (2 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'healthy',
    needsCheckIn: false,
    lightIntensity: 'Medium',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'West',
    careGuide: [
      'Plant is thriving.',
      'No action needed at this time.',
      'Tap card to view full care details.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (3 * oneDayMs)).toISOString()
  },

  // MONITORING - Yellow badge, warning status, water in 3 days, no checkup yet
  {
    id: 'status-monitoring',
    name: 'Amber Alert',
    species: 'Calathea Orbifolia',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop',
    location: 'Bedroom',
    lastWateredAt: new Date(Date.now() - (4 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'warning',
    needsCheckIn: false,
    lightIntensity: 'Low',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'North',
    careGuide: [
      'Plant is in monitoring status.',
      'Shows minor stress signs.',
      'Checkup will be due soon when water is needed.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (4 * oneDayMs)).toISOString()
  },

  // WATER IN 1D - Yellow badge, warning status, water due tomorrow, checkup not yet triggered
  {
    id: 'status-water-1d',
    name: 'Almost There',
    species: 'Alocasia Amazonica',
    photoUrl: 'https://images.unsplash.com/photo-1630627829883-f76fc44ff4e8?q=80&w=800&auto=format&fit=crop',
    location: 'Living Room Corner',
    lastWateredAt: new Date(Date.now() - (6 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'warning',
    needsCheckIn: false,
    lightIntensity: 'Bright',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'South',
    careGuide: [
      'Plant needs attention soon.',
      'Checkup will be prompted when watering becomes due.',
      'Keep monitoring the status.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - oneDayMs).toISOString()
  },

  // CHECK-UP DUE - Amber badge, warning status, water due today, checkup triggered
  {
    id: 'status-checkup-due',
    name: 'Needs Attention',
    species: 'Anthurium Clarinervium',
    photoUrl: 'https://images.unsplash.com/photo-1584447908256-e576c29f0cf7?q=80&w=800&auto=format&fit=crop',
    location: 'Dining Table',
    lastWateredAt: new Date(Date.now() - (7 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'warning',
    needsCheckIn: true,
    lightIntensity: 'Medium',
    lightQuality: 'Indirect',
    nearWindow: false,
    windowDirection: 'East',
    careGuide: [
      'Check-up is due now - tap "Start Checkup" to begin a health assessment call.',
      'During the call, discuss watering and any health concerns.',
      'Plant will be reassessed after the checkup.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (5 * oneDayMs)).toISOString()
  },

  // THIRSTY - Blue button, overdue by 1 day (but healthy status, so just "Water Now" button, no checkup)
  {
    id: 'status-thirsty',
    name: 'Thirsty Ficus',
    species: 'Ficus Lyrata',
    photoUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a207519?q=80&w=800&auto=format&fit=crop',
    location: 'Corner Nook',
    lastWateredAt: new Date(Date.now() - (8 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'healthy',
    needsCheckIn: false,
    lightIntensity: 'Bright',
    lightQuality: 'Direct',
    nearWindow: true,
    windowDirection: 'South',
    careGuide: [
      'Plant is overdue for water by 1 day.',
      'Tap "Water Now" to log watering and restore to healthy status.',
      'No health assessment needed at this time.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (6 * oneDayMs)).toISOString()
  },

  // EMERGENCY - Red badge, overdue by 3+ days
  {
    id: 'status-emergency',
    name: 'Ruby in Crisis',
    species: 'Calathea Ornata',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop',
    location: 'Kitchen Window',
    lastWateredAt: new Date(Date.now() - (10 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    status: 'critical',
    needsCheckIn: false,
    lightIntensity: 'Low',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'North',
    notes: [
      'Leaves are severely curled and browning.',
      'Soil is bone dry and pulling from pot edges.',
      'Several leaves have turned yellow and dropped.',
      'Plant has been without water for 3+ days.'
    ],
    notesSessions: [
      [
        'Leaves are severely curled and browning.',
        'Soil is bone dry and pulling from pot edges.',
        'Several leaves have turned yellow and dropped.'
      ],
      [
        'Plant has been without water for 3+ days.'
      ]
    ],
    notesUpdatedAt: new Date(Date.now() - oneDayMs).toISOString(),
    rescuePlan: [
      'Water deeply until water drains from bottom - use filtered or distilled water only',
      'Remove damaged yellow leaves and trim brown leaf edges with clean scissors',
      'Increase humidity by misting leaves and placing on pebble tray with water',
      'Move to a bright indirect location away from drafts and heat sources',
      'Check soil moisture daily - keep consistently moist but not soggy'
    ],
    rescuePlanTasks: [
      {
        id: 'task-water-deeply',
        description: 'Water deeply until water drains from bottom - use filtered or distilled water only',
        completed: false,
        phase: 'phase-1',
        duration: '10 min',
        sequencing: 1,
        successCriteria: 'Water visibly drains from bottom, soil is moist'
      },
      {
        id: 'task-prune-damaged',
        description: 'Remove damaged yellow leaves and trim brown leaf edges with clean scissors',
        completed: false,
        phase: 'phase-1',
        duration: '15 min',
        sequencing: 2,
        successCriteria: 'All yellowed leaves removed, brown edges trimmed'
      },
      {
        id: 'task-humidity',
        description: 'Increase humidity by misting leaves and placing on pebble tray with water',
        completed: false,
        phase: 'phase-1',
        duration: '5 min',
        sequencing: 3,
        successCriteria: 'Pebble tray filled, leaves misted with water'
      },
      {
        id: 'task-relocate',
        description: 'Move to a bright indirect location away from drafts and heat sources',
        completed: false,
        phase: 'phase-2',
        duration: '5 min',
        sequencing: 4,
        successCriteria: 'Plant in stable, bright location away from vents'
      },
      {
        id: 'task-monitor',
        description: 'Check soil moisture daily - keep consistently moist but not soggy',
        completed: false,
        phase: 'phase-3',
        duration: '2 weeks',
        sequencing: 5,
        successCriteria: 'Soil moist to touch, plant showing new growth'
      }
    ],
    careGuide: [
      'EMERGENCY: Plant requires immediate rescue intervention.',
      'Tap "Begin Rescue Protocol" to start an emergency assessment call.',
      'Be prepared to provide detailed plant care info for AI recommendations.',
      'Follow the rescue plan tasks during or after the call.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (7 * oneDayMs)).toISOString()
  }
]
