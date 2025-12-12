# EAS Secrets Setup for Production

## Important: Domain Configuration

**EXPO_PUBLIC_DOMAIN** is the API backend domain (without protocol).

- ✅ Correct: `EXPO_PUBLIC_DOMAIN=api.committoo.space`
- ❌ Wrong: `EXPO_PUBLIC_DOMAIN=https://api.committoo.space`

The client code constructs full URLs as `https://${EXPO_PUBLIC_DOMAIN}`.

## Quick Setup Commands

```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Set production API domain (required for all builds)
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.committoo.space --type string

# Verify the secret was created
eas secret:list
```

## Backend Environment Variables (Optional)

If your backend needs additional secrets (set these in your hosting provider dashboard):

```bash
# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Twilio (if using SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

## Local Development vs Production

### Local Development (.env)
```bash
# For local backend testing:
EXPO_PUBLIC_DOMAIN=localhost:5000

# For testing against production backend:
EXPO_PUBLIC_DOMAIN=api.committoo.space
```

### Production Builds (EAS)
```bash
# Set once via EAS secrets (as shown above)
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.committoo.space
```

## Verify Configuration

After setting secrets, rebuild your app:

```bash
# Clear cache and rebuild
eas build --platform all --profile production --clear-cache

# Or build specific platform
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Testing

1. **Local development:** 
   ```bash
   EXPO_PUBLIC_DOMAIN=api.committoo.space npx expo start -c
   ```

2. **Check logs in Expo app:**
   - Look for: `[API] EXPO_PUBLIC_DOMAIN value: api.committoo.space`
   - Should see: `[API] Using EXPO_PUBLIC_DOMAIN: https://api.committoo.space`

3. **Health check:**
   - Visit: https://api.committoo.space/api/health
   - Should return: `{"status":"ok"}`

## Troubleshooting

### "CRITICAL CONFIG ERROR: EXPO_PUBLIC_DOMAIN is not set"

**Solution:** Ensure the secret is set in EAS and rebuild:
```bash
eas secret:list  # Verify it exists
eas build --platform all --profile production --clear-cache
```

### API requests failing with CORS errors

**Solution:** Verify server CORS allows `https://committoo.space`:
- Server already whitelists this in `server/index.ts`
- If using custom domain, add it to the CORS origins list

### "Using localhost:5000" in production build

**Solution:** This should only happen in dev builds on simulator. Production builds should use `EXPO_PUBLIC_DOMAIN` from EAS secrets.
