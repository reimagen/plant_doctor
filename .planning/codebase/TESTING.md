# Testing Patterns

**Analysis Date:** 2026-01-17

## Test Framework

**Runner:**
- Not configured
- No test framework dependencies in `package.json`
- No test configuration files detected (jest.config.*, vitest.config.*, etc.)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test scripts defined in package.json
# Available scripts:
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Test File Organization

**Location:**
- No test files exist in the codebase

**Naming:**
- Not established (no test files present)

**Structure:**
```
# No test directory structure exists
# Recommended structure for this codebase:
/Users/lisagu/Projects/plant_doctor/
├── __tests__/                    # Integration tests
│   ├── pages/
│   └── hooks/
├── components/
│   ├── PlantCard.tsx
│   └── PlantCard.test.tsx       # Co-located unit tests
├── hooks/
│   ├── useAppState.ts
│   └── useAppState.test.ts
└── lib/
    ├── storage-service.ts
    └── storage-service.test.ts
```

## Test Structure

**Suite Organization:**
- Not established

**Patterns:**
- Not established

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not established

**What to Mock (recommendations based on codebase):**
- `localStorage` for `StorageService` tests
- `navigator.mediaDevices.getUserMedia` for `useMediaStream` tests
- `@google/genai` SDK for Gemini integration tests
- `AudioContext` and Web Audio API for `AudioService` tests

**What NOT to Mock (recommendations):**
- Pure utility functions
- Type transformations
- React component rendering logic

## Fixtures and Factories

**Test Data:**
- `lib/test-data.ts` contains `TEST_PLANTS` array used as default/fallback data

```typescript
// From lib/test-data.ts - existing test data
export const TEST_PLANTS: Plant[] = [
  {
    id: 'test-checkin-verification',
    name: 'Recovery Test',
    species: 'Fiddle Leaf Fig',
    photoUrl: 'https://images.unsplash.com/...',
    location: 'Studio',
    lastWateredAt: new Date(Date.now() - (1000 * 60 * 60 * 30)).toISOString(),
    cadenceDays: 7,
    status: 'healthy',
    needsCheckIn: true,
    // ... additional properties
  },
  // ... more test plants
];
```

**Location:**
- `lib/test-data.ts` - Application test/demo data (committed, used in production fallback)

## Coverage

**Requirements:**
- None enforced (no testing framework configured)

**View Coverage:**
```bash
# Not available - no test framework configured
```

## Test Types

**Unit Tests:**
- Not implemented
- Recommended targets:
  - `lib/storage-service.ts` - localStorage operations
  - `lib/audio-service.ts` - audio buffer manipulation
  - `hooks/useAppState.ts` - state management logic
  - `types.ts` - type guard functions (if added)

**Integration Tests:**
- Not implemented
- Recommended targets:
  - `hooks/usePlantDoctor.ts` - Gemini Live API integration
  - `hooks/useRehabSpecialist.ts` - Gemini Live API integration
  - `lib/gemini-content.ts` - Gemini Content API integration
  - `lib/gemini-live.ts` - WebSocket session management

**E2E Tests:**
- Not implemented
- Recommended framework: Playwright or Cypress
- Recommended targets:
  - Plant inventory CRUD operations
  - Doctor camera session flow
  - Settings profile persistence

## Common Patterns

**Async Testing:**
- Not established (recommend using async/await with proper cleanup)

**Error Testing:**
- Not established (recommend testing fallback behaviors in storage-service and gemini-content)

## Recommended Setup

**For this React + Vite project, consider:**

1. **Vitest** (Vite-native, fast, Jest-compatible API)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

2. **vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

3. **package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Priority Test Targets

**High Priority (core functionality):**
1. `lib/storage-service.ts` - Data persistence logic
2. `hooks/useAppState.ts` - Central state management
3. `components/PlantCard.tsx` - Status computation logic

**Medium Priority (business logic):**
1. `lib/gemini-content.ts` - API response parsing
2. `hooks/useMediaStream.ts` - Hardware access handling
3. `lib/audio-service.ts` - Audio buffer operations

**Lower Priority (integration-heavy):**
1. `hooks/usePlantDoctor.ts` - Requires extensive mocking
2. `hooks/useRehabSpecialist.ts` - Requires extensive mocking
3. `lib/gemini-live.ts` - WebSocket mocking complexity

---

*Testing analysis: 2026-01-17*
