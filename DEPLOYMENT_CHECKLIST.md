# Commito Deployment Checklist

Complete this checklist before launching to production.

## Pre-Deployment (Before Build)

### Environment & Configuration
- [ ] Create production `.env` file with real values:
  - `EXPO_PUBLIC_DOMAIN` → production API domain (e.g., `api.commito.app`)
  - `DATABASE_URL` → production database connection string
  - `OPENAI_API_KEY` → OpenAI API key (if using AI features)
  - `STRIPE_SECRET_KEY` → Stripe secret key
  - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` → Twilio credentials (if using SMS)
  - `PORT` → production server port (default 5000)
  - `NODE_ENV` → set to `production`
  - `FREE_MODE` → set to `false` (enable paid tier)

- [ ] Update `eas.json`:
  - Replace `YOUR_PRODUCTION_DOMAIN_HERE` with actual domain
  - Set Apple ID, Apple Team ID, ASC App ID (iOS)
  - Provide Google Play service account JSON path (Android)

- [ ] Update `app.json`:
  - Verify bundle IDs match App Store Connect and Google Play Console
  - `ios.bundleIdentifier` → must be registered on Apple Developer
  - `android.package` → must be registered on Google Play

### Code Quality
- [ ] Run all checks and confirm pass:
  ```bash
  npm run typecheck
  npm run lint
  npm run check:format
  ```

- [ ] Verify no console.error logs left in critical paths (audit server/routes.ts and client main screens)

- [ ] Review recent commits for any debug code or TODOs

### Database
- [ ] Generate and review Drizzle migrations:
  ```bash
  npx drizzle-kit generate:pg
  ```

- [ ] Confirm all migrations are valid SQL (check `./migrations` folder)

- [ ] Test migration on staging database:
  ```bash
  npm run db:push
  ```

- [ ] Backup production database before migration

### API Security
- [ ] Confirm all sensitive endpoints require `x-session-id` auth header:
  - GET `/api/users/:id` ✓
  - PUT `/api/users/:id` ✓
  - PUT `/api/users/:id/onboarding` ✓
  - PUT `/api/users/:id/behavioral-profile` ✓
  - DELETE `/api/users/:id` ✓

- [ ] Verify CORS is restricted (check server/index.ts):
  - Only allow origin from EXPO_PUBLIC_DOMAIN
  - Credentials are required

- [ ] Test API endpoints with incorrect/missing auth → expect 401/403

### Secrets & Credentials
- [ ] Ensure `.env.local`, `.env.production`, and `secrets/` are in `.gitignore`

- [ ] Do NOT commit any real credentials

- [ ] Store secrets in EAS Secrets or environment manager:
  ```bash
  eas secret:create --scope project
  ```

- [ ] Confirm CI/CD pipeline (if any) does not expose secrets in logs

### Third-Party Services
- [ ] OpenAI:
  - Confirm API key is valid and has appropriate rate limits
  - Test `/api/ai/respond` endpoint with sample context

- [ ] Stripe:
  - Verify production Stripe account is configured
  - Test checkout flow with test card before launch

- [ ] Twilio (if using SMS):
  - Confirm SID and token are correct
  - Test SMS delivery with test number

- [ ] Google Cloud Storage (if using object storage):
  - Verify bucket permissions are correct
  - Test object upload/retrieval

## Building & Submission

### Pre-Build Checks
- [ ] Run `npx expo-doctor` and confirm all checks pass:
  ```bash
  npx expo-doctor
  ```

- [ ] Clean build artifacts:
  ```bash
  rm -rf node_modules
  npm install
  npm run lint
  ```

### iOS Build
- [ ] Apple Developer account is active and in good standing

- [ ] Create app in App Store Connect (if first release)

- [ ] Configure App Store Connect metadata:
  - App description, screenshots, privacy policy
  - Test user credentials for sandbox testing
  - Export compliance (encryption declaration)

- [ ] Build and submit:
  ```bash
  eas build --platform ios --auto-submit
  ```

- [ ] Monitor App Store review process (typically 24-48 hours)

### Android Build
- [ ] Google Play Developer account is active

- [ ] Create app in Google Play Console (if first release)

- [ ] Configure Play Store metadata:
  - Full description, screenshots, privacy policy
  - Content rating questionnaire
  - Target audience

- [ ] Build and submit to internal testing first:
  ```bash
  eas build --platform android
  ```

- [ ] Test internal build on real device (Firebase App Distribution or manual install)

- [ ] Submit to Google Play Console:
  ```bash
  eas submit --platform android --auto-submit
  ```

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor server logs for errors:
  ```bash
  # View logs (depends on hosting platform)
  # Heroku: heroku logs --tail
  # AWS/GCP: check CloudWatch/Stackdriver
  ```

- [ ] Check error tracking service (if configured, e.g., Sentry)

- [ ] Test core user flows:
  - Sign up → Onboarding → Create commitment → Check-in
  - AI coaching endpoints
  - Stripe checkout flow

- [ ] Monitor database query performance (slow queries)

- [ ] Check API response times (targeting <200ms)

### Ongoing Monitoring
- [ ] Set up alerts for:
  - Server errors (HTTP 5xx)
  - Database connection failures
  - API response time > 500ms
  - Failed API requests (HTTP 4xx spikes)

- [ ] Monitor user feedback channels (App Store/Play Store reviews)

- [ ] Watch for crash reports in Expo Dashboard or error tracking

- [ ] Daily check of server logs for unusual activity

## Rollback Plan

If critical issues are discovered post-launch:

1. **Immediate**: Notify users in-app (if possible) and on social channels
2. **If server-side bug**: 
   - Revert server code to last working commit
   - Run migrations rollback (if needed)
   - Deploy hotfix and test thoroughly before re-release
3. **If app-side bug**:
   - Prepare and test hotfix build locally
   - Submit new build to app stores
   - Expected review time: 1-4 hours (expedited review)
4. **If data corruption**:
   - Restore from database backup
   - Notify affected users
   - Audit data integrity

## Success Criteria

✅ App builds without errors
✅ All API endpoints respond correctly
✅ Authentication and authorization working
✅ Database migrations successful
✅ Third-party integrations (Stripe, OpenAI, Twilio) functional
✅ No unhandled exceptions in logs
✅ Response times < 300ms (p95)
✅ User signups flowing smoothly
✅ Onboarding completion rate > 70%
✅ No critical bugs reported in first week

## Post-Launch Tasks

- [ ] Monitor analytics for user engagement
- [ ] Collect user feedback and prioritize improvements
- [ ] Plan follow-up releases (v1.1, v1.2, etc.)
- [ ] Update app store listings with user reviews/ratings
- [ ] Begin marketing and user acquisition campaigns
