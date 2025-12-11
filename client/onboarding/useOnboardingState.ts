import { useState } from "react";
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

  function update<K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  return {
    payload,
    update,
    summary,
    setSummary,
    recommendations,
    setRecommendations,
  };
}
