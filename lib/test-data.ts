import { Plant } from '@/types'

export const TEST_PLANTS: Plant[] = [
  {
    id: 'test-checkin-verification',
    name: 'Recovery Test',
    species: 'Fiddle Leaf Fig',
    photoUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a207519?q=80&w=800&auto=format&fit=crop',
    location: 'Studio',
    lastWateredAt: new Date(Date.now() - (1000 * 60 * 60 * 30)).toISOString(),
    cadenceDays: 7,
    status: 'healthy',
    needsCheckIn: true,
    lightIntensity: 'Bright',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'West',
    careGuide: [
      'Check-in required to verify stabilization.',
      'Monitor for leaf drop after recent stress.',
      'Keep in a consistent location.'
    ]
  },
  {
    id: 'test-snake-plant',
    name: 'Kevin',
    species: 'Snake Plant (Sansevieria)',
    photoUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?q=80&w=800&auto=format&fit=crop',
    location: 'Living Room',
    lastWateredAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 2)).toISOString(),
    cadenceDays: 14,
    status: 'healthy',
    lightIntensity: 'Medium',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'South',
    careGuide: [
      'Let soil dry out completely between waterings.',
      'Thrives in indirect sunlight but tolerates low light.',
      'Avoid getting water on the leaves to prevent rot.',
      'Perfect for bedrooms as it produces oxygen at night.'
    ]
  },
  {
    id: 'test-calathea-rescue',
    name: 'Ruby',
    species: 'Calathea Ornata',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop',
    location: 'Bedroom Corner',
    lastWateredAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 10)).toISOString(),
    cadenceDays: 4,
    status: 'critical',
    lightIntensity: 'Low',
    lightQuality: 'Indirect',
    nearWindow: true,
    windowDirection: 'North',
    notes: [
      'Leaves are curling and browning at the edges - severe dehydration stress.',
      'Soil feels bone dry and pulling away from pot edges.',
      'Several lower leaves have turned yellow and are dropping.',
      'Last watered 10 days ago; well overdue for hydration recovery.',
      'Observation: Plant showing signs of heat stress in addition to drought.'
    ],
    rescuePlanTasks: [
      {
        id: 'task-water-deeply',
        description: 'Water deeply until water drains from bottom - use filtered or distilled water only',
        completed: true
      },
      {
        id: 'task-humidity',
        description: 'Increase humidity by misting leaves and placing on pebble tray with water',
        completed: true
      },
      {
        id: 'task-prune-damaged',
        description: 'Remove damaged yellow leaves and trim brown leaf edges with clean scissors',
        completed: false
      },
      {
        id: 'task-relocate',
        description: 'Move to a bright indirect location away from drafts and heat sources',
        completed: false
      },
      {
        id: 'task-monitor',
        description: 'Check soil moisture daily for next week - keep consistently moist but not soggy',
        completed: false
      }
    ],
    careGuide: [
      'Keep soil consistently moist but not soggy.',
      'Requires high humidity to prevent leaf crisping.',
      'Sensitive to tap water chemicals; use filtered if possible.',
      'Avoid any direct midday sun.',
      'Once stabilized, maintain watering every 3-4 days in warm months.',
      'Group with other plants or use a humidifier to maintain 60%+ humidity.'
    ]
  }
]
