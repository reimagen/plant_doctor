# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
plant_doctor/
├── app/                          # Next.js App Router
│   ├── api/gemini/content/route.ts
│   ├── doctor/page.tsx
│   ├── plants/page.tsx
│   ├── settings/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Doctor.tsx
│   ├── Manager.tsx
│   ├── Navigation.tsx
│   ├── PlantCard.tsx
│   ├── PlantStatusBadge.tsx
│   ├── pages/
│   │   ├── DoctorPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── PlantDetailPage.tsx
│   │   └── SettingsPage.tsx
│   └── plant-details/
│       ├── CareGuideSection.tsx
│       ├── DangerZoneSection.tsx
│       ├── EnvironmentSettingsSection.tsx
│       ├── FirstAidStepOverlay.tsx
│       ├── HealthNotesSection.tsx
│       ├── IdealConditionsSection.tsx
│       ├── LastWateredSection.tsx
│       ├── RescuePlanSection.tsx
│       ├── RescueTimeline.tsx
│       └── RescueTimelineOverlay.tsx
├── contexts/
│   └── AppContext.tsx
├── hooks/
│   ├── useAppState.ts
│   ├── useCareGuide.ts
│   ├── useMediaStream.ts
│   ├── usePlantDoctor.ts
│   └── useRehabSpecialist.ts
├── lib/
│   ├── audio-service.ts
│   ├── constants.tsx
│   ├── firebase-auth.ts
│   ├── firebase-config.ts
│   ├── firestore-service.ts
│   ├── gemini-content.ts
│   ├── gemini-live.ts
│   ├── rate-limiter.ts
│   ├── season.ts
│   └── test-data.ts
├── types/
│   └── index.ts
├── functions/                    # Firebase Functions
│   ├── src/index.ts
│   ├── package.json
│   └── tsconfig.json
├── websocket-proxy/              # Optional Gemini Live proxy
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── public/
├── .planning/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── metadata.json
├── next.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Directory Purposes

**app/:**
- Next.js routes and API handler
- Client pages for inventory, doctor, plant detail, and settings

**components/:**
- Reusable UI and page-level components
- `components/plant-details/` contains plant detail sections

**contexts/:**
- `AppProvider` for global state and stream controls

**hooks/:**
- Feature hooks for AI sessions, media, and content generation

**lib/:**
- Firebase setup, Firestore persistence, Gemini sessions, audio, utilities

**functions/:**
- Firebase Cloud Function `geminiContent`

**websocket-proxy/:**
- Optional server for Gemini Live WebSocket proxy

## Key Entry Points

- `app/layout.tsx` - Root layout and context provider
- `app/page.tsx` - Inventory page
- `app/doctor/page.tsx` - Live doctor and rehab
- `app/plants/page.tsx` - Plant detail page
- `app/settings/page.tsx` - Settings
- `app/api/gemini/content/route.ts` - Content proxy

---

*Structure analysis: 2026-02-03*
