// Frontend configuration and feature flags
// This file mirrors shared/config.ts but lives in client/ for proper @/ alias resolution

// FREE_MODE: When true, bypasses subscription checks and grants all pro features
// Useful for development and testing
export const FREE_MODE =
  process.env.FREE_MODE === "true" || process.env.NODE_ENV === "development";

// PREMIUM_MODE: Controls premium feature availability
export const PREMIUM_MODE = !FREE_MODE;

// Feature flags for Commito app capabilities
export const FEATURE_FLAGS = {
  dopamineLab: true,
  selfRegulationTest: true,
  aiCoaching: true,
  streakAnalytics: true,
  personalization: true,
  habitProfiles: true,
  toneEngine: true,
  notifications: true,
};

// Export individual feature flags for convenience
export const ENABLE_DOPAMINE_LAB = FEATURE_FLAGS.dopamineLab;
export const ENABLE_SELF_REGULATION = FEATURE_FLAGS.selfRegulationTest;
export const ENABLE_AI_COACHING = FEATURE_FLAGS.aiCoaching;
export const ENABLE_STREAK_ANALYTICS = FEATURE_FLAGS.streakAnalytics;
export const ENABLE_PERSONALIZATION = FEATURE_FLAGS.personalization;
