# Local Development Setup - Committoo

**Last Updated:** December 12, 2025

This guide covers running the Expo mobile app locally against the production backend at `https://api.committoo.space`.

---

## Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Expo Go app on your phone (iOS/Android)
- Access to `https://api.committoo.space` (backend must be deployed)

---

## Step 1: Install Dependencies

```bash
cd ~/commito  # or your repo directory
npm install
```

---

## Step 2: Configure Environment

Create or update `.env` file in the repo root:

```bash
# API Base URL - Full HTTPS URL to backend
EXPO_PUBLIC_API_URL=https://api.committoo.space

# Legacy domain (for backwards compatibility)
EXPO_PUBLIC_DOMAIN=api.committoo.space

# Feature flags
FREE_MODE=true
NODE_ENV=development
```

**Important:** The client will:
1. Use `EXPO_PUBLIC_API_URL` if set (preferred - full URL)
2. Fall back to `https://${EXPO_PUBLIC_DOMAIN}` if only domain is set
3. Default to `https://api.committoo.space` if neither is set

---

## Step 3: Verify Backend is Live

Check that the production backend is responding:

```bash
# Health check (simple text response)
curl -i https://api.committoo.space/health

# Expected: HTTP 200 + "ok"

# API health check (JSON response)
curl -i https://api.committoo.space/api/health

# Expected: HTTP 200 + {"ok":true,"timestamp":"..."}
```

**If 404:** Backend needs to be redeployed with latest code. See `RENDER_DEPLOYMENT.md`.

---

## Step 4: Start Expo Dev Server

### Option A: Local Network (Recommended for WiFi)

```bash
# Clear Metro cache and start
rm -rf node_modules/.cache
npx expo start -c
```

Then:
- Scan QR code with Expo Go (Android) or Camera app (iOS)
- Ensure your phone and computer are on the same WiFi network

### Option B: Tunnel Mode (Works Anywhere)

```bash
# Use tunnel if on different networks or behind restrictive firewall
rm -rf node_modules/.cache
npx expo start -c --tunnel
```

Then scan the QR code.

---

## Step 5: Check Logs

After app loads, check Metro logs for:

```
[API] Base URL resolved: https://api.committoo.space
[API] __DEV__: true
[API] Platform.OS: ios  (or android)
```

If you see:
```
[API] No EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN set.
```

→ Check your `.env` file exists and contains `EXPO_PUBLIC_API_URL=https://api.committoo.space`

---

## Step 6: Test Login

1. Open app in Expo Go
2. Try email login or phone login
3. Check Metro console for request logs

**Expected:**
- Request shows: `POST https://api.committoo.space/api/auth/login`
- Response: 200 OK or 400 with validation error (normal)

**If "Network request failed":**
- Backend might be down → verify Step 3
- CORS issue → backend CORS should allow all origins in development (already configured)
- Wrong URL → check Metro logs show correct base URL

---

## Troubleshooting

### "Network request failed" on Login

**Root causes:**
1. Backend not deployed or crashed
2. API base URL pointing to wrong domain
3. HTTPS certificate issue (rare)

**Debug steps:**
```bash
# 1. Check backend is live
curl -i https://api.committoo.space/health

# 2. Check what URL the client is using (look in Metro logs for):
[API] Base URL resolved: https://...

# 3. Test the exact endpoint manually
curl -X POST https://api.committoo.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Should return 400 (validation error) or 200, NOT 404
```

### Can't Scan QR Code

**Try:**
```bash
# Use tunnel mode
npx expo start -c --tunnel

# Or manually type the URL shown in terminal into Expo Go
```

### Metro Bundler Crashes

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
npm install
npx expo start -c --reset-cache
```

### Backend Returns 404 for /api/health

Backend needs to be redeployed with latest code:
1. Push latest code to GitHub `main` branch
2. Render will auto-deploy
3. Wait 2-3 minutes for build
4. Re-test: `curl https://api.committoo.space/api/health`

---

## Running Local Backend (Optional)

If you want to test against a local backend instead of production:

### 1. Update `.env`

```bash
# For local backend
EXPO_PUBLIC_API_URL=http://localhost:5000

# Or for tunnel access from phone
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000
```

### 2. Start Backend

```bash
# In a separate terminal
BIND_HOST=0.0.0.0 PORT=5000 NODE_ENV=development npm run server:dev
```

Check:
```bash
curl http://localhost:5000/health
# Expected: ok
```

### 3. Restart Expo

```bash
npx expo start -c
```

**Note:** If using Expo Go on a real device, replace `localhost` with your computer's local IP (e.g., `192.168.1.100`).

---

## Quick Reference

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | Full API base URL | `https://api.committoo.space` |
| `EXPO_PUBLIC_DOMAIN` | Legacy - API hostname only | `api.committoo.space` |
| `NODE_ENV` | Environment mode | `development` |
| `FREE_MODE` | Disable paid features | `true` |

### Important URLs

| URL | Purpose |
|-----|---------|
| `https://api.committoo.space` | Production backend (Render) |
| `https://committoo-api.onrender.com` | Direct Render origin (bypass Cloudflare) |
| `https://committoo.space` | Main website/app domain |

### Key Commands

```bash
# Install deps
npm install

# Start Expo (local network)
npx expo start -c

# Start Expo (tunnel)
npx expo start -c --tunnel

# Lint + typecheck
npm run ci:verify

# Start local backend
npm run server:dev

# Test production backend
curl https://api.committoo.space/health
curl https://api.committoo.space/api/health
```

---

## Next Steps

1. ✅ App loads in Expo Go
2. ✅ Base URL shows `https://api.committoo.space` in logs
3. ✅ Login succeeds (or returns validation error, not network error)
4. 🚀 Continue development!

For production builds and EAS configuration, see:
- `EAS_SECRETS_SETUP.md`
- `RENDER_DEPLOYMENT.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
