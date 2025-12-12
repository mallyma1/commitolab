import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

let hasWarnedAboutLocalhost = false;

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL (always HTTPS for production)
 */
export function getApiUrl(): string {
  // Prefer EXPO_PUBLIC_API_URL (full URL), fallback to EXPO_PUBLIC_DOMAIN (hostname only)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;

  let resolvedUrl: string;

  if (apiUrl) {
    // Full URL provided (e.g., https://api.committoo.space)
    resolvedUrl = apiUrl;
  } else if (domain) {
    // Legacy: domain only, construct HTTPS URL
    resolvedUrl = `https://${domain}`;
  } else {
    // No config: use production URL as safe default
    resolvedUrl = "https://api.committoo.space";
    if (__DEV__) {
      console.warn(
        "[API] No EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN set. " +
          "Defaulting to production: https://api.committoo.space"
      );
    }
  }

  // Ensure it's a valid URL and always HTTPS (except localhost)
  try {
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol === "http:" && !parsed.hostname.includes("localhost")) {
      // Force HTTPS for non-localhost
      parsed.protocol = "https:";
      resolvedUrl = parsed.href;
    }
  } catch (e) {
    console.error("[API] Invalid URL:", resolvedUrl, e);
    throw new Error(`Invalid API URL: ${resolvedUrl}`);
  }

  // Log once on startup
  if (!hasWarnedAboutLocalhost) {
    console.log("[API] Base URL resolved:", resolvedUrl);
    console.log("[API] __DEV__:", __DEV__);
    console.log("[API] Platform.OS:", Platform.OS);
    hasWarnedAboutLocalhost = true;
  }

  return resolvedUrl;
}

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

  console.log(`[API] ${method} ${route}`);

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const latency = Date.now() - start;
    console.log(`[API] ${method} ${route} - ${res.status} (${latency}ms)`);

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    const latency = Date.now() - start;
    console.error(`[API] ${method} ${route} - ERROR (${latency}ms):`, error);
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
