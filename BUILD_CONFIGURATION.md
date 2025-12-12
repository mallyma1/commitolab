# Commito Build & Deploy Configuration

## Environment Variables Required for Builds

### Required for All Builds
- `EXPO_PUBLIC_DOMAIN` - Your backend API domain (without https://)
  - Development: `localhost:5000` or your dev server
  - Staging: `staging.commito.app` (example)
  - Production: `api.commito.app` (example)

### Backend Environment Variables (Server)
Set these in your backend environment (not needed for mobile builds):
- `OPENAI_API_KEY` - OpenAI API key for AI coaching features
- `OPENAI_MODEL_COMMITO` - (Optional) Override default model (default: gpt-4.1-mini)
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

## EAS Secrets Setup

For production builds, set environment variables in EAS:

```bash
# Set API domain for production builds
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.commito.app --type string

# For staging/preview builds
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value staging.commito.app --type string --force
```

## Local Development

No EAS secrets needed for local development. Use:
```bash
EXPO_PUBLIC_DOMAIN=localhost:5000 npm run expo:start
```

## Build-Time vs Runtime

### Build-Time Variables (EXPO_PUBLIC_*)
- Must be set during `eas build`
- Embedded into the app binary
- Cannot be changed without rebuilding
- Use for: API endpoints, feature flags

### Runtime Variables (Server)
- Set on your backend server
- Can be changed without app rebuild
- Use for: API keys, database URLs, secrets

## Security Notes

- **Never commit** API keys or secrets to the repository
- **Never use** `EXPO_PUBLIC_*` for secrets (they're embedded in the app and visible)
- Store sensitive backend secrets in your server environment or secret manager
- Use EAS Secrets only for non-sensitive build-time configuration
- Add `secrets/` directory to `.gitignore` for local credential files

## Files Not to Commit

- `.env` files with real values
- `secrets/google-play-service-account.json`
- `.p8` files (Apple authentication keys)
- `.p12` files (iOS certificates)
- Keystore files (`.jks`, `.keystore`)
- Any file containing API keys or passwords
