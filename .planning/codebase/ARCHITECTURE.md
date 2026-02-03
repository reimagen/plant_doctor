# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Next.js App Router with client-first UI, Firebase-backed persistence, and Gemini AI (live via WebSocket + content via Cloud Functions)

**Key Characteristics:**
- Next.js App Router with client-rendered pages (`'use client'` on all pages)
- Centralized app state via `AppProvider` (React Context)
- Firebase Auth (anonymous) + Firestore for persistence with offline support
- Next.js API route proxies to Firebase Cloud Function for Gemini content generation
- Gemini Live sessions run in the browser via WebSocket, optionally through a proxy service
- Feature hooks encapsulate media capture and AI session logic
- Rate limiting on client tool calls and in Cloud Function requests

## Layers

**Routing & Layout Layer:**
- Purpose: Page routes and application shell
- Location: `app/layout.tsx`, `app/page.tsx`, `app/doctor/page.tsx`, `app/plants/page.tsx`, `app/settings/page.tsx`
- Contains: Route-level components, layout, global styles
- Depends on: Context, page components

**UI Components Layer:**
- Purpose: Presentational and page-level UI
- Location: `components/`, `components/pages/`, `components/plant-details/`
- Contains: Inventory, Doctor, Plant Detail, Settings views and UI sections
- Depends on: Hooks, Types, Context data

**Context & State Layer:**
- Purpose: Centralized app state and actions
- Location: `contexts/AppContext.tsx`, `hooks/useAppState.ts`
- Contains: Plant CRUD, hydration/persistence, stream state
- Depends on: Firestore service, Firebase auth, hooks

**Hooks Layer:**
- Purpose: Encapsulate feature logic (AI sessions, media, content generation)
- Location: `hooks/`
- Contains: Plant doctor, rehab specialist, media stream, care guide, rescue plan
- Depends on: Services (lib), browser APIs, Types

**Services Layer:**
- Purpose: External integrations and shared utilities
- Location: `lib/`
- Contains: Firestore service, Firebase auth/config, Gemini live session, rate limiting, audio
- Depends on: Firebase SDK, @google/genai, browser APIs

**API Layer (Next.js):**
- Purpose: Server-side proxy for Gemini content requests
- Location: `app/api/gemini/content/route.ts`
- Depends on: Firebase Cloud Function endpoint

**Backend AI Layer (Firebase Functions):**
- Purpose: Gemini content generation (care guides, rescue plans)
- Location: `functions/src/index.ts`
- Depends on: @google/genai, Firebase Functions params

**WebSocket Proxy Layer (optional):**
- Purpose: Proxy Gemini Live WebSocket from browser to Gemini API
- Location: `websocket-proxy/index.js`
- Depends on: @google/genai, ws, express

**Types Layer:**
- Purpose: Shared domain types
- Location: `types/index.ts`
- Used by: All layers

## Data Flow

**App Hydration & Persistence Flow:**
1. `AppProvider` mounts and calls `useAppState()`
2. `ensureUser()` performs anonymous Firebase Auth
3. `FirestoreService.migrateFromLocalStorage()` (one-time)
4. Firestore loads plants + home profile
5. Updates are persisted back to Firestore on state changes

**Plant Discovery (Live) Flow:**
1. User opens `/doctor` and starts stream
2. `useMediaStream()` provides camera/audio stream
3. `usePlantDoctor()` connects to Gemini Live (direct API key or `websocket-proxy`)
4. Audio + video frames sent every second
5. Gemini tool call `propose_plant_to_inventory` triggers
6. Hook builds `Plant` object and calls `addPlant()`
7. New plant appears in inventory with status `pending`

**Care Guide Generation Flow:**
1. Pending plant triggers `useAppState` care guide request (or manual request in `useCareGuide`)
2. Client calls `/api/gemini/content` (Next.js API route)
3. API route forwards to Firebase Cloud Function `geminiContent`
4. Function calls Gemini Content API and returns tips
5. Plant updated with `careGuide` and timestamp

**Rescue Plan Generation & Rehab Flow:**
1. Rehab session starts in `/doctor?plantId=...`
2. `useRehabSpecialist()` handles live session and tool calls
3. Tool `create_rescue_plan` triggers a `/api/gemini/content` request
4. Cloud Function returns structured steps
5. Plant updated with `rescuePlanTasks` and status transitions

## Key Abstractions

**AppProvider:**
- Purpose: Provides app state + streaming control to all pages
- Location: `contexts/AppContext.tsx`

**FirestoreService:**
- Purpose: CRUD for plants and home profile; localStorage migration
- Location: `lib/firestore-service.ts`

**GeminiLiveSession:**
- Purpose: Browser WebSocket client for Gemini Live (direct or via proxy)
- Location: `lib/gemini-live.ts`

**WebSocket Proxy:**
- Purpose: Server-side Gemini Live proxy for browser clients
- Location: `websocket-proxy/index.js`

**Cloud Function (geminiContent):**
- Purpose: Server-side Gemini Content generation with rate limiting
- Location: `functions/src/index.ts`

**ToolCallRateLimiter:**
- Purpose: Client-side tool call throttling for live sessions
- Location: `lib/rate-limiter.ts`

## Entry Points

**Application Entry:**
- `app/layout.tsx`: Root layout, context provider, navigation

**Pages:**
- `app/page.tsx`: Inventory
- `app/doctor/page.tsx`: Live doctor + rehab
- `app/plants/page.tsx`: Plant detail
- `app/settings/page.tsx`: Home profile settings

**API Route:**
- `app/api/gemini/content/route.ts`: Proxies to Cloud Function

**Cloud Function:**
- `functions/src/index.ts`: `geminiContent` HTTPS function

**WebSocket Proxy (optional):**
- `websocket-proxy/index.js`: `/plant-doctor` and `/rehab-specialist`

## Error Handling

**Strategy:** Local try/catch with graceful fallbacks

**Patterns:**
- API route returns proper HTTP status codes and error messages
- Cloud Function returns 400/429/500 with descriptive errors
- Live session hooks call `stopCall()` on error/close
- Firestore hydration failures still mark `isHydrated` to keep UI usable

## Cross-Cutting Concerns

**Logging:**
- Structured console logs in hooks and functions
- Prefixed tags: `[API_REQUEST]`, `[RESCUE_PLAN]`, `[RATE_LIMIT]`, `[SUCCESS]`, `[GENERATION_ERROR]`

**Rate Limiting:**
- Client: `ToolCallRateLimiter` for tool calls (doctor and rehab)
- Backend: token bucket in `functions/src/index.ts` for content API

**Authentication & Storage:**
- Firebase anonymous auth in browser
- Firestore persistence with IndexedDB offline support
- LocalStorage migration on first run

**Server/Client Boundary:**
- Pages are client components; server-side data is minimal
- API route used only as a proxy to Cloud Function

---

*Architecture analysis: 2026-02-03*
