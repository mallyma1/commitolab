export type OnboardingPayload = {
  roles: string[];
  pressures: string[];
  focusDomains: string[];
  strugglePatterns: string[];
  rewardStyle: string[];
  changeStyle: string;
  currentState: string;
  tonePreferences: string[];
  accountabilityLevel: string;
};

export type HabitProfileSummary = {
  profile_name: string;
  strengths: string[];
  risk_zones: string[];
  best_practices: string[];
};

export type CommitmentRecommendation = {
  title: string;
  short_description: string;
  cadence: "daily" | "weekly";
  proof_mode: "none" | "tick_only" | "photo_optional" | "photo_required";
  reason: string;
};
