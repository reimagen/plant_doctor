# Strategy-Lift Decisions

**Generated:** 2026-02-03

## Scope
- Items requiring team decisions on architecture, policy, or product direction.
- Source: `CONCERNS.md` (strategy-only).

## Decisions Needed
**1) Gemini Live API key exposure** - RESOLVED, must comment out NEXT_PUBLIC_GEMINI_API_KEY
- **Problem:** Browser clients can connect directly to Gemini Live using `NEXT_PUBLIC_GEMINI_API_KEY`.
- **Risk:** Key is exposed in JS bundle and network traffic.
- **Options:**
  - A) Require WebSocket proxy for Live sessions (server holds key).
  - B) Backend session broker (server creates session, returns short‑lived token).
  - C) Accept public key exposure with strict domain restriction + monitoring.
- **Decision Inputs:**
  - Security tolerance for exposed client key.
  - Cost/latency of proxy vs direct.
  - Ops readiness to run/scale proxy.
- **Impact Areas:** `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`, `websocket-proxy/`.

**2) WebSocket proxy authentication & rate limiting**
- **Problem:** Proxy currently accepts any client without auth or rate limits.
- **Options:**
  - A) Require Firebase Auth token on connect; validate in proxy.
  - B) Use signed short‑lived session tokens from backend.
  - C) IP-based rate limiting (least secure).
- **Decision Inputs:**
  - Auth system availability.
  - Compliance/security requirements.
  - Expected traffic patterns.
- **Impact Areas:** `websocket-proxy/index.js`, possibly new auth middleware.

**3) API key rotation policy**
- **Problem:** Dual keys (Content vs Live) with no rotation policy.
- **Options:**
  - A) Document manual rotation cadence (quarterly).
  - B) Add automated rotation scripts + CI.
- **Decision Inputs:**
  - Security policy requirements.
  - Operational overhead tolerance.
- **Impact Areas:** Ops docs, deployment pipeline.

**4) Photo storage strategy**
- **Problem:** Plant photos stored as base64 in Firestore documents.
- **Risks:** Document size growth, read costs, performance.
- **Options:**
  - A) Keep base64 for MVP (low complexity).
  - B) Store images in Firebase Storage / S3 and keep URLs in Firestore.
  - C) Compress images before storing.
- **Decision Inputs:**
  - Expected number of photos per user.
  - Storage cost tolerance.
  - Need for offline access.
- **Impact Areas:** `hooks/usePlantDoctor.ts`, `lib/firestore-service.ts`, storage rules.

**5) Offline UX expectations**
- **Problem:** Firestore persistence is enabled but no explicit offline UI.
- **Options:**
  - A) Add offline banner + limited features messaging.
  - B) Keep silent fallback for MVP.
- **Decision Inputs:**
  - Product expectations for offline use.
  - Support load tolerance for unclear offline state.
- **Impact Areas:** UI components, connectivity detection.

**6) Data export/import**
- **Problem:** No user data export/import path.
- **Options:**
  - A) Add JSON export/import in settings.
  - B) Provide backup via Firestore + account linking.
- **Decision Inputs:**
  - Product roadmap for portability.
  - Legal/compliance needs.
- **Impact Areas:** `components/pages/SettingsPage.tsx`, storage services.

---

*Strategy decisions captured: 2026-02-03*
