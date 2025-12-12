# 🚀 LAUNCH NOW - Interactive Deployment Guide

**Status:** Ready to deploy - follow these steps in order

---

## STEP 1: Obtain Production Credentials ⏳

### 1.1 Database (Choose One)

**Option A: Neon (Recommended - Serverless PostgreSQL)**
```bash
# 1. Go to: https://neon.tech
# 2. Sign up (free tier available)
# 3. Create new project: "commito-production"
# 4. Copy connection string (starts with postgresql://)
# 5. Save it - you'll need it in Step 2
```

**Option B: Supabase**
```bash
# 1. Go to: https://supabase.com
# 2. Sign up (free tier available)
# 3. Create new project: "commito-production"
# 4. Go to Settings → Database → Connection string (URI)
# 5. Copy connection string
```

**Option C: Heroku Postgres**
```bash
# If you'll deploy to Heroku, this is automatic
heroku addons:create heroku-postgresql:essential-0
heroku config:get DATABASE_URL
```

**✅ Once you have your DATABASE_URL, paste it here:**
```
DATABASE_URL=postgresql://___________
```

---

### 1.2 OpenAI API Key

**Get your API key:**
```bash
# 1. Go to: https://platform.openai.com/api-keys
# 2. Sign in or create account
# 3. Click "Create new secret key"
# 4. Name it: "Commito Production"
# 5. Copy the key (starts with sk-proj- or sk-)
# 6. IMPORTANT: Save it now - you can't view it again!
```

**✅ Once you have your OpenAI key, paste it here:**
```
OPENAI_API_KEY=sk-proj-___________
```

---

### 1.3 Stripe Secret Key

**Get your Stripe key:**
```bash
# 1. Go to: https://dashboard.stripe.com/apikeys
# 2. Sign in or create account
# 3. Toggle to "Production" mode (top right)
# 4. Copy "Secret key" (starts with sk_live_)
# 5. Note: Use TEST mode (sk_test_) for testing first
```

**✅ Once you have your Stripe key, paste it here:**
```
STRIPE_SECRET_KEY=sk_live___________  # or sk_test_ for testing
```

---

### 1.4 Apple Developer Account (iOS)

**Required for iOS builds:**
```bash
# 1. Go to: https://developer.apple.com/
# 2. Click "Account" → "Enroll"
# 3. Pay $99/year
# 4. Wait for approval (usually 24-48 hours)
# 5. Once approved, continue to next step
```

**After approval, get your credentials:**
```bash
# Team ID:
# 1. Go to: https://developer.apple.com/account/
# 2. Click "Membership" in sidebar
# 3. Copy "Team ID" (10 characters like ABCDE12345)

# App Store Connect App ID:
# 1. Go to: https://appstoreconnect.apple.com/
# 2. Click "My Apps" → "+" → "New App"
# 3. Fill in:
#    - Platform: iOS
#    - Name: Commito
#    - Bundle ID: com.commito.app
#    - SKU: commito-ios
# 4. After creating, note the App ID from URL
#    (https://appstoreconnect.apple.com/apps/YOUR_APP_ID)
```

**✅ Fill in your Apple credentials:**
```
APPLE_ID=your-email@example.com
APPLE_TEAM_ID=__________
ASC_APP_ID=__________
```

---

### 1.5 Google Play Developer Account (Android)

**Required for Android builds:**
```bash
# 1. Go to: https://play.google.com/console/
# 2. Sign in with Google account
# 3. Pay $25 one-time fee
# 4. Complete registration
# 5. Create app in Play Console
```

**Create service account:**
```bash
# 1. Go to: https://console.cloud.google.com/
# 2. Create project: "Commito"
# 3. Enable "Google Play Android Developer API"
# 4. Create Service Account:
#    - IAM & Admin → Service Accounts
#    - Create Service Account
#    - Name: "EAS Upload"
# 5. Create JSON key:
#    - Click service account
#    - Keys → Add Key → Create new key → JSON
#    - Download the JSON file
# 6. Link in Play Console:
#    - Play Console → Setup → API access
#    - Link the service account
#    - Grant "Release manager" permission
```

**✅ Save the JSON file:**
```bash
# Move downloaded JSON to:
mv ~/Downloads/your-service-account-*.json ./secrets/google-play-service-account.json
```

---

## STEP 2: Configure Environment Variables

### 2.1 Create Local Production Config

**Run these commands:**
```bash
# Copy template
cp .env.production.template .env.production

# Open in editor
code .env.production
```

**Fill in with YOUR credentials from Step 1:**
```bash
EXPO_PUBLIC_DOMAIN=api.commito.app  # Update after deploying backend
DATABASE_URL=postgresql://your_actual_url
OPENAI_API_KEY=sk-proj-your_actual_key
STRIPE_SECRET_KEY=sk_live_your_actual_key
NODE_ENV=production
FREE_MODE=false
PORT=5000
```

### 2.2 Store Secrets in EAS

**Install EAS CLI and login:**
```bash
npm install -g eas-cli
eas login
```

**Create secrets (use your real values):**
```bash
eas secret:create --scope project --name DATABASE_URL --value "postgresql://..."
eas secret:create --scope project --name OPENAI_API_KEY --value "sk-proj-..."
eas secret:create --scope project --name STRIPE_SECRET_KEY --value "sk_live_..."

# Verify
eas secret:list
```

---

## STEP 3: Deploy Backend

### Option A: Deploy to Fly.io (Recommended)

**Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Deploy:**
```bash
# Login
fly auth login

# Launch (interactive setup)
fly launch --name commito-api --region sjc

# Set secrets
fly secrets set \
  DATABASE_URL="your_database_url" \
  OPENAI_API_KEY="your_openai_key" \
  STRIPE_SECRET_KEY="your_stripe_key" \
  NODE_ENV=production \
  FREE_MODE=false

# Deploy
fly deploy

# Get your URL
fly info
# Save the hostname (e.g., commito-api.fly.dev)
```

**Update EXPO_PUBLIC_DOMAIN:**
```bash
# Update eas.json with your Fly.io domain
# production.env.EXPO_PUBLIC_DOMAIN = "commito-api.fly.dev"
```

### Option B: Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create commito-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Set config
heroku config:set \
  OPENAI_API_KEY="your_key" \
  STRIPE_SECRET_KEY="your_key" \
  NODE_ENV=production \
  FREE_MODE=false

# Deploy
git push heroku main

# Get URL
heroku info
```

### Option C: Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up

# Set environment variables in Railway dashboard
# https://railway.app/dashboard
```

**✅ Once deployed, save your backend URL:**
```
BACKEND_URL=https://_____________.fly.dev
```

---

## STEP 4: Run Database Migration

**After backend is deployed:**
```bash
# Set your production database URL
export DATABASE_URL="your_production_database_url"

# Run migration
npm run db:push

# Verify (you should see 6 tables created)
```

---

## STEP 5: Update EAS Configuration

**Edit eas.json with your real values:**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_DOMAIN": "commito-api.fly.dev"  // Your actual backend URL
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",  // Your actual Apple ID
        "ascAppId": "1234567890",  // Your actual ASC App ID
        "appleTeamId": "ABCDE12345"  // Your actual Team ID
      }
    }
  }
}
```

---

## STEP 6: Build with EAS

### 6.1 Verify Everything is Ready

**Run pre-flight checks:**
```bash
# Code quality
npm run typecheck && npm run lint && npm run check:format

# Expo readiness
npx expo-doctor

# Verify secrets
eas secret:list

# All should pass ✅
```

### 6.2 Build iOS

**First build (will set up credentials):**
```bash
# Build and auto-submit to App Store Connect
eas build --platform ios --profile production --auto-submit
```

**Follow prompts to:**
- Generate iOS distribution certificate
- Generate provisioning profile
- Upload to App Store Connect

### 6.3 Build Android

```bash
# Build
eas build --platform android --profile production

# After build completes, submit
eas submit --platform android --latest
```

### 6.4 Monitor Builds

```bash
# Check build status
eas build:list

# Or view in dashboard:
# https://expo.dev/accounts/opsuma/projects/commito/builds
```

---

## STEP 7: Complete App Store Listings

### iOS - App Store Connect

**Go to:** https://appstoreconnect.apple.com/

1. Select your app "Commito"
2. Go to "App Store" tab
3. Fill in:
   - App Description
   - Keywords
   - Screenshots (required: iPhone 15 Pro Max, iPad Pro)
   - Privacy Policy URL
   - Support URL
4. Submit for Review

### Android - Google Play Console

**Go to:** https://play.google.com/console/

1. Select your app "Commito"
2. Go to "Store presence" → "Main store listing"
3. Fill in:
   - App description
   - Screenshots (Phone + Tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Privacy policy URL
4. Complete content rating
5. Submit for review

---

## STEP 8: Post-Launch

### Monitor Your App

```bash
# View server logs (Fly.io)
fly logs

# Check for errors
# Monitor App Store/Play Store reviews
# Watch for crash reports in Expo dashboard
```

### Test Critical Flows

- [ ] Download app from store
- [ ] Sign up with email
- [ ] Complete onboarding
- [ ] Create commitment
- [ ] Check in
- [ ] Test AI coaching
- [ ] Test Stripe checkout

---

## Quick Command Summary

```bash
# 1. Set up EAS secrets
eas login
eas secret:create --scope project --name DATABASE_URL --value "..."
eas secret:create --scope project --name OPENAI_API_KEY --value "..."
eas secret:create --scope project --name STRIPE_SECRET_KEY --value "..."

# 2. Deploy backend (example: Fly.io)
fly auth login
fly launch --name commito-api
fly secrets set DATABASE_URL="..." OPENAI_API_KEY="..." STRIPE_SECRET_KEY="..."
fly deploy

# 3. Run database migration
export DATABASE_URL="..."
npm run db:push

# 4. Update eas.json with your backend URL and Apple/Google credentials

# 5. Build and submit
eas build --platform ios --profile production --auto-submit
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## Need Help?

- Can't get credentials? → Check service signup pages
- Build failing? → Run `eas build:list` and check logs
- Backend not working? → Check `fly logs` or hosting logs
- Database issues? → Verify DATABASE_URL connection string

---

**You're doing great! Follow each step and you'll be live soon! 🚀**
