# COMPREHENSIVE FETCH CHAIN ANALYSIS

## Current State: What Fetches On First Load

### During Onboarding (before login)
**Essential:**
- `POST /api/onboarding/summary` (AI call, 2-10s) - called via `prefetchAI`
- `POST /api/onboarding/recommendations` (AI call, 3-5s) - called via `prefetchAI`

**Non-essential:**
- None during onboarding flow itself

### Immediately After Login
**From AuthContext.login()**:
- `POST /api/auth/login` (creates user, returns user data)
- Stores user in AsyncStorage
- No additional fetches triggered

**Then navigation to Main tab triggers:**

### When HomeScreen Mounts (Critical Path)
**Essential** (called via HomeScreen component):
- `useCommitments()` → `GET /api/commitments` (user's commitments list)
- `useTodayCheckIns()` → `GET /api/check-ins/today` (today's check-ins)

**Currently loaded but non-essential:**
- None explicitly in HomeScreen

### When TabNavigator Initializes
**Eager loads (all tabs):**
- HomeStackNavigator (triggers HomeScreen)
- DopamineLabScreen (loads from AsyncStorage, no API)
- ProfileStackNavigator (triggers ProfileScreen)

### When ProfileScreen Mounts
**Non-essential:**
- `useAnalytics()` → `GET /api/analytics` (stats: bestStreak, categoryStats, weeklyData)
- `useSubscription()` → `GET /api/stripe/subscription` (checks if pro)

### Currently Triggered on Every Interaction
- Mutations invalidate and refetch `/api/commitments`, `/api/analytics`, `/api/check-ins/today`

## Bottleneck Analysis

### Slow Operations (by severity)
1. **Onboarding AI calls** (2-10s) - Already being handled with fallback
2. **Analytics endpoint** (500ms-1s for many commitments) - N+1 query issue
3. **Commitments fetch** (100-200ms) - Database query, acceptable
4. **Check-ins/today** (50-100ms) - Fast, acceptable
5. **Subscription check** (200-300ms) - Stripe API call, non-essential

## Problems

1. **All tabs load immediately** - DopamineLabScreen, ProfileScreen mount with their hooks
2. **Analytics loads on every ProfileScreen mount** - not cached, refetches
3. **No skeleton states** - users see blank spaces while data loads
4. **Synchronous cache defaults** - `staleTime: Infinity` means data never auto-refreshes
5. **Subscription check on ProfileScreen** - blocks stats display until Stripe responds

## Solution Strategy

### Phase 1: Defer Non-Critical Tab Loads
- Only load HomeStackNavigator initially
- ProfileStackNavigator and DopamineLabScreen lazy-load on first tab press

### Phase 2: Split HomeScreen Loading
- Show essential data (commitments, today's check-ins) immediately
- Skeleton for stats that depend on analytics
- Analytics loads in background

### Phase 3: Cache and Batch Strategies
- Analytics: `staleTime: 5m`, `refetchOnWindowFocus: false`
- Subscription: `staleTime: 30m`, lazy-load only in ProfileScreen
- Commitments: `staleTime: 1m` with manual refetch on mutations

### Phase 4: Selective Invalidation
- Don't refetch everything on every check-in
- Only invalidate affected queries

### Phase 5: Logging
- Track which endpoint is slow
- Log if fetchWithTimeout triggers
- Monitor real-world performance

