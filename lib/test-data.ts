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
      'Leaves are starting to curl at the edges.',
      'Soil feels bone dry.'
    ],
    careGuide: [
      'Keep soil consistently moist but not soggy.',
      'Requires high humidity to prevent leaf crisping.',
      'Sensitive to tap water chemicals; use filtered if possible.',
      'Avoid any direct midday sun.'
    ]
  }
]
