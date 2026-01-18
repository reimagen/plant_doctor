# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**
- TypeScript 5.x - All application code (`.ts`, `.tsx` files)

**Secondary:**
- HTML - Via JSX in React components
- CSS - Tailwind utility classes (npm installed)

## Runtime

**Environment:**
- Node.js 18+ (Next.js requirement)
- Browser (Web APIs: AudioContext, MediaDevices, localStorage)

**Package Manager:**
- npm
- Lockfile: `package-lock.json`

## Frameworks

**Core:**
- Next.js 15.x - Full-stack React framework with App Router
- React 19.x - UI framework with functional components and hooks
- React DOM 19.x - DOM rendering

**Build/Dev:**
- Next.js built-in compiler (replaces Vite)
- SWC for fast compilation

**Styling:**
- Tailwind CSS 3.x (npm installed, PostCSS configured)

**Testing:**
- Vitest (planned)

## Key Dependencies

**Critical:**
- `@google/genai` - Google Gemini AI SDK for live audio/video sessions and content generation

**Dev Dependencies:**
- `@types/node` - Node.js type definitions
- `@types/react` - React type definitions
- `typescript` - TypeScript compiler
- `tailwindcss` - Utility-first CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixing

## Configuration

**Environment Variables:**
- `GEMINI_API_KEY` - Server-only, for Content API (no `NEXT_PUBLIC_` prefix)
- `NEXT_PUBLIC_GEMINI_API_KEY` - Client-side, for Live API (domain-restricted)
- Auto-loaded from `.env.local` by Next.js

**TypeScript Configuration (`tsconfig.json`):**
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx (automatic runtime)
- Path alias: `@/*` maps to project root
- Next.js recommended settings

**Next.js Configuration (`next.config.ts`):**
- App Router enabled (default)
- TypeScript config

**Tailwind Configuration:**
- `tailwind.config.ts` - Theme customization, content paths
- `postcss.config.js` - PostCSS plugins (tailwindcss, autoprefixer)

## Platform Requirements

**Development:**
- Node.js 18+
- npm
- Modern browser with camera/microphone access
- Environment variables in `.env.local`

**Production:**
- Vercel hosting (zero-config deployment)
- HTTPS required (automatic on Vercel)
- Modern browser (Chrome, Firefox, Safari, Edge)

**Browser APIs Used:**
- `navigator.mediaDevices.getUserMedia` - Camera and microphone access
- `AudioContext` / `webkitAudioContext` - Audio processing and playback
- `localStorage` - Plant and profile persistence
- `FileReader` - Image encoding for Gemini API

## Scripts

```bash
npm run dev      # Start Next.js dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

**Target:** Vercel
- Zero-config deployment from Git
- Automatic HTTPS
- Environment variables via Vercel dashboard
- Edge Functions available for API routes if needed

---

*Stack analysis: 2026-01-18*
