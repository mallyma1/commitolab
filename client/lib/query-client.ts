import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

let hasWarnedAboutLocalhost = false;

/**
 * Gets the base URL for the Express API server
 * CRITICAL: Always returns https://api.committoo.space for production
 * 
 * SUPPORTED AUTH ROUTES (backend):
 * - POST /api/auth/login (email passwordless)
 * - POST /api/auth/phone/send-code
 * - POST /api/auth/phone/verify
 * - POST /api/auth/google
 * - POST /api/auth/apple
 * 
 * @returns {string} The API base URL (always HTTPS)
 */
export function getApiUrl(): string {
  // Use EXPO_PUBLIC_API_URL only - no fallbacks to avoid ambiguity
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Hard default to production API
  const resolvedUrl = apiUrl || "https://api.committoo.space";

  // Validate URL format
  try {
    const parsed = new URL(resolvedUrl);
    
    // 🚨 CRITICAL: Prevent using committoo.space without api. subdomain
    if (
      parsed.hostname === "committoo.space" ||
      parsed.hostname === "www.committoo.space"
    ) {
      const errorMsg =
        `[API] ❌ FATAL: Cannot use ${parsed.hostname} as API base URL. ` +
        `Must use 'api.committoo.space' for API requests.`;
      console.error(errorMsg);
      if (__DEV__) {
        throw new Error(errorMsg);
      }
    }
    
    // Ensure HTTPS (except localhost for local dev)
    if (parsed.protocol === "http:" && !parsed.hostname.includes("localhost")) {
      throw new Error(
        `[API] Insecure HTTP URL not allowed in production: ${resolvedUrl}`
      );
    }
  } catch (e) {
    console.error("[API] Invalid API URL:", resolvedUrl, e);
    throw new Error(`Invalid API URL: ${resolvedUrl}`);
  }

  // Log once on startup for debugging
  if (!hasWarnedAboutLocalhost) {
    console.log("[API] ═══════════════════════════════════════");
    console.log("[API] 🔗 API Configuration");
    console.log("[API] ─────────────────────────────────────────────────");
    console.log(`[API] Base URL:              ${resolvedUrl}`);
    console.log(`[API] EXPO_PUBLIC_API_URL:  ${apiUrl || "❌ NOT SET (using default)"}`);
    console.log(`[API] Development Mode:     ${__DEV__ ? "YES" : "NO"}`);
    console.log(`[API] Platform:             ${Platform.OS}`);
    console.log("[API] ═══════════════════════════════════════");
    hasWarnedAboutLocalhost = true;
  }

  return resolvedUrl;
}

/**
 * Canonical auth routes supported by backend
 * DO NOT modify these without updating server/routes.ts
 */
export const AUTH_ROUTES = {
  LOGIN: "/api/auth/login",
  PHONE_SEND_CODE: "/api/auth/phone/send-code",
  PHONE_VERIFY: "/api/auth/phone/verify",
  GOOGLE: "/api/auth/google",
  APPLE: "/api/auth/apple",
} as const;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const start = Date.now();

  console.log(`[API] 📤 ${method.toUpperCase()} ${route}`);
  console.log(`[API]    Full URL: ${url.href}`);

  try {
    const res = await fetch(url, {
      method,
      mode: "cors",
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const latency = Date.now() - start;
    const statusEmoji = res.ok ? "✅" : "❌";
    console.log(`[API] ${statusEmoji} ${method.toUpperCase()} ${route} - ${res.status} (${latency}ms)`);

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    const latency = Date.now() - start;
    console.error(`[API] ❌ ${method.toUpperCase()} ${route} - ERROR (${latency}ms)`);
    console.error(`[API]    Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      mode: "cors",
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * Global query client configuration for React Query.
 *
 * Strategy:
 * - Critical path queries (commitments, check-ins): short staleTime, lazy refetch
 * - Non-essential queries (analytics, subscription): longer staleTime, lazy-load
 * - Mutations: no automatic retry (user interaction expected)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Queries are stale after this time, but won't refetch unless explicitly triggered
      // Individual hooks can override with specific staleTime values
      staleTime: 1000, // Default 1s - mostly for simple cached values
      retry: 1, // Retry once on network failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't auto-retry mutations - user should be aware of failure
    },
  },
});
