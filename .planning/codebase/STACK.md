# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- TypeScript (Next.js app, Firebase Functions)

**Secondary:**
- JavaScript (WebSocket proxy)
- HTML/CSS (via JSX + Tailwind)

## Runtime

**App Runtime:**
- Node.js 18+ for Next.js
- Browser APIs: MediaDevices, AudioContext, localStorage

**Functions Runtime:**
- Node.js 20 (Firebase Functions `engines.node`)

**WebSocket Proxy Runtime:**
- Node.js (Express + ws)

## Frameworks & Libraries

**Core UI:**
- Next.js 15
- React 19

**Styling:**
- Tailwind CSS 3
- PostCSS + Autoprefixer

**Backend/Infra:**
- Firebase Auth (anonymous)
- Firestore (client SDK with persistence)
- Firebase Cloud Functions (HTTPS)
- Express + ws (WebSocket proxy)

**AI:**
- `@google/genai` (Gemini Live + Content)

## Tooling

**Linting:**
- ESLint (`eslint-config-next`)

**Type Checking:**
- TypeScript `strict` mode

## Package Management

- npm
- Lockfiles: `package-lock.json` (root, functions, websocket-proxy)

## Scripts

**App:**
```bash
npm run dev
npm run build
npm run start
npm run lint
```

**Functions:**
```bash
cd functions
npm run build
npm run serve
npm run deploy
```

**WebSocket Proxy:**
```bash
cd websocket-proxy
npm run start
```

## Testing

- No test framework or test scripts configured

---

*Stack analysis: 2026-02-03*
