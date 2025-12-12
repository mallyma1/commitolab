# Testing & Validation Guide

## Performance Testing Checklist

### 1. Console Logging Verification

**Objective**: Confirm that fetch timing logs are appearing correctly

**Steps**:
1. Open app in simulator/device with `npm run dev`
2. Press Tab key (or shake device) to open React Native debugger
3. Go to Console tab
4. Watch for timing logs as you navigate:

```
Expected logs:
[fetch] /api/commitments: 45ms, 12 items
[fetch] /api/check-ins/today: 67ms, 8 items
[onboarding] prefetch start - fast profile ready immediately
[fetch] /api/analytics: 234ms
```

**Validation**:
- ✓ Each fetch shows millisecond timing
- ✓ Item counts appear for list queries
- ✓ Multiple fetches can log (not blocked by first one)
- ✗ If missing: Check that `meta: { timing: true }` is in hook `useQuery` options

### 2. Home Screen Load Time

**Objective**: Verify home screen appears in <3 seconds

**Test A: Fresh app launch**
1. Kill and relaunch app
2. Note time when app starts (stopwatch)
3. Check when home screen becomes visible with commitments listed
4. Should be 2-3 seconds total

**Expected**:
- 0-1s: Splash screen
- 1-2s: Loading spinner appears
- 2-3s: Home screen visible with commitment cards

**Test B: Resume from background**
1. Open app fully
2. Go to home screen with commitments visible
3. Press home button (iOS/Android) to background app
4. Wait 5 minutes
5. Relaunch app
6. Commitments should be visible immediately (cached)

**Expected**: Instant or <500ms (using stale cache)

### 3. Non-Essential Data Loading

**Objective**: Confirm analytics, subscription load in background without blocking UI

**Test A: ProfileScreen loading**
1. Tap Profile tab
2. Should see:
   - User name, photo, settings visible immediately
   - Statistics header with loading spinner
   - After 500ms-1s: Stats populate (check-ins, streaks, active)

**Expected**: 
```
ProfileScreen visible: <300ms
Stats data appears: 500ms-1s later
No frozen spinner perception
```

**Test B: Check console**
1. Tap Profile tab
2. Watch console for:
```
[fetch] /api/analytics: 234ms
[fetch] /api/stripe/subscription: 180ms
```
3. Should appear AFTER home screen is interactive (not before)

### 4. Lazy Tab Loading

**Objective**: Verify secondary tabs only load when accessed

**Test**: Monitor React Native DevTools
1. Open app
2. DevTools → React Profiler → Components
3. HomeTab should show:
   - HomeStackNavigator: mounted
   - ProfileStackNavigator: NOT mounted (!)
   - DopamineLabScreen: NOT mounted (!)

4. Tap Profile tab
5. Now ProfileStackNavigator should mount
6. Watch for query hooks initializing (useAnalytics, useSubscription)

**Expected**:
- Home load should NOT trigger ProfileStackNavigator mount
- Clicking Profile tab causes slight delay (first initialization)
- All subsequent Profile tab access is fast (already mounted)

### 5. Cache Behavior

**Objective**: Verify that stale data is returned immediately, refetch happens in background

**Test A: Stale cache return**
1. Open app (commitments load, cached)
2. Kill backend server or disconnect WiFi
3. Navigate away from home and back
4. Commitments should still display (from stale cache)
5. Loading indicator should appear, then either:
   - Data updates if server responds
   - Or dismisses after retry timeout

**Expected**: No crash, user sees data from cache while app tries refresh

**Test B: Stale time expiration**
1. Note current commit list
2. Wait exactly 60 seconds (useCommitments staleTime)
3. Navigate away and back to home
4. Fetch should auto-trigger in background (console shows fetch)

**Expected**: 
```
[fetch] /api/commitments: 123ms
(displayed data updates)
```

### 6. Mutation Performance

**Objective**: Confirm check-ins complete quickly without waiting for analytics

**Test A: Quick check-in response**
1. Open home screen with commitments
2. Quick-check-in on any commitment (tap check button)
3. Should see:
   - Immediate response feedback
   - Streak counter updates quickly
   - "checked in today" count updates

**Expected**: <200ms user feedback (not waiting for analytics recompute)

**Test B: Analytics updates lazily**
1. Do step 2 above
2. Wait 5 seconds
3. Tap ProfileTab
4. Analytics might show "Loading" briefly
5. Stats should eventually update to show new check-in

**Expected**:
```
Mutation completes: <200ms
Analytics recomputes: 500ms-1s
Stats updated on profile: 1-2s total
```

### 7. Network Waterfall

**Objective**: Verify critical path queries happen in parallel, not sequential

**Steps**:
1. Open DevTools Network tab in simulator
2. Kill app and relaunch
3. Look at network request timeline

**Expected waterfall**:
```
[Timeline]
GET /api/auth/me          ▯▯▯▯ (auth, ~100ms)
  GET /api/commitments    ▯▯▯▯ (starts while auth happening)
  GET /api/check-ins      ▯▯ (starts same time)
  
Home screen interactive at ~2s ✓

(After profileTab tapped)
  GET /api/analytics      ▯▯▯▯▯▯▯ (~600ms)
```

**NOT Expected** (would indicate sequential blocking):
```
GET /api/auth/me          ▯▯▯▯
  GET /api/commitments              ▯▯▯▯ (waits for auth)
    GET /api/analytics              ▯▯▯▯ (waits for commitments)
Home screen: 2+ seconds
```

### 8. Search Slow Endpoints

**Objective**: Find which endpoints are actually the bottleneck

**Steps**:
1. In DevTools Network tab, sort by Duration
2. Identify any request >500ms during critical path
3. Example: If `/api/commitments` takes 2+ seconds, that's the bottleneck

**Action**:
- If commitments slow: Check database indexes, N+1 patterns, response size
- If analytics slow: Likely server-side aggregation, add caching
- If subscription slow: Stripe API latency, increase staleTime further

### 9. Regression Testing

**After any server changes**, rerun the checklist:

**Quick regression suite** (5 minutes):
1. Kill and relaunch app - check home loads in <3s
2. Tap Profile - stats load asynchronously with spinner
3. Console shows `[fetch]` logs with timing
4. No TypeScript errors: `npm run typecheck`

**Full regression suite** (15 minutes):
1. All of quick suite
2. Network waterfall shows parallel requests
3. ProfileTab lazy loads (not mounted on app start)
4. Stale cache works (disconnect network, reload)
5. Check-in mutations complete <200ms
6. Analytics data appears after 1s on profile

## Debugging Guide

### Problem: Home screen still slow (>3s)

**Debug steps**:
1. Check console logs:
   ```
   grep '\[fetch\]' logs | head -20
   ```
   - If commitments >200ms: Backend issue, check database
   - If commitments normal but home slow: Rendering bottleneck, use React Profiler
   - If no logs: Fetch hook not instrumented, check meta: { timing: true }

2. Open DevTools React Profiler:
   - Record render from app start
   - Identify which component takes longest to render
   - If HomeScreen renders slow: Check useMemo/useCallback efficiency
   - If MainTabNavigator slow: Confirm lazy loading is enabled

3. Check network:
   - Any request timing out (>10s)?
   - Any request retrying multiple times?
   - Response size >1MB? (Gzip compression should be enabled)

### Problem: ProfileScreen frozen on loading

**Debug steps**:
1. Check console for errors:
   ```
   ERROR: could not fetch analytics
   ERROR: subscription query failed
   ```

2. Confirm skeleton component renders:
   - Is ActivityIndicator showing in ProfileScreen?
   - If not: Check that `analyticsLoading` prop is being read from hook
   - If yes: Component is correctly non-blocking

3. Check React Query cache:
   ```typescript
   // In DevTools console:
   queryClient.getQueryData(['analytics'])
   ```
   - If returns data: Already cached, should show immediately
   - If returns undefined: Query hasn't run yet

4. Force retry analytics:
   ```typescript
   queryClient.refetchQueries({ queryKey: ['analytics'] })
   ```
   - If succeeds: Network works, backend is okay
   - If fails: Check network logs for error details

### Problem: Network requests sequential instead of parallel

**Debug steps**:
1. Check useQuery dependencies:
   ```typescript
   // WRONG - second query waits for first:
   const commitments = useQuery({
     queryKey: ['commitments'],
     queryFn: async () => {
       const auth = await fetchAuth()  // ← blocks here
       return fetchCommitments(auth.token)
     }
   })
   
   // RIGHT - parallel, use cached auth token:
   const commitments = useQuery({
     queryKey: ['commitments'],
     queryFn: () => fetchCommitments(token),
     enabled: !!token  // Wait for token, but don't fetch it
   })
   ```

2. Check React Navigation initialization:
   - Are all tabs initializing? (should only be HomeTab initially)
   - Look for mounting ProfileStackNavigator too early

### Problem: Excessive refetching

**Debug steps**:
1. Count console logs in 5 seconds of app idle:
   ```
   [fetch] logs should be <2 during idle
   ```
   - If >5: Something is triggering unnecessary refetches

2. Check query options:
   ```typescript
   // Each useQuery should have:
   refetchOnWindowFocus: false
   refetchInterval: false
   ```

3. Check mutation invalidation:
   ```typescript
   // useCreateCheckIn should only invalidate:
   queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] })
   // NOT:
   queryClient.invalidateQueries({ queryKey: ['commitments'] })  // Too broad
   ```

## Performance Metrics to Track

**Add to your monitoring**:

1. **Home screen First Meaningful Paint (FMP)**
   ```
   Target: <2.5 seconds
   Acceptable: <3 seconds
   Problem: >3.5 seconds
   ```

2. **Profile screen FMP**
   ```
   Target: <1 second
   (Stats load asyncly, shouldn't block)
   ```

3. **Check-in mutation latency**
   ```
   Target: <200ms
   Measure: time from user tap to streak counter update
   ```

4. **Analytics fetch latency**
   ```
   Target: <600ms
   Measure: time from ProfileTab visible to stats appearing
   ```

5. **Cache hit ratio**
   ```
   Target: 80%+
   Measure: (queries served from cache) / total queries
   ```

## Load Testing Simulation

**To simulate slower network**:

1. **iOS Simulator**: Xcode → Debug → Simulate Location & Network Link Conditioner
   - Select "3G" or "LTE" preset
   - Retest to ensure app still loads in acceptable time

2. **Android Emulator**: Tools → Network Settings → Throttling
   - Select "3G" or "4G LTE"
   - Retest performance

3. **Localhost latency injection**:
   ```typescript
   // Add to useCommitments() during testing:
   const startTime = performance.now();
   await new Promise(resolve => setTimeout(resolve, 200)); // Simulated latency
   const data = await api.get('/commitments');
   ```

Expected results:
- App should remain interactive
- No frozen spinners
- Progressive loading visible
- Should feel snappy even on 3G

## Acceptance Criteria

**Performance fix is complete when**:

✅ Home screen shows within 2-3 seconds (no frozen spinner)
✅ User can tap commitments and check in immediately (doesn't require all data)
✅ ProfileScreen appears quickly with loading state for stats
✅ Analytics and subscription load in background (don't block UI)
✅ All console logs show structured timing format
✅ Network waterfall shows parallel requests in critical path
✅ No TypeScript errors
✅ App works offline (returns cached data)
✅ User perceives constant progress (spinners, skeleton loaders)
✅ Check-in mutations complete <200ms (user feedback immediate)
