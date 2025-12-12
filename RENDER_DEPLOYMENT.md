# Render Deployment Guide - Committoo Backend

**Domain:** api.committoo.space  
**Platform:** Render Web Service  
**Stack:** Node.js + Express

---

## Step 1: Create Render Web Service

1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **mallyma1/commitolab**
5. Configure service:

### Basic Settings
```
Name: committoo-api
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: (leave blank - uses repo root)
Runtime: Node
```

### Build & Deploy
```
Build Command:
npm install && npm run server:build

Start Command:
PORT=$PORT BIND_HOST=0.0.0.0 NODE_ENV=production node server_dist/index.js
```

### Instance Type
- **Free tier** (sufficient for testing)
- **Starter** ($7/mo - recommended for production with auto-scaling)

---

## Step 2: Environment Variables

Add these in Render dashboard → Environment tab:

### Required Variables

```bash
# Automatically provided by Render
PORT=10000  # Render sets this automatically

# Server Configuration
BIND_HOST=0.0.0.0
NODE_ENV=production

# API Domain (for CORS and client config)
EXPO_PUBLIC_DOMAIN=api.committoo.space
```

### Database (Required)

**Option A: Use Render PostgreSQL (Recommended)**
1. Render → New → PostgreSQL
2. Name: `committoo-db`
3. After creation, copy the **Internal Database URL**
4. Add to web service:
```bash
DATABASE_URL=postgresql://committoo_user:xxxxx@dpg-xxxxx/committoo_db
```

**Option B: External Database (Neon/Supabase)**
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

### API Keys (Required for full functionality)

```bash
# OpenAI - Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Stripe - Get from: https://dashboard.stripe.com/apikeys
# Use TEST keys first (sk_test_...), then LIVE keys (sk_live_...)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE_OR_LIVE_KEY
```

### Optional Services

```bash
# Twilio (SMS verification - optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Feature Flags
FREE_MODE=false  # Set to true to disable paid features
```

### Cloudflare Credentials (Already Set)
```bash
CLOUDFLARE_ACCOUNT_ID=f271050e5ede6cbc49a80cd9da5464e4
CLOUDFLARE_ZONE_ID=055f0ee9fc5ca0b71c6cab28d81a00dc
CLOUDFLARE_API_TOKEN=Ncl61B2aC9mF70FjYERYAu9QvU8qV2tGUpnQSboh
CLOUDFLARE_DOMAIN=committoo.space
```

---

## Step 3: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Run `npm install && npm run server:build`
   - Start server with your start command
3. Wait 2-5 minutes for first deploy
4. Note your Render URL: `https://committoo-api.onrender.com`

---

## Step 4: Cloudflare DNS Setup

### Configure DNS (zone: committoo.space)

1. Go to Cloudflare dashboard → DNS → Records
2. Add CNAME record:

```
Type: CNAME
Name: api
Target: committoo-api.onrender.com
Proxy status: Proxied (orange cloud icon)
TTL: Auto
```

3. SSL/TLS Settings:
   - Go to SSL/TLS → Overview
   - Set to **"Full"** (not "Full (strict)" - Render uses Let's Encrypt)

4. **Optional but Recommended:** Page Rules for API
   - Go to Rules → Page Rules
   - Create rule:
     ```
     URL: api.committoo.space/api/*
     Settings:
       - Cache Level: Bypass
       - Security Level: Medium
     ```

### Wait for DNS Propagation

Check DNS is working:
```bash
# Should return Render's IP
dig api.committoo.space

# Or use browser
curl -I https://api.committoo.space/api/health
```

DNS typically propagates in 1-5 minutes with Cloudflare.

---

## Step 5: Verify Deployment

### Health Check
```bash
# Should return: {"status":"ok"}
curl https://api.committoo.space/api/health
```

### Check Logs
1. Render Dashboard → Your Service → Logs
2. Look for:
   ```
   express server serving on 0.0.0.0:10000
   Serving static Expo files with dynamic manifest routing
   ```

### Test CORS
```bash
# Should include Access-Control-Allow-Origin header
curl -I -H "Origin: https://committoo.space" https://api.committoo.space/api/health
```

---

## Step 6: Database Migration

### Option A: Using Render Shell

1. Render Dashboard → Your Service → Shell
2. Run:
```bash
npm run db:push
```

### Option B: From Local Machine

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your_render_postgres_url"

# Push schema
npm run db:push

# Unset after
unset DATABASE_URL
```

---

## Step 7: Update Mobile App Configuration

### Set EAS Secret

```bash
# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login
eas login

# Set production API domain
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.committoo.space --type string

# Verify
eas secret:list
```

### Test Locally First

```bash
# Update .env to use production backend
echo "EXPO_PUBLIC_DOMAIN=api.committoo.space" > .env

# Clear cache and start
rm -rf node_modules/.cache
npx expo start -c
```

Check logs show:
- `[API] EXPO_PUBLIC_DOMAIN value: api.committoo.space`
- `[API] Using EXPO_PUBLIC_DOMAIN: https://api.committoo.space`

### Rebuild Production App

```bash
# Build both platforms
eas build --platform all --profile production --clear-cache

# Or one at a time
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## Troubleshooting

### Build Fails on Render

**Check logs for errors:**
- Missing dependencies? Ensure `package.json` has all deps
- TypeScript errors? Run `npm run typecheck` locally first
- Build command wrong? Verify: `npm install && npm run server:build`

**Common fixes:**
```bash
# Clear build cache in Render dashboard
Settings → Build & Deploy → Clear Build Cache & Retry Deploy
```

### Server Crashes on Start

**Check environment variables:**
- `PORT` must be set (Render sets automatically)
- `BIND_HOST=0.0.0.0` must be set
- `NODE_ENV=production` must be set

**Check logs:**
```
Render Dashboard → Logs tab
Look for errors after "Starting service..."
```

### CORS Errors

**Verify CORS whitelist includes your domain:**
- Server already allows: `https://committoo.space` and `https://www.committoo.space`
- Check `server/index.ts` lines 114-142

### Database Connection Fails

**Check DATABASE_URL format:**
```bash
# Must be full connection string
postgresql://user:password@host:port/database

# For Render Postgres, use INTERNAL url (starts with postgresql://)
# NOT the external url (starts with postgres://)
```

### Health Check Returns 404

**Possible causes:**
- Server not fully started (check logs)
- DNS not propagated (wait 5 mins, try again)
- Cloudflare SSL mode wrong (set to "Full", not "Flexible")

---

## Monitoring & Maintenance

### Check Service Status
- Render Dashboard shows: **Live** (green) = healthy
- Click service → Metrics for CPU/Memory graphs

### View Real-time Logs
```bash
# In Render dashboard
Click service → Logs → Enable "Auto-scroll"
```

### Auto-deploys
Render auto-deploys on every push to `main` branch by default.

To disable:
```
Settings → Build & Deploy → Auto-Deploy: OFF
```

### Scale Up (If Needed)

Free tier limitations:
- Spins down after 15 min inactivity
- First request after spin-down takes 30-60s

Upgrade to Starter ($7/mo):
- Always on
- Better performance
- Custom domains included

---

## Quick Reference

### Render Service URLs
- Dashboard: https://dashboard.render.com/
- Service: https://dashboard.render.com/web/YOUR_SERVICE_ID
- Live URL: https://committoo-api.onrender.com
- Custom domain: https://api.committoo.space

### Important Endpoints
- Health: `GET /api/health`
- Auth login: `POST /api/auth/login`
- Dopamine: `GET /api/dopamine/today`

### Essential Commands
```bash
# Local build test
npm run server:build

# Local production test
BIND_HOST=127.0.0.1 PORT=5000 NODE_ENV=production node server_dist/index.js

# Database push
npm run db:push

# Type check
npm run typecheck
```

---

## Next Steps After Deployment

1. ✅ Verify health check works
2. ✅ Test API endpoints with Postman/curl
3. ✅ Update EAS secrets with production domain
4. ✅ Test mobile app against production backend
5. ✅ Build production mobile apps
6. ✅ Submit to App Store / Play Store

---

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com/
- Support: https://render.com/support

For app-specific issues, check logs in Render dashboard first.
