# Phase 8.1: Firebase Migration Plan

## Summary

Replace Vercel with Firebase ecosystem: **Cloud Run** (WebSocket proxy to hide Gemini API key), **Firestore** (replace localStorage), **Firebase Hosting** (static site), **Anonymous Auth** (secure data access).

## Architecture

```
Browser ──WSS──> Cloud Run (WebSocket Proxy) ──WSS──> Gemini Live API
                 (GEMINI_API_KEY hidden)                (audio + video)

Browser ──HTTPS──> Cloud Functions ──> Gemini Content API
                   (care guides, rescue plans)

Browser ──SDK──> Firestore (plants, profile)
                 (offline persistence enabled)

Firebase Hosting ──CDN──> Static Next.js build
```

## Why Firebase over Vercel

- **Cloud Run**: Native WebSocket support (Vercel has none) — solves the security problem
- **Firestore**: Built-in database with offline persistence (replaces localStorage, enables multi-device)
- **Anonymous Auth**: Free, zero-friction user identity for Firestore rules + WebSocket validation
- **Cost**: ~$18/mo for WebSocket proxy (scale-to-zero), Firestore/Auth/Hosting free tier

## Implementation Phases

### Phase A: Firebase Setup + Firestore (replace localStorage)

**Create:**
- `lib/firebase-config.ts` — Firebase SDK init + offline persistence
- `lib/firestore-service.ts` — CRUD for plants/profile (replaces StorageService)
- `lib/firebase-auth.ts` — `ensureUser()` with anonymous auth
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`

**Modify:**
- `hooks/useAppState.ts` — Replace `StorageService` calls with `FirestoreService`, add userId from auth, add localStorage→Firestore migration on first load
- `package.json` — Add `firebase` dependency

### Phase B: Cloud Run WebSocket Proxy (security fix)

**Create:**
- `websocket-proxy/` directory:
  - `index.js` — Express + `ws` server with two endpoints (`/plant-doctor`, `/rehab-specialist`)
  - `package.json` — express, ws, @google/genai
  - `Dockerfile`

The proxy:
1. Accepts WSS from client (no API key needed)
2. Optionally validates Firebase Auth ID token
3. Creates Gemini Live session server-side with `GEMINI_API_KEY`
4. Forwards audio/video/tool-calls bidirectionally
5. Handles disconnect cleanup

**Modify:**
- `lib/gemini-live.ts` — Add proxy mode: connect to Cloud Run URL instead of Gemini directly
- `hooks/usePlantDoctor.ts` — Pass Cloud Run URL instead of `NEXT_PUBLIC_GEMINI_API_KEY`
- `hooks/useRehabSpecialist.ts` — Same
- `.env.example` — Remove `NEXT_PUBLIC_GEMINI_API_KEY`, add `NEXT_PUBLIC_CLOUD_RUN_URL` + Firebase config vars

### Phase C: Cloud Functions + Static Export + Hosting

**Create:**
- `functions/src/gemini-content.ts` — Migrate `/api/gemini/content` logic

**Modify:**
- `next.config.ts` — Add `output: 'export'`, `images: { unoptimized: true }`
- `firebase.json` — Hosting rewrites for `/api/*` → Cloud Functions, `/ws/*` → Cloud Run

**Delete:**
- `app/api/gemini/content/route.ts` (replaced by Cloud Function)
- `lib/storage-service.ts` (replaced by Firestore)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WebSocket proxy | Cloud Run (not Cloud Functions) | Cloud Functions don't support WebSocket upgrade |
| Database | Firestore | Offline persistence like localStorage, real-time sync, free tier |
| Auth | Anonymous Auth | Zero friction, enables Firestore security rules, free |
| Hosting | Firebase Hosting (static export) | CDN-backed, integrates with Cloud Run/Functions rewrites |
| Proxy protocol | Forward raw Gemini SDK messages as JSON over WS | Keeps client-side hooks mostly intact |

## Verification

1. `npm run build` succeeds with `output: 'export'`
2. Local Firestore emulator: plants save/load correctly
3. Cloud Run proxy: `wscat -c wss://[url]/plant-doctor` connects
4. End-to-end: voice/video plant detection works through proxy
5. Firestore security rules: unauthenticated requests rejected
6. `NEXT_PUBLIC_GEMINI_API_KEY` fully removed from codebase
