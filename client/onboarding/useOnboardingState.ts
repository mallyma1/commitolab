import { useState, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  OnboardingPayload,
  HabitProfileSummary,
  CommitmentRecommendation,
} from "@/shared/onboardingTypes";

type AiStatus = "idle" | "running" | "ready" | "failed";
const AI_TIMEOUT_MS = 10000; // Reduced from 12s to 10s after backend optimizations

// Simple hash function for payload caching
function hashPayload(payload: OnboardingPayload, userId?: string): string {
  const normalized = normalizePayload(payload);
  // Include ALL inputs that affect AI output to prevent cache collisions
  // across users or when any significant field changes
  const key = JSON.stringify({
    userId: userId || "anonymous", // Different users = different cache
    roles: normalized.roles?.sort(),
    focusDomains: normalized.focus_domains?.sort(),
    focusArea: normalized.focusArea,
    struggles: normalized.strugglePatterns?.sort(),
    changeStyle: normalized.change_style,
    tones: normalized.tonePreferences?.sort(),
    accountabilityLevel: normalized.preferred_cadence,
    motivations: normalized.motivations?.sort(),
    rewardStyle:
      normalized.reward_style?.sort() || normalized.rewardStyle?.sort(),
    currentState: normalized.currentState,
    pressures: normalized.pressures?.sort(),
    relapseTriggers:
      normalized.relapse_triggers?.sort() || normalized.relapseTriggers?.sort(),
  });
  // Simple 32-bit hash for cache key
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `onboarding_ai_${hash.toString(36)}`;
}

// Cache for AI results
const aiCache = new Map<
  string,
  {
    summary: HabitProfileSummary;
    recommendations: CommitmentRecommendation[];
    timestamp: number;
  }
>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Onboarding data flow (critical vs optional)
 * - Critical before showing UI: local fast profile + recommendations computed synchronously from payload
 * - Background/optional: POST /api/onboarding/summary (AI) -> POST /api/onboarding/recommendations (AI) to polish copy
 *
 * First app load after auth
 * - Essential before home renders: GET /api/commitments, GET /api/check-ins/today
 * - Deferred/optional after home renders: analytics, AI coaching, dopamine lab data (none block navigation)
 */

function normalizePayload(payload: OnboardingPayload): OnboardingPayload {
  return {
    ...payload,
    focus_domains: payload.focus_domains ?? payload.focusDomains ?? [],
    reward_style: payload.reward_style ?? payload.rewardStyle ?? [],
    change_style: payload.change_style ?? payload.changeStyle ?? "",
    primary_goal_category:
      payload.primary_goal_category ?? payload.focusDomains?.[0],
    preferred_cadence: payload.preferred_cadence ?? payload.accountabilityLevel,
  };
}

function buildFastSummary(payload: OnboardingPayload): HabitProfileSummary {
  const focusArea = payload.focus_domains?.[0] || "personal growth";
  const style = payload.change_style || "steady";
  return {
    profile_name:
      style === "intensive"
        ? "Focused Achiever"
        : style === "micro"
          ? "Steady Builder"
          : "Balanced Practitioner",
    strengths: [
      "You have self-awareness about your patterns",
      "You are motivated to make positive changes",
      `You have clear focus on ${focusArea}`,
    ],
    risk_zones: [
      "Taking on too much at once can lead to burnout",
      "Inconsistent environments may disrupt routines",
      "High expectations without flexibility can cause setbacks",
    ],
    best_practices: [
      "Start with one small commitment and build from there",
      "Track your progress daily to stay accountable",
      "Adjust your approach when something is not working",
    ],
  };
}

function buildFastRecommendations(payload: OnboardingPayload): {
  commitments: CommitmentRecommendation[];
} {
  const focusArea = payload.focus_domains?.[0] || "wellness";
  const style = payload.change_style || "steady";

  const baseCommitments: CommitmentRecommendation[] = [
    {
      title: "Morning Check-in",
      short_description:
        "Start your day with intention by reviewing your goals",
      cadence: "daily",
      proof_mode: "tick_only",
      reason: "Building awareness of daily priorities helps maintain focus",
    },
    {
      title: "Evening Reflection",
      short_description: "Take 5 minutes to note what went well today",
      cadence: "daily",
      proof_mode: "tick_only",
      reason: "Reflecting on progress reinforces positive habits",
    },
    {
      title: "Weekly Review",
      short_description: "Review your week and plan the next one",
      cadence: "weekly",
      proof_mode: "tick_only",
      reason: "Regular reviews help you stay on track with larger goals",
    },
  ];

  if (focusArea === "fitness" || focusArea === "health") {
    baseCommitments.unshift({
      title: "Movement Break",
      short_description: "Get up and move for at least 10 minutes",
      cadence: "daily",
      proof_mode: "tick_only",
      reason: "Regular movement improves energy and focus throughout the day",
    });
  }

  if (style === "micro") {
    return { commitments: baseCommitments.slice(0, 2) };
  }

  return { commitments: baseCommitments };
}

async function fetchWithTimeout(
  url: URL,
  options: RequestInit,
  timeoutMs = AI_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useOnboardingState() {
  const { user } = useAuth();
  const [payload, setPayload] = useState<OnboardingPayload>({
    roles: [],
    pressures: [],
    focusDomains: [],
    strugglePatterns: [],
    rewardStyle: [],
    changeStyle: "",
    currentState: "",
    tonePreferences: [],
    accountabilityLevel: "",
  });

  const [summary, setSummary] = useState<HabitProfileSummary | null>(null);
  const [summarySource, setSummarySource] = useState<
    "none" | "fallback" | "server"
  >("none");
  const [recommendations, setRecommendations] = useState<
    CommitmentRecommendation[]
  >([]);
  const [recommendationsSource, setRecommendationsSource] = useState<
    "none" | "fallback" | "server"
  >("none");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiTimedOut, setAiTimedOut] = useState(false);
  const [aiDurationMs, setAiDurationMs] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const prefetchStartedRef = useRef(false);

  function update<K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  const prefetchAI = useCallback(
    async (currentPayload: OnboardingPayload) => {
      if (prefetchStartedRef.current) return;

      const cacheKey = hashPayload(currentPayload, user?.id);
      const cached = aiCache.get(cacheKey);

      // Check cache first
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.debug(
          "[onboarding] using cached AI result for user:",
          user?.id
        );
        setSummary(cached.summary);
        setSummarySource("server");
        setRecommendations(cached.recommendations);
        setRecommendationsSource("server");
        setAiStatus("ready");
        return;
      }

      prefetchStartedRef.current = true;

      const normalizedPayload = normalizePayload(currentPayload);
      const fastSummary = buildFastSummary(normalizedPayload);
      const fastRecs = buildFastRecommendations(normalizedPayload);

      // Immediate UI update with fallback
      setSummary(fastSummary);
      setSummarySource("fallback");
      setRecommendations(fastRecs.commitments);
      setRecommendationsSource("fallback");

      setAiLoading(true);
      setAiStatus("running");
      setAiTimedOut(false);
      setAiDurationMs(null);
      setAiError(null);

      const startedAt = Date.now();
      let loggedSummarySource: "fallback" | "server" = "fallback";
      console.debug(
        "[onboarding] prefetch start - fast profile ready immediately"
      );

      try {
        const summaryUrl = new URL("/api/onboarding/summary", getApiUrl());
        const summaryRes = await fetchWithTimeout(
          summaryUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizedPayload),
          },
          AI_TIMEOUT_MS
        );

        if (!summaryRes.ok) throw new Error("Failed to fetch summary");
        const summaryData = (await summaryRes.json()) as HabitProfileSummary;
        setSummary(summaryData);
        setSummarySource("server");
        loggedSummarySource = "server";

        const recsUrl = new URL("/api/onboarding/recommendations", getApiUrl());
        const recsRes = await fetchWithTimeout(
          recsUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payload: normalizedPayload,
              summary: summaryData,
            }),
          },
          AI_TIMEOUT_MS
        );

        if (!recsRes.ok) throw new Error("Failed to fetch recommendations");
        const recsData = (await recsRes.json()) as {
          commitments: CommitmentRecommendation[];
        };
        setRecommendations(recsData.commitments);
        setRecommendationsSource("server");
        setAiStatus("ready");

        // Cache successful result
        aiCache.set(cacheKey, {
          summary: summaryData,
          recommendations: recsData.commitments,
          timestamp: Date.now(),
        });

        const duration = Date.now() - startedAt;
        console.debug(
          `[onboarding] AI refinement complete: ${duration}ms, source: ${loggedSummarySource}, cached`
        );
      } catch (e: any) {
        const timedOut = e?.message === "Request timed out";
        setAiTimedOut(timedOut);
        setAiStatus("failed");
        setAiError(
          timedOut
            ? "Request timed out"
            : e?.message || "Failed to generate profile"
        );
        const duration = Date.now() - startedAt;
        console.warn(`[onboarding] AI failed after ${duration}ms:`, {
          timedOut,
          message: e?.message,
        });
      } finally {
        const duration = Date.now() - startedAt;
        setAiDurationMs(duration);
        setAiLoading(false);
        prefetchStartedRef.current = false;
      }
    },
    [user?.id]
  );

  return {
    payload,
    update,
    summary,
    setSummary,
    summarySource,
    recommendations,
    setRecommendations,
    recommendationsSource,
    aiLoading,
    aiStatus,
    aiTimedOut,
    aiDurationMs,
    aiError,
    prefetchAI,
  };
}

// Test plan (dev):
// - Simulate slow AI: set SIMULATE_AI_DELAY_MS (server env) to 8000–12000 and verify Summary shows immediately with "Finishing with AI" banner.
// - Confirm home screen renders within ~1–3s on warm backend: onboarding -> auth -> Main should show commitments list (or empty state) while analytics or AI coaching can still be loading.
// - Timeout path: force latency > AI_TIMEOUT_MS and check that the timeout banner appears but navigation continues and recommendations are available from the quick set.
