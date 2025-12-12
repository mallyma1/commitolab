# Commito - Commitment Tracking & Behavioral Change App

A React Native app for creating daily commitments, checking in on progress, and building lasting change through consistent action.

**Commito is the core product.** Daily and weekly commitments, check-ins, and progress tracking are the primary focus. The Dopamine Lab and Self Regulation tools are supportive, optional features.

## 📱 Quick Start - Test on Your Phone

**Want to test on your phone right now?**

1. Install **Expo Go** from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Run in this directory:
   ```bash
   ./start-expo-go.sh
   ```
3. Scan the QR code with your phone
4. Commito will open in Expo Go!

**Your phone and computer must be on the same WiFi network.**

See [Development with Expo Go](#development-with-expo-go-physical-device) below for detailed instructions and troubleshooting.

---

## 🎯 Core Features

### 1. Commitment Creation
- Guided commitment wizard with templates
- Category selection (fitness, learning, work, creative, mental health, etc.)
- Cadence options (daily, weekly, monthly)
- Duration setting (default 30 days)
- Optional photo proof modes

### 2. Daily Check-Ins
- Quick tap-to-check-in on home screen
- Optional photo proof for accountability
- Streak tracking (current and longest)
- Daily and weekly progress visibility

### 3. Progress & Insights
- Home screen showing active commitments, today's check-ins, total streaks
- Weekly trends visualization
- Category-based analytics
- Personalized tone based on user archetype (direct, calm, data-driven, hype, quiet)

### 4. AI-Powered Personalization (Scaffolded)
- `usePersonalisedSuggestions` - AI commitment ideas and nudges
- `useCommitmentAIHelper` - AI help refining commitment titles and descriptions
- `useProgressCoaching` - Daily coaching messages tailored to user tone
- Ready for LLM integration via backend `/api/ai/*` endpoints

### 5. Supporting Tools

#### Dopamine Lab
- Educational tool explaining natural dopamine and motivation
- 9 science-backed daily habits (Movement, Daylight, Meditation, Nature, Breathing, Learning, Hydration, Cold, Social)
- Weekly trends and progress tracking
- Positioned as a secondary tool in the "Tools" tab

#### Focus & Control Check-In
- 12-question assessment of self-regulation across 8 dimensions
- Interactive results with tappable development tips
- Progress tracking over time
- Positioned as a secondary tool in the "Tools" tab

## 🎨 Design System

### Navigation
- **HomeTab** (Primary): Active commitments, today's check-ins, quick actions
- **Tools** (Secondary): Dopamine Lab + Focus & Control Check-In
- **ProfileTab**: User settings, achievements, preferences

### Tone System
The app adapts copy and messaging to user archetype:
- **Direct** - Bold, no-nonsense motivation
- **Calm** - Gentle, compassionate messaging
- **Data** - Metrics-focused, analytical
- **Hype** - Energetic, celebratory
- **Quiet** - Minimal, understated

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development with Expo Go (Physical Device)

This is the easiest way to test on your phone without building native apps.

#### Quick Start (One Command)

```bash
./start-expo-go.sh
```

This script will:
1. Create `.env` if missing
2. Start the backend server
3. Launch Expo dev server with QR code
4. Stop all services when you press Ctrl+C

Then just scan the QR code with Expo Go!

#### Manual Setup (Step-by-Step)

If you prefer to run services separately:

**Step 1: Start the Backend Server**

Terminal 1:
```bash
npm run server:dev
```

The backend will start on `http://localhost:5000`. You should see:
```
express server serving on port 5000
```

**Note**: The backend will show warnings about missing `DATABASE_URL` and `OPENAI_API_KEY`. These are optional for basic testing - the app will work with in-memory data.

**Step 2: Start Expo Dev Server**

Terminal 2:
```bash
npx expo start
```

You should see:
```
Starting Metro Bundler
Waiting on http://localhost:8081

› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**Step 3: Connect Your Phone**

**iOS**:
1. Install **Expo Go** from the App Store
2. Open the Camera app
3. Point it at the QR code in your terminal
4. Tap the notification to open in Expo Go

**Android**:
1. Install **Expo Go** from Google Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code from your terminal

#### Connection Modes

**LAN (Local Network)** - Default, fastest:
- Your phone and computer must be on the same WiFi network
- Works automatically with `npx expo start`

**Tunnel Mode** - For different networks or VPN:
If LAN doesn't work (different networks, VPN, firewall issues):
```bash
npx expo start --tunnel
```

This creates a public URL via ngrok. Note: May be slower than LAN.

#### Troubleshooting

**"Unable to connect to server"**:
- Make sure backend is running (`npm run server:dev`)
- Check that `EXPO_PUBLIC_DOMAIN=localhost:5000` is in `.env`
- For tunnel mode, the app will use the ngrok URL automatically

**"Expo Go: Network Error"**:
- Ensure phone and computer are on same WiFi (LAN mode)
- Try tunnel mode: `npx expo start --tunnel`
- Disable VPN on computer if active

**"White screen on load"**:
- Backend might not be running - check Terminal 1
- Check Expo Go console logs for errors

**"Red error screen"**:
- Look at the error message in Expo Go
- Check terminal for bundler errors
- Try clearing cache: `npx expo start -c`

**Firewall blocking Metro**:
- Allow port 8081 in firewall
- Or use tunnel mode

**VPN Issues**:
- Disable VPN on your computer
- Or use tunnel mode which bypasses local network

#### Quick Commands Reference

```bash
# Start with cache clear
npx expo start -c

# Force tunnel mode
npx expo start --tunnel

# Force LAN mode (default)
npx expo start --lan

# Web version (browser only)
npx expo start --web
```

### Running on Web (Browser)
```bash
npm run expo:web
```

The app will open at http://localhost:8081

## Project Structure

```
client/                    # React Native app
├── screens/              # App screens (Home, Dopamine Lab, etc)
├── components/           # Reusable UI components
├── onboarding/           # Multi-step onboarding
├── features/ai/          # AI coaching scaffolding
├── hooks/                # Custom React hooks
├── navigation/           # Navigation setup
└── lib/tone-engine.ts    # Personalized tone & copy system

server/                   # Express backend
routes/
  ├── commitments         # Create, read, update commitments
  ├── check-ins           # Record daily check-ins
  ├── analytics           # Progress insights
  └── ai/                 # Stub endpoints for LLM integration

shared/                   # Shared types
```

## AI Coaching Endpoints

Backend prompt and endpoints for Commito coaching:

- Location: server/llm/systemPrompt.ts — Commito LLM system prompt template
- Fallback: server/llm/responseBuilder.ts — deterministic JSON builder

Endpoints:
- POST /api/ai/respond
  - Input: Full context JSON (see system prompt spec).
  - Output: JSON contract: summary_line, body, actions?, meta.
  - Behaviour: Uses OpenAI when `OPENAI_API_KEY` is set; otherwise deterministic fallback.

- GET /api/ai/coaching
  - Input: Optional header `x-session-id`.
  - Output: Same JSON contract as above.
  - Behaviour: Minimal context; guarded to work without DB and without OpenAI.

- POST /api/ai/suggestions
  - Input: Lightweight snapshot: { user_id, surface, mode, snapshot: { completion_rate_last_7_days, streak_longest_days, active_commitments_count, self_regulation_trend }, communication_preferences }
  - Output: JSON contract.
  - Behaviour: Maps snapshot to internal context and uses the same prompt system.

- POST /api/ai/commitment-help
  - Input: { user_id, draft_commitment: { title, category, target_frequency, notes? }, behaviour_state?, communication_preferences? }
  - Output: JSON contract, including `meta.extra.proposed_commitment` and `meta.extra.rationale_tags`.
  - Behaviour: Preserves intent, proposes simpler repeatable versions, keeps safety within habit coaching.

Environment:
- `OPENAI_API_KEY` — enables LLM responses (never commit this key).
- `OPENAI_MODEL_COMMITO` (optional) — override model; default: `gpt-4.1-mini`.

Quick setup examples:
```bash
# One-off run (current command only)
OPENAI_API_KEY=YOUR_KEY npm run server:dev

# Current shell session
export OPENAI_API_KEY=YOUR_KEY
npm run server:dev

# Persist in shell profile (bash)
echo 'export OPENAI_API_KEY=YOUR_KEY' >> ~/.bashrc
source ~/.bashrc
```

Security notes:
- Do not commit keys or store them in tracked .env files.
- Prefer environment variables or secret managers in production.
- Rotate keys if exposure is suspected.

Backend prompt location:
- See server/llm/systemPrompt.ts for the full Commito coaching behaviour spec.
- Use `buildCommitoSystemPrompt({ appName, regionStyle })` to customise brand/region.

Request validation:
- Zod schemas in server/llm/requestSchemas.ts validate suggestions and commitment-help request bodies.
- Invalid requests return 400 with error details.

Client SDK:
- Import typed helpers from `client/features/ai/sdk.ts`:
  - `getCoaching(sessionId?)` → CommitoAiResponse
  - `getSuggestions(request)` → CommitoAiResponse
  - `getCommitmentHelp(request)` → CommitoAiResponse
  - `sendAiContext(context)` → CommitoAiResponse
- Builder functions: `buildSuggestionsRequest()`, `buildCommitmentHelpRequest()`
- All functions handle baseUrl automatically (localhost or EXPO_PUBLIC_DOMAIN).

## Tech Stack
- **Frontend**: React Native (Expo v54), React Navigation, React Query v5
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Styling**: Custom theme system with light/dark modes
- **Animations**: react-native-reanimated v4
- **Icons**: Feather icons via @expo/vector-icons

## Key Features Implemented

✅ Commito-focused onboarding (5 slides)
✅ Commitment creation & templates
✅ Daily check-ins with streak tracking
✅ Home screen redesign (minimal, action-focused)
✅ Tone-aware copy system throughout app
✅ Secondary Tools tab (Dopamine Lab + Self Regulation)
✅ AI coaching scaffolding (hooks + stub endpoints)
✅ Feature info cards (What/Why/How explanations)
✅ TypeScript: 0 errors
✅ expo-doctor: All checks passing

## Next Steps for Development

1. Connect AI endpoints to LLM backend
2. Add push notifications for daily reminders
3. Implement data export (CSV reports)
4. Add celebration animations on milestones
5. Build native mobile builds (iOS/Android)
6. Deploy backend to production

---

## Build and Submit with EAS

Commito uses Expo Application Services (EAS) for building and submitting to app stores.

### Prerequisites

1. **Install EAS CLI globally**:
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo**:
   ```bash
   eas login
   ```

3. **Initialize project** (if not already done):
   ```bash
   npx eas-cli@latest init --id e94a1503-cb55-46cb-a06d-3959f2358d4d
   ```

### Environment Configuration

#### For Development Builds

Set locally before building:
```bash
export EXPO_PUBLIC_DOMAIN=localhost:5000
# or for deployed dev backend
export EXPO_PUBLIC_DOMAIN=dev.commito.app
```

#### For Production Builds

Set via EAS Secrets (recommended):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.commito.app --type string
```

Or update directly in `eas.json` under `build.production.env`.

See [BUILD_CONFIGURATION.md](BUILD_CONFIGURATION.md) for complete environment variable reference.

### Test Builds (Development Profile)

Build for testing without app store submission:

**iOS Simulator**:
```bash
eas build --profile development --platform ios
```

**Android APK**:
```bash
eas build --profile development --platform android
```

**Both platforms**:
```bash
eas build --profile development --platform all
```

### Preview Builds (Internal Testing)

Build for internal distribution (TestFlight/Internal Testing):

**iOS**:
```bash
eas build --profile preview --platform ios
```

**Android**:
```bash
eas build --profile preview --platform android
```

### Production Builds and Submission

#### Manual Build Then Submit

1. **Build for both platforms**:
   ```bash
   eas build --profile production --platform all
   ```

2. **Submit to stores** (after build completes):
   ```bash
   eas submit --platform ios --latest
   eas submit --platform android --latest
   ```

#### Automated Build and Submit

**One command for both platforms**:
```bash
npx eas-cli@latest build --platform all --auto-submit
```

This will:
- Build iOS and Android production binaries
- Automatically submit to App Store Connect and Google Play
- Use credentials from EAS or prompt for missing ones

### App Store Credentials

#### iOS (Apple)

You'll need:
- **Apple ID**: Your developer account email
- **App-Specific Password**: Generated in Apple ID settings
- **ASC App ID**: From App Store Connect (create app first)
- **Apple Team ID**: From Apple Developer account

EAS can manage these via:
```bash
eas credentials
```

Or set in `eas.json` under `submit.production.ios`.

#### Android (Google Play)

You'll need:
- **Service Account Key**: JSON file from Google Play Console
  - Go to Play Console > Setup > API Access
  - Create/download service account key
  - Save to `secrets/google-play-service-account.json` (not committed)
  - Reference in `eas.json`: `"serviceAccountKeyPath": "./secrets/google-play-service-account.json"`

Or use EAS managed credentials:
```bash
eas credentials
```

### Build Profiles Explained

- **development**: Internal testing, simulator builds, not for stores
- **preview**: Internal distribution (TestFlight/Internal Testing track)
- **production**: App store releases with auto-increment version/build numbers

See `eas.json` for profile configurations.

### Verify Before Building

Run these checks locally:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Expo health check
npx expo-doctor

# Install dependencies
npm install
```

### Common Issues

**Missing EXPO_PUBLIC_DOMAIN**:
- Set via EAS Secret or in `eas.json` env section
- This is your backend API domain (e.g., `api.commito.app`)

**Build fails with "Invalid bundle identifier"**:
- Check `app.json` ios.bundleIdentifier and android.package
- Must match Apple Developer and Google Play Console

**Auto-submit fails**:
- Ensure credentials are configured via `eas credentials`
- Check `eas.json` submit section has correct Apple/Google IDs
- For first release, may need to create app in stores first

### Monitoring Builds

View build status:
```bash
eas build:list
```

View build details:
```bash
eas build:view <build-id>
```

Cancel running build:
```bash
eas build:cancel
```

### Local Credentials vs EAS Managed

**EAS Managed** (recommended):
- EAS handles certificates and provisioning profiles
- Easier setup, no local files needed
- Run `eas credentials` to configure

**Local Credentials**:
- You provide certificates, profiles, keystores
- More control but more complex
- Not recommended for most cases

---

## License

Private - All Rights Reserved
