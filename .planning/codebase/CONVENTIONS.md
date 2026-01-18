# Coding Conventions

**Analysis Date:** 2026-01-18

## Next.js App Router Conventions

**Server vs Client Components:**
- Default: Server Components (no directive needed)
- Interactive: Add `'use client'` at top of file
- Keep client boundary as low as possible in component tree
- Server Components cannot use hooks, event handlers, or browser APIs

**When to use `'use client'`:**
- Component uses React hooks (`useState`, `useEffect`, etc.)
- Component has event handlers (`onClick`, `onChange`, etc.)
- Component accesses browser APIs (`localStorage`, `navigator`, etc.)
- Component uses third-party libraries that require browser environment

**File Naming (Next.js):**
- `page.tsx` - Route pages (required for route to exist)
- `layout.tsx` - Shared layouts (wraps child pages)
- `loading.tsx` - Loading UI (optional)
- `error.tsx` - Error boundaries (optional, must be Client Component)
- `route.ts` - API route handlers

**Data Fetching:**
- Server Components: `async function` with direct data access or fetch
- Client Components: `useEffect` + fetch, or React Query
- API Routes: For server-side operations with secrets

**Navigation:**
- Use `next/link` for internal links (enables prefetching)
- Use `useRouter` from `next/navigation` for programmatic navigation
- Avoid `<a>` tags for internal navigation

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `PlantCard.tsx`, `Navigation.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useAppState.ts`, `usePlantDoctor.ts`)
- Services/Libraries: kebab-case with `.ts` extension (e.g., `audio-service.ts`, `gemini-live.ts`)
- Types: lowercase in `types/` directory (e.g., `types/index.ts`)
- Route files: lowercase Next.js conventions (`page.tsx`, `route.ts`)

**Functions:**
- React components: PascalCase (e.g., `PlantCard`, `DoctorPage`)
- Custom hooks: camelCase with `use` prefix (e.g., `useAppState`, `useMediaStream`)
- Handler functions: camelCase with `handle` prefix (e.g., `handleOpenRehab`, `handleSubmit`)
- Callbacks: camelCase with `on` prefix for props (e.g., `onWater`, `onUpdate`, `onClose`)
- API route handlers: lowercase HTTP method names (`GET`, `POST`, `PUT`, `DELETE`)
- Service methods: camelCase verbs (e.g., `getPlants`, `savePlants`, `generateCareGuide`)

**Variables:**
- State variables: camelCase nouns (e.g., `plants`, `homeProfile`, `isCalling`)
- Boolean state: camelCase with `is`/`has`/`needs` prefix (e.g., `isCalling`, `isGenerating`, `needsCheckIn`)
- Refs: camelCase with `Ref` suffix (e.g., `videoRef`, `sessionRef`, `audioContextRef`)
- Environment variables: UPPER_SNAKE_CASE (e.g., `GEMINI_API_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`)

**Types:**
- Interfaces: PascalCase nouns (e.g., `Plant`, `HomeProfile`, `AppState`)
- Type aliases: PascalCase (e.g., `IntensityLevel`, `QualityLevel`, `SortOption`)
- Props interfaces: `Props` for component-local, descriptive name for shared

## Code Style

**Formatting:**
- Indentation: 2 spaces
- Semicolons: optional (generally omitted)
- Quotes: single quotes for strings
- Trailing commas: used in multiline arrays/objects
- Line length: no enforced limit, but generally under 120 characters

**Linting:**
- ESLint with Next.js config (`next lint`)
- TypeScript strict mode recommended

## Import Organization

**Order:**
1. React imports (e.g., `import { useState, useCallback } from 'react'`)
2. Next.js imports (e.g., `import Link from 'next/link'`, `import { useRouter } from 'next/navigation'`)
3. External library imports (e.g., `import { GoogleGenAI } from "@google/genai"`)
4. Internal type imports (e.g., `import { Plant, HomeProfile } from '@/types'`)
5. Internal component/hook imports (e.g., `import { PlantCard } from '@/components/PlantCard'`)
6. Internal service/utility imports (e.g., `import { StorageService } from '@/lib/storage-service'`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use path aliases for cleaner imports

**Examples:**
```typescript
// From a Client Component
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plant } from '@/types'
import { PlantCard } from '@/components/PlantCard'
import { useAppState } from '@/hooks/useAppState'
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations with fallbacks
- `console.error` or `console.warn` for logging errors
- Graceful fallback to default values on parse errors
- API routes return proper HTTP status codes

**API Route Error Handling:**
```typescript
// From app/api/gemini/content/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // ... process request
    return Response.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
```

**Client Error Handling:**
```typescript
// From hooks or components
try {
  const response = await fetch('/api/gemini/content', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Request failed')
  const result = await response.json()
} catch (error) {
  console.error('Fetch error:', error)
  // Fallback behavior
}
```

## Logging (Updated 2026-01-18)

**Framework:** Native `console` methods with structured prefixes

**Patterns:**
- Structured logging with prefixes for easy filtering and monitoring:
  - `[RATE_LIMIT]` - Rate limit violations
  - `[TOOL_CALL]` - Successful tool invocations with context
  - `[API_REQUEST]` - Incoming API requests
  - `[SUCCESS]` - Successful operations
  - `[GENERATION_ERROR]` - Gemini API failures
  - `[PARSE_ERROR]` - Response parsing failures
  - `[INVALID_REQUEST]` - Request validation failures
- Legacy: `console.error` for operation failures, `console.warn` for non-critical issues
- All logs should include relevant context (plant names, species, operation types)

**Example:**
```typescript
if (!limiter.canCall(toolName)) {
  console.warn(`[RATE_LIMIT] Tool '${toolName}' exceeded limit`)
  return
}
console.log(`[TOOL_CALL] ${toolName} called for plant: ${plant.name}`)
```

## Comments

**When to Comment:**
- Critical business logic explanations
- `'use client'` directive explanation when non-obvious
- Complex async flows or state management

**JSDoc/TSDoc:**
- Not required for public API documentation
- Inline comments for complex logic only

## Function Design

**Size:**
- Components: 50-200 lines typical
- Hooks: 50-180 lines
- Service methods: 10-50 lines
- API route handlers: 20-80 lines

**Parameters:**
- Destructured objects for component props
- Individual parameters for simple functions
- Callbacks passed as props use `on` prefix naming

**Return Values:**
- Hooks return objects with state and functions
- Components return JSX
- Service methods return Promises or direct values
- API routes return `Response` objects

## Module Design

**Exports:**
- Named exports preferred (e.g., `export const PlantCard`, `export class AudioService`)
- Default exports for page components (Next.js convention)
- Types exported from central `types/index.ts` file

**API Route Exports:**
```typescript
// Named exports for HTTP methods
export async function GET(request: Request) { }
export async function POST(request: Request) { }
```

## React Patterns

**State Management:**
- `useState` for local component state
- `useCallback` for memoized callbacks passed to children
- `useRef` for mutable values that don't trigger re-renders
- `useEffect` for side effects and cleanup
- Custom hooks for shared stateful logic

**Component Structure (Client Component):**
```typescript
'use client'

interface Props {
  prop1: string
  prop2: () => void
}

export const ComponentName = ({ prop1, prop2 }: Props) => {
  // 1. State declarations
  const [state, setState] = useState()

  // 2. Refs
  const ref = useRef()

  // 3. Custom hooks
  const { data } = useAppState()

  // 4. Derived values / useMemo
  const derived = useMemo(() => {}, [deps])

  // 5. Effects
  useEffect(() => {}, [deps])

  // 6. Handler functions
  const handleAction = () => {}

  // 7. Return JSX
  return (<div>...</div>)
}
```

**Server Component Structure:**
```typescript
// No 'use client' directive - Server Component by default

interface Props {
  params: { id: string }
}

export default async function PageName({ params }: Props) {
  // Can use async/await directly
  const data = await fetchData(params.id)

  return (<div>...</div>)
}
```

## Guardrails & Rate Limiting (Added 2026-01-18)

**When Adding AI Features:**

1. **Import Rate Limiters:**
   ```typescript
   import { ToolCallRateLimiter, TokenBucketLimiter, PlantContextValidator } from '@/lib/rate-limiter'
   ```

2. **Create Limiter Instances:**
   ```typescript
   // In a hook (per session)
   const toolLimiterRef = useRef(new ToolCallRateLimiter(10, 60000)) // 10 calls/min

   // In an API route (global)
   const apiLimiter = new TokenBucketLimiter(10, 2) // 10 tokens, 2 refill/sec
   ```

3. **Check Before Processing:**
   ```typescript
   if (!toolLimiterRef.current.canCall(toolName)) {
     console.warn(`[RATE_LIMIT] Tool '${toolName}' exceeded rate limit`)
     // Return error to user or reject silently
     return
   }
   ```

4. **Update System Prompt:**
   - Add "PLANT-ONLY FOCUS" mode heading
   - Include CRITICAL RULES section
   - Explicitly state "Do NOT engage with requests about other topics"

5. **Log Operations:**
   ```typescript
   console.log(`[TOOL_CALL] ${toolName} called with context: ${context}`)
   console.error(`[GENERATION_ERROR] Failed to generate for ${plant.species}`)
   ```

6. **API Endpoint Validation:**
   - Validate request type/fields
   - Return HTTP 400 for invalid requests
   - Return HTTP 429 for rate-limited requests
   - Return HTTP 500 for server errors

**Example: New AI Integration Pattern**
```typescript
'use client'
import { ToolCallRateLimiter } from '@/lib/rate-limiter'

export const useNewFeature = () => {
  const limiterRef = useRef(new ToolCallRateLimiter(5, 60000))

  const processToolCall = (toolName: string, args: any) => {
    if (!limiterRef.current.canCall(toolName)) {
      console.warn(`[RATE_LIMIT] ${toolName} limit exceeded`)
      return { error: 'Rate limit exceeded' }
    }

    console.log(`[TOOL_CALL] ${toolName} processing`)
    // Process call...
  }

  return { processToolCall }
}
```

## CSS/Styling

**Framework:** Tailwind CSS (utility-first)

**Patterns:**
- Inline className strings with Tailwind utilities
- Conditional classes using template literals
- Design tokens: `stone-*` for neutrals, `green-*` for success, `red-*` for danger, `amber-*` for warning, `blue-*` for info
- Border radius: rounded-2xl, rounded-3xl for cards
- Responsive: `sm:`, `md:`, `lg:` prefixes for breakpoints

**Global Styles:**
- Tailwind imports in `app/globals.css`
- Minimal custom CSS; prefer Tailwind utilities

---

*Convention analysis: 2026-01-18*
*Updated with guardrails and rate limiting patterns: 2026-01-18*
