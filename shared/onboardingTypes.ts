// Onboarding flow types shared between client and server

export interface OnboardingPayload {
  identity_archetype?: string;
  focus_domains?: string[];
  focusDomains?: string[]; // alias for focus_domains
  focusArea?: string; // primary focus area
  motivations?: string[];
  relapse_triggers?: string[];
  relapseTriggers?: string[]; // alias for relapse_triggers
  reward_style?: string[];
  rewardStyle?: string[]; // alias for reward_style
  environment_risks?: string[];
  environmentRisks?: string[]; // alias for environment_risks
  change_style?: string;
  changeStyle?: string; // alias for change_style
  tonePreferences?: string[]; // communication preferences
  tonePreference?: string; // primary tone preference
  currentState?: string; // emotional state
  roles?: string[]; // life roles
  pressures?: string[]; // external pressures
  strugglePatterns?: string[]; // struggle patterns
  accountabilityLevel?: string; // accountability level preference
  primary_goal_category?: string;
  primary_goal_reason?: string;
  preferred_cadence?: string;
}

export interface HabitProfileSummary {
  profile_name: string;
  strengths: string[];
  risk_zones: string[];
  best_practices: string[];
}

export interface CommitmentRecommendation {
  title: string;
  short_description: string;
  cadence: "daily" | "weekly";
  proof_mode: "none" | "tick_only" | "photo_optional" | "photo_required";
  reason: string;
}
