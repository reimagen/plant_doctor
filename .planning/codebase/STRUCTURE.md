# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
plant_doctor/
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks (state, features)
├── lib/                  # Service classes and utilities
├── pages/                # Top-level view components
├── .planning/            # GSD planning documents
├── index.tsx             # App entry point and root component
├── index.html            # HTML template
├── types.ts              # TypeScript interfaces
├── constants.tsx         # Default values and icon components
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Directory Purposes

**components/:**
- Purpose: Reusable presentational and interactive UI components
- Contains: React functional components (.tsx)
- Key files:
  - `Navigation.tsx`: Bottom tab bar
  - `PlantCard.tsx`: Plant display with status and actions
  - `PlantEditModal.tsx`: Full-screen plant detail editor
  - `RescueProtocolView.tsx`: Emergency care flow UI

**hooks/:**
- Purpose: Custom React hooks encapsulating stateful logic
- Contains: TypeScript hook files (.ts)
- Key files:
  - `useAppState.ts`: Central state management (plants, views, profile)
  - `usePlantDoctor.ts`: Discovery mode AI session
  - `useRehabSpecialist.ts`: Rehab verification AI session
  - `useMediaStream.ts`: Camera/microphone access abstraction

**lib/:**
- Purpose: Service classes for external APIs and browser features
- Contains: TypeScript class files (.ts)
- Key files:
  - `gemini-live.ts`: GeminiLiveSession WebSocket wrapper
  - `gemini-content.ts`: GeminiContentService for text generation
  - `audio-service.ts`: AudioService for voice playback
  - `storage-service.ts`: StorageService for localStorage
  - `test-data.ts`: Seed data for development

**pages/:**
- Purpose: Top-level view components corresponding to app views
- Contains: React page components (.tsx)
- Key files:
  - `DoctorPage.tsx`: Camera view with AI streaming
  - `InventoryPage.tsx`: Plant list with sorting and modals
  - `SettingsPage.tsx`: Home profile configuration

## Key File Locations

**Entry Points:**
- `index.tsx`: React app bootstrap, renders `<App />`
- `index.html`: HTML shell with `#root` mount point

**Configuration:**
- `vite.config.ts`: Build config, env var injection
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Scripts, dependencies

**Core Logic:**
- `hooks/useAppState.ts`: All plant CRUD, view switching, persistence
- `hooks/usePlantDoctor.ts`: Plant discovery AI integration
- `hooks/useRehabSpecialist.ts`: Plant rehab AI integration

**Type Definitions:**
- `types.ts`: `Plant`, `HomeProfile`, `AppState` interfaces

**Constants:**
- `constants.tsx`: `DEFAULT_HOME_PROFILE`, `Icons` object

**Testing:**
- No test files present; `lib/test-data.ts` provides seed data only

## Naming Conventions

**Files:**
- Components: PascalCase (`PlantCard.tsx`, `DoctorPage.tsx`)
- Hooks: camelCase with `use` prefix (`useAppState.ts`, `useMediaStream.ts`)
- Services: kebab-case (`audio-service.ts`, `gemini-live.ts`)
- Types: lowercase (`types.ts`)

**Directories:**
- Lowercase plural (`components`, `hooks`, `lib`, `pages`)

**Exports:**
- Components: Named export matching filename (`export const PlantCard`)
- Hooks: Named export matching filename (`export const useAppState`)
- Services: Named class export (`export class GeminiLiveSession`)
- Constants: Named exports (`export const Icons`, `export const DEFAULT_HOME_PROFILE`)

## Where to Add New Code

**New Page/View:**
- Create component in `pages/` with PascalCase name
- Add view type to `'doctor' | 'inventory' | 'settings'` union in `types.ts`
- Add conditional render in `index.tsx` App component
- Add navigation button in `components/Navigation.tsx`

**New Reusable Component:**
- Create in `components/` with PascalCase name
- Define Props interface at top of file
- Export as named export

**New Feature Hook:**
- Create in `hooks/` with `use` prefix
- Follow pattern from `usePlantDoctor.ts` for AI features
- Return object with state values and action functions

**New Service/API Client:**
- Create class in `lib/` with kebab-case filename
- Export class with methods for API operations
- Instantiate in hooks or components as needed

**New Type Definition:**
- Add interface to `types.ts`
- Export from same file

**New Constant/Default:**
- Add to `constants.tsx`
- Export as named export

## Special Directories

**.planning/:**
- Purpose: GSD planning and analysis documents
- Generated: No (manually created)
- Committed: Yes

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)

**dist/:**
- Purpose: Production build output
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-01-17*
