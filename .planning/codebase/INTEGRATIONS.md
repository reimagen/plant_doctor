# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Google Gemini AI:**
- Purpose: AI-powered plant identification, health assessment, and care recommendations
- SDK: `@google/genai`
- Auth: API keys (see Environment Configuration below)

**Two Integration Modes:**

1. **Gemini Content API (Server-Side)**
   - Model: `gemini-3-flash-preview`
   - Features: JSON schema responses for structured data
   - Implementation: API route at `app/api/gemini/content/route.ts`
   - Used for: Care guide generation, rescue plan generation
   - API Key: `GEMINI_API_KEY` (server-only, never exposed to client)

2. **Gemini Live API (Client-Side)**
   - Model: `gemini-2.5-flash-native-audio-preview-12-2025`
   - Features: Bidirectional audio, video frame streaming, function calling
   - Implementation: `lib/gemini-live.ts` (`GeminiLiveSession` class)
   - Voice: Kore (prebuilt voice config)
   - Audio formats: PCM 16kHz input, 24kHz output
   - API Key: `NEXT_PUBLIC_GEMINI_API_KEY` (client-side, domain-restricted)
   - Note: Cannot be proxied through API routes (WebSocket connection)

**Google Fonts:**
- Inter font family from `fonts.googleapis.com`
- Loaded in root layout

**Fallback Images:**
- Unsplash: Default plant photo URL when camera capture fails
  - URL pattern: `https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=400&auto=format&fit=crop`

## Data Storage

**Databases:**
- None - Client-side only application

**Browser Storage:**
- localStorage for persistence
- Keys: `plants`, `homeProfile`
- Implementation: `lib/storage-service.ts` (`StorageService` object)
- Data format: JSON-serialized TypeScript objects
- Access: Client Components only (browser API)

**File Storage:**
- None - Images stored as base64 data URLs in localStorage

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None - No user authentication
- API keys are environment-managed, not user-provided

## Monitoring & Observability

**Error Tracking:**
- None - Console logging only

**Logs:**
- `console.warn` for suppressed errors
- `console.error` for critical failures

## CI/CD & Deployment

**Hosting:**
- Vercel (zero-config deployment)
- Automatic HTTPS
- Environment variables via Vercel dashboard

**CI Pipeline:**
- None configured (recommended: GitHub Actions)

## Environment Configuration

**Required Environment Variables:**

```
# Server-only (for Content API) - DO NOT prefix with NEXT_PUBLIC_
GEMINI_API_KEY=<your-server-gemini-api-key>

# Client-side (for Live API) - MUST prefix with NEXT_PUBLIC_
NEXT_PUBLIC_GEMINI_API_KEY=<your-client-gemini-api-key>
```

**Configuration Files:**
- `.env.local` - Local environment variables (not committed)
- Auto-loaded by Next.js at runtime

**API Key Security Strategy:**

| API | Key Variable | Location | Security |
|-----|--------------|----------|----------|
| Content API | `GEMINI_API_KEY` | Server only | Never exposed to browser |
| Live API | `NEXT_PUBLIC_GEMINI_API_KEY` | Client-side | Domain-restricted in Google Cloud Console |

**Setting Up Domain Restriction:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit the API key used for `NEXT_PUBLIC_GEMINI_API_KEY`
3. Under "Application restrictions", select "HTTP referrers"
4. Add your Vercel production domain (e.g., `https://your-app.vercel.app/*`)
5. Optionally add localhost for development (remove for production)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## API Route Details

**POST /api/gemini/content**

Request body:
```typescript
{
  type: 'care-guide' | 'rescue-plan',
  plant: Plant,
  homeProfile: HomeProfile
}
```

Response:
```typescript
{
  tips?: string[],           // For care-guide
  plan?: RescuePlan,         // For rescue-plan
  error?: string             // On failure
}
```

## Gemini API Function Declarations

**`propose_plant_to_inventory`** (used in `usePlantDoctor.ts`):
```typescript
{
  commonName: string,
  scientificName: string,
  healthStatus: 'healthy' | 'warning' | 'critical',
  habitGrade: string,      // A-F grade
  habitFeedback: string,
  cadenceDays?: number,
  idealConditions?: string
}
```

**`verify_rehab_success`** (used in `useRehabSpecialist.ts`):
```typescript
{
  success: boolean,
  newStatus: 'healthy' | 'warning',
  recoveryNote?: string,
  updatedCadence?: number
}
```

## Browser Permissions Required

Declared in `metadata.json`:
- `camera` - For plant photo capture and video streaming
- `microphone` - For voice interaction with Gemini Live

## Media Processing

**Audio Input:**
- Sample rate: 16kHz
- Format: PCM (Int16Array to base64)
- Encoding: `GeminiLiveSession.encodeAudio()`

**Audio Output:**
- Sample rate: 24kHz
- Playback: `AudioService.playRawChunk()`
- Decoding: `GeminiLiveSession.decodeAudio()`

**Video Input:**
- Capture: Canvas 2D context from video element
- Resolution: 320px width (scaled height)
- Format: JPEG, quality 0.4-0.5
- Frequency: 1 frame per second

## Vercel Deployment

**Zero-Config Setup:**
1. Connect Git repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

**Environment Variables in Vercel:**
- Add `GEMINI_API_KEY` (not exposed to browser)
- Add `NEXT_PUBLIC_GEMINI_API_KEY` (exposed to browser, domain-restricted)

**Edge Functions:**
- Available for API routes if needed for performance
- Not currently used

---

*Integration audit: 2026-01-18*
