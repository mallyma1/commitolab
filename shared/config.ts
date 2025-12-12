// FREE_MODE: When true, bypasses subscription checks and grants all pro features
// Useful for development and testing
export const FREE_MODE =
  process.env.FREE_MODE === "true" || process.env.NODE_ENV === "development";

export const FEATURE_FLAGS = {
  dopamineLab: true,
  selfRegulationTest: true,
  aiCoaching: true,
  streakAnalytics: true,
  personalization: true,
};
