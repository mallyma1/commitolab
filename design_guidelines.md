# Commitment Tracker - Design Guidelines

## Authentication Architecture
**Auth Required** - The app uses Supabase authentication with magic link email sign-in.

**Implementation:**
- Magic link authentication (primary method)
- Add Apple Sign-In for iOS compliance
- Add Google Sign-In for cross-platform support
- Mock auth flow in prototype using local state
- Include Privacy Policy & Terms of Service placeholder links on auth screen

**Auth Screens:**
- Login/Signup: Single screen with email input and magic link button
- Account Management: Nested in Profile screen with logout and delete account options (both require confirmation alerts)

## Navigation Architecture

**Root Navigation: Tab Bar (4 tabs)**
- **Home** - View all active commitments
- **Create** - Create new commitment (use floating action button instead of tab)
- **Check-In** - Quick access to check-in flow
- **Profile** - User settings and account management

**Floating Action Button (FAB):**
- Position: Bottom-right, elevated above tab bar
- Purpose: Primary "Create Commitment" action
- Behavior: Opens Create Commitment screen as modal

## Screen Specifications

### 1. Authentication Screen
**Purpose:** Sign in or sign up via magic link

**Layout:**
- Header: None (full-screen auth experience)
- Main content (centered vertically):
  - App logo/title
  - Subtitle explaining the app
  - Email input field
  - "Get Magic Link" button
  - Privacy policy & terms links (small text at bottom)
- Root view: Scrollable
- Safe area insets: Top = insets.top + Spacing.xl, Bottom = insets.bottom + Spacing.xl

**Components:**
- Large app title with tagline
- Email TextInput with email keyboard type
- Primary CTA button
- Helper text explaining magic link process
- Social sign-in buttons (Apple, Google) below magic link option

---

### 2. Home Screen (Commitments List)
**Purpose:** View all active commitments and their streak status

**Layout:**
- Header: Custom transparent header
  - Title: "My Commitments"
  - Right button: None (FAB handles creation)
  - No search bar
- Main content: ScrollView of commitment cards
- Empty state when no commitments exist
- Root view: Scrollable list
- Safe area insets: Top = headerHeight + Spacing.xl, Bottom = tabBarHeight + Spacing.xl

**Components:**
- Commitment cards (see Card Design section)
- Empty state illustration with "Create Your First" CTA
- Pull-to-refresh functionality

**Card Design:**
Each commitment card displays:
- Title and category badge
- Current streak (large, prominent number)
- Longest streak and days remaining (secondary stats)
- Visual progress indicator
- Touchable with subtle press feedback

---

### 3. Create Commitment Screen
**Purpose:** Create a new commitment with customization options

**Layout:**
- Header: Default navigation header
  - Left button: Back/Cancel
  - Title: "New Commitment"
  - Right button: None (submit button below form)
- Main content: Scrollable form
- Submit button: Fixed at bottom of form, not in header
- Root view: Scrollable form
- Safe area insets: Top = Spacing.xl, Bottom = tabBarHeight + Spacing.xl

**Form Fields:**
1. Commitment title (text input)
2. Category selector (horizontal scrollable chips)
3. Cadence selector (daily/weekly/monthly - segmented control style)
4. Duration in days (number input)

**Components:**
- Text input for title (large, prominent)
- Horizontal scrollable category chips with active state
- Segmented control for cadence selection
- Number input for duration
- Primary CTA button: "Create Commitment"

**Category Chips:**
- Categories: fitness, reading, meditation, sobriety, learning, creative
- Horizontal scroll
- Active state: filled background
- Inactive state: outlined

---

### 4. Check-In Screen
**Purpose:** Log daily check-in with photo proof and optional note

**Layout:**
- Header: Default navigation header
  - Left button: Back
  - Title: Commitment name
  - Right button: None
- Main content: 
  - Large photo preview area (empty state shows camera icon)
  - "Take Photo" button
  - Optional note text area
  - Submit button at bottom
- Root view: Scrollable
- Safe area insets: Top = Spacing.xl, Bottom = tabBarHeight + Spacing.xl

**Components:**
- Photo preview container (2:3 aspect ratio)
- Camera button with icon
- Multi-line text input for notes
- Primary CTA: "Complete Check-In"
- Success feedback animation after submission

**States:**
- Empty: Shows camera icon placeholder
- Photo taken: Displays preview with retake option
- Submitting: Loading state on button

---

### 5. Profile Screen
**Purpose:** User account management, stats overview, and app settings

**Layout:**
- Header: Default navigation header
  - Title: "Profile"
  - Right button: Settings icon
- Main content: Scrollable sections
  - Profile header (avatar, name, edit button)
  - Stats summary (total commitments, best streak)
  - Settings section
  - Account management (logout, delete account)
- Root view: Scrollable
- Safe area insets: Top = Spacing.xl, Bottom = tabBarHeight + Spacing.xl

**Profile Header:**
- User avatar (customizable - generate 6 preset avatars with fitness/wellness theme)
- Display name field (editable)
- Member since date

**Components:**
- Avatar selection modal
- Editable text field for name
- Stats cards showing lifetime achievements
- Settings list items (theme, notifications)
- Destructive actions (logout, delete) in red text with confirmation alerts

---

## Design System

### Color Palette
**Primary Colors:**
- Primary: `#6366F1` (Indigo) - Used for CTAs, active states, current streaks
- Secondary: `#10B981` (Emerald) - Used for success states, completed check-ins
- Accent: `#F59E0B` (Amber) - Used for streak badges, achievements

**Neutrals:**
- Background: `#F9FAFB` (Light Gray)
- Surface: `#FFFFFF` (White)
- Border: `#E5E7EB` (Gray 200)
- Text Primary: `#111827` (Gray 900)
- Text Secondary: `#6B7280` (Gray 500)

**Semantic Colors:**
- Success: `#10B981` (Emerald)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Amber)

### Typography
**Font Family:** System default (SF Pro for iOS, Roboto for Android)

**Text Styles:**
- **Title Large:** 34px, Bold - Screen titles
- **Title Medium:** 24px, Semibold - Card titles, section headers
- **Body Large:** 18px, Regular - Primary content
- **Body Medium:** 16px, Regular - Secondary content
- **Body Small:** 14px, Regular - Captions, helper text
- **Label:** 12px, Medium, All caps - Category badges, small labels

### Spacing Scale
- `Spacing.xs`: 4px
- `Spacing.sm`: 8px
- `Spacing.md`: 16px
- `Spacing.lg`: 24px
- `Spacing.xl`: 32px
- `Spacing.xxl`: 48px

### Component Specifications

**Buttons:**
- Primary: Filled background (Primary color), white text, rounded 12px, height 56px
- Secondary: Outlined with Primary color, Primary text, rounded 12px, height 56px
- Text: No background, Primary text
- Press feedback: Opacity 0.8 on press

**Cards:**
- Background: White
- Border radius: 16px
- Padding: Spacing.lg
- Drop shadow: None (use subtle border instead)
- Press feedback: Scale 0.98 on press

**Input Fields:**
- Background: Surface color
- Border: 1px Border color (focus: Primary color)
- Border radius: 12px
- Padding: Spacing.md horizontal, Spacing.sm vertical
- Height: 56px

**Category Chips:**
- Inactive: White background, gray border, gray text
- Active: Primary background, white text
- Border radius: 24px (fully rounded)
- Padding: Spacing.sm horizontal
- Height: 36px

**Floating Action Button (FAB):**
- Size: 64px diameter
- Background: Primary color
- Icon: Plus symbol (white)
- Position: Bottom-right, 16px from edges
- Drop shadow specifications:
  - shadowOffset: { width: 0, height: 2 }
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Press feedback: Scale 0.95

**Tab Bar:**
- Height: 60px + bottom safe area
- Background: White
- Border top: 1px Border color
- Icons: 24px, use Feather icons
- Active state: Primary color
- Inactive state: Gray 400

### Visual Assets

**Required Generated Assets:**
1. **User Avatars (6 presets):** Abstract wellness-themed illustrations in circular format
   - Yoga pose silhouette
   - Mountain/nature scene
   - Sunrise/zen circle
   - Running figure
   - Book/learning symbol
   - Creative palette
   - Style: Minimalist, 2-color gradients matching app theme

2. **Empty State Illustration:** Simple illustration for "no commitments yet" state
   - Centered composition
   - Motivational/uplifting aesthetic
   - Matches app color palette

**System Icons (Feather):**
- Home: home
- Create: plus
- Check-in: check-circle
- Profile: user
- Camera: camera
- Back: arrow-left
- Settings: settings
- Calendar: calendar

### Interaction Design

**Touch Targets:**
- Minimum size: 44×44px (iOS HIG standard)
- Spacing between targets: Minimum 8px

**Gestures:**
- Pull-to-refresh on Home screen
- Swipe back navigation on iOS
- Tap for selection
- Long press for additional options (future feature)

**Animations:**
- Screen transitions: 300ms ease-in-out
- Button press: Immediate visual feedback
- Streak counter: Count-up animation when updated
- Success check-in: Confetti or check mark animation

**Loading States:**
- Buttons: Show loading spinner, disable interaction
- Lists: Show skeleton screens
- Images: Show placeholder with subtle pulse

### Accessibility Requirements

**Color Contrast:**
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Clearly distinguishable

**Touch & Interaction:**
- All interactive elements meet 44×44px minimum
- Clear focus states for all inputs
- VoiceOver/TalkBack labels for all meaningful elements

**Text:**
- Support Dynamic Type (iOS) and font scaling (Android)
- Minimum font size: 14px

**Content:**
- Provide alternative text for images
- Clear error messages and validation
- Success confirmations for all actions