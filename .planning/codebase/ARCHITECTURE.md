# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** Component-Based Single Page Application with Custom Hook State Management

**Key Characteristics:**
- React SPA with centralized state in a custom hook (`useAppState`)
- Feature-based hooks encapsulate AI/media integration logic
- Services layer for external APIs and browser storage
- No routing library; view switching via state enum
- Real-time multimodal AI integration via WebSocket sessions

## Layers

**Presentation Layer:**
- Purpose: React components that render UI and handle user interactions
- Location: `components/`, `pages/`
- Contains: JSX components, event handlers, local UI state
- Depends on: Types, Constants, Hooks
- Used by: Root `App` component in `index.tsx`

**State Management Layer:**
- Purpose: Centralized application state and business logic
- Location: `hooks/useAppState.ts`
- Contains: Plant CRUD operations, view navigation, persistence sync
- Depends on: StorageService, Types
- Used by: Root `App` component, passed down via props

**Feature Hooks Layer:**
- Purpose: Encapsulate complex features (AI sessions, media capture)
- Location: `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`, `hooks/useMediaStream.ts`
- Contains: WebSocket session management, audio/video streaming, tool call handling
- Depends on: GeminiLiveSession, AudioService, Types
- Used by: `DoctorPage` component

**Services Layer:**
- Purpose: External API clients and browser API wrappers
- Location: `lib/`
- Contains: Gemini API wrappers, localStorage abstraction, audio playback
- Depends on: External SDKs (@google/genai), Browser APIs
- Used by: Hooks, Components

**Types/Constants Layer:**
- Purpose: Shared type definitions and static configuration
- Location: `types.ts`, `constants.tsx`
- Contains: TypeScript interfaces, default values, icon components
- Depends on: Nothing
- Used by: All other layers

## Data Flow

**Plant Discovery Flow:**

1. User activates camera via `DoctorPage` toggle button
2. `usePlantDoctor` hook starts media stream and Gemini Live session
3. Video frames and audio sent to Gemini every 1 second
4. Gemini calls `propose_plant_to_inventory` tool when plant detected
5. Hook captures current frame and calls `onAutoDetect` callback
6. `useAppState.addPlant()` adds plant with `pending` status
7. Plant appears in `InventoryPage` pending section

**Plant Care Flow:**

1. User interacts with `PlantCard` (water, adopt, check-in)
2. Handler calls state mutation from `useAppState` (e.g., `waterPlant`)
3. State update triggers `useEffect` which persists to localStorage
4. Component re-renders with new state

**Rehab Verification Flow:**

1. User triggers rehab from `InventoryPage` via `onOpenRehab`
2. `useAppState` sets `rehabTarget` and switches to doctor view
3. `DoctorPage` detects `rehabTargetId` and auto-starts rehab session
4. `useRehabSpecialist` connects to Gemini with plant context
5. Gemini calls `verify_rehab_success` tool after analyzing plant
6. Hook calls `onUpdate` to update plant status

**State Management:**
- Single source of truth in `useAppState` hook
- State passed down via props (prop drilling pattern)
- No context providers or state management libraries
- Persistence via localStorage on every state change

## Key Abstractions

**GeminiLiveSession:**
- Purpose: Wraps WebSocket connection to Gemini Live API
- Examples: `lib/gemini-live.ts`
- Pattern: Class with connect/send/close lifecycle, callback-based message handling

**AudioService:**
- Purpose: Manages audio playback of Gemini voice responses
- Examples: `lib/audio-service.ts`
- Pattern: Class managing AudioContext and buffer queue for gapless playback

**Plant:**
- Purpose: Core domain entity representing a tracked houseplant
- Examples: `types.ts` interface, used throughout
- Pattern: Plain object with status enum driving UI states

**HomeProfile:**
- Purpose: User's home environment settings for AI context
- Examples: `types.ts` interface, `SettingsPage` for editing
- Pattern: Simple object stored in localStorage, passed to AI prompts

## Entry Points

**Application Entry:**
- Location: `index.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Creates React root, renders `App` component

**Vite Dev Server:**
- Location: `vite.config.ts`
- Triggers: `npm run dev`
- Responsibilities: Bundles app, injects env vars, serves HMR

**AI Session Entries:**
- Location: `hooks/usePlantDoctor.ts:startCall()`, `hooks/useRehabSpecialist.ts:startRehabCall()`
- Triggers: User toggles camera button or navigates to rehab
- Responsibilities: Initialize media, connect WebSocket, start streaming

## Error Handling

**Strategy:** Catch-and-recover with graceful degradation

**Patterns:**
- AI hooks wrap connection in try/catch, call `stopCall()` on error
- `onError` and `onClose` callbacks trigger cleanup
- StorageService returns defaults on parse errors
- GeminiContentService returns fallback tips on API failure
- No global error boundary; errors handled at feature level

## Cross-Cutting Concerns

**Logging:** Console-based via `console.error`, `console.warn` in catch blocks; no structured logging

**Validation:** TypeScript compile-time only; no runtime validation of API responses or user input

**Authentication:** None; API key injected via `process.env.API_KEY` at build time

**Persistence:** LocalStorage via `StorageService` with automatic sync on state changes

---

*Architecture analysis: 2026-01-17*
