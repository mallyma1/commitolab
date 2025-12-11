import type { OnboardingPayload, HabitProfileSummary, CommitmentRecommendation } from "../../shared/onboardingTypes";

export type OnboardingData = {
  completed: boolean;
  payload?: OnboardingPayload;
  summary?: HabitProfileSummary;
  recommendations?: CommitmentRecommendation[];
  selectedRecommendations?: CommitmentRecommendation[];
  identityArchetype?: string;
  primaryGoalCategory?: string;
  primaryGoalReason?: string;
  preferredCadence?: string;
};

export const ONBOARDING_DATA_KEY = "@streak_onboarding_data";
export const HAS_EVER_LOGGED_IN_KEY = "@streak_has_logged_in";
