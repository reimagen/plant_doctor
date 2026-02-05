import { Plant } from '@/types'

const oneDayMs = 24 * 60 * 60 * 1000

export const TEST_PLANTS: Plant[] = [
  // ==================== STATUS SHOWCASE ====================

  // PENDING - New Discovery
  {
    id: 'status-pending',
    name: 'Monty',
    species: 'Monstera Deliciosa',
    photoUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop',
    location: 'Entryway',
    lastWateredAt: new Date(Date.now() - oneDayMs).toISOString(),
    cadenceDays: 7,
    overdueThresholdMinor: 2,
    overdueThresholdMajor: 5,
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
    name: 'Perry',
    species: 'Epipremnum Aureum',
    photoUrl: 'https://images.unsplash.com/photo-1589923188900-85dbbfc08db2?q=80&w=800&auto=format&fit=crop',
    location: 'Bookshelf',
    lastWateredAt: new Date(Date.now() - (2 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    overdueThresholdMinor: 2,
    overdueThresholdMajor: 5,
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

  // MONITORING - Amber badge, water today (watering day)
  {
    id: 'status-monitoring',
    name: 'Callie',
    species: 'Calathea Orbifolia',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop',
    location: 'Bedroom',
    lastWateredAt: new Date(Date.now() - (7 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    overdueThresholdMinor: 2,
    overdueThresholdMajor: 5,
    status: 'warning',
    needsCheckIn: false,
    lightIntensity: 'Low',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'North',
    careGuide: [
      'Plant is healthy and on schedule.',
      'Water today to keep it thriving.',
      'Tap "Mark as Watered" after watering.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (7 * oneDayMs)).toISOString()
  },

  // EMERGENCY - Red badge, overdue by 3+ days, with 3-phase rescue plan
  // TEST: Complete tasks one-by-one to verify:
  // 1. During livestream: Overlay shows ONLY Phase 1 (First Aid) tasks
  // 2. Status stays CRITICAL until all 3 PHASE-1 tasks complete
  // 3. In plant details: Phase 1 under "First Aid" (red), Phases 2+3 under "Monitoring" (amber)
  // 4. Only after all phase-1 complete does status flip to "Monitoring" (warning status)
  {
    id: 'status-emergency',
    name: 'Cathy',
    species: 'Calathea Ornata',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop',
    location: 'Kitchen Window',
    lastWateredAt: new Date(Date.now() - (10 * oneDayMs)).toISOString(),
    cadenceDays: 7,
    overdueThresholdMinor: 2,
    overdueThresholdMajor: 5,
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
        id: 'task-phase1-water',
        description: 'Water deeply until water drains from bottom - use filtered or distilled water only',
        completed: false,
        phase: 'phase-1',
        duration: '10 min',
        sequencing: 1,
        successCriteria: 'Water visibly drains from bottom, soil is moist'
      },
      {
        id: 'task-phase1-prune',
        description: 'Remove damaged yellow leaves and trim brown leaf edges with clean scissors',
        completed: false,
        phase: 'phase-1',
        duration: '15 min',
        sequencing: 2,
        successCriteria: 'All yellowed leaves removed, brown edges trimmed'
      },
      {
        id: 'task-phase1-humidity',
        description: 'Increase humidity by misting leaves and placing on pebble tray with water',
        completed: false,
        phase: 'phase-1',
        duration: '5 min',
        sequencing: 3,
        successCriteria: 'Pebble tray filled, leaves misted with water'
      },
      {
        id: 'task-phase2-relocate',
        description: 'Move to a bright indirect location away from drafts and heat sources',
        completed: false,
        phase: 'phase-2',
        duration: '5 min',
        sequencing: 4,
        successCriteria: 'Plant in stable, bright location away from vents'
      },
      {
        id: 'task-phase3-monitor',
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
      'Tap "Start Checkup" to begin an emergency assessment call.',
      'Be prepared to provide detailed plant care info for AI recommendations.',
      'Follow the rescue plan tasks during or after the call.'
    ],
    careGuideGeneratedAt: new Date(Date.now() - (7 * oneDayMs)).toISOString()
  }
]
