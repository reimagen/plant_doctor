# Architecture

**Analysis Date:** 2026-01-18 (Updated with Guardrails implementation)

## Pattern Overview

**Overall:** Next.js App Router with Server/Client Component Architecture + AI Guardrails

**Key Characteristics:**
- Next.js App Router for file-based routing (replaces state-based view switching)
- Server Components for pages, layouts, and data fetching
- Client Components (`'use client'`) for interactive features
- API Routes for secure server-side Gemini Content API calls with validation and rate limiting
- Client-side Gemini Live API for real-time audio/video (WebSocket) with tool call rate limiting
- Feature-based hooks encapsulate client-side AI/media logic with rate limiters
- localStorage persistence handled in Client Components
- Structured logging with prefixed messages for monitoring and debugging
- System prompts enforce "PLANT-ONLY FOCUS" mode to prevent off-topic AI interactions

## Layers

**Server Components Layer:**
- Purpose: Render pages, layouts, and static content on the server
- Location: `app/page.tsx`, `app/layout.tsx`, `app/*/page.tsx`
- Contains: Async components, server-side data fetching, SEO metadata
- Depends on: Types
- Used by: Next.js router

**API Routes Layer:**
- Purpose: Server-side proxy for Gemini Content API (keeps API key secure)
- Location: `app/api/`
- Contains: Route handlers for POST requests to Gemini
- Depends on: `@google/genai`, server environment variables
- Used by: Client Components via fetch

**Client Components Layer:**
- Purpose: Interactive UI that requires browser APIs or user interaction
- Location: Components with `'use client'` directive
- Contains: Camera/audio features, forms, localStorage access, state management
- Depends on: Hooks, Types, Browser APIs
- Used by: Server Components (as children)

**Hooks Layer:**
- Purpose: Encapsulate client-side stateful logic (AI sessions, media, persistence)
- Location: `hooks/`
- Contains: Plant CRUD, Gemini Live sessions, media capture, audio playback
- Depends on: Services (lib/), Types, Browser APIs
- Used by: Client Components only

**Services Layer:**
- Purpose: External API clients and browser API wrappers
- Location: `lib/`
- Contains: Gemini Live session, audio playback, localStorage abstraction
- Depends on: External SDKs (@google/genai), Browser APIs
- Used by: Hooks, Client Components

**Types Layer:**
- Purpose: Shared type definitions
- Location: `types/`
- Contains: TypeScript interfaces
- Depends on: Nothing
- Used by: All other layers

## Data Flow

**Navigation Flow:**

1. User clicks navigation link (`next/link`)
2. Next.js router handles navigation (no state-based view switching)
3. Target page's Server Component renders
4. Client Components hydrate for interactivity

**Plant Discovery Flow:**

1. User navigates to `/doctor` via Navigation
2. `DoctorPage` (Client Component) mounts
3. User activates camera via toggle button
4. `usePlantDoctor` hook starts media stream and Gemini Live session
5. Video frames and audio sent to Gemini every 1 second (client-side WebSocket)
6. Gemini calls `propose_plant_to_inventory` tool when plant detected
7. Hook captures current frame and calls `onAutoDetect` callback
8. `useAppState.addPlant()` adds plant with `pending` status
9. User navigates to `/` (inventory) to see pending plant

**Care Guide Generation Flow (Server-Side):**

1. Client Component requests care guide via fetch to `/api/gemini/content`
2. API Route handler receives request with plant data
3. Server-side code calls Gemini Content API with secure `GEMINI_API_KEY`
4. Response returned to Client Component
5. UI updates with care guide

**State Management:**
- Plant CRUD and profile managed in `useAppState` hook (Client Component)
- Navigation handled by Next.js router (not in app state)
- Persistence via localStorage (Client Components only)
- Server Components pass initial props; Client Components manage interactivity

## Key Abstractions

**GeminiLiveSession:**
- Purpose: Wraps WebSocket connection to Gemini Live API (client-side only)
- Location: `lib/gemini-live.ts`
- Pattern: Class with connect/send/close lifecycle, callback-based message handling
- Note: Cannot be proxied through API routes due to WebSocket nature

**API Route Handlers:**
- Purpose: Server-side Gemini Content API proxy
- Location: `app/api/gemini/content/route.ts`
- Pattern: POST handler that forwards requests to Gemini, returns JSON

**AudioService:**
- Purpose: Manages audio playback of Gemini voice responses
- Location: `lib/audio-service.ts`
- Pattern: Class managing AudioContext and buffer queue for gapless playback

**Plant:**
- Purpose: Core domain entity representing a tracked houseplant
- Location: `types/index.ts`
- Pattern: Plain object with status enum driving UI states

**HomeProfile:**
- Purpose: User's home environment settings for AI context
- Location: `types/index.ts`
- Pattern: Simple object stored in localStorage, passed to AI prompts

**Rate Limiting & Guardrails (Added 2026-01-18):**
- **ToolCallRateLimiter:** Limits tool function calls per time window
  - Location: `lib/rate-limiter.ts`
  - Rehab mode: 10 calls/min (verify_rehab_success, mark_rescue_task_complete)
  - Discovery mode: 15 calls/min (propose_plant_to_inventory)
  - Rate-limited calls logged with `[RATE_LIMIT]` prefix and rejected gracefully

- **TokenBucketLimiter:** Burst-friendly rate limiting for API endpoints
  - Location: `lib/rate-limiter.ts`
  - API endpoint `/api/gemini/content`: 10 tokens, 2 refill/sec
  - Exceeded limit returns HTTP 429 with descriptive error

- **PlantContextValidator:** Validates plant-related content via keyword matching
  - Location: `lib/rate-limiter.ts`
  - Reserved for future integration into request filtering
  - Contains 29 plant-related keywords for context validation

## Entry Points

**Application Entry:**
- Location: `app/layout.tsx` (root layout)
- Triggers: Any page navigation
- Responsibilities: HTML shell, global styles, Navigation component

**Page Entries:**
- Location: `app/page.tsx` (home/inventory), `app/doctor/page.tsx`, `app/settings/page.tsx`
- Triggers: Route navigation via Next.js
- Responsibilities: Render page content, instantiate Client Components

**API Entries:**
- Location: `app/api/gemini/content/route.ts`
- Triggers: POST requests from Client Components
- Responsibilities: Proxy Gemini Content API calls with server-side key

**AI Session Entries:**
- Location: `hooks/usePlantDoctor.ts:startCall()`, `hooks/useRehabSpecialist.ts:startRehabCall()`
- Triggers: User toggles camera button or navigates to rehab
- Responsibilities: Initialize media, connect WebSocket, start streaming

## Error Handling

**Strategy:** Catch-and-recover with graceful degradation

**Patterns:**
- API Routes return proper HTTP status codes and error messages
- Client Components handle fetch errors with try/catch
- AI hooks wrap connection in try/catch, call `stopCall()` on error
- `onError` and `onClose` callbacks trigger cleanup
- StorageService returns defaults on parse errors
- No global error boundary; errors handled at feature level

**Next.js Error Handling:**
- `error.tsx` files can be added for route-level error boundaries
- `loading.tsx` files for loading states during navigation

## Cross-Cutting Concerns

**Logging:** Structured logging via prefixed console messages (Added 2026-01-18)
- Prefixes: `[RATE_LIMIT]`, `[TOOL_CALL]`, `[API_REQUEST]`, `[SUCCESS]`, `[GENERATION_ERROR]`, `[PARSE_ERROR]`, `[INVALID_REQUEST]`
- Logs include relevant context (plant names, species, operation types) for debugging and monitoring
- Legacy: `console.error`, `console.warn` in catch blocks

**Validation:**
- TypeScript compile-time type checking
- Runtime validation for API inputs in `/api/gemini/content` route handler
- Request validation checks: request type, plant species presence, homeProfile presence

**Rate Limiting & Guardrails (Added 2026-01-18):**
- **Tool Call Limits:** Rehab mode (10 calls/min), Discovery mode (15 calls/min) via `ToolCallRateLimiter`
- **API Endpoint Limits:** Token bucket (10 tokens, 2 refill/sec) via `TokenBucketLimiter` on `/api/gemini/content`
- **System Prompt Enforcement:** "PLANT-ONLY FOCUS" mode with explicit CRITICAL RULES for both rehab and discovery modes
- **Context Validation:** `PlantContextValidator` available for keyword-based plant content detection
- Rate-limited requests return HTTP 429 with descriptive error messages

**Authentication:** None for users; API key managed server-side for Content API, client-side (domain-restricted) for Live API

**Persistence:** localStorage via Client Components with automatic sync on state changes

**Server/Client Boundary:**
- Default to Server Components (no directive needed)
- Add `'use client'` only for components that need:
  - Browser APIs (localStorage, AudioContext, MediaDevices)
  - React hooks (useState, useEffect)
  - Event handlers
- Keep client boundary as low as possible in component tree

---

*Architecture analysis: 2026-01-18*
*Updated with guardrails, rate limiting, and structured logging: 2026-01-18*
