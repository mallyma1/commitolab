# Production Deployment Guide - Commito

**Last Updated:** December 12, 2025  
**Status:** Ready for Production Deployment

---

## Prerequisites Completed ✅

All pre-deployment checks have been completed:

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 warnings/errors  
- ✅ Prettier: 100% formatted
- ✅ Expo Doctor: 17/17 checks passed
- ✅ Database migrations: Generated and reviewed
- ✅ API Security: All sensitive endpoints protected
- ✅ CORS: Properly configured and restricted
- ✅ Dependencies: Updated to Expo SDK 54 compatible versions

---

## Step 1: Set Up Production Environment Variables

### 1.1 Create Production Environment File

```bash
# Copy the template
cp .env.production.template .env.production

# Edit with your production values
nano .env.production
```

### 1.2 Required Values to Configure

Open `.env.production` and replace ALL placeholder values:

```bash
# API Domain - Your production backend URL
EXPO_PUBLIC_DOMAIN=api.commito.app  # or your-backend.fly.dev

# Database - Production PostgreSQL connection
DATABASE_URL=postgresql://user:pass@host:5432/commito_prod

# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Stripe Secret Key - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Set production mode
NODE_ENV=production
FREE_MODE=false
```

**Where to get credentials:**

- **Database URL**: Sign up at [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Heroku Postgres](https://www.heroku.com/postgres)
- **OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Stripe Keys**: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) (use Live mode, not Test)

### 1.3 Store Secrets in EAS

**Do NOT hardcode secrets in eas.json.** Instead, use EAS Secrets:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Create project secrets (one at a time)
eas secret:create --scope project --name DATABASE_URL --value "your_production_database_url"
eas secret:create --scope project --name OPENAI_API_KEY --value "your_openai_key"
eas secret:create --scope project --name STRIPE_SECRET_KEY --value "your_stripe_key"

# If using Twilio (optional)
eas secret:create --scope project --name TWILIO_ACCOUNT_SID --value "your_twilio_sid"
eas secret:create --scope project --name TWILIO_AUTH_TOKEN --value "your_twilio_token"

# Verify secrets are stored
eas secret:list
```

---

## Step 2: Configure Apple & Google Credentials

### 2.1 Apple Developer Setup (iOS)

**Follow the detailed guide in [EAS_CONFIGURATION_GUIDE.md](EAS_CONFIGURATION_GUIDE.md)**, then:

1. **Update eas.json with your Apple credentials:**

   Edit `eas.json` → `submit.production.ios`:
   ```json
   "ios": {
     "appleId": "your-email@example.com",
     "ascAppId": "1234567890",
     "appleTeamId": "ABCDE12345"
   }
   ```

2. **Create app in App Store Connect:**
   - Bundle ID: `com.commito.app`
   - Save the ASC App ID (numerical, from URL)

3. **Set up certificates:**
   ```bash
   eas credentials
   ```
   Follow prompts to generate iOS certificates.

### 2.2 Google Play Setup (Android)

1. **Create service account JSON** (see [EAS_CONFIGURATION_GUIDE.md](EAS_CONFIGURATION_GUIDE.md))

2. **Save to:** `./secrets/google-play-service-account.json`

3. **Verify path in eas.json:**
   ```json
   "android": {
     "serviceAccountKeyPath": "./secrets/google-play-service-account.json"
   }
   ```

### 2.3 Update Production Domain in eas.json

Edit `eas.json` → `build.production.env`:

```json
"production": {
  "env": {
      "EXPO_PUBLIC_DOMAIN": "api.committoo.space"  // Your actual production API domain
  }
}
```

---

## Step 3: Deploy Backend Server

### Deploy Backend to Render (recommended)

**Why Render:** fast HTTPS, simple env/secrets, reliable free tier.

1) Render → New → Web Service
   - Repo: commitolab (root)
   - Branch: main
2) Build: `npm install && npm run server:build`
3) Start: `PORT=$PORT BIND_HOST=0.0.0.0 NODE_ENV=production node server_dist/index.js`
4) Env vars (Render dashboard):
   - `PORT` (provided)
   - `BIND_HOST=0.0.0.0`
   - `NODE_ENV=production`
   - `EXPO_PUBLIC_DOMAIN=api.committoo.space`
   - `DATABASE_URL=<prod postgres>`
   - `OPENAI_API_KEY=<key>`
   - `STRIPE_SECRET_KEY=<key>` (if subscriptions)
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (if SMS)
5) CORS: already whitelisted in server/index.ts for `https://committoo.space` and `https://www.committoo.space`.
6) Health: `GET https://api.committoo.space/api/health` should return 200 JSON.
7) Smoke (local): run server locally then `npm run smoke:config`.

### Cloudflare DNS (committoo.space)
- CNAME `api` → Render service hostname, proxy ON (orange cloud).
- SSL/TLS: "Full". Optionally bypass cache for `/api/*`.

### Client configuration
- EAS/production: `EXPO_PUBLIC_DOMAIN=api.committoo.space` (no protocol).
- Local dev: `EXPO_PUBLIC_DOMAIN=localhost:5000`.

---

## Step 4: Run Database Migration

**Connect to your production database and run migrations:**

```bash
# Set DATABASE_URL to production
export DATABASE_URL="your_production_database_url"

# Push schema to production database
npm run db:push

# Verify tables were created
# Connect via psql or database GUI and check for:
# - users
# - commitments
# - check_ins
# - dopamine_checklist_entries
# - push_tokens
# - stoic_quotes
```

---

## Step 5: Build Mobile Apps

### 5.1 Build iOS (Production)

```bash
# Build and auto-submit to App Store Connect
eas build --platform ios --profile production --auto-submit

# Or build without auto-submit
eas build --platform ios --profile production
```

**Monitor build:**
- Go to https://expo.dev/accounts/opsuma/projects/commito/builds
- Wait for build to complete (usually 10-20 minutes)
- If auto-submit enabled, build will be submitted to App Store Connect automatically

### 5.2 Build Android (Production)

```bash
# Build for production
eas build --platform android --profile production

# After build completes, submit to Play Store
eas submit --platform android --latest
```

**Or build both platforms simultaneously:**

```bash
eas build --platform all --profile production
```

---

## Step 6: Submit to App Stores

### 6.1 iOS App Store Submission

1. **Wait for build to upload to App Store Connect**
   - Check https://appstoreconnect.apple.com/
   - Go to "My Apps" → Commito
   - Build should appear under "TestFlight" tab

2. **Complete App Store listing:**
   - App Description
   - Screenshots (iPhone 15 Pro Max + iPad Pro required)
   - Privacy Policy URL
   - Support URL
   - Keywords
   - Category: Health & Fitness

3. **Submit for Review:**
   - Go to "App Store" tab
   - Click "+" to create new version
   - Select build from TestFlight
   - Fill in "What's New in This Version"
   - Click "Submit for Review"

4. **Wait for approval** (typically 24-48 hours)

### 6.2 Android Play Store Submission

1. **Upload build to Play Console:**
   - If using `eas submit`, build is uploaded automatically
   - Otherwise, go to https://play.google.com/console/
   - Select "Commito" app
   - Go to "Release" → "Production" → "Create new release"
   - Upload APK/AAB from EAS build

2. **Complete Store Listing:**
   - App name: Commito
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (Phone + Tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Privacy Policy URL
   - Category: Health & Fitness

3. **Set up content rating:**
   - Go to "Content rating" → "Start questionnaire"
   - Answer questions about app content
   - Get rating certificate

4. **Submit for review:**
   - Go to "Release" → "Production"
   - Click "Review release"
   - Click "Start rollout to Production"

5. **Wait for approval** (typically 1-7 days)

---

## Step 7: Post-Launch Monitoring

### 7.1 Set Up Monitoring

**Backend monitoring:**

```bash
# View server logs (if using Fly.io)
fly logs

# Or Heroku
heroku logs --tail
```

**Error tracking (optional but recommended):**

1. **Set up Sentry:**
   ```bash
   npm install @sentry/react-native
   ```

2. **Add to client/App.tsx:**
   ```typescript
   import * as Sentry from "@sentry/react-native";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     enableInExpoDevelopment: false,
   });
   ```

### 7.2 Test Production App

**Critical user flows to test:**

1. ✅ Sign up with email
2. ✅ Complete onboarding (6 steps)
3. ✅ Create first commitment
4. ✅ Check in on commitment
5. ✅ View habit profile
6. ✅ Test AI coaching (if connected)
7. ✅ Upgrade flow (Stripe checkout)
8. ✅ Push notifications

**Test from real devices:**
- Download from App Store (iOS)
- Download from Play Store (Android)
- Test on actual phones, not simulators

### 7.3 Monitor First 24 Hours

**Watch for:**
- Crash rate > 1%
- API error rate > 5%
- Slow response times (> 500ms p95)
- User complaints in reviews

**Quick fixes:**
- Server issues → redeploy with fix
- App crashes → submit hotfix build (expedited review available)

---

## Step 8: Launch Checklist Summary

Mark each as complete before considering launch successful:

### Pre-Launch
- [ ] Production .env configured with real credentials
- [ ] Backend deployed and accessible
- [ ] Database migrated successfully
- [ ] Apple Developer account active ($99/year paid)
- [ ] Google Play Developer account active ($25 one-time paid)
- [ ] App Store Connect listing complete
- [ ] Google Play Console listing complete
- [ ] eas.json updated with real Apple/Google credentials
- [ ] EAS secrets configured (database, API keys)
- [ ] All build checks pass (typecheck, lint, expo-doctor)

### Build & Submit
- [ ] iOS build completed successfully
- [ ] Android build completed successfully
- [ ] iOS submitted to App Store Connect
- [ ] Android submitted to Play Console
- [ ] Privacy policy URL live and accessible
- [ ] Support email/URL functional

### Post-Launch
- [ ] App approved and live on App Store
- [ ] App approved and live on Play Store
- [ ] Backend monitoring set up
- [ ] Error tracking configured (Sentry recommended)
- [ ] All critical user flows tested on production
- [ ] Push notifications working
- [ ] Stripe checkout functional
- [ ] Analytics tracking configured

---

## Rollback Plan

If critical issues arise:

### Server Issues
```bash
# Rollback to previous version
git revert HEAD
git push heroku main  # or fly deploy
```

### App Issues
1. Fix bug locally
2. Test thoroughly
3. Submit hotfix build:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```
4. Request expedited review (available for critical bugs)

---

## Success Metrics

**Week 1 Targets:**
- Crash-free rate > 99%
- API uptime > 99.5%
- Onboarding completion > 70%
- First commitment created > 60%
- App Store rating > 4.0
- No critical bugs reported

---

## Support Resources

- **EAS Build Docs:** https://docs.expo.dev/build/
- **Expo Forums:** https://forums.expo.dev/
- **This Project Issues:** https://github.com/mallyma1/commitolab/issues
- **Stripe Docs:** https://stripe.com/docs
- **OpenAI Docs:** https://platform.openai.com/docs

---

## Final Notes

🎉 **Congratulations!** Your app is production-ready. All technical checks have passed.

**Remember:**
- Keep your `.env.production` file secure and NEVER commit it
- Monitor logs daily for the first week
- Respond to user reviews promptly
- Plan regular updates (bug fixes, features)
- Maintain Apple Developer + Google Play accounts

**You're ready to launch! 🚀**
