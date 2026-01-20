# Refactor: Move Stream Controls from Navigation to Doctor Page

## Problem
Navigation bar currently changes buttons based on stream state (Doctor/Listen → Stop), which:
- Hides primary navigation when streaming
- Couples navigation to feature state
- Violates principle of consistent navigation UI

## Solution
Move stream start/stop controls to the Doctor page itself, simplify Navigation to just navigation links.

## Design Decision: Explicit Stream Mode Tracking

Add `streamMode: 'video' | 'audio' | null` state to prevent race conditions where both video and audio could be started simultaneously.

**Why needed:** Without explicit mode tracking, rapid clicks on camera + microphone buttons could attempt to start both streams before guards kick in.

## Architecture Changes

### State Management (ClientApp.tsx)
```typescript
// Add new state
const [streamMode, setStreamMode] = useState<'video' | 'audio' | null>(null)

// Update handler signature
const handleStartStream = async (mode: 'video' | 'audio') => {
  // Guard: prevent if already connecting or active
  if (isConnecting || streamMode !== null || stream) return

  setIsConnecting(true)
  setStreamMode(mode)  // Claim mode immediately
  try {
    await start(mode === 'video')
  } catch (error) {
    setStreamMode(null)  // Release on error
  } finally {
    setIsConnecting(false)
  }
}

const handleStopStream = () => {
  stop()
  setStreamMode(null)  // Release mode
}
```

### Navigation Simplification (Navigation.tsx)
**Remove:**
- `stream`, `isConnecting`, `onStart`, `onStop` props
- Doctor/Listen/Stop buttons

**Add:**
- Simple `<Link href="/doctor">` with Doctor icon

**Result:** Clean navigation bar showing Jungle | Doctor | Settings

### Doctor Page Controls (app/doctor/page.tsx)
**Add props:**
```typescript
interface Props {
  stream: MediaStream | null
  streamMode: 'video' | 'audio' | null
  isConnecting: boolean
  onStartStream: (mode: 'video' | 'audio') => void
  onStopStream: () => void
  // ... existing props
}
```

**UI Controls:**
- Camera icon button → `onStartStream('video')`
- Microphone icon button → `onStartStream('audio')`
- Stop button (shown when `stream` active)
- All buttons disabled when `isConnecting || streamMode !== null`

### PlantDetailPage Compatibility (PlantDetailPage.tsx)
Update `handleStartRehab`:
```typescript
const handleStartRehab = (mode: 'video' | 'audio') => {
  router.push(`/doctor?plantId=${plant.id}`)
  onStartStream(mode)
}
```

## Race Condition Prevention

**Multi-layer guards (all preserved + enhanced):**

1. **UI Level:** Buttons disabled when `isConnecting || streamMode !== null`
2. **ClientApp Level:** Check `streamMode !== null` before allowing start
3. **Hook Level:** Existing `isConnectingRef` guards (unchanged)
4. **Session Level:** Existing `sessionRef.current` checks (unchanged)

## Implementation Phases

### Phase 1: Add Mode Tracking
- Add `streamMode` state to ClientApp
- Update `handleStartStream` signature to `(mode: 'video' | 'audio')`
- Update guards to check `streamMode !== null`
- Pass `streamMode` to DoctorPage

**File:** `app/ClientApp.tsx`

### Phase 2: Add Doctor Page Controls
- Update DoctorPage to receive stream control props
- Add camera/microphone/stop button UI
- Implement button logic with guards
- Pass stream to Doctor component (without controls)

**File:** `app/doctor/page.tsx`

### Phase 3: Simplify Navigation
- Remove stream props from Navigation interface
- Replace Doctor/Listen/Stop buttons with simple Doctor link
- Update ClientApp to not pass stream props to Navigation

**Files:** `components/Navigation.tsx`, `app/ClientApp.tsx`

### Phase 4: Update PlantDetailPage
- Update `onStartStream` prop type
- Modify `handleStartRehab` to use new signature

**Files:** `components/pages/PlantDetailPage.tsx`, `app/ClientApp.tsx`

## What Stays Unchanged

- `useMediaStream` hook (no changes)
- `usePlantDoctor` and `useRehabSpecialist` hooks (no changes)
- `Doctor` component interface and behavior (no changes)
- Stream lifecycle management (no changes)
- All existing race condition guards (preserved)

## Critical Files

1. `/Users/lisagu/Projects/plant_doctor/app/ClientApp.tsx` - Core state changes
2. `/Users/lisagu/Projects/plant_doctor/app/doctor/page.tsx` - Add controls UI
3. `/Users/lisagu/Projects/plant_doctor/components/Navigation.tsx` - Simplify to links only
4. `/Users/lisagu/Projects/plant_doctor/components/pages/PlantDetailPage.tsx` - Update signature
5. `/Users/lisagu/Projects/plant_doctor/components/pages/DoctorPage.tsx` - Receive new props

## Verification

**Test scenarios:**
1. Navigate to Doctor → see camera/mic buttons → start video → see stop button
2. Rapid-click camera button → only one stream starts
3. Click camera then mic → second click blocked by guard
4. Start from PlantDetailPage → navigates and starts correctly
5. Video mode shows video feed, audio mode shows audio-only UI
6. Stop button clears stream and shows start buttons again

**Race condition tests:**
- Rapid clicks on same button
- Rapid clicks on different buttons
- Start during connection
- Multiple entry points (Doctor page vs PlantDetailPage)

**Console verification:**
- No "already connecting" guard messages from duplicate attempts
- No duplicate WebSocket connections
- Clean session teardown on stop
