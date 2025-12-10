# Streak Tracker

## Overview

Streak Tracker is a React Native mobile application built with Expo for tracking personal commitments and maintaining streaks. Users can create commitments in various categories (fitness, reading, meditation, etc.), check in daily/weekly/monthly, and track their progress over time. The app runs on iOS, Android, and web platforms with a shared Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with a hybrid structure:
  - Root stack navigator handles auth flow and modals
  - Bottom tab navigator for main app sections (Home, Profile)
  - Nested stack navigators within each tab
- **State Management**: 
  - TanStack React Query for server state and API caching
  - React Context for authentication state
  - AsyncStorage for persistent local storage
- **UI Components**: Custom themed components with Reanimated animations
- **Styling**: StyleSheet-based with a centralized theme system supporting light/dark modes

### Backend Architecture
- **Server**: Express.js running on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful endpoints with session-based auth via `x-session-id` header
- **File Storage**: Google Cloud Storage integration for photo uploads

### Authentication
- Simple email-based login (stores user in AsyncStorage)
- Session ID passed in request headers for API authentication
- No magic link or OAuth implemented yet (design guidelines mention future Supabase integration)

### Onboarding Flow
New users go through a 4-step onboarding flow after login:
1. **Intro**: Welcome message and value proposition
2. **Identity**: Choose an archetype (Athlete, Focused Creative, Disciplined Builder, Balanced Mind, Better Everyday)
3. **Science**: Explains why streaks work (visual feedback, loss aversion, commitment effect)
4. **Personalize**: Select goal category, enter reason, choose cadence
- Auto-creates first commitment based on selections
- Stored in user profile for personalization

### Data Models
Three main entities defined in `shared/schema.ts`:
- **Users**: id, email, displayName, avatarPreset, identityArchetype, primaryGoalCategory, primaryGoalReason, preferredCadence, onboardingCompleted
- **Commitments**: title, category, cadence (daily/weekly/monthly), date range, streak tracking
- **CheckIns**: Links to commitment, optional note and media URL

### Path Aliases
- `@/*` maps to `./client/*`
- `@shared/*` maps to `./shared/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Cloud Services
- **Google Cloud Storage**: Object storage for user-uploaded photos (check-in media)
- **Replit Sidecar**: Authentication proxy for GCS credentials at `127.0.0.1:1106`

### Key Libraries
- **expo-camera / expo-image-picker**: Photo capture for check-ins
- **expo-file-system**: File handling for uploads
- **react-native-reanimated**: Smooth animations
- **react-native-keyboard-controller**: Keyboard-aware scroll views

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: API server domain for client requests
- `REPLIT_DEV_DOMAIN` / `REPLIT_INTERNAL_APP_DOMAIN`: Replit deployment URLs