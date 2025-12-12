# Local Development Setup - Commito

**Use this guide for local development with Expo Go connecting to the production backend.**

## Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/apple-store/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Backend deployed to https://api.committoo.space

---

## Quick Start (5 Steps)

### 1. Install Dependencies

```bash
cd /workspaces/commitolab
npm install
```

### 2. Configure Environment

Ensure `.env` has the production API URL:

```bash
cat .env
```

Should contain:
```
EXPO_PUBLIC_API_URL=https://api.committoo.space
```

If not set, run:
```bash
echo "EXPO_PUBLIC_API_URL=https://api.committoo.space" >> .env
```

### 3. Clear Cache & Start Expo

```bash
# Clear Metro bundler cache
rm -rf node_modules/.cache

# Start Expo with tunnel for LAN access
npx expo start --clear --tunnel
```

**Expected Output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan QR code with Expo Go app
› Press a to open Android, i to open iOS simulator
```

### 4. Verify API Connection

In a separate terminal, test the backend health:

```bash
curl -i https://api.committoo.space/health
```

**Expected:**
```
HTTP/2 200
ok
```

```bash
curl https://api.committoo.space/api/health
```

**Expected:**
```json
{"ok":true,"timestamp":"2024-01-11T..."}
```

### 5. Scan QR & Check Logs

1. Open **Expo Go** on your phone
2. Scan the QR code from the terminal
3. Watch terminal for logs:

```
[API] Base URL resolved: https://api.committoo.space
[API] __DEV__: true
[API] Platform.OS: ios
[AI SDK] Base URL: https://api.committoo.space
```

---

## Troubleshooting

### "Network request failed"

**Cause:** CORS issue, backend down, or wrong URL.

**Fix:**
```bash
# 1. Check backend is up
curl https://api.committoo.space/health

# 2. Restart Expo with fresh cache
npx expo start --clear --tunnel

# 3. Check logs for resolved URL
# Should see: [API] Base URL resolved: https://api.committoo.space
```

### "EXPO_PUBLIC_API_URL is not set"

**Fix:**
```bash
# Add to .env
echo "EXPO_PUBLIC_API_URL=https://api.committoo.space" > .env

# Restart Expo
npx expo start --clear
```

### Expo Go can't connect

**Fix:**
```bash
# Use tunnel mode for better connectivity
npx expo start --tunnel

# Or use LAN mode if on same network
npx expo start --lan
```

### API returns 404 or CORS error

**Backend Issue:** Redeploy to Render.

**Local Fix:** Switch to local backend:
```bash
# In .env
EXPO_PUBLIC_API_URL=http://localhost:5000

# Start local server
npm run server:dev
```

---

## Environment Variables Reference

### Client (.env)

| Variable | Value | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_API_URL` | `https://api.committoo.space` | Full URL to backend API |
| `EXPO_PUBLIC_DOMAIN` | `api.committoo.space` | Legacy (hostname only) |

### Server (Render Environment)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Enables strict CORS |
| `DATABASE_URL` | `postgresql://...` | Postgres connection |
| `PORT` | `5000` | Server port |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key |

---

## Development Workflow

### 1. Start Server (Optional - Local Backend)

```bash
# Only if testing backend changes locally
npm run server:dev

# In .env, use:
EXPO_PUBLIC_API_URL=http://localhost:5000
```

### 2. Start Client

```bash
npx expo start --clear --tunnel
```

### 3. Hot Reload

- Edit files in `client/` - auto-reloads in Expo Go
- Edit files in `server/` - restart server with `npm run server:dev`

### 4. Run Tests

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Full CI verification
npm run ci:verify
```

---

## Production Testing Checklist

Before deploying to EAS:

- [ ] Backend health check works: `curl https://api.committoo.space/health`
- [ ] `.env` has `EXPO_PUBLIC_API_URL=https://api.committoo.space`
- [ ] Expo logs show correct base URL
- [ ] Login flow completes without network errors
- [ ] No CORS errors in dev console
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

---

## Common Commands

```bash
# Start Expo with cache clear
npx expo start --clear

# Start with tunnel (best for Expo Go)
npx expo start --tunnel

# Start with LAN (same network only)
npx expo start --lan

# Check TypeScript
npm run typecheck

# Lint code
npm run lint

# Full CI check
npm run ci:verify

# Test backend health
curl https://api.committoo.space/health
```

---

## Architecture Notes

### API URL Resolution (Client)

1. Reads `EXPO_PUBLIC_API_URL` from `.env`
2. Fallback to `EXPO_PUBLIC_DOMAIN` (legacy, constructs `https://${domain}`)
3. Final fallback: `https://api.committoo.space` (safe default)
4. Logs resolved URL on startup: `[API] Base URL resolved: ...`

### CORS (Server)

- **Development** (`NODE_ENV=development`): Allows all origins
- **Production**: Strict allowlist (committoo.space, www.committoo.space)

### Health Endpoints

- `/health` - Simple text response "ok" (for quick checks)
- `/api/health` - JSON response `{"ok":true,"timestamp":"..."}` (for monitoring)

---

## Need Help?

- Backend issues → Check [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- EAS builds → Check [EAS_SECRETS_SETUP.md](./EAS_SECRETS_SETUP.md)
- Config issues → Check [BUILD_CONFIGURATION.md](./BUILD_CONFIGURATION.md)
