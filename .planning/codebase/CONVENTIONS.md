# Coding Conventions

**Analysis Date:** 2026-01-17

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `PlantCard.tsx`, `Navigation.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useAppState.ts`, `usePlantDoctor.ts`)
- Services/Libraries: kebab-case with `.ts` extension (e.g., `audio-service.ts`, `gemini-live.ts`)
- Types: lowercase singular noun (e.g., `types.ts`)
- Constants: lowercase plural noun (e.g., `constants.tsx`)

**Functions:**
- React components: PascalCase (e.g., `PlantCard`, `DoctorPage`)
- Custom hooks: camelCase with `use` prefix (e.g., `useAppState`, `useMediaStream`)
- Handler functions: camelCase with `handle` prefix (e.g., `handleOpenRehab`, `handleSetView`)
- Callbacks: camelCase with `on` prefix for props (e.g., `onWater`, `onUpdate`, `onClose`)
- Service methods: camelCase verbs (e.g., `getPlants`, `savePlants`, `generateCareGuide`)

**Variables:**
- State variables: camelCase nouns (e.g., `plants`, `homeProfile`, `isCalling`)
- Boolean state: camelCase with `is`/`has`/`needs` prefix (e.g., `isCalling`, `isGenerating`, `needsCheckIn`)
- Refs: camelCase with `Ref` suffix (e.g., `videoRef`, `sessionRef`, `audioContextRef`)
- Constants: UPPER_SNAKE_CASE for object keys (e.g., `KEYS.PLANTS`)

**Types:**
- Interfaces: PascalCase nouns (e.g., `Plant`, `HomeProfile`, `AppState`)
- Type aliases: PascalCase (e.g., `IntensityLevel`, `QualityLevel`, `SortOption`)
- Props interfaces: `Props` for component-local, descriptive name for shared

## Code Style

**Formatting:**
- No explicit Prettier or ESLint configuration detected
- Indentation: 2 spaces
- Semicolons: optional (generally omitted)
- Quotes: single quotes for strings
- Trailing commas: used in multiline arrays/objects
- Line length: no enforced limit, but generally under 120 characters

**Linting:**
- No ESLint configuration present
- TypeScript strict mode not enabled (no `strict: true` in tsconfig)
- `skipLibCheck: true` enabled

## Import Organization

**Order:**
1. React imports (e.g., `import React from 'react'`, `import { useState, useCallback } from 'react'`)
2. External library imports (e.g., `import { GoogleGenAI } from "@google/genai"`)
3. Internal type imports (e.g., `import { Plant, HomeProfile } from '../types'`)
4. Internal component/hook imports (e.g., `import { PlantCard } from '../components/PlantCard'`)
5. Internal service/utility imports (e.g., `import { StorageService } from '../lib/storage-service'`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)
- Currently not used in codebase - relative paths used instead

**Examples from codebase:**
```typescript
// From hooks/usePlantDoctor.ts
import { useState, useRef, useCallback } from 'react';
import { Type, FunctionDeclaration } from "@google/genai";
import { HomeProfile, Plant } from '../types';
import { GeminiLiveSession } from '../lib/gemini-live';
import { AudioService } from '../lib/audio-service';
import { useMediaStream } from './useMediaStream';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations with silent fallbacks
- `console.error` or `console.warn` for logging errors
- Graceful fallback to default values on parse errors

**Examples from codebase:**
```typescript
// From lib/storage-service.ts - silent fallback pattern
getPlants: (): Plant[] => {
  try {
    const saved = localStorage.getItem(KEYS.PLANTS);
    if (!saved) return TEST_PLANTS;
    const parsed = JSON.parse(saved);
    return parsed.length === 0 ? TEST_PLANTS : parsed;
  } catch {
    return TEST_PLANTS;
  }
}

// From lib/gemini-content.ts - fallback with default data
try {
  const data = JSON.parse(response.text || '{"tips":[]}');
  return data.tips;
} catch (e) {
  return ["Keep soil moist", "Ensure adequate light", "Avoid drafts", "Check regularly"];
}

// From hooks/usePlantDoctor.ts - cleanup on error
} catch (e) {
  stopCall();
}
```

## Logging

**Framework:** Native `console` methods

**Patterns:**
- `console.error` for operation failures (e.g., "Hardware access denied:", "Rescue plan generation failed")
- `console.warn` for non-critical issues (e.g., "Playback suppressed:", "Failed to send initial greet")
- No structured logging or log levels beyond console methods
- No production logging strategy detected

## Comments

**When to Comment:**
- Critical business logic explanations
- TODO/FIXME markers (none detected in codebase)
- JSDoc-style for type hints where TypeScript inference is unclear

**JSDoc/TSDoc:**
- Not used for public API documentation
- Inline comments for complex logic only

**Examples from codebase:**
```typescript
// From hooks/useAppState.ts
// CRITICAL: We do NOT setView here. Detection happens in the background.
// Newly detected plants are ALWAYS 'pending' until the user "Adopts" them.

// From hooks/usePlantDoctor.ts
// Refs for video elements to allow frame capture during tool calls
```

## Function Design

**Size:**
- Components: 50-200 lines typical
- Hooks: 50-180 lines
- Service methods: 10-50 lines
- No explicit line limit enforced

**Parameters:**
- Destructured objects for component props
- Individual parameters for simple functions
- Callbacks passed as props use `on` prefix naming

**Return Values:**
- Hooks return objects with state and functions
- Components return JSX
- Service methods return Promises or direct values

**Examples from codebase:**
```typescript
// Hook return pattern from hooks/useAppState.ts
return {
  view,
  setView: handleSetView,
  plants,
  homeProfile,
  setHomeProfile,
  rehabTarget,
  addPlant,
  updatePlant,
  removePlant,
  waterPlant,
  adoptPlant,
  handleOpenRehab
};

// Props interface pattern from components/PlantCard.tsx
interface Props {
  plant: Plant;
  onWater: (id: string) => void;
  onAdopt?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCheckIn?: (id: string, mode: 'discovery' | 'rehab') => void;
  onRescue?: (id: string) => void;
}
```

## Module Design

**Exports:**
- Named exports preferred (e.g., `export const PlantCard`, `export class AudioService`)
- No default exports used
- Types exported from central `types.ts` file

**Barrel Files:**
- Not used - direct imports from individual files

## React Patterns

**State Management:**
- `useState` for local component state
- `useCallback` for memoized callbacks passed to children
- `useRef` for mutable values that don't trigger re-renders
- `useEffect` for side effects and cleanup

**Component Structure:**
```typescript
// Standard component pattern
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. State declarations
  const [state, setState] = useState();

  // 2. Refs
  const ref = useRef();

  // 3. Derived values / useMemo
  const derived = useMemo(() => {}, [deps]);

  // 4. Effects
  useEffect(() => {}, [deps]);

  // 5. Handler functions
  const handleAction = () => {};

  // 6. Helper functions (render helpers)
  const renderSection = () => {};

  // 7. Return JSX
  return (<div>...</div>);
};
```

## CSS/Styling

**Framework:** Tailwind CSS (utility-first)

**Patterns:**
- Inline className strings with Tailwind utilities
- Conditional classes using template literals
- Design tokens: `stone-*` for neutrals, `green-*` for success, `red-*` for danger, `amber-*` for warning, `blue-*` for info
- Border radius: rounded-2xl, rounded-3xl, rounded-[40px] for cards
- Responsive: `sm:` prefix for breakpoints

**Example:**
```typescript
className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
  isOverdue
  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
  : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
}`}
```

---

*Convention analysis: 2026-01-17*
