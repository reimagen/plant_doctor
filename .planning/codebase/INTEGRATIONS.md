# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**Google Gemini AI:**
- Purpose: AI-powered plant identification, health assessment, and care recommendations
- SDK: `@google/genai` 1.35.0
- Auth: `GEMINI_API_KEY` environment variable

**Two Integration Modes:**

1. **Gemini Live API (Real-time Audio/Video)**
   - Model: `gemini-2.5-flash-native-audio-preview-12-2025`
   - Features: Bidirectional audio, video frame streaming, function calling
   - Implementation: `lib/gemini-live.ts` (`GeminiLiveSession` class)
   - Voice: Kore (prebuilt voice config)
   - Audio formats: PCM 16kHz input, 24kHz output

2. **Gemini Content API (Text Generation)**
   - Model: `gemini-3-flash-preview`
   - Features: JSON schema responses for structured data
   - Implementation: `lib/gemini-content.ts` (`GeminiContentService` class)
   - Used for: Care guide generation, rescue plan generation

**CDN Services:**
- Tailwind CSS: `https://cdn.tailwindcss.com`
- Google Fonts: Inter font family from `fonts.googleapis.com`
- esm.sh: React and @google/genai modules in browser import map

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

**File Storage:**
- None - Images stored as base64 data URLs in localStorage

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None - No user authentication
- API key is build-time environment variable, not user-provided

## Monitoring & Observability

**Error Tracking:**
- None - Console logging only

**Logs:**
- `console.warn` for suppressed errors
- `console.error` for critical failures

## CI/CD & Deployment

**Hosting:**
- Not configured
- Designed for static hosting (Vite build output)

**CI Pipeline:**
- None configured

## Environment Configuration

**Required Environment Variables:**
```
GEMINI_API_KEY=<your-gemini-api-key>
```

**Configuration Files:**
- `.env.local` - Local environment variables (not committed)
- Loaded by Vite via `loadEnv()` in `vite.config.ts`

**Secrets Location:**
- `.env.local` file (gitignored)
- Injected at build time via Vite's `define` config

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

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

---

*Integration audit: 2026-01-17*
