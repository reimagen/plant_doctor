# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Google Gemini AI:**
- SDK: `@google/genai`
- Uses both Live (audio/video) and Content (text) endpoints

**Gemini Content (Server-Side):**
- Hosted as Firebase Cloud Function `geminiContent`
- Location: `functions/src/index.ts`
- Trigger: HTTPS POST from Next.js API route
- Models: `gemini-2.0-flash` (content), JSON schema responses
- Rate limiting: token bucket inside Cloud Function

**Gemini Live (Client-Side):**
- Location: `lib/gemini-live.ts`, `hooks/usePlantDoctor.ts`, `hooks/useRehabSpecialist.ts`
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Modes:
  - Direct from browser using `NEXT_PUBLIC_GEMINI_API_KEY`
  - Via WebSocket proxy (`NEXT_PUBLIC_CLOUD_RUN_URL`)
- Tool call limits: `ToolCallRateLimiter` in live hooks

**WebSocket Proxy (Optional):**
- Location: `websocket-proxy/index.js`
- Tech: Express + `ws`
- Endpoints: `/plant-doctor`, `/rehab-specialist`
- Requires `GEMINI_API_KEY` server env var

## Firebase

**Auth:**
- Anonymous auth in browser
- Location: `lib/firebase-auth.ts`

**Firestore:**
- Client SDK with multi-tab persistence
- Location: `lib/firestore-service.ts`, `lib/firebase-config.ts`
- Stores: Plants and home profile
- LocalStorage migration on first run

**Cloud Functions:**
- `geminiContent` HTTPS function for content generation
- Deploy with `firebase deploy --only functions`

## Environment Configuration

**Next.js App (.env.local):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...   # Used by /api/gemini/content
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_GEMINI_API_KEY=...        # Optional if using proxy
NEXT_PUBLIC_CLOUD_RUN_URL=...         # Optional; WebSocket proxy base URL
```

**Firebase Functions (params):**
```
GEMINI_API_KEY=...
```

**WebSocket Proxy:**
```
GEMINI_API_KEY=...
PORT=8080
```

## API Routes

**POST `/api/gemini/content`:**
- Location: `app/api/gemini/content/route.ts`
- Forwards requests to Firebase Cloud Function:
  - URL: `https://us-central1-${NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/geminiContent`

## Logging & Observability

**Common Log Prefixes:**
- `[API_REQUEST]`, `[SUCCESS]`, `[API_ERROR]`
- `[RATE_LIMIT]`, `[RESCUE_PLAN]`, `[RESCUE]`

## Data Storage

**Primary Storage:**
- Firestore (plants + home profile)

**Client Migration:**
- LocalStorage to Firestore on first sign-in

**Media:**
- Captured plant photos stored as base64 data URLs in plant records

---

*Integration audit: 2026-02-03*
