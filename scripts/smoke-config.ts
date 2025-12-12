/**
 * Simple config + endpoint smoke test.
 * Runs in Node. Assumes dev server at localhost:5000 when EXPO_PUBLIC_DOMAIN missing.
 */
import http from "node:http";
import https from "node:https";

// Minimal inline getApiUrl equivalent for Node-side smoke
function getApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  
  if (apiUrl) return apiUrl;
  if (host) return `https://${host}`;
  return "http://localhost:5000"; // dev fallback for local smoke
}

async function check(path: string, allowStatuses: number[] = [200]) {
  const base = getApiUrl();
  const url = new URL(path, base);
  const start = Date.now();
  const client = url.protocol === "https:" ? https : http;
  const status: number = await new Promise((resolve, reject) => {
    const req = client.request(url.toString(), { method: "GET" }, (res) => {
      resolve(res.statusCode || 0);
    });
    req.on("error", (err) => reject(err));
    req.end();
  });
  const ms = Date.now() - start;
  console.log(`[SMOKE] GET ${url.toString()} -> ${status} in ${ms}ms`);
  if (!allowStatuses.includes(status)) {
    throw new Error(`Smoke failed for ${path}: ${status}`);
  }
}

async function main() {
  console.log("[SMOKE] Base:", getApiUrl());
  // Fast, non-auth endpoints first
  await check("/api/health", [200]);
  // Auth endpoint should respond; accept 200, 400, 401 without payload
  await check("/api/auth/login", [200, 400, 401]);
  console.log("[SMOKE] Completed successfully");
}

main().catch((err) => {
  console.error("[SMOKE] Error:", err?.message || err);
  process.exit(1);
});
