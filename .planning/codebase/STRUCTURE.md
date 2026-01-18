# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
plant_doctor/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with Navigation
│   ├── page.tsx                  # Home/Inventory page
│   ├── globals.css               # Global styles, Tailwind imports
│   ├── doctor/
│   │   └── page.tsx              # Doctor camera view
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   └── api/
│       └── gemini/
│           └── content/
│               └── route.ts      # Content generation proxy
├── components/                   # Shared UI components
│   ├── Navigation.tsx            # Bottom tab bar (Client Component)
│   ├── PlantCard.tsx             # Plant display with status and actions
│   ├── PlantEditModal.tsx        # Full-screen plant detail editor
│   └── RescueProtocolView.tsx    # Emergency care flow UI
├── hooks/                        # Client-side hooks
│   ├── useAppState.ts            # Plant CRUD, profile (no view switching)
│   ├── usePlantDoctor.ts         # Discovery mode AI session
│   ├── useRehabSpecialist.ts     # Rehab verification AI session
│   └── useMediaStream.ts         # Camera/microphone access abstraction
├── lib/                          # Utilities and services
│   ├── gemini-live.ts            # Client-side Gemini Live session (WebSocket)
│   ├── gemini-content.ts         # Gemini Content API (for API route)
│   ├── audio-service.ts          # AudioService for voice playback
│   ├── storage-service.ts        # StorageService for localStorage
│   └── test-data.ts              # Seed data for development
├── types/
│   └── index.ts                  # TypeScript interfaces
├── .planning/                    # GSD planning documents
├── public/                       # Static assets
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages, layouts, and API routes
- Contains: Server and Client Components, route handlers
- Key files:
  - `layout.tsx`: Root layout with HTML structure, Navigation
  - `page.tsx`: Home/Inventory page (default route `/`)
  - `doctor/page.tsx`: Plant doctor camera view (`/doctor`)
  - `settings/page.tsx`: Home profile settings (`/settings`)
  - `api/gemini/content/route.ts`: Server-side Gemini Content API proxy

**components/:**
- Purpose: Reusable presentational and interactive UI components
- Contains: React functional components (.tsx), mostly Client Components
- Key files:
  - `Navigation.tsx`: Bottom tab bar with next/link
  - `PlantCard.tsx`: Plant display with status and actions
  - `PlantEditModal.tsx`: Full-screen plant detail editor
  - `RescueProtocolView.tsx`: Emergency care flow UI

**hooks/:**
- Purpose: Custom React hooks encapsulating client-side stateful logic
- Contains: TypeScript hook files (.ts)
- Key files:
  - `useAppState.ts`: Plant CRUD, profile management (no view switching)
  - `usePlantDoctor.ts`: Discovery mode AI session
  - `useRehabSpecialist.ts`: Rehab verification AI session
  - `useMediaStream.ts`: Camera/microphone access abstraction

**lib/:**
- Purpose: Service classes for external APIs and browser features
- Contains: TypeScript class files (.ts)
- Key files:
  - `gemini-live.ts`: GeminiLiveSession WebSocket wrapper (client-side)
  - `gemini-content.ts`: GeminiContentService for text generation
  - `audio-service.ts`: AudioService for voice playback
  - `storage-service.ts`: StorageService for localStorage
  - `test-data.ts`: Seed data for development

**types/:**
- Purpose: Shared TypeScript interfaces
- Contains: Type definition files (.ts)
- Key files:
  - `index.ts`: `Plant`, `HomeProfile`, `AppState` interfaces

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, renders on all pages
- `app/page.tsx`: Home page component

**Configuration:**
- `next.config.ts`: Next.js settings
- `tailwind.config.ts`: Tailwind theme, content paths
- `postcss.config.js`: PostCSS plugins
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Scripts, dependencies

**Core Logic:**
- `hooks/useAppState.ts`: Plant CRUD, profile, persistence
- `hooks/usePlantDoctor.ts`: Plant discovery AI integration
- `hooks/useRehabSpecialist.ts`: Plant rehab AI integration
- `app/api/gemini/content/route.ts`: Server-side Gemini proxy

**Type Definitions:**
- `types/index.ts`: All shared interfaces

## Naming Conventions

**Files:**
- Route pages: `page.tsx` (Next.js convention)
- Route layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase (`PlantCard.tsx`, `Navigation.tsx`)
- Hooks: camelCase with `use` prefix (`useAppState.ts`, `useMediaStream.ts`)
- Services: kebab-case (`audio-service.ts`, `gemini-live.ts`)
- Types: lowercase (`index.ts` in `types/`)

**Directories:**
- Lowercase plural for shared code (`components`, `hooks`, `lib`, `types`)
- Lowercase singular for routes (`doctor`, `settings`)

**Exports:**
- Components: Named export matching component name (`export const PlantCard`)
- Hooks: Named export matching hook name (`export const useAppState`)
- Services: Named class export (`export class GeminiLiveSession`)
- Types: Named exports (`export interface Plant`)

## Where to Add New Code

**New Page/Route:**
- Create directory in `app/` with route name
- Add `page.tsx` inside the directory
- Add `layout.tsx` if route-specific layout needed
- Navigation updates in `components/Navigation.tsx`

**New API Route:**
- Create directory structure in `app/api/`
- Add `route.ts` with exported HTTP method handlers
- Use `GEMINI_API_KEY` (server-only) for secure operations

**New Reusable Component:**
- Create in `components/` with PascalCase name
- Add `'use client'` directive if interactive
- Define Props interface at top of file
- Export as named export

**New Feature Hook:**
- Create in `hooks/` with `use` prefix
- Must be used in Client Components only
- Follow pattern from `usePlantDoctor.ts` for AI features
- Return object with state values and action functions

**New Service/API Client:**
- Create class in `lib/` with kebab-case filename
- Export class with methods for API operations
- Separate client-only services (browser APIs) from server-compatible

**New Type Definition:**
- Add interface to `types/index.ts`
- Export from same file

## Special Directories

**app/api/:**
- Purpose: Server-side API route handlers
- Not accessible to client code directly
- Secure environment for API keys

**.planning/:**
- Purpose: GSD planning and analysis documents
- Generated: No (manually created)
- Committed: Yes

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)

**.next/:**
- Purpose: Next.js build output and cache
- Generated: Yes (`next build` or `next dev`)
- Committed: No (in `.gitignore`)

**public/:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes

## Gemini API Strategy

**Content API (Server-Side):**
- Used for: Care guide generation, rescue plans
- Route: `POST /api/gemini/content`
- API key: `GEMINI_API_KEY` (server-only, never exposed to client)

**Live API (Client-Side):**
- Used for: Real-time audio/video plant detection, rehab sessions
- Connection: Direct WebSocket from browser
- API key: `NEXT_PUBLIC_GEMINI_API_KEY` (client-exposed, domain-restricted)
- Note: WebSocket connections cannot be proxied through API routes

**API Key Security:**
- Configure `NEXT_PUBLIC_GEMINI_API_KEY` in Google Cloud Console
- Restrict to production Vercel domain only
- Use separate keys for Content API (server) and Live API (client)

---

*Structure analysis: 2026-01-18*
