# EAS Build Configuration Guide

## Current Status
Your `eas.json` is properly structured but needs real credentials before building for production.

## Required Configuration Steps

### 1. Apple Developer Setup (iOS)

**Before you can build for iOS, complete these steps:**

1. **Create an Apple Developer Account**
   - Go to https://developer.apple.com/
   - Enroll in Apple Developer Program ($99/year)
   - Wait for approval (usually 24-48 hours)

2. **Create App in App Store Connect**
   - Go to https://appstoreconnect.apple.com/
   - Click "My Apps" → "+" → "New App"
   - Fill in app details:
     - Platform: iOS
     - Name: Commito
     - Primary Language: English
     - Bundle ID: `com.commito.app` (must match app.json)
     - SKU: `commito-ios` (unique identifier)
   - Note the **ASC App ID** (numerical ID shown in URL)

3. **Get Your Team ID**
   - Go to https://developer.apple.com/account/
   - Click "Membership" in sidebar
   - Copy your **Team ID** (10-character alphanumeric)

4. **Update eas.json with Real Values**
   ```json
   "ios": {
     "appleId": "YOUR_ACTUAL_EMAIL@example.com",
     "ascAppId": "1234567890",  // From App Store Connect
     "appleTeamId": "ABCDE12345"  // From Apple Developer
   }
   ```

### 2. Google Play Setup (Android)

**Before you can build for Android, complete these steps:**

1. **Create Google Play Developer Account**
   - Go to https://play.google.com/console/
   - Pay one-time $25 registration fee
   - Complete account setup

2. **Create App in Play Console**
   - Click "Create app"
   - Fill in details:
     - App name: Commito
     - Default language: English
     - App type: Application
     - Free or paid: Free (or Paid if charging)
   - Complete content rating questionnaire
   - Set up app access and privacy policy

3. **Create Service Account for API Access**
   ```bash
   # This allows EAS to upload builds automatically
   ```
   
   - Go to Google Cloud Console: https://console.cloud.google.com/
   - Create new project or select existing
   - Enable "Google Play Android Developer API"
   - Create Service Account:
     - Go to IAM & Admin → Service Accounts
     - Click "Create Service Account"
     - Name: "EAS Build Upload"
     - Grant role: "Service Account User"
   - Create JSON key:
     - Click on service account
     - Go to "Keys" tab
     - Click "Add Key" → "Create new key" → JSON
     - Download JSON file
   - Save JSON to: `./secrets/google-play-service-account.json`

4. **Link Service Account to Play Console**
   - Go back to Play Console
   - Go to "Setup" → "API access"
   - Click "Link" on your service account
   - Grant permissions: "Admin" (releases) or "Release manager"

### 3. EAS CLI Setup

**Install and authenticate EAS CLI:**

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Link this project to your Expo account
eas init --id e94a1503-cb55-46cb-a06d-3959f2358d4d

# Configure credentials (will prompt for Apple/Google credentials)
eas credentials
```

### 4. Environment Variables in EAS

**Set production secrets in EAS (not in code):**

```bash
# Set database URL
eas secret:create --scope project --name DATABASE_URL --value "postgres://..."

# Set OpenAI API key
eas secret:create --scope project --name OPENAI_API_KEY --value "sk-..."

# Set Stripe secret key
eas secret:create --scope project --name STRIPE_SECRET_KEY --value "sk_live_..."

# Set Twilio credentials (if using SMS)
eas secret:create --scope project --name TWILIO_ACCOUNT_SID --value "AC..."
eas secret:create --scope project --name TWILIO_AUTH_TOKEN --value "..."

# List all secrets to verify
eas secret:list
```

### 5. Update eas.json for Your Setup

**Replace placeholders in eas.json:**

1. Open `eas.json`
2. Update these values:
   - `EXPO_PUBLIC_DOMAIN` in production env → your actual API domain (e.g., `api.commito.app`)
   - `appleId` → your actual Apple ID email
   - `ascAppId` → your App Store Connect app ID (numerical)
   - `appleTeamId` → your 10-character Apple Team ID
3. Ensure `google-play-service-account.json` is in `./secrets/`

## Build Commands

Once configuration is complete:

```bash
# Build for iOS (development)
eas build --platform ios --profile development

# Build for iOS (production + auto-submit to App Store)
eas build --platform ios --profile production --auto-submit

# Build for Android (development)
eas build --platform android --profile development

# Build for Android (production)
eas build --platform android --profile production

# Submit Android build manually to Play Store
eas submit --platform android --latest

# Build both platforms simultaneously
eas build --platform all --profile production
```

## Verification Checklist

Before building for production, verify:

- [ ] Apple Developer account is active and paid
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.commito.app`
- [ ] Team ID and ASC App ID are correct in eas.json
- [ ] Google Play Developer account is active and paid
- [ ] Service account JSON file exists: `./secrets/google-play-service-account.json`
- [ ] Service account linked in Play Console with proper permissions
- [ ] EAS CLI installed and logged in
- [ ] Production domain set in eas.json
- [ ] All secrets configured in EAS (database, API keys)
- [ ] App icon and splash screen assets exist
- [ ] Privacy policy URL ready
- [ ] Terms of service URL ready

## Common Issues

**Issue: "Invalid bundle identifier"**
- Solution: Ensure `com.commito.app` is registered in Apple Developer portal

**Issue: "Service account not authorized"**
- Solution: Link service account in Play Console API access settings

**Issue: "Missing ASC App ID"**
- Solution: Create app in App Store Connect first, then get ID from URL

**Issue: "Build fails with 'missing credentials'"**
- Solution: Run `eas credentials` to configure signing certificates

## Next Steps After Build

1. **iOS**: Monitor build in Expo dashboard → wait for App Store review (24-48 hours)
2. **Android**: Build completes → upload to Play Console → submit for review
3. **Testing**: Use TestFlight (iOS) or Internal Testing (Android) before public release

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- App Store Connect: https://appstoreconnect.apple.com/
- Google Play Console: https://play.google.com/console/
