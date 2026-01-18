# Codebase Concerns

**Analysis Date:** 2026-01-17

## Tech Debt

**Deprecated Web Audio API Usage:**
- Issue: Uses deprecated `ScriptProcessorNode` for audio processing instead of `AudioWorklet`
- Files: `hooks/usePlantDoctor.ts` (lines 97-106), `hooks/useRehabSpecialist.ts` (lines 95-106)
- Impact: ScriptProcessorNode runs on main thread, causing potential audio glitches and UI jank. Will be removed from browsers eventually.
- Fix approach: Migrate to AudioWorkletNode with a separate AudioWorklet processor file

**Weak Type Safety with `any`:**
- Issue: Multiple uses of `any` type bypass TypeScript's safety guarantees
- Files:
  - `lib/gemini-live.ts` (lines 13, 18, 94): `session: any`, `error: any`, `response: any`
  - `hooks/usePlantDoctor.ts` (line 134): `const args = fc.args as any`
  - `hooks/useRehabSpecialist.ts` (line 138): `const args = fc.args as any`
  - `lib/audio-service.ts` (line 14): `(window as any).webkitAudioContext`
- Impact: Runtime type errors possible from AI function call responses; no compile-time validation
- Fix approach: Define proper interfaces for Gemini API responses and function call arguments; use type guards

**Duplicated Audio/Video Session Logic:**
- Issue: `usePlantDoctor.ts` and `useRehabSpecialist.ts` share ~80% identical code for WebRTC/Gemini session management
- Files: `hooks/usePlantDoctor.ts` (184 lines), `hooks/useRehabSpecialist.ts` (165 lines)
- Impact: Bug fixes must be applied in two places; inconsistent behavior risk
- Fix approach: Extract shared session management into a common hook or class (e.g., `useGeminiMediaSession`)

**Non-deterministic Plant IDs:**
- Issue: Plant IDs generated with `Math.random().toString(36).substr(2, 9)` - not cryptographically random, potential collisions
- Files: `hooks/usePlantDoctor.ts` (line 156)
- Impact: Duplicate ID collision risk in large inventories; not suitable for sync/export
- Fix approach: Use `crypto.randomUUID()` for proper UUID generation

## Known Bugs

**useEffect Missing Dependencies:**
- Symptoms: React warns about missing dependencies; potential stale closure bugs
- Files: `pages/DoctorPage.tsx` (line 36): `useEffect` references `rehab` but only lists `rehabTargetId` as dependency
- Trigger: Auto-starting rehab call may use stale `rehab` functions
- Workaround: Currently works due to ref patterns but violates React rules

**Silent Error Swallowing in sendMedia:**
- Symptoms: Media frames silently dropped with no logging or retry
- Files: `lib/gemini-live.ts` (lines 88-90): Empty catch block
- Trigger: Network instability or rapid session transitions
- Workaround: None - data loss is silent

## Security Considerations

**API Key in Client Bundle:**
- Risk: Gemini API key is embedded in client-side JavaScript via Vite's `define` config
- Files: `vite.config.ts` (lines 14-15), usage in `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`, `components/PlantEditModal.tsx`, `components/RescueProtocolView.tsx`
- Current mitigation: None - key is fully exposed in production build
- Recommendations:
  - Implement a backend proxy for API calls
  - Use Gemini's client-side key restrictions (domain locking, rate limiting)
  - Consider Google's recommended client-side token flow

**Missing .env from .gitignore:**
- Risk: `.env` files containing API keys could be accidentally committed
- Files: `.gitignore` - no `.env` pattern present
- Current mitigation: No `.env` file exists yet
- Recommendations: Add `.env*` and `!.env.example` patterns to `.gitignore` before creating env files

**Native Confirm Dialog for Destructive Actions:**
- Risk: `confirm()` is blockable by browsers and provides no styling/branding
- Files: `components/PlantEditModal.tsx` (line 72)
- Current mitigation: None
- Recommendations: Implement custom modal confirmation component

## Performance Bottlenecks

**Frequent Canvas Operations:**
- Problem: Canvas captures and blob conversions every 1 second during active sessions
- Files: `hooks/usePlantDoctor.ts` (lines 108-125), `hooks/useRehabSpecialist.ts` (lines 109-127)
- Cause: Synchronous canvas operations + FileReader for base64 conversion on main thread
- Improvement path: Use OffscreenCanvas in worker; reduce frame rate; use createImageBitmap for async decode

**Repeated Storage Reads:**
- Problem: `StorageService.getHomeProfile()` called on each component mount in `PlantEditModal`
- Files: `components/PlantEditModal.tsx` (line 53)
- Cause: Service reads localStorage synchronously; not cached
- Improvement path: Pass homeProfile as prop (already available in parent); or use React context

**Unnecessary Re-renders on Plant Updates:**
- Problem: Every plant update triggers full list re-render; no memoization
- Files: `hooks/useAppState.ts` (line 54): `updatePlant` creates new array every call
- Cause: Callback always creates new array reference
- Improvement path: Add React.memo to PlantCard; use immer for immutable updates; implement virtualization for large lists

## Fragile Areas

**Gemini Live Session State:**
- Files: `lib/gemini-live.ts`, `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`
- Why fragile: Complex state machine across WebSocket, WebRTC, and React state; `isClosing` flag is the only guard against race conditions
- Safe modification: Add explicit state machine (idle/connecting/active/closing); add comprehensive logging
- Test coverage: None - no test files exist

**Audio Context Lifecycle:**
- Files: `lib/audio-service.ts`, `hooks/usePlantDoctor.ts` (lines 58-60), `hooks/useRehabSpecialist.ts` (lines 59-62)
- Why fragile: Multiple AudioContext instances created/destroyed; browser limits on concurrent contexts (6-12 depending on browser)
- Safe modification: Implement singleton AudioContext; add context pool with reuse
- Test coverage: None

**Date Handling:**
- Files: `components/PlantEditModal.tsx` (lines 36-45), `components/PlantCard.tsx` (lines 16-30)
- Why fragile: Date math with manual setHours() to avoid timezone issues; ISO string parsing scattered across components
- Safe modification: Centralize date utilities; consider date-fns or dayjs for consistency
- Test coverage: None

## Scaling Limits

**LocalStorage Plant Data:**
- Current capacity: ~5MB per origin (browser limit)
- Limit: ~500-1000 plants with photos stored as data URLs
- Scaling path: Move to IndexedDB; implement photo compression; or add backend sync

**Single-threaded Audio Processing:**
- Current capacity: Works for single active session
- Limit: CPU spikes with ScriptProcessorNode; no concurrent sessions possible
- Scaling path: Migrate to AudioWorklet; implement session queuing

## Dependencies at Risk

**No Lockfile Present:**
- Risk: Dependencies not locked - builds are not reproducible; potential for silent breaking changes
- Impact: `npm install` can pull different versions across environments
- Migration plan: Run `npm install` to generate package-lock.json and commit it

**Google GenAI SDK:**
- Risk: Using preview/beta Gemini model (`gemini-2.5-flash-native-audio-preview-12-2025`)
- Impact: Model may be deprecated or have breaking changes without notice
- Migration plan: Monitor Google announcements; abstract model selection; implement fallback

## Missing Critical Features

**No Error UI:**
- Problem: All errors go to console.log/console.error only
- Blocks: Users have no visibility into failures (API errors, permission denials, network issues)

**No Offline Support:**
- Problem: App requires network for all AI features; localStorage data only
- Blocks: Any use without internet; PWA potential

**No Data Export/Import:**
- Problem: Plant data locked in browser localStorage
- Blocks: Device migration; backup/restore; multi-device sync

**No Permission Handling UI:**
- Problem: Camera/microphone permission denial throws error, caught only in console
- Blocks: User recovery after permission denial; guided permission request flow

## Test Coverage Gaps

**No Tests Exist:**
- What's not tested: Entire codebase - no test files found
- Files: All `*.ts` and `*.tsx` files in `hooks/`, `lib/`, `components/`, `pages/`
- Risk: Any change could break existing functionality without detection
- Priority: High - no safety net for refactoring

**Critical Untested Logic:**
- Plant status state machine (`useAppState.ts`)
- Date calculations for watering schedules (`PlantCard.tsx`)
- AI function call argument parsing (`usePlantDoctor.ts`, `useRehabSpecialist.ts`)
- Storage serialization/deserialization (`storage-service.ts`)

---

*Concerns audit: 2026-01-17*
