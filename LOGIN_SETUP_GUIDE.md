# Email Login Setup Guide

**Last Updated:** December 12, 2025

This guide helps you set up email login for the Committoo app.

---

## Current Issue

**Error:** `TypeError: Network request failed`

**Root Cause:** Backend is deployed but the `/api/auth/login` endpoint is crashing with a 500 error because `DATABASE_URL` is not configured on Render.

---

## Quick Diagnosis

Test these URLs to verify status:

```bash
# ✅ Should return "ok"
curl https://api.committoo.space/health

# ✅ Should return {"ok":true,"timestamp":"..."}
curl https://api.committoo.space/api/health

# ❌ Currently returns {"error":"Internal server error"}
curl -X POST https://api.committoo.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

The health endpoints work, but login fails because there's no database.

---

## Solution: Add Database to Render

### Option 1: Use Render PostgreSQL (Recommended - Free Tier Available)

#### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `committoo-db`
   - **Database:** `committoo_db`
   - **User:** `committoo_user`
   - **Region:** Same as your web service (e.g., Oregon)
   - **Instance Type:** Free (for testing) or Starter ($7/mo for production)
4. Click **"Create Database"**
5. Wait 1-2 minutes for provisioning

#### Step 2: Get Database URL

After creation, you'll see two connection strings:

- **External Database URL:** `postgresql://committoo_user:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/committoo_db`
- **Internal Database URL:** `postgresql://committoo_user:xxxxx@dpg-xxxxx/committoo_db` ⭐ **Use this one**

Copy the **Internal Database URL** (faster, no extra network hops).

#### Step 3: Add to Web Service

1. Go to your `committoo-api` web service
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the Internal Database URL
5. Click **"Save Changes"**

Render will automatically redeploy (2-3 minutes).

#### Step 4: Run Database Migrations

After deploy completes, you need to create the database tables:

**Option A: Use Render Shell**
1. In your web service, go to **"Shell"** tab
2. Run:
```bash
npm run db:push
```

**Option B: Use Local CLI**
```bash
# Set DATABASE_URL locally (use External URL for remote access)
export DATABASE_URL="postgresql://committoo_user:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/committoo_db"

# Run migrations
npm run db:push
```

#### Step 5: Test Login

```bash
# Should now return user object, not 500 error
curl -X POST https://api.committoo.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected response:
# {"user":{"id":"...","email":"test@example.com",...}}
```

---

### Option 2: Use Neon (Serverless PostgreSQL - Free Tier)

Neon is great for development and has a generous free tier.

#### Step 1: Create Neon Database

1. Go to https://neon.tech
2. Sign up / Sign in
3. Create a new project:
   - **Name:** `committoo`
   - **Region:** Choose closest to your users
4. Copy the **Connection String**:
```
postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
```

#### Step 2: Add to Render

1. Go to your `committoo-api` service → **Environment**
2. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste Neon connection string
3. Save (auto-redeploys)

#### Step 3: Run Migrations

```bash
# Use your Neon connection string
export DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:push
```

#### Step 4: Test

Same as Option 1 Step 5.

---

### Option 3: Use Supabase (Includes Auth + Storage)

Supabase provides PostgreSQL plus built-in auth/storage.

#### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Create new project:
   - **Name:** `committoo`
   - **Database Password:** Generate secure password
   - **Region:** Choose closest region
3. Wait 2-3 minutes for provisioning

#### Step 2: Get Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection String** → **URI**
3. Copy the connection string (replace `[YOUR-PASSWORD]` with your actual password):
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Step 3: Add to Render

Same as previous options - add `DATABASE_URL` to Render environment variables.

#### Step 4: Run Migrations

```bash
export DATABASE_URL="postgresql://postgres.xxxxx:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
npm run db:push
```

---

## After Database Setup

Once you have the database configured and migrations run:

### 1. Verify Backend Works

```bash
# Test login endpoint
curl -X POST https://api.committoo.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'

# Should return:
# {"user":{"id":"cuid...","email":"testuser@example.com",...}}
```

### 2. Test from Expo App

```bash
# Start Expo with tunnel
cd /workspaces/commitolab
npx expo start -c --tunnel

# Scan QR code with Expo Go
# Try logging in with any email (no password needed!)
```

### 3. Check Logs

In Metro bundler console, you should see:
```
[auth] email login start
[API] Base URL resolved: https://api.committoo.space
[auth] email login success, user id: cuid...
[auth] session stored
```

No more "Network request failed"!

---

## How Email Login Works

The current implementation is **passwordless email login**:

1. User enters email
2. App sends `POST /api/auth/login` with email
3. Backend:
   - Checks if user exists by email
   - If not, creates new user
   - Returns user object with session
4. App stores user in AsyncStorage
5. User is logged in!

**Note:** This is a simplified auth flow for development. For production, you should add:
- Email verification (send magic link/code)
- Session tokens with expiration
- CSRF protection
- Rate limiting

---

## Troubleshooting

### "Internal server error" persists after adding DATABASE_URL

**Check:**
1. Did Render finish redeploying? (Check Events tab)
2. Did you run database migrations? (`npm run db:push`)
3. Is the DATABASE_URL valid? (Test connection locally)

**Debug:**
```bash
# Check Render logs
# In Render dashboard → committoo-api → Logs
# Look for "DATABASE_URL not set" or connection errors
```

### "Network request failed" in Expo app

**Possible causes:**

1. **Backend not running**
   ```bash
   curl https://api.committoo.space/health
   # Should return "ok", not timeout
   ```

2. **Wrong API URL in app**
   - Check Metro logs for: `[API] Base URL resolved: https://api.committoo.space`
   - Should NOT say `localhost` or empty

3. **CORS blocking request**
   - Ensure Render has `NODE_ENV=development` set (for permissive CORS)
   - Check browser/Expo network inspector for CORS errors

4. **Expo Go network issues**
   - Try using tunnel mode: `npx expo start --tunnel`
   - Ensure phone has internet connection

### Database connection fails

**Check connection string format:**
```bash
# Correct format:
postgresql://user:password@host:5432/database

# Common mistakes:
postgres://...  # Should be postgresql://
missing :5432   # Port is required
missing /dbname # Database name required
```

**Test connection locally:**
```bash
# Install psql if needed
sudo apt-get install postgresql-client

# Test connection (use External URL for remote)
psql "postgresql://user:password@host:5432/database"

# Should connect and show:
# database=>
```

---

## Next Steps

1. ✅ Add DATABASE_URL to Render
2. ✅ Run database migrations
3. ✅ Test `/api/auth/login` returns user object
4. ✅ Test login from Expo app
5. 🚀 Start building features!

For production deployment, see:
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Full Render setup
- [EAS_SECRETS_SETUP.md](EAS_SECRETS_SETUP.md) - Mobile app secrets
- [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) - Complete production checklist
