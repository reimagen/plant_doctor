# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code (`.ts`, `.tsx` files)

**Secondary:**
- HTML - Single entry point (`index.html`)
- CSS - Tailwind utility classes (CDN-loaded)

## Runtime

**Environment:**
- Node.js (no version pinned, README states "Prerequisites: Node.js")
- Browser (Web APIs: AudioContext, MediaDevices, localStorage)

**Package Manager:**
- npm (implied by `package.json` scripts)
- Lockfile: Not present in repository

## Frameworks

**Core:**
- React 19.2.3 - UI framework with functional components and hooks
- React DOM 19.2.3 - DOM rendering via `createRoot`

**Build/Dev:**
- Vite 6.2.0 - Dev server and build tool
- @vitejs/plugin-react 5.0.0 - React Fast Refresh and JSX transform

**Styling:**
- Tailwind CSS (CDN) - Utility-first CSS loaded via `<script src="https://cdn.tailwindcss.com">`

**Testing:**
- None configured

## Key Dependencies

**Critical:**
- `@google/genai` 1.35.0 - Google Gemini AI SDK for live audio/video sessions and content generation

**Dev Dependencies:**
- `@types/node` 22.14.0 - Node.js type definitions
- `typescript` 5.8.2 - TypeScript compiler

## Configuration

**Environment Variables:**
- `GEMINI_API_KEY` - Required, set in `.env.local` (not committed)
- Vite exposes as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time

**TypeScript Configuration (`tsconfig.json`):**
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx (automatic runtime)
- Path alias: `@/*` maps to project root
- Strict mode: Not enabled
- No emit (Vite handles bundling)

**Vite Configuration (`vite.config.ts`):**
- Dev server: Port 3000, host 0.0.0.0
- Path alias: `@` resolves to project root
- Environment: Loads `GEMINI_API_KEY` from `.env.local`

**Import Maps (`index.html`):**
- React packages loaded from esm.sh CDN in browser
- `@google/genai` loaded from esm.sh CDN

## Platform Requirements

**Development:**
- Node.js (any recent LTS)
- npm
- Modern browser with camera/microphone access
- GEMINI_API_KEY environment variable

**Production:**
- Static file hosting (Vite builds to `dist/`)
- HTTPS required for MediaDevices API in production
- Modern browser (Chrome, Firefox, Safari, Edge)

**Browser APIs Used:**
- `navigator.mediaDevices.getUserMedia` - Camera and microphone access
- `AudioContext` / `webkitAudioContext` - Audio processing and playback
- `localStorage` - Plant and profile persistence
- `FileReader` - Image encoding for Gemini API

## Scripts

```bash
npm run dev      # Start Vite dev server on port 3000
npm run build    # Build for production
npm run preview  # Preview production build
```

---

*Stack analysis: 2026-01-17*
