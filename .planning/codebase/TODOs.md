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

## Post-Migration Improvements
- [ ] Health notes: stop unbounded append during calls (dedupe/replace strategy)
- [ ] Health notes: add manual removal UI from plant details
- [ ] Rehab checkups: confirm existing health notes are provided to the rehab specialist context
- [ ] Add error boundaries (`error.tsx` files)
- [ ] Add loading states (`loading.tsx` files)
- [ ] Set up Vitest for testing
- [ ] Add tests for API route handlers

## Future Considerations
- [ ] Offline support / PWA
- [ ] Data export/import functionality
- [ ] Permission handling UI for camera/microphone
- [ ] Error UI for user visibility into failures
