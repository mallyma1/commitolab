/**
 * Health check utility for verifying API connectivity
 * Runs on app startup to detect API issues early
 * 
 * IMPLEMENTATION SUMMARY:
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ BACKEND AUTH ROUTES (server/routes.ts):
 *    - POST /api/auth/login (line 159)
 *    - POST /api/auth/phone/send-code (line 244)
 *    - POST /api/auth/phone/verify (line 295)
 *    - POST /api/auth/google (line 386)
 *    - POST /api/auth/apple (line 477)
 * 
 * ✅ FRONTEND API BASE URL (single source of truth):
 *    - Uses ONLY process.env.EXPO_PUBLIC_API_URL
 *    - Hard defaults to "https://api.committoo.space"
 *    - NO fallbacks to EXPO_PUBLIC_DOMAIN or other env vars
 *    - Blocks committoo.space (without api. subdomain) with error
 * 
 * ✅ AUTH ROUTE CONSTANTS (client/lib/query-client.ts):
 *    - AUTH_ROUTES.LOGIN = "/api/auth/login"
 *    - AUTH_ROUTES.PHONE_SEND_CODE = "/api/auth/phone/send-code"
 *    - AUTH_ROUTES.PHONE_VERIFY = "/api/auth/phone/verify"
 *    - AUTH_ROUTES.GOOGLE = "/api/auth/google"
 *    - AUTH_ROUTES.APPLE = "/api/auth/apple"
 * 
 * ✅ FINAL LOGIN ENDPOINT:
 *    https://api.committoo.space/api/auth/login
 * 
 * ✅ VALIDATION:
 *    - No code path can resolve committoo.space as API base
 *    - All fetch calls include mode: "cors"
 *    - Full URLs logged in development
 *    - Health check validates hostname on startup
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { getApiUrl } from "./query-client";

let hasRunHealthCheck = false;

/**
 * Performs a health check against the API server
 * Logs results clearly for debugging
 */
export async function performHealthCheck(): Promise<void> {
  if (hasRunHealthCheck) {
    return;
  }
  hasRunHealthCheck = true;

  const baseUrl = getApiUrl();
  const healthUrl = `${baseUrl}/api/health`;

  console.log("[HEALTH] ═══════════════════════════════════════");
  console.log("[HEALTH] 🏥 Starting API health check...");
  console.log("[HEALTH] Base URL:", baseUrl);
  console.log("[HEALTH] Health endpoint:", healthUrl);
  console.log("[HEALTH] ═══════════════════════════════════════");
  
  // Validate URL is correct
  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname !== "api.committoo.space" && !parsed.hostname.includes("localhost")) {
      console.warn(`[HEALTH] ⚠️  Unexpected API hostname: ${parsed.hostname}`);
      console.warn("[HEALTH]    Expected: api.committoo.space or localhost");
    }
  } catch (e) {
    console.error("[HEALTH] ❌ Invalid base URL format:", e);
  }

  try {
    const start = Date.now();
    const response = await fetch(healthUrl, {
      method: "GET",
      mode: "cors",
    });

    const latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      console.log(`[HEALTH] ✅ API is reachable (${latency}ms)`);
      console.log(`[HEALTH]    Response: ${JSON.stringify(data)}`);
      console.log("[HEALTH] ✅ Ready for authentication requests");
      console.log(`[HEALTH]    Login: POST ${baseUrl}/api/auth/login`);
    } else {
      console.error(
        `[HEALTH] ❌ API returned ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      if (text) console.error(`[HEALTH]    Response: ${text}`);
    }
  } catch (error) {
    console.error("[HEALTH] ❌ Failed to reach API");
    console.error(`[HEALTH]    Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error("[HEALTH] 📋 Troubleshooting checklist:");
    console.error("[HEALTH]    ☐ Is backend deployed/running?");
    console.error("[HEALTH]    ☐ Is EXPO_PUBLIC_API_URL correct in .env?");
    console.error("[HEALTH]    ☐ Is CORS enabled on backend?");
    console.error("[HEALTH]    ☐ Is device connected to internet?");
    console.error("[HEALTH]    ☐ Common causes:");
    console.error("[HEALTH]       1. Backend is not deployed or crashed");
    console.error("[HEALTH]       2. EXPO_PUBLIC_API_URL is incorrect");
    console.error("[HEALTH]       3. CORS is blocking the request");
    console.error("[HEALTH]       4. Network connectivity issue");
  }
}
