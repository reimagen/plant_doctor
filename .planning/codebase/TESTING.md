# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**
- Vitest (Vite-native, works well with Next.js)
- Jest-compatible API

**Assertion Library:**
- Vitest built-in (`expect`)
- @testing-library/jest-dom for DOM assertions

**Run Commands:**
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage report
```

## Test File Organization

**Location:**
- Co-located with source files (recommended)
- `__tests__/` directories for integration tests

**Naming:**
- `*.test.ts` or `*.test.tsx` for test files
- Match source file name (e.g., `PlantCard.test.tsx` for `PlantCard.tsx`)

**Structure:**
```
plant_doctor/
├── app/
│   ├── api/
│   │   └── gemini/
│   │       └── content/
│   │           ├── route.ts
│   │           └── route.test.ts      # API route tests
│   └── __tests__/                     # Page integration tests
├── components/
│   ├── PlantCard.tsx
│   └── PlantCard.test.tsx             # Component unit tests
├── hooks/
│   ├── useAppState.ts
│   └── useAppState.test.ts            # Hook unit tests
└── lib/
    ├── storage-service.ts
    └── storage-service.test.ts        # Service unit tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  })

  describe('when condition', () => {
    it('should behave this way', () => {
      // Arrange, Act, Assert
    })
  })
})
```

**Patterns:**
- Arrange-Act-Assert (AAA) pattern
- One assertion per test when possible
- Descriptive test names that read as sentences

## Mocking

**Framework:**
- Vitest built-in (`vi.mock`, `vi.fn`, `vi.spyOn`)

**What to Mock:**
- `localStorage` for `StorageService` tests
- `navigator.mediaDevices.getUserMedia` for `useMediaStream` tests
- `fetch` for API route and client fetch tests
- `@google/genai` SDK for Gemini integration tests
- `AudioContext` and Web Audio API for `AudioService` tests
- `next/navigation` for router mocking

**What NOT to Mock:**
- Pure utility functions
- Type transformations
- React component rendering logic (use Testing Library)

**Examples:**

```typescript
// Mocking localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mocking next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mocking fetch for API tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ tips: ['Tip 1', 'Tip 2'] }),
  })
) as any
```

## Fixtures and Factories

**Test Data:**
- `lib/test-data.ts` contains `TEST_PLANTS` array
- Use factories for generating test data with variations

**Example Factory:**
```typescript
// test/factories.ts
import { Plant } from '@/types'

export const createTestPlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: crypto.randomUUID(),
  name: 'Test Plant',
  species: 'Testus plantus',
  photoUrl: 'https://example.com/plant.jpg',
  location: 'Living Room',
  lastWateredAt: new Date().toISOString(),
  cadenceDays: 7,
  status: 'healthy',
  needsCheckIn: false,
  ...overrides,
})
```

## Coverage

**Requirements:**
- No minimum enforced (recommended: 70%+ for critical paths)

**View Coverage:**
```bash
npm run test:coverage
# Opens HTML report in coverage/index.html
```

## Test Types

**Unit Tests:**
- Target: Individual functions, hooks, services
- Location: Co-located with source files
- Dependencies: Mocked

Recommended targets:
- `lib/storage-service.ts` - localStorage operations
- `lib/audio-service.ts` - audio buffer manipulation
- `hooks/useAppState.ts` - state management logic
- API route handlers

**Component Tests:**
- Target: React components
- Framework: @testing-library/react
- Focus: User interactions, rendered output

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { PlantCard } from './PlantCard'
import { createTestPlant } from '@/test/factories'

describe('PlantCard', () => {
  it('displays plant name', () => {
    const plant = createTestPlant({ name: 'My Fern' })
    render(<PlantCard plant={plant} onWater={vi.fn()} />)
    expect(screen.getByText('My Fern')).toBeInTheDocument()
  })

  it('calls onWater when water button clicked', () => {
    const onWater = vi.fn()
    const plant = createTestPlant()
    render(<PlantCard plant={plant} onWater={onWater} />)
    fireEvent.click(screen.getByRole('button', { name: /water/i }))
    expect(onWater).toHaveBeenCalledWith(plant.id)
  })
})
```

**API Route Tests:**
- Target: Route handlers in `app/api/`
- Test as functions, mock external dependencies

```typescript
import { POST } from './route'
import { vi } from 'vitest'

// Mock the Gemini SDK
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() => ({
        text: () => JSON.stringify({ tips: ['Water regularly'] }),
      })),
    })),
  })),
}))

describe('POST /api/gemini/content', () => {
  it('returns care tips for valid request', async () => {
    const request = new Request('http://localhost/api/gemini/content', {
      method: 'POST',
      body: JSON.stringify({
        type: 'care-guide',
        plant: { name: 'Fern', species: 'Boston Fern' },
        homeProfile: {},
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tips).toBeDefined()
  })
})
```

**Integration Tests:**
- Target: Multiple components/hooks working together
- Location: `__tests__/` directories
- Dependencies: Minimal mocking

**E2E Tests:**
- Framework: Playwright (recommended) or Cypress
- Not yet configured
- Would test full user flows

## Recommended Setup

**1. Install dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**2. Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**3. Create `test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Global mocks
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
})
```

**4. Add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Priority Test Targets

**High Priority (core functionality):**
1. `lib/storage-service.ts` - Data persistence logic
2. `hooks/useAppState.ts` - Central state management
3. `app/api/gemini/content/route.ts` - API route handler
4. `components/PlantCard.tsx` - Status computation logic

**Medium Priority (business logic):**
1. `lib/gemini-content.ts` - API response parsing
2. `hooks/useMediaStream.ts` - Hardware access handling
3. `lib/audio-service.ts` - Audio buffer operations

**Lower Priority (integration-heavy):**
1. `hooks/usePlantDoctor.ts` - Requires extensive mocking
2. `hooks/useRehabSpecialist.ts` - Requires extensive mocking
3. `lib/gemini-live.ts` - WebSocket mocking complexity

---

*Testing analysis: 2026-01-18*
