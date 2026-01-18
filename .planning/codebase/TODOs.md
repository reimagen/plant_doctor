# Project Status Checklist

## Completed (Pre-Migration)
- [x] Ignore `.env*` files and allow `.env.example` to be tracked.
- [x] Add `.env.example` with `GEMINI_API_KEY` placeholder.
- [x] Ensure Vite loads the app entry by adding `/index.tsx` to `index.html`.
- [x] Replace deprecated `ScriptProcessorNode` capture with `AudioWorkletNode` in live audio hooks.
- [x] Log media send errors to surface live session failures.
- [x] Seasonal Mode: Auto-populate based on date/hemisphere

## Next.js Migration Tasks

### Phase 1: Project Setup ✅
- [x] Initialize Next.js project with App Router
- [x] Set up Tailwind CSS via npm (not CDN)
  - [x] Install tailwindcss, postcss, autoprefixer
  - [x] Create `tailwind.config.ts`
  - [x] Create `postcss.config.js`
  - [x] Create `app/globals.css` with Tailwind imports
- [x] Configure TypeScript (`tsconfig.json` with path aliases)
- [x] Set up environment variables
  - [x] Update `.env.example` for dual key setup
- [x] Configure `.gitignore` for Next.js (`.next/`, etc.)

### Phase 2: App Structure ✅
- [x] Create `app/` directory structure:
  - [x] `app/layout.tsx` - Root layout
  - [x] `app/page.tsx` - Home/Inventory page
  - [x] `app/globals.css` - Global styles
  - [x] `app/doctor/page.tsx` - Doctor camera view
  - [x] `app/settings/page.tsx` - Settings page
  - [x] `app/ClientApp.tsx` - Client wrapper for state management
- [x] Create API routes:
  - [x] `app/api/gemini/content/route.ts` - Content generation proxy

### Phase 3: Component Migration ✅
- [x] Migrate components (add `'use client'` where needed):
  - [x] `Navigation.tsx` - Update to use `next/link`
  - [x] `PlantCard.tsx`
  - [x] `PlantEditModal.tsx`
  - [x] `RescueProtocolView.tsx`
  - [x] `components/pages/InventoryPage.tsx`
  - [x] `components/pages/DoctorPage.tsx`
  - [x] `components/pages/SettingsPage.tsx`
- [x] Move types to `types/index.ts`

### Phase 4: Hooks Migration ✅
- [x] Migrate hooks:
  - [x] `useAppState.ts` - Remove view switching (router handles navigation)
  - [x] `usePlantDoctor.ts` - Update to use `NEXT_PUBLIC_GEMINI_API_KEY`
  - [x] `useRehabSpecialist.ts` - Update to use `NEXT_PUBLIC_GEMINI_API_KEY`
  - [x] `useMediaStream.ts`

### Phase 5: Services Migration ✅
- [x] Migrate services in `lib/`:
  - [x] `gemini-live.ts` - Use `NEXT_PUBLIC_GEMINI_API_KEY` (client-side)
  - [x] `audio-service.ts`
  - [x] `storage-service.ts`
  - [x] `test-data.ts`
  - [x] `season.ts`
  - [x] `constants.tsx`
- [x] Create `public/pcm-capture-worklet.js` for AudioWorklet

### Phase 6: API Integration ✅
- [x] Implement Content API route (`POST /api/gemini/content`)
  - [x] Handle care-guide requests
  - [x] Handle rescue-plan requests
  - [x] Use server-only `GEMINI_API_KEY`
- [x] Client components fetch from API route (RescueProtocolView)

### Phase 7: Navigation & State ✅
- [x] Update `Navigation.tsx` to use `next/link`
- [x] Implement state persistence across navigation
  - [x] Client Component wrapper with useAppState (`ClientApp.tsx`)
- [x] Remove view switching from `useAppState` (router handles navigation)

### Phase 8: Testing & Verification ✅
- [x] Verify all routes work correctly (build succeeds)
- [x] Build generates correct routes:
  - `/` - Inventory page
  - `/doctor` - Doctor camera view
  - `/settings` - Settings page
  - `/api/gemini/content` - API route

### Phase 9: Deployment (Ready) ✅
- [x] Project configured for Vercel zero-config deployment
- [ ] **Manual steps required:**
  - [ ] Configure Vercel project in dashboard
  - [ ] Set environment variables in Vercel dashboard:
    - [ ] `GEMINI_API_KEY` (server-only)
    - [ ] `NEXT_PUBLIC_GEMINI_API_KEY` (client-side)
  - [ ] Configure API key domain restriction in Google Cloud Console
  - [ ] Deploy and verify production build

### Phase 10: Cleanup
- [ ] Remove old Vite configuration files:
  - [ ] `vite.config.ts`
  - [ ] `index.html`
  - [ ] `index.tsx` (entry point)
- [ ] Remove old `pages/` directory (replaced by `app/`)
- [ ] Update package.json scripts
- [ ] Update README with new setup instructions

## Post-Migration Improvements (Phased)

### Phase 1: Split Doctor vs Manager (In Progress)
- [x] Split PlantDoctor into two focused components
  - **Doctor.tsx** - Livestream UI and media management
  - **Manager.tsx** - Plant settings and management UI
  - **DoctorPage.tsx** - Orchestrator layer
- [x] Refactor `DoctorPage.tsx` to coordinate both components
- [x] Ensure state flows correctly between Doctor and Manager
- [x] Decision: source of environment settings detected during calls (tool call fields via Doctor tool call)

### Phase 2: Manager Owns Environment + AI Tips
- [x] AI tips must be populated by Manager
  - [x] Move AI tips generation from Doctor to Manager
  - [x] Manager uses content API to fetch tips (no Doctor dependency)
  - [x] Create UI section in Manager for displaying tips
  - [x] Remove AI tips rendering from Doctor component
- [ ] All environment settings populated by Plant Manager
  - [x] Update plant manager to retrieve all environment settings (temp, humidity, light, location, etc.)
  - [x] Ensure environment settings are included in Gemini livestream context
  - [ ] Test settings are passed correctly during rehab calls

### Phase 3: Navigation + Audio-Only Livestream
- [x] Change bottom Navbar to include microphone button, for audio only
  - [x] Add microphone icon button to bottom navbar
  - [x] Implement microphone state (active/inactive) display
  - [x] Wire button to start/end livestream call
    - [x] In `Navigation.tsx`, import and use the `useMediaStream` hook.
    - [x] The new microphone button's `onClick` handler should call the `start` function from the hook with `videoMode` set to `false` (i.e., `start(false)`).
    - [x] The existing video/doctor button should be updated to call `start(true)`.
    - [x] The `stop` function from the hook can be used to terminate both audio and video streams, so it should be wired to a common 'end call' button.
  - [x] Update navbar layout for audio-only mode (hide other controls if needed)
  - [x] Ensure button is accessible and prominently visible
  - [x] Use context of plantID for livestreams when on plant page

### Phase 3.1: Fix Gemini Live Connection Issue
- [ ] Investigate premature WebSocket closure with Gemini API
  - [ ] Problem: WebSocket closes immediately after `onopen` and `session established` logs, preventing media transfer.
  - [ ] Hypothesis: Server-side rejection due to unfulfilled expectations (e.g., immediate multimodal input, specific configuration).
  - [ ] Current Status: Audio worklet processes data, but `sendMedia` fails due to closed WebSocket.

### Phase 3.5: Change PlantEditModal to individual pages for each plant
  - [ ] Create dynamic route `/plants/[id]/page.tsx` for individual plant pages
  - [ ] Move PlantEditModal content and logic to new plant detail pages
  - [ ] Update Navigation to link to `/plants/[id]` instead of modal
  - [ ] Migrate modal state management to page routing
  - [ ] Remove PlantEditModal component usage from InventoryPage

### Phase 4: Retire useRehabSpecialist (Planned)
- [ ] Validate `useRehabSpecialist` is no longer needed
  - [ ] Review current usage of `useRehabSpecialist`
  - [ ] Test passing plantID through context instead of rehab state
  - [ ] Verify Gemini API calls work with plantID from router params
  - [ ] Check for missing functionality without rehab specialist
  - [ ] Remove or refactor `useRehabSpecialist` if confirmed unnecessary

### Phase 5: Livestream Notifications + Timeline Overlay
- [ ] Audit live notifications for livestream with timeline overlay
  - **Current State:** Toast notifications on right side showing plant detections (discovery log)
  - **Existing Implementation Reference:**
    - Location: `DoctorPage.tsx` lines 66-85
    - Pattern: Toast-based notification stack on right side (`absolute right-6 top-1/2 -translate-y-1/2 z-20`)
    - Styling: Dark semi-transparent cards (`bg-black/60 backdrop-blur-md border border-white/20`)
    - Animation: `animate-slide-up` with stagger effect (opacity fades, slight X shift and scale per layer)
    - Max items: 5 notifications (FIFO removal)
  - **Requirements:**
    - [ ] Add notifications for rescue plan task completions (e.g., "✓ Task: Water Plant")
    - [ ] Add notifications for plant status changes (e.g., "📈 Status: Warning → Healthy")
    - [ ] Add notifications for health observations (e.g., "📝 New leaf growth detected")
    - [ ] Incorporate RescueTimeline component into the livestream overlay during rehab mode
    - [ ] Support mixed notification types in same stack
  - **Implementation Plan:**
    - [ ] Create notification event system: update useRehabSpecialist to emit events via callback/state
      - Emit when `mark_rescue_task_complete` function is called (task completion notification)

### Phase 6: General Improvements
- [ ] Add error boundaries (`error.tsx` files)
- [ ] Add loading states (`loading.tsx` files)
- [ ] Set up Vitest for testing
- [ ] Add tests for API route handlers
- [ ] update structure documents from /Users/lisagu/Projects/plant_doctor/.planning to reflect new setup, audit folder as well.
- [ ] User should have to tap as few buttons as possible, with the goal of the agent handling task completions, status updates, etc. so the goal is the user should only have to tap the start and end call buttons. 

## NEXT CALL: DISCUSS HOW CARE NOTES SHOULD BE HANDLED
- [ ] Health notes: stop unbounded append during calls (dedupe/replace strategy)
- [ ] Health notes: add manual removal UI from plant details


## Future Considerations
- [ ] Offline support / PWA
- [ ] Data export/import functionality
- [ ] Permission handling UI for camera/microphone
- [ ] Error UI for user visibility into failures
