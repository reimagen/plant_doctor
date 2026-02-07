# Gemini Version 3 Production Upgrade Plan

## Executive Summary

Upgrade all Gemini model usage from 2.x versions to Gemini 3 for production deployment. The codebase already has excellent centralization - all model names are configured in a single file.

---

## Current State

### Models in `functions/shared/gemini-config.json`

| Key | Current Model | Usage |
|-----|---------------|-------|
| `liveAudio` | `gemini-2.5-flash-native-audio-preview-12-2025` | Live audio/video sessions (Plant Doctor, Rehab Specialist) |
| `content` | `gemini-2.0-flash` | Care guides, rescue plans (Cloud Functions) |
| `contentPreview` | `gemini-3-flash-preview` | Already on v3 preview! |

### Files Using Gemini Config (8 total)
- `lib/gemini-content.ts`
- `lib/gemini-live.ts`
- `hooks/usePlantDoctor.ts`
- `hooks/useRehabSpecialist.ts`
- `hooks/useCareGuide.ts`
- `hooks/useAppState.ts`
- `functions/src/index.ts`
- `websocket-proxy/index.js`
- `app/api/gemini/content/route.ts`

### SDK Versions
- Main app: `@google/genai@1.37.0`
- Functions: `@google/genai@1.39.0`
- Websocket proxy: `@google/genai@1.39.0`

---

## Target State (Gemini 3 Production)

### Proposed New Config

```json
{
  "models": {
    "liveAudio": "gemini-3-flash-native-audio",
    "content": "gemini-3-flash",
    "contentPreview": "gemini-3-flash-preview"
  },
  "liveEndpoints": {
    "plantDoctor": { "path": "/plant-doctor", "modelKey": "liveAudio" },
    "rehabSpecialist": { "path": "/rehab-specialist", "modelKey": "liveAudio" }
  },
  "api": {
    "contentRoute": "/api/gemini/content",
    "cloudFunctionName": "geminiContent",
    "cloudFunctionRegion": "us-central1"
  }
}
```

> **Note:** Confirm exact Gemini 3 model names from Google's documentation before implementation. Model names above are placeholders based on naming conventions.

---

## Upgrade Phases

### Phase 1: Pre-Upgrade Preparation

#### 1.1 Verify Gemini 3 Model Availability
- [ ] Check Google AI Studio for available Gemini 3 models
- [ ] Confirm exact model IDs:
  - Live audio model (native audio support)
  - Content generation model (stable)
- [ ] Verify API version requirements (`v1beta` vs `v1` vs other)

#### 1.2 SDK Compatibility Check
- [ ] Update `@google/genai` to latest version across all packages:
  - `package.json` (main)
  - `functions/package.json`
  - `websocket-proxy/package.json`
- [ ] Review SDK changelog for breaking changes
- [ ] Check if API version hardcode needs updating:
  - `lib/gemini-live.ts:137` (`apiVersion: 'v1beta'`)
  - `websocket-proxy/index.js:13` (`apiVersion: 'v1beta'`)

#### 1.3 Create Backup Configuration
```bash
cp functions/shared/gemini-config.json functions/shared/gemini-config.v2-backup.json
```

---

### Phase 2: Staged Rollout

#### 2.1 Content Generation First (Lower Risk)
**Why:** Content generation is stateless and easier to test/rollback.

1. Update `gemini-config.json`:
   ```diff
   - "content": "gemini-2.0-flash",
   + "content": "gemini-3-flash",
   ```

2. Test locally:
   - [ ] Care guide generation works
   - [ ] Rescue plan generation works
   - [ ] Response schema is maintained (JSON output)

3. Deploy to staging/preview environment

4. Verify in staging:
   - [ ] Quality of generated content
   - [ ] Response times acceptable
   - [ ] No API errors in logs

5. Deploy to production

#### 2.2 Live Audio Second (Higher Risk)
**Why:** Live sessions are stateful and user-facing. Requires careful testing.

1. Update `gemini-config.json`:
   ```diff
   - "liveAudio": "gemini-2.5-flash-native-audio-preview-12-2025",
   + "liveAudio": "gemini-3-flash-native-audio",
   ```

2. Test locally:
   - [ ] Plant Doctor livestream connects
   - [ ] Audio/video input works
   - [ ] Tool calls (`propose_plant`) execute correctly
   - [ ] Rehab Specialist livestream connects
   - [ ] Tool calls (`verify_rehab`, `create_rescue_plan`, `mark_rescue_task_complete`) work

3. Deploy websocket-proxy first (handles live connections)

4. Deploy main app

5. Monitor:
   - [ ] WebSocket connection stability
   - [ ] Reconnection logic still works
   - [ ] No unexplained session drops

---

### Phase 3: API Version Update (If Required)

If Gemini 3 requires a different API version:

#### Files to Update

| File | Line | Current | New |
|------|------|---------|-----|
| `lib/gemini-live.ts` | 137 | `apiVersion: 'v1beta'` | `apiVersion: 'v1'` |
| `websocket-proxy/index.js` | 13 | `apiVersion: 'v1beta'` | `apiVersion: 'v1'` |

#### Suggested Improvement
Consider moving `apiVersion` to the config file for future flexibility:

```json
{
  "models": { ... },
  "apiVersion": "v1",
  "liveEndpoints": { ... }
}
```

---

## Rollback Plan

### Quick Rollback (< 2 minutes)
If issues occur post-deployment:

1. Revert `gemini-config.json` to previous values
2. Redeploy affected services

### Preserved Backup Commands
```bash
# Restore from backup
cp functions/shared/gemini-config.v2-backup.json functions/shared/gemini-config.json

# Or git revert
git checkout HEAD~1 -- functions/shared/gemini-config.json
```

---

## Testing Checklist

### Functional Tests

#### Content Generation
- [ ] `/api/gemini/content` returns valid care guide
- [ ] `/api/gemini/content` returns valid rescue plan
- [ ] JSON schema validation passes on responses
- [ ] Error handling works for malformed requests

#### Live Sessions (Plant Doctor)
- [ ] Session connects successfully
- [ ] Camera/microphone input processed
- [ ] Audio responses play correctly
- [ ] `propose_plant` tool call triggers correctly
- [ ] Plant gets added to inventory on confirmation
- [ ] Session disconnection is clean

#### Live Sessions (Rehab Specialist)
- [ ] Session connects successfully
- [ ] Sick plant context is sent correctly
- [ ] `verify_rehab` tool call works
- [ ] `create_rescue_plan` tool call works
- [ ] `mark_rescue_task_complete` tool call works
- [ ] Task completion updates UI correctly

### Performance Tests
- [ ] Content generation latency < 5s
- [ ] Live session first response < 2s
- [ ] No memory leaks in long sessions (> 5 minutes)

---

## Monitoring Post-Upgrade

### Metrics to Watch
- API error rates (Google Cloud Console / Firebase)
- WebSocket connection failures
- Average session duration
- Content generation success rate

### Alerts to Set
- Error rate > 5% for content generation
- WebSocket failures > 10% of connection attempts
- Latency P95 > 10s for content generation

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Pre-Upgrade Prep | 1 day | Access to Gemini 3 models |
| Content Generation Rollout | 1 day | Phase 1 complete |
| Live Audio Rollout | 2 days | Phase 2.1 stable for 24h |
| Monitoring & Stabilization | 3 days | All phases deployed |

**Total:** ~1 week for safe rollout

---

## Open Questions

1. **Exact Gemini 3 model names?**
   - What is the production-ready Gemini 3 model for native audio?
   - Is there a distinct model for live vs content generation?

2. **API version requirements?**
   - Does Gemini 3 require `v1` instead of `v1beta`?

3. **Pricing changes?**
   - Any cost differences between 2.x and 3.x models?

4. **Feature parity?**
   - Does Gemini 3 support all current features (native audio, tool calls, JSON schema)?

---

## Files to Modify

| File | Change |
|------|--------|
| `functions/shared/gemini-config.json` | Update model names |
| `lib/gemini-live.ts` | Update `apiVersion` if needed |
| `websocket-proxy/index.js` | Update `apiVersion` if needed |
| `package.json` | Update SDK version |
| `functions/package.json` | Update SDK version |
| `websocket-proxy/package.json` | Update SDK version |

---

## Success Criteria

- [ ] All Gemini models upgraded to version 3
- [ ] Zero increase in error rates
- [ ] User-facing latency within acceptable bounds
- [ ] All features working (content gen, live audio, tool calls)
- [ ] Monitoring in place for ongoing health

