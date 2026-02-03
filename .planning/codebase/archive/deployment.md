# Phase 8.1: Deployment Architecture Decision

## Executive Summary

**Critical Issue Discovered:** Vercel does not support persistent WebSocket connections, which eliminates Option 2 (Backend WebSocket Proxy) from consideration **unless** we switch hosting platforms.

**Current Architecture:**
- Client-side WebSocket connections directly to Gemini Live API
- `NEXT_PUBLIC_GEMINI_API_KEY` exposed in browser (security concern)
- Server-side API routes use `GEMINI_API_KEY` (secure)

**Decision Required:** Choose deployment architecture that balances security, cost, complexity, and timeline.

---

## Problem Statement

### The Security Issue

**Current Implementation:**
```
Browser (usePlantDoctor.ts) ──WebSocket──> Gemini Live API
                                           using NEXT_PUBLIC_GEMINI_API_KEY
```

**Why This Is A Problem:**
1. API key visible in:
   - Browser DevTools (Network tab)
   - Bundled JavaScript files
   - Network traffic (WebSocket handshake)
2. Anyone can extract and abuse the key
3. Risk of unauthorized usage and cost
4. Violates security best practices

**Current Mitigation:**
- Domain restrictions in Google Cloud Console (limits key to specific domains)
- Not sufficient for production security

---

## Architectural Options Analysis

### Option 1: Keep Current Architecture (Domain-Restricted Keys)

**How It Works:**
- Continue using `NEXT_PUBLIC_GEMINI_API_KEY` client-side
- Configure Google Cloud API key restrictions:
  - HTTP referrer restrictions (e.g., `*.vercel.app/*`, `localhost/*`)
  - API quota limits
  - Usage monitoring

**Pros:**
✅ Zero deployment changes needed
✅ Works on Vercel (current plan)
✅ Fast time to market
✅ Simple architecture
✅ Google handles rate limiting

**Cons:**
❌ API key still visible in browser
❌ Domain restrictions can be spoofed (send fake referrer headers)
❌ Not suitable for commercial/sensitive applications
❌ Relies entirely on Google's restrictions
❌ If key leaks, entire app is compromised

**Security Level:** 🟡 Medium (relies on Google Cloud restrictions)

**Best For:**
- MVP/prototype deployment
- Personal projects
- Low-stakes applications
- Getting user feedback quickly

**Implementation Effort:** None (already done)

---

### Option 2: Backend WebSocket Proxy (Requires Platform Change)

**How It Works:**
```
Browser ──WebSocket──> Your Backend ──WebSocket──> Gemini Live API
                       (Next.js on Railway/Render/Cloud Run)
                       using server-side GEMINI_API_KEY
```

**Architecture:**
1. Client connects to backend WebSocket endpoint (`/api/gemini/stream`)
2. Backend authenticates client (session token, JWT, etc.)
3. Backend creates Gemini Live session with server-side API key
4. Backend proxies all messages bidirectionally
5. API key never exposed to client

**Hosting Platform Options:**

| Platform | WebSocket Support | Ease of Migration | Monthly Cost (Est.) |
|----------|-------------------|-------------------|---------------------|
| **Railway** | ✅ Excellent | Very Easy | $5-20 |
| **Render** | ✅ Excellent | Very Easy | $7-25 |
| **Fly.io** | ✅ Excellent | Moderate | $0-15 |
| **Google Cloud Run** | ✅ Good | Moderate | $0-20 |
| **AWS App Runner** | ✅ Good | Complex | $10-30 |
| **DigitalOcean** | ✅ Good | Easy | $5-12 |

**Pros:**
✅ API key completely hidden from client
✅ Full control over authentication
✅ Can add monitoring, logging, abuse detection
✅ Production-grade security
✅ Backend can enforce business logic
✅ Audit trail of all API usage

**Cons:**
❌ Must leave Vercel (or run hybrid setup)
❌ More complex architecture
❌ Additional hosting costs
❌ Higher latency (extra network hop)
❌ Requires refactoring hooks (usePlantDoctor, useRehabSpecialist)
❌ Backend becomes bottleneck for media streaming
❌ More infrastructure to maintain

**Security Level:** 🟢 High (API key never exposed)

**Best For:**
- Production applications
- Commercial products
- Apps with sensitive data
- Enterprise deployments

**Implementation Effort:** High (2-4 days of work)

**Files to Modify:**
- Create: `app/api/gemini/stream/route.ts` (WebSocket handler)
- Modify: `hooks/usePlantDoctor.ts` (connect to backend instead of Gemini)
- Modify: `hooks/useRehabSpecialist.ts` (connect to backend instead of Gemini)
- Modify: `lib/gemini-live.ts` (potentially split into client/server versions)
- Add: Authentication middleware
- Add: Session management

---

### Option 3: Hybrid Approach (Backend Session Tokens)

**How It Works:**
```
Browser ──HTTP──> Backend: Request session token
Backend ──API──> Gemini: Create session, get token
Backend ──HTTP──> Browser: Return session token
Browser ──WebSocket──> Gemini Live API (using session token)
```

**Note:** This approach depends on whether Gemini Live API supports token-based authentication. **Requires investigation.**

**Pros:**
✅ API key stays on backend
✅ Lower latency than full proxy
✅ Could work on Vercel (token endpoint is simple HTTP)
✅ Less bandwidth on backend

**Cons:**
❌ Unknown if Gemini Live supports this pattern
❌ Token could still be intercepted
❌ Complex token refresh logic
❌ Still exposes some security surface

**Security Level:** 🟡 Medium-High (depends on token implementation)

**Best For:**
- If Gemini supports it and Vercel is required

**Implementation Effort:** Medium (1-2 days, IF Gemini supports it)

**⚠️ Requires Research:** Need to verify if Gemini Live API supports session token authentication.

---

### Option 4: Delay Decision (Deploy Now, Migrate Later)

**How It Works:**
1. Deploy to Vercel with current architecture immediately
2. Use domain-restricted `NEXT_PUBLIC_GEMINI_API_KEY`
3. Set aggressive quotas in Google Cloud Console
4. Monitor usage closely
5. Plan migration to Option 2 as Phase 10+ if needed

**Pros:**
✅ Fastest time to market
✅ Get user feedback immediately
✅ Learn usage patterns before architecting for scale
✅ Can validate product-market fit first
✅ Make informed decision based on real data

**Cons:**
❌ Security risk during initial deployment
❌ Migration later is disruptive
❌ May accumulate users on insecure platform
❌ Harder to migrate after launch

**Security Level:** 🟡 Medium (temporary, with monitoring)

**Best For:**
- Rapid prototyping
- User testing
- Pre-launch validation
- Projects with flexible timeline

**Implementation Effort:** None now, High later

---

## Google Cloud API Key Restrictions (Deep Dive)

### What Domain Restrictions Actually Do

**Configurable in Google Cloud Console:**

1. **HTTP Referrer Restrictions**
   - Limit key to specific domains
   - Example: `https://yourapp.vercel.app/*`, `http://localhost:*`
   - Checked on every API request

2. **API Restrictions**
   - Limit which Google APIs can be called
   - Example: Only allow "Gemini API"

3. **Quota & Rate Limits**
   - Requests per minute/day
   - Concurrent requests
   - Cost caps

### How Secure Are Domain Restrictions?

**Legitimate Uses:**
✅ Prevents key from being used on other websites
✅ Prevents third-party apps from using your key
✅ Provides basic abuse protection

**Known Vulnerabilities:**
❌ Referrer headers can be spoofed (tools like cURL, Postman)
❌ Key is still visible in browser
❌ Extracted key can be used with fake referrer header
❌ CORS doesn't prevent key extraction (different security layer)

**Google's Official Stance:**
> "API key restrictions are not a security feature. They are meant to reduce the impact of exposed keys, not prevent key exposure entirely."

### Monitoring & Alerts

**Available in Google Cloud Console:**
- Real-time usage metrics
- Cost tracking
- Unusual activity alerts
- Geographic usage patterns
- Per-endpoint usage breakdown

**Recommended Monitoring:**
1. Set up billing alerts at thresholds ($10, $50, $100)
2. Monitor requests per hour/day
3. Alert on sudden spikes
4. Review usage weekly

### Mitigation Strategies (If Staying With Option 1)

1. **Aggressive Quotas:**
   - Set daily request limits
   - Set cost caps
   - Set per-minute rate limits

2. **Monitoring:**
   - Daily usage review
   - Automated alerts
   - Cost tracking

3. **Key Rotation:**
   - Rotate keys monthly
   - Have revocation plan ready
   - Monitor for 24h after rotation

4. **User Education:**
   - Don't share deployment URLs publicly until launch
   - Limited beta testing
   - Whitelist testing domains only

---

## Platform Comparison: Vercel vs. Alternatives

### Vercel (Current Plan)

**Pros:**
- Zero-config Next.js deployment
- Excellent developer experience
- Free tier for personal projects
- Fast global CDN
- Automatic HTTPS
- Git integration

**Cons:**
- No WebSocket server support
- Serverless function time limits (10s Hobby, 60s Pro, 900s Enterprise)
- Can't run persistent connections
- Forces client-side Gemini Live connections

**Best For:** Option 1 or Option 4 (current architecture or delay decision)

---

### Railway

**Pros:**
- Full WebSocket support
- Similar UX to Vercel (Git-based deploys)
- No time limits on connections
- Can run Docker containers
- $5/month credit included (Hobby plan)
- Easy migration from Vercel

**Cons:**
- Slightly more expensive at scale
- Smaller ecosystem than Vercel
- Less mature than AWS/GCP

**Best For:** Option 2 (Backend WebSocket Proxy)

**Migration Effort:** Low (similar to Vercel)

---

### Render

**Pros:**
- Full WebSocket support
- Free tier available (with limits)
- Very similar to Vercel UX
- Automatic deploys from Git
- Good documentation

**Cons:**
- Free tier has spin-down delays (services sleep after 15 min inactivity)
- Paid tier starts at $7/month

**Best For:** Option 2 (Backend WebSocket Proxy)

**Migration Effort:** Low

---

### Google Cloud Run

**Pros:**
- Full WebSocket support
- Pay only for what you use
- Scales to zero (no idle costs)
- Google Cloud ecosystem (same as Gemini API)
- Can use same GCP project/billing

**Cons:**
- More complex setup than Railway/Render
- Requires Dockerfile
- Steeper learning curve
- More configuration needed

**Best For:** Option 2, especially if already using Google Cloud

**Migration Effort:** Moderate

---

### Fly.io

**Pros:**
- Full WebSocket support
- Edge deployment (low latency)
- Free tier (3 VMs)
- Docker-based

**Cons:**
- Requires Dockerfile
- More complex than Vercel
- Smaller community

**Best For:** Option 2, global low-latency apps

**Migration Effort:** Moderate

---

## Decision Matrix

| Criteria | Option 1: Current | Option 2: Proxy | Option 3: Tokens | Option 4: Delay |
|----------|-------------------|-----------------|------------------|-----------------|
| **Security** | 🟡 Medium | 🟢 High | 🟡 Med-High | 🟡 Medium |
| **Time to Deploy** | ✅ Immediate | ❌ 2-4 days | ⚠️ 1-2 days | ✅ Immediate |
| **Cost** | $0 (Vercel free) | $5-25/mo | $0 (Vercel free) | $0 now |
| **Complexity** | ✅ Simple | ❌ Complex | ⚠️ Medium | ✅ Simple |
| **Scalability** | ✅ Good | ⚠️ Backend bottleneck | ✅ Good | ✅ Good |
| **Latency** | ✅ Low | ⚠️ Higher | ✅ Low | ✅ Low |
| **Migration Effort** | None | High | Medium | None now, High later |
| **Platform Lock-in** | Vercel | Railway/Render/etc | Vercel | Vercel (temporary) |
| **Suitable For** | MVP, Personal | Production, Commercial | Unknown (needs research) | Prototyping |

---

## Recommended Decision Path

### If Timeline is Critical (Launch ASAP):
**Choose Option 4 (Delay Decision)**
1. Deploy to Vercel immediately with domain-restricted keys
2. Set aggressive Google Cloud quotas
3. Monitor usage daily
4. Get user feedback
5. Plan migration to Option 2 in Phase 10+ if product gains traction

**Reasoning:** Get product in users' hands, validate idea, make informed architecture decision based on real usage data.

---

### If Security is Critical (Enterprise/Commercial):
**Choose Option 2 (Backend WebSocket Proxy)**
1. Select hosting platform (recommend Railway for ease of migration)
2. Implement WebSocket proxy endpoint
3. Refactor hooks to use backend
4. Add authentication/session management
5. Deploy with full security from day 1

**Reasoning:** Production-grade security, no migration headaches later, suitable for commercial use.

---

### If Staying on Vercel is Required:
**Choose Option 1 (Domain-Restricted Keys) with Enhanced Monitoring**
1. Configure strict domain restrictions
2. Set up aggressive quotas and cost caps
3. Implement detailed monitoring and alerts
4. Key rotation schedule (monthly)
5. Accept medium security level

**Reasoning:** Best option if Vercel's developer experience and infrastructure are non-negotiable.

---

## Phase 8.1 Implementation Plan

**Depends on decision above. Three possible plans:**

### Plan A: Option 1 (Current Architecture)
**Tasks:**
1. Configure Google Cloud API key restrictions
   - Add HTTP referrer restrictions
   - Set API restrictions (Gemini API only)
   - Set quota limits (100 requests/min, 10k/day)
2. Set up monitoring
   - Google Cloud billing alerts
   - Weekly usage review schedule
3. Document security risks in README
4. Deploy to Vercel
5. Test with real Gemini API (no more mock data)

**Estimated Time:** 2-4 hours

---

### Plan B: Option 2 (Backend WebSocket Proxy)
**Tasks:**
1. Choose hosting platform (Railway recommended)
2. Create `/app/api/gemini/stream/route.ts`
   - WebSocket connection handler
   - Gemini Live session creation
   - Bidirectional message proxying
   - Session cleanup on disconnect
3. Refactor `hooks/usePlantDoctor.ts`
   - Remove direct Gemini connection
   - Connect to backend WebSocket
   - Update message protocol
4. Refactor `hooks/useRehabSpecialist.ts`
   - Same as usePlantDoctor
5. Add authentication
   - Session token generation
   - Token validation middleware
6. Update environment variables
   - Remove `NEXT_PUBLIC_GEMINI_API_KEY`
   - Keep `GEMINI_API_KEY` server-side only
7. Deploy to new platform
8. Test end-to-end with real Gemini API

**Estimated Time:** 2-4 days

**Files to Create:**
- `app/api/gemini/stream/route.ts` (WebSocket handler)
- `lib/auth.ts` (authentication helpers)

**Files to Modify:**
- `hooks/usePlantDoctor.ts`
- `hooks/useRehabSpecialist.ts`
- `.env.example` (remove NEXT_PUBLIC_GEMINI_API_KEY)
- `README.md` (update deployment instructions)

---

### Plan C: Option 4 (Delay Decision)
**Tasks:**
1. Same as Plan A (configure restrictions and monitoring)
2. Add prominent "BETA" notice in app
3. Limit initial user access (invite-only)
4. Create migration plan for future (document Option 2 steps)
5. Set review date (e.g., 30 days post-launch)

**Estimated Time:** 2-4 hours now, 2-4 days later

---

## Next Steps

**Decision Required:** Which option aligns with your priorities?

1. **Timeline** - How urgent is deployment?
2. **Security** - What security level is acceptable?
3. **Budget** - Monthly hosting budget?
4. **Platform** - Must it be Vercel?
5. **Scale** - Expected number of users in first 3 months?

**After Decision:**
- I'll create detailed implementation plan for chosen option
- Update Phase 8.1 tasks in TODOs.md
- Provide step-by-step execution checklist

---

## Document Export

This analysis should be saved to:
`/Users/lisagu/Projects/plant_doctor/.planning/codebase/deployment.md`

For team discussion and reference.
