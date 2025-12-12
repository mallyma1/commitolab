# EAS Quick Reference

## Most Common Commands

### Environment Setup (One-time)
```bash
# Install EAS CLI globally (optional)
npm install -g eas-cli

# Login to Expo/EAS
npx eas login

# Set environment variables (required before builds)
npx eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.commito.app --type string --visibility public
```

### Development Workflow
```bash
# Quick test build (iOS simulator)
npx eas build --profile development --platform ios

# Quick test build (Android emulator APK)
npx eas build --profile development --platform android

# Local development (not EAS build)
npm run dev
```

### Internal Testing (Preview Builds)
```bash
# iOS TestFlight internal testing
npx eas build --profile preview --platform ios

# Android Play Internal Testing
npx eas build --profile preview --platform android

# Both platforms
npx eas build --profile preview --platform all
```

### Production Builds
```bash
# Build only (no auto-submit)
npx eas build --profile production --platform all

# Build AND auto-submit to app stores
npx eas build --profile production --platform all --auto-submit

# iOS only with auto-submit
npx eas build --profile production --platform ios --auto-submit

# Android only with auto-submit
npx eas build --profile production --platform android --auto-submit
```

### Monitoring & Troubleshooting
```bash
# List recent builds
npx eas build:list --limit 10

# View specific build details
npx eas build:view [BUILD_ID]

# View build logs
npx eas build:view [BUILD_ID] --logs

# Check submission status
npx eas submit:list

# List environment variables/secrets
npx eas secret:list

# Validate EAS configuration
npx eas config
```

### Credentials Management
```bash
# List credentials
npx eas credentials

# iOS credentials
npx eas credentials --platform ios

# Android credentials
npx eas credentials --platform android

# Clear credentials (start fresh)
npx eas credentials --clear-credentials
```

### Local Verification (Before EAS Build)
```bash
# TypeScript check
npx tsc --noEmit --skipLibCheck

# Expo health check
npx expo-doctor

# Run linter
npm run lint

# Validate EAS config
npx eas config
```

## Build Profile Quick Reference

| Profile | Purpose | Distribution | Auto-increment | Output |
|---------|---------|--------------|----------------|--------|
| `development` | Local testing, debugging | Internal | No | Dev client, APK |
| `preview` | TestFlight, Play Internal | Internal | No | IPA, AAB |
| `production` | App Store releases | Store | Yes | IPA, AAB |

## Environment Variables by Profile

### Development
```bash
EXPO_PUBLIC_DOMAIN=localhost:5000
```

### Preview
```bash
EXPO_PUBLIC_DOMAIN=api.commito.app  # or staging URL
```

### Production
```bash
EXPO_PUBLIC_DOMAIN=api.commito.app
```

## Common Issues

### "Owner mismatch" error
**Solution:** Ensure `app.json` owner field matches EAS project owner.
```json
{
  "expo": {
    "owner": "opsuma",  // Must match EAS project
    "extra": {
      "eas": {
        "projectId": "e94a1503-cb55-46cb-a06d-3959f2358d4d"
      }
    }
  }
}
```

### "Missing environment variable" error
**Solution:** Set required env vars in EAS Secrets:
```bash
npx eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.commito.app
```

### Build fails with TypeScript errors
**Solution:** Run local typecheck first:
```bash
npx tsc --noEmit --skipLibCheck
```

### "Credentials required" error
**Solution:** Let EAS manage credentials (recommended):
- For iOS: Follow prompts during first build
- For Android: Place service account JSON in `./secrets/google-play-service-account.json`

## File Structure

```
/workspaces/commitolab/
├── eas.json                    # EAS build configuration
├── app.json                    # Expo app configuration
├── EAS_READINESS.md           # This readiness report
├── BUILD_CONFIGURATION.md      # Environment variable details
├── README.md                   # Complete guide
└── secrets/
    ├── README.md               # Credential setup guide
    └── google-play-service-account.json  # (Create this for Android auto-submit)
```

## Pre-flight Checklist

Before running `eas build`:

- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Expo Doctor passes (`npx expo-doctor`)
- [ ] EAS config valid (`npx eas config`)
- [ ] Environment variables set (`npx eas secret:list`)
- [ ] Logged into EAS (`npx eas whoami`)
- [ ] For auto-submit: Credentials configured

## Links

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [Managing Credentials](https://docs.expo.dev/app-signing/app-credentials/)

---

**Quick Help:** Run `npx eas --help` or `npx eas [command] --help` for detailed command options.
