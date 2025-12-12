# Console Logging Guide

## Overview

All console logs in this app follow a consistent prefix-based system for easy filtering and debugging. Each subsystem has a unique prefix in square brackets.

---

## Log Prefixes

### `[API]` - Network Requests
All HTTP/fetch calls to backend endpoints.

**Examples:**
```
[API] 📤 POST /api/auth/login
[API]    Full URL: http://localhost:5000/api/auth/login
[API] ✅ POST /api/auth/login - 200 (145ms)
[API] ❌ POST /api/auth/login - ERROR (2000ms)
[API]    Error: Network request failed
```

**Filter in console:** `cmd+shift+j` then search `[API]`

---

### `[HEALTH]` - API Health Check
Startup diagnostics for backend connectivity.

**Examples:**
```
[HEALTH] 🏥 Starting API health check...
[HEALTH] ✅ API is reachable (145ms)
[HEALTH]    Response: {"ok":true,"timestamp":"..."}
[HEALTH] ❌ Failed to reach API
[HEALTH]    Error: Network request failed
[HEALTH] 📋 Troubleshooting checklist:
[HEALTH]    ☐ Is backend deployed/running?
[HEALTH]    ☐ Is EXPO_PUBLIC_API_URL correct in .env?
```

**When it runs:** On app startup automatically

---

### `[auth]` - Authentication
Login, logout, and user session management.

**Examples:**
```
[auth] 📧 Email login start
[auth]    Route: /api/auth/login
[auth]    API URL: http://localhost:5000
[auth] ✅ Email login success, user id: 798daf99-d8e9-4787-b2e4-78be77860c03
[auth] ✅ Session stored in AsyncStorage
[auth] ❌ Email login failed
[auth]    Error: Invalid email format
```

**Filter in console:** Type `[auth]`

---

### `[onboarding]` - Onboarding Flow
AI profile generation, preference selection, commitment creation.

**Examples:**
```
[onboarding] 🤖 Prefetch AI start - fast profile ready immediately
[onboarding] ✅ AI refinement complete: 1200ms
[onboarding] ❌ AI failed after 5000ms:
[onboarding]    timedOut: false
[onboarding]    message: Network request failed
```

**Filter in console:** Type `[onboarding]`

---

### `[AI SDK]` - AI Services
Client-side SDK configuration for AI features.

**Examples:**
```
[AI SDK] ═══════════════════════════════════════
[AI SDK] 🤖 AI SDK Configuration
[AI SDK] Base URL: http://localhost:5000
[AI SDK] EXPO_PUBLIC_API_URL: http://localhost:5000
```

**When it runs:** On app startup

---

### `[fetch]` - Query Results
React Query fetch operations and data loading.

**Examples:**
```
[fetch] /api/commitments: 245ms, 5 items
[fetch] /api/commitments/abc123: 156ms
[fetch] /api/analytics: 78ms
```

---

## Emoji Legend

| Emoji | Meaning | When to Use |
|-------|---------|------------|
| 📤 | Sending request | HTTP method + route |
| ✅ | Success | Operation completed successfully |
| ❌ | Error/Failure | Operation failed or error occurred |
| 🏥 | Health check | Diagnostics and status |
| 📧 | Email | Email-related operations |
| 🤖 | AI | AI/ML operations |
| ⚠️ | Warning | Something unexpected but not critical |
| 📋 | Information | Helpful information or checklist |
| ☐ | Checkbox | List item in troubleshooting |

---

## How to Use Logs for Debugging

### 1. Check API Configuration
```bash
# Look for:
# [API] ═══════════════════════════════════════════════════
# [API] Base URL: http://localhost:5000  ✅ Should match your .env
```

### 2. Verify API Health
```bash
# Look for:
# [HEALTH] ✅ API is reachable (145ms)
# [HEALTH]    Response: {"ok":true,...}
```

### 3. Debug Login Issues
```bash
# Look for this sequence:
[auth] 📧 Email login start
[API] 📤 POST /api/auth/login
[API]    Full URL: http://localhost:5000/api/auth/login
[API] ✅ POST /api/auth/login - 200 (145ms)
[auth] ✅ Email login success, user id: 798daf99...
[auth] ✅ Session stored in AsyncStorage
```

### 4. Debug Network Failures
```bash
# If you see:
[API] ❌ POST /api/auth/login - ERROR (2000ms)
[API]    Error: Network request failed

# Check:
1. Is the server running? (curl http://localhost:5000/api/health)
2. Is EXPO_PUBLIC_API_URL correct? (check console logs for [API] prefix)
3. Are you on the same network? (Expo needs to reach the IP)
```

### 5. Debug Onboarding AI Issues
```bash
# If you see:
[onboarding] ❌ AI failed after 5000ms:
[onboarding]    timedOut: false
[onboarding]    message: Network request failed

# The AI fetch failed - check [API] logs above for the actual request error
```

---

## Console Filtering Tips

### In Metro Bundler
1. Open the app's terminal
2. Type filter terms:
   - `[API]` - see all network requests
   - `[auth]` - see authentication flow
   - `[onboarding]` - see onboarding AI
   - `❌` - see only errors
   - `✅` - see only successes

### In Expo Go
1. Shake device to open dev menu
2. Select "Show logs"
3. Search/filter with the prefixes above

---

## Log Levels

We use standard console methods:

- `console.log()` - ℹ️ Informational messages
- `console.warn()` - ⚠️ Non-fatal issues
- `console.error()` - ❌ Critical errors

---

## Performance Insights

All API requests log latency in milliseconds:

```
[API] ✅ POST /api/auth/login - 200 (145ms)
                                           ^^^^^ Latency
```

**Healthy ranges:**
- Local API: 50-200ms
- Production API: 200-1000ms
- Anything >5000ms might indicate network issues

---

## Adding New Logs

When adding console logs, follow this pattern:

```typescript
// ❌ Bad
console.log("login started");
console.error("error", error);

// ✅ Good
console.log("[auth] 📧 Email login start");
console.log(`[auth]    Route: ${AUTH_ROUTES.LOGIN}`);
console.error("[auth] ❌ Email login failed");
console.error(`[auth]    Error: ${error instanceof Error ? error.message : String(error)}`);
```

**Pattern:**
1. Prefix with `[FEATURE]` in square brackets
2. Add emoji for quick visual scanning
3. Indent sub-messages with spaces for readability
4. Always extract error messages, not whole error objects
5. Include request/response info for debugging

---

## Quick Reference Card

```
[API]       → Network requests
[HEALTH]    → Backend connectivity
[auth]      → Login/logout
[onboarding] → AI profile generation
[AI SDK]    → AI service config
[fetch]     → React Query operations

Emojis:
✅ Success  ❌ Error  ⚠️ Warning
📤 Request  📋 Info   🏥 Health
📧 Email    🤖 AI
```
