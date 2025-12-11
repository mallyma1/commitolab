import { useState, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/query-client";
import type {
  OnboardingPayload,
  HabitProfileSummary,
  CommitmentRecommendation,
} from "../../shared/onboardingTypes";

export function useOnboardingState() {
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
  const [recommendations, setRecommendations] = useState<
    CommitmentRecommendation[]
  >([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const prefetchStartedRef = useRef(false);

  function update<K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  const prefetchAI = useCallback(async (currentPayload: OnboardingPayload) => {
    if (prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      const summaryUrl = new URL("/api/onboarding/summary", getApiUrl());
      const summaryRes = await fetch(summaryUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPayload),
      });
      
      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const summaryData = await summaryRes.json() as HabitProfileSummary;
      setSummary(summaryData);
      
      const recsUrl = new URL("/api/onboarding/recommendations", getApiUrl());
      const recsRes = await fetch(recsUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: currentPayload, summary: summaryData }),
      });
      
      if (!recsRes.ok) throw new Error("Failed to fetch recommendations");
      const recsData = await recsRes.json() as { commitments: CommitmentRecommendation[] };
      setRecommendations(recsData.commitments);
    } catch (e: any) {
      console.error("AI prefetch error:", e);
      setAiError(e.message || "Failed to generate profile");
    } finally {
      setAiLoading(false);
    }
  }, []);

  return {
    payload,
    update,
    summary,
    setSummary,
    recommendations,
    setRecommendations,
    aiLoading,
    aiError,
    prefetchAI,
  };
}
