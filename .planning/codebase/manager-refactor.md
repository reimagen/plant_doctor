# Manager.tsx refactor plan

## Goals
- Split `components/Manager.tsx` into smaller, focused components while preserving current behavior.
- Isolate rescue plan and care guide generation logic from UI blocks.
- Keep existing integrations with `RescueTimeline` and `RescueProtocolView` intact (no functional regressions).

## Proposed structure
1) **Create section components** in `components/manager/`:
   - `LastWateredSection.tsx`
   - `RescuePlanSection.tsx`
   - `IdealConditionsSection.tsx`
   - `HealthNotesSection.tsx`
   - `EnvironmentSettingsSection.tsx`
   - `CareGuideSection.tsx`
   - `DangerZoneSection.tsx`

2) **Create rescue plan logic hook** in `hooks/useRescuePlan.ts`:
   - Owns generation, auto-generate effect, and task completion handler.
   - Exposes `isRescueGenerating`, `generateError` (or split errors), `onGenerate`, `onTaskComplete`.

3) **Create care guide logic hook** in `hooks/useCareGuide.ts`:
   - Owns generation state and error handling.
   - Exposes `isGenerating`, `generateError`, `onGenerate`.

4) **Update Manager.tsx** to compose sections:
   - Keep only wiring and shared layout.
   - Pass minimal props to each section.

5) **Audit imports/usages**:
   - Ensure `RescueTimeline` usage lives inside `RescuePlanSection`.
   - Keep `RescueProtocolView` in `InventoryPage.tsx` unchanged.

## Steps
- Add the new hooks and section components.
- Move UI blocks from `Manager.tsx` into the new components.
- Update `Manager.tsx` imports and props.
- Verify no TypeScript errors; ensure behavior parity.

## Risks
- State duplication between sections; keep single source of truth in hooks/Manager.
- Auto-generate rescue plan should only trigger when needed.

