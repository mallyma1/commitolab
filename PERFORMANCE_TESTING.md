# Performance Testing Guide

## Overview
This document describes how to test and verify the performance improvements made to reduce onboarding and first-load latency.

## What Was Optimized

### Backend Improvements
1. **Analytics N+1 Query Fix**: Replaced per-commitment check-in queries with a single batch query
   - Before: `O(n)` queries where n = number of commitments
   - After: 2 queries total (commitments + all check-ins)
   - Added `storage.getUserCheckIns()` method

2. **Performance Logging**: Added timing logs to critical endpoints
   - `/api/commitments` - logs fetch time and count
   - `/api/check-ins/today` - logs fetch time and count
   - `/api/analytics` - logs computation time
   - `/api/onboarding/summary` - logs AI call duration
   - `/api/onboarding/recommendations` - logs AI call duration

### Frontend Improvements
1. **Non-Blocking Onboarding Flow**
   - ProfileSummaryScreen shows instant fallback profile, AI refines in background
   - RecommendationsScreen has fast local recommendations, AI polishes copy
   - Users can navigate immediately without waiting for AI

2. **Deferred Analytics Loading**
   - Analytics query configured with `staleTime: 60000ms`
   - `refetchOnMount: false` and `refetchOnWindowFocus: false`
   - Profile screen shows gracefully with loading state

3. **Reduced Timeout**
   - AI timeout reduced from 12s to 10s after backend optimizations
   - Timeout now acts as true safety net, not expected wait time

## Testing Scenarios

### 1. Fast Path (Warm Backend)
**Expected behavior**: Onboarding completes and main screen renders in 1-3 seconds

**Steps**:
1. Complete onboarding flow
2. Observe ProfileSummaryScreen - should show immediately with "Finishing with AI" banner
3. Navigate to Recommendations - should show instant recommendations
4. Complete onboarding and land on home screen
5. Check server logs for timing

**Success criteria**:
- ProfileSummaryScreen renders < 500ms after ToneScreen
- Recommendations screen renders immediately
- Home screen shows commitments list within 1-3s
- Server logs show:
  - `[commitments] fetched` < 100ms
  - `[check-ins/today] fetched` < 50ms
  - `[analytics] computed` < 200ms

### 2. Slow Network Simulation
**Expected behavior**: App remains usable even with slow AI responses

**Steps**:
1. Set `SIMULATE_AI_DELAY_MS=8000` in server environment
2. Complete onboarding
3. Verify that ProfileSummaryScreen shows quick profile immediately
4. Verify "Finishing with AI" banner appears
5. Navigate to Recommendations before AI completes
6. Verify recommendations are available from fallback

**Success criteria**:
- Quick profile visible within 500ms
- Navigation not blocked by AI delay
- Fallback recommendations appear immediately
- AI refinement happens in background

### 3. Timeout Path
**Expected behavior**: Timeout surfaces helpful UI, app still usable

**Steps**:
1. Set `SIMULATE_AI_DELAY_MS=15000` (longer than 10s timeout)
2. Complete onboarding
3. Observe timeout behavior

**Success criteria**:
- After 10s, ProfileSummaryScreen shows timeout notice
- User can still navigate to Recommendations
- Retry button is available
- Fallback profile and recommendations are functional

### 4. First Load After Login
**Expected behavior**: Main app renders quickly, analytics loads in background

**Steps**:
1. Log out and log back in
2. Observe main screen load time
3. Watch ProfileScreen analytics section

**Success criteria**:
- Home screen (commitments list) renders within 1-3s
- ProfileScreen renders with loading state for stats
- Analytics populate asynchronously without blocking

### 5. Production-Like Cold Start
**Expected behavior**: Even with cold backend, users see progress

**Steps**:
1. Restart the backend server
2. Immediately complete onboarding
3. Monitor both client UX and server logs

**Success criteria**:
- Quick profile still shows immediately (client-side)
- AI calls may take longer on cold start but don't block UI
- Server logs show timing for each endpoint
- No request exceeds 10s before timeout

## Monitoring in Production

### Server Logs to Watch
```bash
# Onboarding AI timing
[onboarding] prefetch start
[onboarding] summary { ms: <time>, model: ... }
[onboarding] recs { ms: <time>, model: ... }
[onboarding] prefetch end { durationMs: <time>, summarySource: ... }

# Critical path timing
[commitments] fetched { ms: <time>, count: <n> }
[check-ins/today] fetched { ms: <time>, count: <n> }
[analytics] computed { ms: <time> }
```

### Client-Side Metrics
- Check `aiDurationMs` from useOnboardingState
- Watch `aiTimedOut` flag - should be rare
- Monitor `summarySource` and `recommendationsSource` - "server" is ideal, "fallback" is acceptable

### Red Flags
- Analytics endpoint > 500ms consistently (indicates N+1 regression)
- Commitments fetch > 200ms (database connection issue)
- AI timeout > 10% of requests (OpenAI latency or rate limits)
- Blank screens or spinners > 3s (flow is blocking incorrectly)

## Environment Variables for Testing

Add to `.env` or server config:

```bash
# Simulate slow AI for testing (milliseconds)
SIMULATE_AI_DELAY_MS=0

# OpenAI timeout (milliseconds)
OPENAI_TIMEOUT_MS=10000

# OpenAI models (can switch to faster models for testing)
OPENAI_MODEL_PROFILE=gpt-4o-mini
OPENAI_MODEL_RECS=gpt-4o-mini
```

## Performance Targets

### Onboarding (after completing ToneScreen)
- Quick profile visible: < 500ms
- Navigate to Recommendations: immediate (no wait)
- Complete onboarding: < 3s total

### First Load (after login)
- Auth check + load stored user: < 500ms
- Home screen with commitments: < 2s
- Analytics populate: < 3s (deferred, non-blocking)

### Analytics Endpoint
- With 10 commitments, 100 check-ins: < 200ms
- With 50 commitments, 500 check-ins: < 500ms

### AI Endpoints (warm OpenAI)
- Summary generation: 2-4s typical
- Recommendations generation: 3-5s typical
- Combined onboarding AI: < 10s (timeout is safety net)

## Regression Prevention

When adding new features:

1. **Before adding blocking data fetches**:
   - Ask: "Does the app need this before showing UI?"
   - If no: defer it, use skeleton/placeholder

2. **Before adding DB queries in loops**:
   - Check for N+1 patterns
   - Batch queries when possible

3. **Before adding heavy computation**:
   - Add timing logs
   - Consider caching or precomputation

4. **Before changing onboarding flow**:
   - Verify fast fallback still shows immediately
   - Check that navigation is never blocked > 3s
