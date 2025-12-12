# Quick Build Commands Reference

## Prerequisites Checklist ✅
Before running any build commands, ensure:
- [ ] All code quality checks pass: `npm run typecheck && npm run lint && npm run check:format`
- [ ] Expo doctor passes: `npx expo-doctor`
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] Production secrets configured: `eas secret:list`
- [ ] eas.json updated with real credentials
- [ ] Backend deployed and accessible

---

## Build Commands

### iOS Production Build (Auto-Submit)
```bash
eas build --platform ios --profile production --auto-submit
```
**What it does:**
- Builds iOS app for production
- Automatically submits to App Store Connect
- Requires: Apple Developer account, eas.json configured with Apple credentials

### iOS Production Build (Manual Submit)
```bash
# Build only
eas build --platform ios --profile production

# Then submit later
eas submit --platform ios --latest
```

### Android Production Build
```bash
# Build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

### Build Both Platforms
```bash
eas build --platform all --profile production
```

---

## Development Builds

### iOS Development Build
```bash
eas build --platform ios --profile development
```
**Use case:** Testing on device without going through App Store

### Android Development Build
```bash
eas build --platform android --profile development
```
**Output:** APK file for direct installation

---

## Preview Builds (Internal Testing)

### iOS Preview
```bash
eas build --platform ios --profile preview
```

### Android Preview
```bash
eas build --platform android --profile preview
```

---

## Common Build Options

### Local Build (requires Xcode/Android Studio)
```bash
eas build --platform ios --local
```

### Clear cache and rebuild
```bash
eas build --platform ios --profile production --clear-cache
```

### Specify app version
```bash
eas build --platform ios --profile production --build-number 2
```

---

## Monitoring Builds

### Check build status
```bash
eas build:list
```

### View build details
```bash
eas build:view <build-id>
```

### Cancel a build
```bash
eas build:cancel <build-id>
```

---

## Credential Management

### Configure iOS credentials
```bash
eas credentials
```
Select: iOS → Production → Configure

### Configure Android credentials
```bash
eas credentials
```
Select: Android → Production → Configure

### Remove and regenerate credentials
```bash
eas credentials --platform ios
# Then select "Remove" and reconfigure
```

---

## Secret Management

### Create a secret
```bash
eas secret:create --scope project --name SECRET_NAME --value "secret_value"
```

### List all secrets
```bash
eas secret:list
```

### Delete a secret
```bash
eas secret:delete --scope project --name SECRET_NAME
```

---

## Submission Commands

### iOS Submission
```bash
# Auto-submit during build
eas build --platform ios --profile production --auto-submit

# Or submit after build
eas submit --platform ios --latest
```

### Android Submission
```bash
eas submit --platform android --latest
```

### Submit specific build
```bash
eas submit --platform ios --id <build-id>
```

---

## Update Commands (OTA)

### Publish update to production
```bash
eas update --branch production --message "Bug fixes"
```

### View updates
```bash
eas update:list
```

---

## Typical Production Workflow

```bash
# 1. Verify everything is ready
npm run typecheck && npm run lint && npx expo-doctor

# 2. Ensure secrets are configured
eas secret:list

# 3. Build and submit iOS
eas build --platform ios --profile production --auto-submit

# 4. Build Android
eas build --platform android --profile production

# 5. Monitor builds
eas build:list

# 6. After Android build completes, submit
eas submit --platform android --latest

# 7. Monitor in dashboards
# iOS: https://appstoreconnect.apple.com/
# Android: https://play.google.com/console/
```

---

## Emergency Hotfix Workflow

```bash
# 1. Fix the bug locally
# 2. Test thoroughly
# 3. Build with increased version
eas build --platform ios --profile production --auto-submit

# 4. Request expedited review in App Store Connect
# (Usually approved within 1-4 hours for critical bugs)
```

---

## Troubleshooting

### Build fails with "Missing credentials"
```bash
eas credentials
# Reconfigure certificates
```

### Build fails with "Invalid bundle identifier"
```bash
# Verify bundle ID in app.json matches Apple Developer portal
# iOS: com.commito.app
# Android: com.commito.app
```

### Submission fails with "Invalid Apple ID"
```bash
# Update eas.json with correct Apple credentials:
# - appleId (email)
# - ascAppId (numerical ID from App Store Connect)
# - appleTeamId (10-character team ID)
```

### Android submission fails with "Service account not authorized"
```bash
# 1. Verify service account JSON exists: ./secrets/google-play-service-account.json
# 2. Link service account in Play Console → API access
# 3. Grant "Release manager" permissions
```

---

## Useful Links

- **Build Dashboard:** https://expo.dev/accounts/opsuma/projects/commito/builds
- **EAS Docs:** https://docs.expo.dev/build/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Google Play Console:** https://play.google.com/console/

---

## Notes

- **Build time:** iOS typically 15-20 minutes, Android 10-15 minutes
- **Auto-submit:** Only works if credentials are properly configured
- **Review time:** iOS 24-48 hours, Android 1-7 days
- **Expedited review:** Available for critical bugs on iOS (request in App Store Connect)
- **TestFlight:** iOS builds appear here first for internal testing
