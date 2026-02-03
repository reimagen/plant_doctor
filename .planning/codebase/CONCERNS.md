# Codebase Concerns (Full Audit)

**Audit Date:** 2026-02-03
**Basis:** File-by-file verification against current code + progress notes in `TODOs.md`

## Resolved (Verified)

**Content API key exposure removed**
- Evidence: Gemini Content runs in Firebase Function `functions/src/index.ts`; Next.js route proxies it in `app/api/gemini/content/route.ts`.

**Tailwind CDN removed**
- Evidence: Tailwind configured via `tailwind.config.ts` + `postcss.config.js`; styles in `app/globals.css`.

**Lockfile + env ignore**
- Evidence: `package-lock.json` present; `.gitignore` includes `.env*`.

**View switching removed**
- Evidence: Next.js App Router pages in `app/` and `components/pages/*` (no custom view state).

**Firestore persistence with localStorage migration**
- Evidence: `lib/firestore-service.ts` + `hooks/useAppState.ts`.

**Plant IDs use UUID**
- Evidence: `crypto.randomUUID()` in `hooks/usePlantDoctor.ts` and rescue tasks in `hooks/useRehabSpecialist.ts`.

## Remaining Checklist (Verified With Evidence)

**Review Links**
- Strategy decisions: `strategy-concerns.md`
- Execution tasks: `executions-concerns.md`

**Security & Ops**
- [ ] Client Gemini Live key exposure still possible (direct WebSocket allowed). Evidence: `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts` accept `NEXT_PUBLIC_GEMINI_API_KEY` when `NEXT_PUBLIC_CLOUD_RUN_URL` is absent.
- [ ] WebSocket proxy has no auth/rate limiting. Evidence: `websocket-proxy/index.js` has no auth middleware or rate controls.
- [ ] Domain restriction + monitoring for `NEXT_PUBLIC_GEMINI_API_KEY` is a manual config step (not enforced in code). Evidence: no runtime checks or key rotation in codebase.
- [ ] Dual key rotation process undocumented in repo (Content vs Live). Evidence: no docs or scripts found.

**Engineering Debt**
- [x] `any` types in Gemini/tooling paths removed. Evidence: `lib/gemini-live.ts`, `hooks/useRehabSpecialist.ts`, `functions/src/index.ts`, `lib/firestore-service.ts`.
- [x] Shared live session media pipeline extracted. Evidence: `lib/live-media.ts`, `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`.
- [x] Explicit live-session state machine added. Evidence: `lib/gemini-live.ts`.
- [x] AudioContext lifecycle centralized with shared capture context. Evidence: `lib/audio-capture.ts`, `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`.
- [x] Date handling centralized across components. Evidence: `lib/date-utils.ts`, `components/plant-details/LastWateredSection.tsx`.

**Performance & Scaling**
- [ ] Canvas capture and base64 encoding every 1s (main thread). Evidence: `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`.
- [x] Plant cards now memoized (list still not virtualized). Evidence: `components/PlantCard.tsx`.
- [ ] Firestore docs can grow due to base64 `photoUrl`. Evidence: `hooks/usePlantDoctor.ts` sets data URLs; `lib/firestore-service.ts` stores `photoUrl`.
- [x] MediaThrottler wired into livestream frame capture. Evidence: `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`.

**Product & UX**
- [x] Expanded user-facing error UI (global toast + stream + care guide). Evidence: `components/GlobalErrorToast.tsx`, `app/layout.tsx`, `contexts/AppContext.tsx`, `components/pages/DoctorPage.tsx`, `components/pages/PlantDetailPage.tsx`, `components/Manager.tsx`.
- [x] Permission-denied errors surfaced to users. Evidence: stream error banners via `contexts/AppContext.tsx`.
- [ ] No data export/import UI. Evidence: no components or routes for export/import.
- [ ] Offline behavior not surfaced. Evidence: Firestore persistence enabled, but no UX for offline status.
- [x] Native confirm dialogs replaced with modal. Evidence: `components/ConfirmDialog.tsx`, `components/Navigation.tsx`, `components/Manager.tsx`.

**Documentation Drift**
- [X] None found after clarifying audio-only removal; audio is still used for video livestreams.

---

*Audit completed: 2026-02-03*
