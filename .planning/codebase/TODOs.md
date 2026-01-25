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

### Phase 3.1: Fix Gemini Live Connection Issue ✅
- [x] Investigate premature WebSocket closure with Gemini API
  - [x] Problem: WebSocket closes immediately after `onopen` and `session established` logs, preventing media transfer.
  - [x] Root cause: Invalid model name (`gemini-2.5-flash-preview-native-audio-dialog`) and API version (`v1alpha`).
  - [x] Solution: Changed to `gemini-2.0-flash-exp` model with `v1beta` API version.
  - [x] Added `isClosed` flag to prevent "WebSocket is already in CLOSING or CLOSED state" errors.
  - [x] Updated close event logging to show code, reason, and wasClean for debugging.
  - [x] Removed verbose PCM packet logging from both hooks.

### Phase 3.5: Change PlantEditModal to individual pages for each plant ✅
  - [x] Create dynamic route `/plants/[id]/page.tsx` for individual plant pages
  - [x] Move PlantEditModal content and logic to new plant detail pages
  - [x] Update InventoryPage to link to `/plants/[id]` instead of modal
  - [x] Migrate modal state management to page routing
  - [x] Remove PlantEditModal component usage from InventoryPage

### Phase 4: Route-based Rehab Mode ✅
- [x] Refactored rehab mode to use URL params instead of state
  - [x] Review current usage of `useRehabSpecialist`
  - [x] Changed plantID passing from state to URL search params (`/doctor?plantId=xxx`)
  - [x] DoctorPage now reads plantId from `useSearchParams()`
  - [x] Added Suspense boundary for useSearchParams compatibility
  - [x] Removed `rehabTarget` state and `handleOpenRehab` from useAppState
  - [x] Added "Start Rehab Call" buttons (audio/video) to PlantDetailPage
  - [x] Updated InventoryPage onCheckIn to navigate directly to `/doctor?plantId=xxx`
  - Note: `useRehabSpecialist` hook is still used for rehab-specific Gemini session logic

### Phase 4.5: Livestream UX Polish & Bug Fixes ✅
- [x] **Refactor livestream controls from navbar to Doctor page**
  - [x] Added explicit stream mode tracking (`'video' | 'audio' | null`)
  - [x] Simplified Navigation component to pure navigation links (removed Doctor/Listen/Stop action buttons)
  - [x] Moved start/stop controls to Doctor page (camera/microphone/stop buttons centered above navbar)
  - [x] Updated PlantDetailPage to use new mode signature
  - [x] Prevention of race conditions: guards at UI, ClientApp, hook, and session levels

- [x] **Fix audio-only state display**
  - [x] Fixed lingering "Audio Stream Active" message when stream stopped (added `setIsAudioOnly(false)`)
  - [x] Made "Inventory Sweep" header only visible during video calls, hidden in audio mode

- [x] **Audio vs Video mode differentiation**
  - [x] Created separate system instructions for video (inventory cataloging) vs audio (Q&A) modes
  - [x] Video greeting: "I'm ready for the grand tour! Show me your plants one by one..."
  - [x] Audio greeting: "What questions can I answer about your plants today?"
  - [x] Audio mode rejects plant cataloging requests with helpful message to switch to video

- [x] **Code cleanup**
  - [x] Deleted dead code: `components/PlantEditModal.tsx` (replaced by PlantDetailPage in Phase 3.5)
  - [x] Refactored Manager.tsx to `components/plant-details` and `hooks/useCareguide.ts` and `hooks/useRescuePlant.ts`. 
  - [ ] Open item: reorganize Components folder to match new file structure.

### Navigation State Loss Bug ✅ RESOLVED
- **Status:** FIXED
- **Root Cause:** Each route page was rendering its own instance of `ClientApp` component, creating separate state for each route. When navigating between routes, the state was lost because a new `ClientApp` instance was created.
- **Solution Implemented:**
  - Moved `ClientApp` from individual route pages to `app/layout.tsx` (root layout)
  - Updated all route pages (`/`, `/doctor`, `/settings`, `/plants/[id]`) to return `null`
  - Now there is a single persistent `ClientApp` instance across all routes
  - Stream state (`stream`, `streamMode`, `isConnecting`) survives all navigation
  - MediaStream reference and UI state remain in sync
- **Files Changed:**
  - `app/layout.tsx` - Moved ClientApp to root layout
  - `app/page.tsx` - Changed to return null
  - `app/doctor/page.tsx` - Changed to return null
  - `app/settings/page.tsx` - Changed to return null
  - `app/plants/[id]/page.tsx` - Changed to return null
  - `hooks/useMediaStream.ts` - Refactored to utility-only (no state)
  - `app/ClientApp.tsx` - Now manages stream state directly
- **Verification:** Tested navigation between routes while stream active - Stop button persists and call can be terminated from any route

## Session Summary: Plant Card & Rescue Protocol UX Improvements

### Completed Improvements
- [x] **Plant Card Redesign**
  - Removed camera icon from plant cards (redundant with plant detail buttons)
  - Removed "Hydrated" button for healthy plants (no action needed)
  - Cleaned up action buttons to only show contextual CTAs

- [x] **Unified Plant Status Logic**
  - Created `PlantStatusBadge.tsx` component as single source of truth for status display
  - Both PlantCard and PlantDetailPage now use same component
  - Eliminated inconsistent status displays between views

- [x] **Rescue Plan Structured Metadata**
  - Updated `RescueTask` type to include: `phase`, `duration`, `sequencing`, `successCriteria`
  - Updated API to request 3-5 steps organized into phases (phase-1, phase-2, phase-3)
  - Changed from hardcoded "day-2" timing to flexible phase system

- [x] **RescueTimeline Component Redesign**
  - Tasks now grouped by phase with descriptive headers
  - Each phase shows title, description, and completion progress
  - Visual separation with phase-colored backgrounds (red/amber/blue)
  - Removed redundant phase badge from individual tasks

- [x] **Rescue Plan Auto-Updates**
  - Detect watering tasks (phase-1) and auto-update `lastWateredAt` when completed
  - Auto-flip status from critical → warning when first task is completed
  - Eliminated need for manual date entry

- [x] **Auto-Generation Fix**
  - Changed rescue plan auto-generation to critical plants only
  - Warning plants only show routine checkup buttons, not rescue protocol
  - Eliminated confusing dual-status on warning plants (checkup-due + rescue)

- [x] **Button Priority & State Management**
  - Reordered button checks: emergency states (rescue) → checkup states → water states
  - Added "Complete First Rescue Step" button for plans with no completed tasks (red, urgent)
  - Added "Checkup in Xd" button for monitoring plants (light amber, heads-up)
  - Fixed inconsistent button showing for critical plants

- [x] **Urgency Sorting**
  - Updated urgency score to include overdue plants (score 2)
  - Overdue healthy plants now sort above non-urgent plants
  - Tiebreaker: sort by days until next watering

- [x] **Removed Confusing UX**
  - Removed "Regenerate Plan" button (single path: Generate → Commit)
  - Changed "Save Plan" to "Commit to Plan" (more intentional language)
  - Removed quotation marks from phase description text

### Files Modified
- `components/PlantCard.tsx` - Refactored buttons, integrated PlantStatusBadge
- `components/PlantStatusBadge.tsx` - New component for unified status logic
- `components/pages/PlantDetailPage.tsx` - Updated to use PlantStatusBadge
- `components/pages/InventoryPage.tsx` - Fixed urgency sorting logic
- `components/plant-details/RescueTimeline.tsx` - Phase grouping and descriptions
- `components/RescueProtocolView.tsx` - Removed regenerate button, added onCommit prop
- `hooks/useRescuePlan.ts` - Auto-generation for critical only, watering task detection
- `types/index.ts` - Extended RescueTask interface with metadata
- `app/api/gemini/content/route.ts` - Updated API to request structured rescue steps
- `lib/test-data.ts` - Updated Ruby's rescue plan with full structured metadata

### Phase Flow Now Clear
1. **Critical plant** → "Begin Rescue Protocol" → Generate plan → "Commit to Plan"
2. **Commit plan** → "Complete First Rescue Step" button (red, urgent)
3. **Complete first task** → Status auto-flips to warning, shows "Monitoring"
4. **Follow phases** → Phase 1 (first aid), Phase 2 (recovery), Phase 3 (monitor)
5. **Watering tasks** → Auto-update lastWateredAt, no manual entry needed

### UX Improvements
- [x] Right-aligned "Pending Adoption" section in InventoryPage.
- [x] Changed "Adopt Plant" button fill color to green in PlantCard.
- [x] Removed "Assessment Pending" timeline text from PlantCard.
- [x] Renamed "AI Expert Tips" to "Care Guide" in CareGuideSection.
- [x] Implemented automatic care guide generation upon user tapping "adopt plant" via useAppState. Not manager, intentonally.
- [x] Hid "Rescue Plan" section for healthy but overdue plants in Manager. Confusing to user, not needed.

### Phase 5: Remove Audio Concept ✅
- [x] Remove audio concept from the app. We will keep it for future improvements for when we have time.
  - [x] Deleted `lib/audio-service.ts`
  - [x] Deleted `public/pcm-capture-worklet.js`
  - [x] Simplified `useMediaStream.ts` - removed `videoMode` parameter, always request video
  - [x] Removed AudioService from `usePlantDoctor.ts` and simplified to video-only (removed Q&A mode)
  - [x] Removed AudioService from `useRehabSpecialist.ts` and simplified to video-only
  - [x] Removed `isAudioOnly` state from `Doctor.tsx`
  - [x] Removed microphone button from `DoctorPage.tsx`
  - [x] Removed audio rehab button from `PlantDetailPage.tsx`
  - [x] Simplified `ClientApp.tsx` streamMode to `'video' | null`

### Phase 6: Livestream Notifications + Timeline Overlay ✅
- [x] Decision needed: Plant Doctor - Don't ask user for `lastWateredAt` instead default to undefined or null. That would mean the card is in PENDING state. The adopt plant and release button should be removed, the adopt plant button should be called "Review Plant". The relase button should be an x at the top right of the card. Then on the detail page of the plant in pending we should have a "Adopt Plant" button that adds the plant to the user's inventory. The watered date should be required and block the user from clicking adopt plant if it's not set. The watered date section label should have an additional indicator to show that it's required for adoption.
- [x] When on video call user is asked to prioritize a plant and rescue plant  plan is automatically generated. User should just start video chat and plan should be generated and followed in plantdetailspage.
- [x] Audit live notifications for livestream with timeline overlay
  - **Current State:** Toast notifications on right side showing plant detections (discovery log)
  - **Existing Implementation Reference:**
    - Location: `DoctorPage.tsx` lines 66-85
    - Pattern: Toast-based notification stack on right side (`absolute right-6 top-1/2 -translate-y-1/2 z-20`)
    - Styling: Dark semi-transparent cards (`bg-black/60 backdrop-blur-md border border-white/20`)
    - Animation: `animate-slide-up` with stagger effect (opacity fades, slight X shift and scale per layer)
    - Max items: 5 notifications (FIFO removal)
  - **Requirements:**
    - [x] Add notifications for rescue plan task completions (e.g., "✓ Task: Water Plant")
    - [x] Add notifications for plant status changes (e.g., "📈 Status: Warning → Healthy")
    - [x] Add notifications for health observations (e.g., "📝 New leaf growth detected")
    - [x] Incorporate RescueTimeline component into the livestream overlay during rehab mode
    - [x] Support mixed notification types in same stack
    - [x] Add notifications for plant detections (e.g., "🌱 New plant detected")
  - **Implementation Plan:**
    - [x] Create notification event system: update useRehabSpecialist to emit events via callback/state
      - Emit when `mark_rescue_task_complete` function is called (task completion notification)
  - **Timeline Overlay:**
    - [x] Add RescueTimeline component to the livestream overlay if a plant needs an immediate action
    - [x] The overlay should have a faint opacity lets say 0.3 with no background and the text should be gray. Important we should still see the camera feed.
    - [x] The overlay should be position absolute and cover the entire screen.
    - [x] The overlay should be z-indexed higher than the livestream.
    - [x] It should only show the timeline similar to the plant detail page and nothing else

### Phase 7: Livestream & Timeline Refinements (Refines Phase 6)
- [ ] **Plant targeting indicator for multi-plant frames**
  - [ ] Add visual indicator (circle/reticle) overlay on livestream
  - [ ] Indicator helps Gemini identify which plant to focus on when multiple plants visible
  - [ ] Indicator position communicated to Gemini via frame context or prompt
- [ ] Refine notification system for clearer visual hierarchy
  - [ ] Distinguish between task completion, status change, and observation notifications
  - [ ] Add animation polish for notification transitions
  - [ ] Ensure notifications don't obscure critical camera feed areas
- [ ] Improve timeline overlay readability during livestream
  - [ ] Optimize opacity and contrast for varying backgrounds
  - [ ] Add collapsible/expandable timeline for less intrusive viewing
  - [ ] Ensure timeline updates in real-time as tasks are completed
- [ ] Enhance rescue plan auto-generation during video calls
  - [ ] Streamline plan generation without user interruption
  - [ ] Ensure plan syncs immediately to PlantDetailPage
- [ ] Polish pending adoption workflow from Phase 6
  - [ ] Improve "Review Plant" card interaction
  - [ ] Ensure required watered date validation is clear and user-friendly

### Phase 8: User Flow & Status Path Refinements ✅
**Decisions Made:**
- Grace period: 1 day (daysDiff -1 still shows "Water today")
- Thresholds: Gemini per-plant during detection (same place as cadenceDays)
- Big overdue flow: Water → Monitoring (with checkup)
- "Add Plant" button: In Jungle page header, navigates to Doctor

**Implementation:**
- [x] Add Plant type fields: `overdueThresholdMinor`, `overdueThresholdMajor`, `nextCheckupDate`
- [x] Update usePlantDoctor proposePlantFunction + systemInstruction to include thresholds
- [x] Refactor PlantStatusBadge/PlantCard with dynamic threshold logic
- [x] Implement 1-day grace period (daysDiff >= -1 = not overdue)
- [x] Implement Water → Monitoring flow for major overdue
- [x] Update button labels: "Water Now" → "Mark as Watered"
- [x] Add "Water today" label for daysDiff = 0 or -1
- [x] Show "Mark as Watered" button ONLY on watering day (daysDiff 0 or -1), no button otherwise for healthy
- [x] Add "Add Plant" button to InventoryPage header → navigates to /doctor
- [x] Update urgency sorting to use new threshold logic

**Files Modified:**
- `types/index.ts` - Added threshold and checkup date fields
- `hooks/usePlantDoctor.ts` - Gemini now sets per-plant thresholds during detection
- `hooks/useAppState.ts` - Water → Monitoring flow for major overdue plants
- `components/PlantStatusBadge.tsx` - Dynamic thresholds, grace period, new labels
- `components/PlantCard.tsx` - New button logic, "Mark as Watered" labels
- `components/pages/InventoryPage.tsx` - "Add Plant" button, updated urgency sorting
- `lib/constants.tsx` - Added Plus icon

### Phase 9: General Improvements
- [ ] Add error boundaries (`error.tsx` files)
- [ ] Add loading states (`loading.tsx` files)
- [ ] Set up Vitest for testing
- [ ] Add tests for API route handlers
- [ ] update structure documents from /Users/lisagu/Projects/plant_doctor/.planning to reflect new setup, audit folder as well.
- [ ] User should have to tap as few buttons as possible, with the goal of the agent handling task completions, status updates, etc. so the goal is the user should only have to tap the start and end call buttons.
- [ ] While rescue plan is active, show next step on summary card. Next to "Next watering" or "Next checkup".
- [ ] Handle user event correctly when clicking on a card and check in button. Clicking on the button shouldn't nagivage to the plant detail page but to the doctor page. and if we click on the card it should navigate to the detail page.
- [ ] All first aid tasks should be completed before entering monitoring mode.
- [ ] Change the welcome note so we only see it from the general call and not from the plant specific call.
- [ ] The Navigation bar Doctor label and phone icon should be changed to the Video version the icon should be a camera icon. And the Video button should be removed from the Doctor Page. Since it is already in the nav bar.
- [ ] Rescue plan currently is created by user clicking "begin rescue protocol" instead should be generated during check-up video call after gemini has visually assessed the status of the plant.


## Phase: If we have time
- [ ] Audio with inventory
  1. Perform an action e.g. Watered plant
  2. Ask for status update and things to do today, and future tasks
  Edge case: Plants in critical condition
    - What do we do between audio and livestream? Can we click on video and pass the audio context over.
  Edge case: Doing something with a specific plant
    - Can we have an agent to navigate us to the plant detail page and perform an action?







## NEXT CALL: DISCUSS HOW CARE NOTES SHOULD BE HANDLED
- [ ] Health notes: stop unbounded append during calls (dedupe/replace strategy)
- [ ] Health notes: add manual removal UI from plant details


## Future Considerations
- [ ] Offline support / PWA
- [ ] Data export/import functionality
- [ ] Permission handling UI for camera/microphone
- [ ] Error UI for user visibility into failures
