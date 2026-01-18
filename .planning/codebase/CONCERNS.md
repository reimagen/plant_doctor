# Codebase Concerns

**Analysis Date:** 2026-01-18

## Resolved (by Next.js Migration & Guardrails Implementation)

### Next.js Migration (Phase 9 Complete)

~~**API Key Exposure for Content API:**~~
- Previously: Gemini API key embedded in client-side JavaScript
- Now: Content API calls made via server-side API routes with `GEMINI_API_KEY`
- Key `GEMINI_API_KEY` never exposed to browser

~~**CDN Dependency for Tailwind:**~~
- Previously: Tailwind CSS loaded via CDN script tag
- Now: Tailwind CSS installed via npm with PostCSS
- Proper tree-shaking and production builds

~~**No Lockfile Present:**~~
- Previously: Dependencies not locked, builds not reproducible
- Now: `package-lock.json` committed with reproducible builds

~~**Missing .env from .gitignore:**~~
- Previously: Risk of accidentally committing API keys
- Now: `.env*` patterns properly gitignored in Next.js project

~~**State-based View Switching:**~~
- Previously: Complex view state management with action types
- Now: Next.js App Router handles navigation via URLs
- View switching via `next/link` and router navigation

### Guardrails Implementation (2026-01-18 Complete)

~~**No Request Rate Limiting:**~~
- Previously: No protection against abuse of AI API calls
- Now: `ToolCallRateLimiter` (10/min rehab, 15/min discovery) and `TokenBucketLimiter` (10 tokens, 2 refill/sec)
- Rate-limited requests return HTTP 429 or logged rejection

~~**Silent Error Swallowing in API Calls:**~~
- Previously: Media send and API errors logged minimally
- Now: Structured logging with 7 prefixes (`[RATE_LIMIT]`, `[TOOL_CALL]`, `[API_REQUEST]`, `[SUCCESS]`, `[GENERATION_ERROR]`, `[PARSE_ERROR]`, `[INVALID_REQUEST]`)

~~**No Request Validation:**~~
- Previously: API endpoints accepted any input without validation
- Now: `/api/gemini/content` validates request type, plant species, homeProfile presence
- Invalid requests return HTTP 400 with descriptive errors

## Tech Debt

**Weak Type Safety with `any`:**
- Issue: Multiple uses of `any` type bypass TypeScript's safety guarantees
- Files:
  - `lib/gemini-live.ts`: `session: any`, `error: any`, `response: any`
  - `hooks/usePlantDoctor.ts`: `const args = fc.args as any`
  - `hooks/useRehabSpecialist.ts`: `const args = fc.args as any`
  - `lib/audio-service.ts`: `(window as any).webkitAudioContext`
- Impact: Runtime type errors possible from AI function call responses; no compile-time validation
- Fix approach: Define proper interfaces for Gemini API responses and function call arguments; use type guards

**Duplicated Audio/Video Session Logic:**
- Issue: `usePlantDoctor.ts` and `useRehabSpecialist.ts` share ~80% identical code for media session management
- Impact: Bug fixes must be applied in two places; inconsistent behavior risk
- Fix approach: Extract shared session management into a common hook (e.g., `useGeminiMediaSession`)

**Non-deterministic Plant IDs:**
- Issue: Plant IDs generated with `Math.random().toString(36).substr(2, 9)` - not cryptographically random
- Impact: Duplicate ID collision risk in large inventories
- Fix approach: Use `crypto.randomUUID()` for proper UUID generation

## Known Bugs

**useEffect Missing Dependencies:**
- Symptoms: React warns about missing dependencies; potential stale closure bugs
- Files: `pages/DoctorPage.tsx`: `useEffect` references `rehab` but only lists `rehabTargetId` as dependency
- Trigger: Auto-starting rehab call may use stale `rehab` functions
- Workaround: Currently works due to ref patterns but violates React rules

**~~Silent Error Swallowing in sendMedia:~~** ✅ IMPROVED
- Previously: Media frames silently dropped with no logging or retry
- Now: Added structured logging to track media send operations
- Files Updated:
  - `hooks/useRehabSpecialist.ts`: Added `[TOOL_CALL]` and `[RATE_LIMIT]` logging
  - `hooks/usePlantDoctor.ts`: Added `[TOOL_CALL]` and `[RATE_LIMIT]` logging
  - `app/api/gemini/content/route.ts`: Added comprehensive `[API_REQUEST]`, `[SUCCESS]`, `[GENERATION_ERROR]`, `[PARSE_ERROR]` logging
- Remaining: `lib/gemini-live.ts` still has empty catch blocks in sendMedia; recommend adding low-level frame logging

## Security Considerations

### Guardrails Implemented (2026-01-18) ✅

**Rate Limiting & Request Control:**
- New utility file: `lib/rate-limiter.ts` with:
  - `ToolCallRateLimiter`: Enforces 10 calls/min for rehab (verify_rehab_success, mark_rescue_task_complete), 15 calls/min for discovery (propose_plant_to_inventory)
  - `TokenBucketLimiter`: API endpoint rate limiting (10 tokens, 2 refill/sec)
  - `PlantContextValidator`: Keyword-based validation to detect plant-related content
- Integration:
  - Both `useRehabSpecialist.ts` and `usePlantDoctor.ts` now enforce rate limits on tool calls
  - API route `/api/gemini/content` now enforces rate limit with HTTP 429 response
  - Requests exceeding limits are logged and rejected gracefully

**System Prompt Guardrails:**
- Added "PLANT-ONLY FOCUS" mode to both rehab and discovery modes
- Explicit CRITICAL RULES in system prompts:
  - "ONLY discuss plant health, recovery, and care"
  - Immediate refusal of non-plant topics with polite redirect
  - No engagement with off-topic requests
- Enhances AI focus and prevents jailbreak attempts via conversation

**Structured Logging:**
- Added prefixed log messages for easy parsing and monitoring:
  - `[RATE_LIMIT]` - When requests exceed limits
  - `[TOOL_CALL]` - Successful tool invocations (with context)
  - `[API_REQUEST]` - Incoming API requests
  - `[SUCCESS]` - Successful operations
  - `[GENERATION_ERROR]` - Gemini API failures
  - `[PARSE_ERROR]` - Response parsing failures
  - `[INVALID_REQUEST]` - Validation failures
- Logs include relevant context (plant names, species, request types) for debugging

**Request Validation:**
- API endpoint now validates:
  - Request type must be "care-guide" or "rescue-plan"
  - Plant data must include species
  - homeProfile must be present
- Invalid requests return HTTP 400 with descriptive error messages

**Status:** Guardrails operational on livestream endpoints and API routes

### Remaining Mitigations

**Gemini Live API Key in Client Bundle:**
- Risk: `NEXT_PUBLIC_GEMINI_API_KEY` is exposed in client-side JavaScript
- Necessity: WebSocket-based Live API cannot be proxied through API routes
- Mitigation:
  - Configure domain restriction in Google Cloud Console
  - Restrict to production Vercel domain only
  - Use separate keys for Content API (server) and Live API (client)
  - Monitor API usage for anomalies
  - Rate limiting now helps prevent abuse even if key is compromised
- Status: Partially mitigated (domain restriction required + new rate limiting)

**Dual API Key Management:**
- Risk: Two separate API keys to manage and rotate
- Impact: Increased operational complexity
- Mitigation: Document key rotation process; use Vercel environment variables

**Native Confirm Dialog for Destructive Actions:**
- Risk: `confirm()` is blockable by browsers and provides no styling/branding
- Files: `components/PlantEditModal.tsx`
- Recommendations: Implement custom modal confirmation component

## Next.js-Specific Concerns

**Hydration Mismatches:**
- Risk: localStorage reads in Server Components will cause hydration errors
- Impact: Must use Client Components for all localStorage access
- Mitigation: Keep `StorageService` usage in Client Components only; never access localStorage in Server Components

**Server/Client Boundary Management:**
- Risk: Unnecessary JavaScript shipped to client if `'use client'` placed too high in component tree
- Impact: Larger bundle sizes, slower initial load
- Mitigation: Keep client boundary as low as possible; only wrap truly interactive components

**Client-Side Navigation State:**
- Risk: App state (`useAppState`) must be accessible across all pages
- Consideration: May need to lift state to root layout or use React Context
- Alternative: Keep state in a Client Component wrapper that persists across navigation

## Performance Bottlenecks

**Frequent Canvas Operations:**
- Problem: Canvas captures and blob conversions every 1 second during active sessions
- Files: `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`
- Cause: Synchronous canvas operations + FileReader for base64 conversion on main thread
- Improvement path: Use OffscreenCanvas in worker; reduce frame rate; use createImageBitmap for async decode

**Repeated Storage Reads:**
- Problem: `StorageService.getHomeProfile()` called on each component mount
- Cause: Service reads localStorage synchronously; not cached
- Improvement path: Pass homeProfile as prop; or use React context

**Unnecessary Re-renders on Plant Updates:**
- Problem: Every plant update triggers full list re-render; no memoization
- Cause: Callback always creates new array reference
- Improvement path: Add React.memo to PlantCard; use immer for immutable updates; implement virtualization for large lists

## Fragile Areas

**Gemini Live Session State:**
- Files: `lib/gemini-live.ts`, `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`
- Why fragile: Complex state machine across WebSocket and React state; `isClosing` flag is the only guard against race conditions
- Safe modification: Add explicit state machine (idle/connecting/active/closing); add comprehensive logging
- Test coverage: None

**Audio Context Lifecycle:**
- Files: `lib/audio-service.ts`, hooks
- Why fragile: Multiple AudioContext instances created/destroyed; browser limits on concurrent contexts (6-12 depending on browser)
- Safe modification: Implement singleton AudioContext; add context pool with reuse
- Test coverage: None

**Date Handling:**
- Files: `components/PlantEditModal.tsx`, `components/PlantCard.tsx`
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
- Limit: CPU spikes possible; no concurrent sessions
- Scaling path: Ensure AudioWorklet usage; implement session queuing

## Dependencies at Risk

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
- Risk: Any change could break existing functionality without detection
- Priority: High - no safety net for refactoring

**Critical Untested Logic:**
- Plant status state machine (`useAppState.ts`)
- Date calculations for watering schedules (`PlantCard.tsx`)
- AI function call argument parsing (`usePlantDoctor.ts`, `useRehabSpecialist.ts`)
- Storage serialization/deserialization (`storage-service.ts`)
- API route handlers (`app/api/gemini/content/route.ts`)

---

*Concerns audit: 2026-01-18*
*Updated with guardrails resolution: 2026-01-18*
