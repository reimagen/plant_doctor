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
  - [x] Solution: Changed to `gemini-2.5-flash-native-audio-preview-12-2025` model with `v1beta` API version.
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

### Phase 6: User Flow & Status Path Refinements ✅
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

### Phase 6.5: Rescue Timeline Display & AI-Driven Plan Generation ✅
- [x] **Fix checkup page rescue timeline flow**
  - [x] FirstAidStepOverlay persists after stream stops (DoctorPage.tsx)
  - [x] PlantManager sidebar hides when rescue timeline exists
  - [x] Welcome message only shows when no stream AND no rescue timeline
- [x] **Add AI rescue plan generation during livestream**
  - [x] Added `create_rescue_plan` tool to useRehabSpecialist hook
  - [x] AI automatically generates rescue plan after assessing plant
  - [x] Calls `/api/gemini/content` to generate structured rescue tasks
  - [x] Updates plant with `rescuePlanTasks` array during conversation
- [x] **Fix overlay to show all rescue phases sequentially**
  - [x] FirstAidStepOverlay now accepts `phase` prop (phase-1, phase-2, phase-3)
  - [x] Shows only tasks from current phase with phase-specific labels
  - [x] Phase 1: "IMMEDIATE ACTION" (red) - First Aid steps
  - [x] Phase 2: "RECOVERY SUPPORT" (amber) - Recovery steps
  - [x] Phase 3: "ONGOING MONITORING" (blue) - Maintenance steps
  - [x] DoctorPage auto-transitions between phases as tasks complete
  - [x] User sees "First Aid Step 1/2", then "Recovery Step 1/3", etc.
- [x] **Remove manual rescue generation (completed in Phase 7)**
  - [x] Remove `generateRescuePlan` from useRescuePlan hook
  - [x] Delete RescueProtocolView component
  - [x] Remove "Begin Rescue Protocol" button from PlantCard → "Start Checkup"
  - [x] Remove "Generate" button from RescueTimeline
  - [x] Update empty states to direct users to livestream checkup
  - [x] Rename useRescuePlan to useRescueTaskManager (single purpose)

**Files Modified:**
- `components/pages/DoctorPage.tsx` - Overlay logic, phase detection, sidebar hiding
- `components/plant-details/FirstAidStepOverlay.tsx` - Phase-based display
- `hooks/useRehabSpecialist.ts` - Added create_rescue_plan tool

**Plan Created:**
- `/Users/lisagu/.claude/plans/abundant-stirring-allen.md` - Full removal plan for manual generation

**Recent Updates (post Phase 6.5):**
- Add-plant livestream always creates pending entries; care guides now generate on add (not adoption) and include health notes + ideal conditions
- Care guide timestamps show "Last Generated: Mon DD" and test data includes generated timestamps
- Health notes now track session-based updates (max 3 sessions, max 3 notes per session) with "Last Updated" label vs. endless prepending
- Environment Settings refinements (near-window Yes/No radios, white inputs, Water Cycle helper, visible spinners)
- Livestream targeting glow ring added and prompt updated to focus centered plant
- Navigation doctor icon updated to a stethoscope

### Phase 7: Livestream & Timeline Refinements ✅ (Completed)
- [x] **Plant targeting indicator for multi-plant frames**
  - [x] Add visual indicator (circle/reticle) overlay on livestream
  - [x] Indicator helps Gemini identify which plant to focus on when multiple plants visible
  - [x] Indicator position communicated to Gemini via frame context or prompt
- [x] **Remove manual rescue generation (deferred from Phase 6.5)**
  - [x] Remove `generateRescuePlan` from useRescueTaskManager hook
  - [x] Delete RescueProtocolView.tsx component
  - [x] Change "Begin Rescue Protocol" button to "Start Checkup"
  - [x] Remove "Generate" button from RescueTimeline
  - [x] Update empty state messages to guide users to livestream
- [x] **Fix AI task completion side effects**
  - [x] Apply watering task detection when AI marks tasks complete
  - [x] Update `lastWateredAt` for watering tasks during livestream
  - [x] Apply status transitions consistently (UI and AI paths)
- [x] **Fix task matching logic**
  - [x] Implement best-match scoring (exact > substring > word overlap)
  - [x] Prevent multiple tasks completing simultaneously from loose matching
- [x] **Fix status transition timing**
  - [x] Only flip to "Monitoring" (warning) after ALL phase-1 tasks complete
  - [x] Was prematurely flipping on first task completion
- [x] **Hide manager panel during livestream calls**
  - [x] Remove plant details sidebar from DoctorPage during active calls
  - [x] Only FirstAidStepOverlay displays during livestream
- [x] **Fix rescue plan visibility in plant details**
  - [x] Update Manager.tsx visibility condition to check `rescuePlanTasks`
  - [x] Plans created by AI now appear in plant details
- [x] **Update test data**
  - [x] Add 3-phase test plant with clear testing guide comments

### Phase 7.5: Debug Rescue Plan Flow ✅
- [x] **Debug & Verify Rescue Plan Persistence**
  - [x] Verified rescue plan tasks persist from livestream to plant details
  - [x] Confirmed status transition (critical → warning) triggers only after all phase-1 complete
  - [x] Verified localStorage cache cleared, test data loads correctly
  - [x] All phase-1 task completion logic validated during livestream

### Phase 7.6: Simplify Rescue Phase Display - First Aid (Livestream) vs Monitoring (Details) ✅
**Problem:** AI generates phases 1-3, but only phase 1 should show during livestream. Phases 2-3 create confusion and "Monitoring" name collides with status. Blue Phase 3 color is unnecessary.

**Solution:** Show phase 1 only during call, group phase 2+3 as "Monitoring" in plant details with amber color.

**Simplified Color System:**
- Red = First Aid (Phase 1) - immediate action, both livestream and plant details
- Amber = Monitoring (Phase 2+3) - recovery & follow-up guidance, plant details only
- ❌ Remove Blue = Phase 3 no longer exists as separate display category

**Completed:**
- [x] **Update FirstAidStepOverlay**
  - [x] Only render Phase 1 (First Aid) tasks during livestream
  - [x] Remove phase transition logic (don't cycle to Phase 2/3)
  - [x] Hide phase 2/3 tasks completely during call (not accessible)
  - [x] Remove Phase 2 amber config from PHASE_CONFIG
  - [x] Remove Phase 3 blue config from PHASE_CONFIG
- [x] **Update RescueTimeline in plant details**
  - [x] Add grouping logic: Phase 1 → "First Aid" section (red)
  - [x] Group Phase 2 + Phase 3 together → "Monitoring" section (amber)
  - [x] Create SECTION_INFO for "First Aid" and "Monitoring" headings
  - [x] Display both sections with appropriate styling
  - [x] Users can see full recovery plan in plant details
- [x] **Update DoctorPage getCurrentPhase**
  - [x] Only detect Phase 1 tasks for FirstAidStepOverlay
  - [x] Don't look for Phase 2/3 during call
  - [x] Removed phase-2 and phase-3 detection logic
- [x] **Update test data (Ruby)**
  - [x] Keep 3 phases in rescuePlanTasks (unchanged, AI generates full plan)
  - [x] Updated comments: "Phase 1 shows on livestream (red), Phases 2-3 group in Monitoring (amber)"
  - [x] Verified Phase 3 task shows in "Monitoring" section on plant details
- [x] **Language consistency**
  - [x] "First Aid" = Phase 1 label (immediate, livestream + details)
  - [x] "Monitoring" = Phases 2+3 grouped (recovery guidance, plant details only)
  - [x] Status `warning` = "Monitoring" badge (plant health state, inventory card)

**Files Modified:**
- `components/plant-details/FirstAidStepOverlay.tsx` - Only show phase-1, removed phase-2/3 config
- `components/pages/DoctorPage.tsx` - Only detect phase-1
- `components/plant-details/RescueTimeline.tsx` - Added grouping logic (First Aid / Monitoring)
- `lib/test-data.ts` - Updated comments for clarity

**Verified Working:**
- ✅ Phase 1 only displays during livestream
- ✅ No phase cycling to 2/3 on livestream
- ✅ Status stays "Emergency" (critical) until ALL phase-1 complete
- ✅ Plant details shows "First Aid" (red) + "Monitoring" (amber) sections
- ✅ Status flips to "Monitoring" only after all phase-1 tasks complete

### Phase 7.7: Simplify Plant Card Labels & Watering UX ✅
**Problem:** Plant card had confusing variant labels ("Check-up Due", "Checkup Needed", "Thirsty") and blue "Water Today" badge that replaced "Healthy" status.

**Solution:** Consolidate all warning states to "Monitoring" label, keep watering day plants showing "Healthy" with blue action indicator.

**Completed:**
- [x] **Consolidate warning labels**
  - [x] Removed "Check-up Due", "Checkup Needed", "Thirsty" labels
  - [x] All warning states (isCheckInNeeded, isMajorOverdue, isMinorOverdue, isMonitoring) now show "Monitoring"
  - [x] Updated both PlantCard and PlantStatusBadge components
- [x] **Fix watering day display**
  - [x] Changed from showing "Water Today" badge (blue) to "Healthy" badge (green)
  - [x] Added blue "Water today" action tag below badge
  - [x] Green "Mark as Watered" button for consistency
- [x] **Fix condition ordering**
  - [x] Moved isWateringDay check before isMinorOverdue to prioritize watering day
  - [x] Ensures plants in water-today window show correct status
- [x] **Fix timeline tag styling**
  - [x] Changed from hardcoded `bg-stone-50` to dynamic `config.pill`
  - [x] Watering day now shows blue fill (`bg-blue-600 text-white`)
  - [x] Monitoring plants show amber fill
  - [x] Added check to hide empty timeline tags
  - [X] All first aid tasks should be completed before entering monitoring mode.

**Files Modified:**
- `components/PlantCard.tsx` - Consolidated labels, fixed watering day logic, dynamic styling
- `components/PlantStatusBadge.tsx` - Consolidated labels, watering day logic

**Verified Working:**
- ✅ All warning states show "Monitoring" label
- ✅ Watering day shows "Healthy" badge with blue "Water today" action tag
- ✅ Blue fill on action tags provides visual hierarchy
- ✅ Clearer UX with less label variance

### Phase 7.8: UX Polish - Notifications & Timeline Overlay & Testing checkup logic
- [ ] **Refine notification system for clearer visual hierarchy**
  - [ ] Distinguish between task completion, status change, and observation notifications - adding visual feedback when plan is being generated
  - [x] Add animation polish for notification transitions - Added fade-in entrance for overlay, scale-in animation for step transitions, dot-complete pulse when task completes
  - [X] Ensure notifications don't obscure critical camera feed areas
- [ ] **Livestream issues**
  - [X] Validate what is passed to Gemini for livestream besides the plant ID (i.e. need to pass rest of profile like last watered date, previous heath notes, etc.) - Gemini said "sorry I can't see the last watered date" but is able to update it? 
  - [X] Gemini ignores user and keeps speaking over user, idk if we can fix or if that will cause conflicts.
    - Root cause: `gemini-live.ts:39-45` doesn't configure `realtimeInputConfig` — VAD is on by default but sensitivity may be too low
    - Fix: Add `realtimeInputConfig` with high speech sensitivity to the `ai.live.connect()` config in `gemini-live.ts:41-45`:
      ```
      realtimeInputConfig: {
        automaticActivityDetection: {
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
        },
      }
      ```
    - Single file change, no hook changes needed since config is centralized

### Phase 8: Livestream Known Bug and UX Improvements
  - [X] Test Case "needs attention" plant is marked as "start checkup" but in theory just needs to be watered
  - Duplicate additions: Known Gemini Live API bug — duplicate tool calls when function calling is involved (LiveKit #2884, #3870, python-genai #437).
    - [ ] Potential fix: Client-side deduplication in `usePlantDoctor.ts` — before processing `propose_plant_to_inventory`, check if a plant with the same species was already added in the current session. Needs further analysis to determine best approach in frontend.
  - [X] User must speak first, indicate in Welcome Message "begin the chat by saying Hello" (otherwise confusing to a user who expects Gemini to speak first)
  - [X] Analyzing livestream button, move to bottom next to call start/stop button
  - [X] When rescue plan is being generated, there is a long period of silence from Gemini, so users need to know it is processing. Need to provide feedback visually that plan is being generated. Use button indicator plan is being generated, and also pulse glow the ring when model is active. 
  - [x] Once all Phase 1 First Aid tasks are marked as completed, Timeline should change to "First Aid Completed". Plant Doctor tells user they have completed the necessary First Aid actions and that the checkup is complete. The Doctor tells the user to follow the monitoring steps listed in the Plant Detail Page to bring the plant back to full health.  
  - [x] Web socket closing prematurely after plant rescue plan is generated
  - [X] Start checkup + plant card livestream entry points: showing wrong welcome message at the top, should say "Begin livestream checkup for X" with X as nickname of plant
  - [X] Basic Welcome Message: add step 4 "Start conversation by saying Hello"
  - [x] Add to livestream prompt: gemini must acknowledge user after greeting detected. after that, Gemini can assess plants
  - [X] Plant is mistakenly being marked as healthy even though rescue plan is active. In order to be classified as healthy, plant must not have any first aid or monitoring tasks active. Can only flip back to healthy when all tasks complete.
- [x] **Improve timeline overlay readability during livestream**
  - [X] Optimize opacity and contrast for varying backgrounds
  - [X] Timeline focuses on Phase 1: First Aid.
- [ ] **Check-Up due logic** 
  - [ ] Ensure test data aligns with AI-generated responsibilities. Added major/minorThresholds to test data. "needs attention" in conflict with healthy but checkup due displayed. Currently status-checkup-due is driven by needsCheckIn vs. overdue thresholds. Validate logic elsewhere in app. 

### Phase 8.1: Retest w/ Next.js backend vs mock data. Was fine for plants, didnt work on mock data 
  - [ ] Gemini doesn't always save the rescue plan to the plantdetailpage (created timeline on call, but didn't save)
    - Added comprehensive console logging to track rescue plan creation and state updates
    - Logs API requests/responses, task generation, onUpdateRef calls, and state updates in both useRehabSpecialist and useAppState hooks
    - Console debugging now reveals exact failure points for rescue plan saving issues
  - [ ] Ensure Gemini makes timeline updates in real-time as tasks are completed - had issues with this, I would say the task is done but not see the update made on the timeline overlay and was unable to move ot the next first aid task. 
  - [ ] Gemini mistakes plant identification (jade plant was misidentified, vs others were fine, could be plant specific issue), or adds multiple of the same plant during inventory sweep/add plant (i.e. added jade plant twice) -- could be because this plant is tricky to identify
  - [X] Misidentification: No jade-specific issues found — general accuracy limitation for visually similar species. Could improve prompt by passing existing inventory so Gemini has context. Not relevant, model problem.
  - [ ] Deploy to Vercel - lisa set up + add calvin

### Phase 9: General Improvements + Checks
- [X] The Navigation bar Doctor icon should be changed from a phone to a doctor icon. - used stethoscope
- [ ] Add error boundaries (`error.tsx` files)
- [ ] Add loading states (`loading.tsx` files)
- [ ] Evaluate Plant Manager vs. Plant Doctor responsibilities for any remaining overlap or refactoring opportunities
- [ ] Double check rehabspecialist vs. plantdoctor (difference should be passing plant id)
- [ ] Set up Vitest for testing
- [ ] Add tests for API route handlers
- [ ] update structure documents from /Users/lisagu/Projects/plant_doctor/.planning to reflect new setup, audit folder as well.
- [ ] User should have to tap as few buttons as possible, with the goal of the agent handling task completions, status updates, etc. so the goal is the user should only have to tap the start and end call buttons.


## Phase: If we have time
- [ ] Audio with inventory
  1. Perform an action e.g. Watered plant
  2. Ask for status update and things to do today, and future tasks
  Edge case: Plants in critical condition
    - What do we do between audio and livestream? Can we click on video and pass the audio context over.
  Edge case: Doing something with a specific plant
    - Can we have an agent to navigate us to the plant detail page and perform an action?


## Future Considerations
- [ ] Offline support / PWA
- [ ] Data export/import functionality
- [ ] Permission handling UI for camera/microphone
- [ ] Error UI for user visibility into failures
