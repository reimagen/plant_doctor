# Coding Conventions

**Analysis Date:** 2026-02-03

## Next.js App Router Conventions

**Client Components:**
- All current route pages are Client Components (`'use client'` at top)
- Use Client Components for anything that touches hooks, browser APIs, or event handlers
- Wrap `useSearchParams()` usage in `Suspense` (see `app/doctor/page.tsx`, `app/plants/page.tsx`)

**Server-Side:**
- API route handlers live in `app/api/*/route.ts` and run on the server
- No Server Component data fetching in the current app

**File Naming (Next.js):**
- `page.tsx` - Route pages
- `layout.tsx` - Shared layouts
- `route.ts` - API route handlers

**Data Fetching:**
- Client components fetch via `/api/gemini/content`
- Use Firestore SDK in client hooks for persistence

**Navigation:**
- Use `next/link` for links
- Use `useSearchParams` from `next/navigation` for query-driven routes

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `PlantCard.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useAppState.ts`)
- Services/Libraries: kebab-case (e.g., `firestore-service.ts`)
- Types: lowercase in `types/index.ts`
- Route files: `page.tsx`, `layout.tsx`, `route.ts`

**Functions:**
- React components: PascalCase
- Custom hooks: camelCase with `use` prefix
- Handlers: camelCase with `handle` prefix
- Callbacks: camelCase with `on` prefix

**Variables:**
- State: camelCase nouns (`plants`, `homeProfile`)
- Booleans: `is`/`has`/`needs` prefix (`isCalling`, `needsCheckIn`)
- Refs: `Ref` suffix (`sessionRef`, `videoRef`)
- Env vars: UPPER_SNAKE_CASE (`NEXT_PUBLIC_GEMINI_API_KEY`)

## Code Style

**Formatting:**
- Indentation: 2 spaces
- Quotes: single quotes preferred (some files use double quotes; follow local file style)
- Semicolons: generally omitted, but existing files mix styles
- Trailing commas: used in multiline objects/arrays

**Linting:**
- ESLint with Next.js config (`next lint`)
- TypeScript `strict: true` in `tsconfig.json`

## Import Organization

**Order:**
1. React imports
2. Next.js imports
3. External libraries
4. Internal types
5. Internal components/hooks/services

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)

## Error Handling

**Patterns:**
- Try/catch around async operations
- Log with context and prefixed tags
- Return safe fallbacks (e.g., empty arrays)

## Logging

**Common Prefixes:**
- `[APP_STATE]` - State updates
- `[API_REQUEST]` - Content API calls
- `[RESCUE_PLAN]` / `[RESCUE]` - Rehab flows
- `[RATE_LIMIT]` - Tool call limits
- `[SUCCESS]` / `[GENERATION_ERROR]` / `[API_ERROR]` - Results and failures
- `[Auth]` / `[Firebase]` - Firebase lifecycle events

## Module Design

**Exports:**
- Default exports for page components
- Named exports for components, hooks, and services

**Hooks:**
- Return objects with state + actions
- Keep browser-only logic inside hooks or Client Components

## Styling

**Framework:** Tailwind CSS

**Patterns:**
- Utility classes in `className` strings
- Prefer Tailwind utilities over custom CSS

---

*Convention analysis: 2026-02-03*
