export type OnboardingData = {
  identityArchetype: string;
  primaryGoalCategory: string;
  primaryGoalReason: string;
  preferredCadence: string;
};

export const ONBOARDING_DATA_KEY = "@streak_onboarding_data";
export const HAS_EVER_LOGGED_IN_KEY = "@streak_has_logged_in";
