export type HabitProfileType =
  | "structured_rebuilder"
  | "high_drive_sprinter"
  | "gentle_sustainer"
  | "quiet_strategist"
  | "identity_builder";

export interface HabitProfile {
  type: HabitProfileType;
  name: string;
  description: string;
  strengths: string[];
  riskZones: string[];
  strategies: string[];
  color: string;
}

const profiles: Record<HabitProfileType, HabitProfile> = {
  structured_rebuilder: {
    type: "structured_rebuilder",
    name: "Structured Rebuilder",
    description:
      "You thrive with clear systems and processes. When things fall apart, you methodically rebuild them stronger.",
    strengths: [
      "Strong planning abilities",
      "Resilient after setbacks",
      "Detail-oriented execution",
    ],
    riskZones: [
      "Can get stuck in planning mode",
      "May resist flexibility when needed",
      "Perfectionism can slow progress",
    ],
    strategies: [
      "Start with a simple daily routine before adding complexity",
      "Build in scheduled review points to adjust your approach",
      "Celebrate small wins to maintain momentum",
    ],
    color: "#4A6741",
  },
  high_drive_sprinter: {
    type: "high_drive_sprinter",
    name: "High-Drive Sprinter",
    description:
      "You move fast when motivated, but risk burning out when momentum drops. Small, visible wins and consistent cues will be your foundation.",
    strengths: [
      "High energy when motivated",
      "Quick to take action",
      "Competitive drive fuels progress",
    ],
    riskZones: [
      "Burnout risk during intense periods",
      "Impatience with slow progress",
      "May abandon habits when bored",
    ],
    strategies: [
      "Keep habits short and energizing",
      "Build in rest days to prevent burnout",
      "Track visible progress to maintain motivation",
    ],
    color: "#B7472A",
  },
  gentle_sustainer: {
    type: "gentle_sustainer",
    name: "Gentle Sustainer",
    description:
      "You prefer gradual, sustainable change over dramatic transformations. Your patience is your superpower.",
    strengths: [
      "Patient with long-term goals",
      "Self-compassionate approach",
      "Consistent over time",
    ],
    riskZones: [
      "May avoid necessary discomfort",
      "Can underestimate own capabilities",
      "Slow starts can delay momentum",
    ],
    strategies: [
      "Start with tiny habits that feel almost too easy",
      "Focus on consistency over intensity",
      "Connect habits to self-care and well-being",
    ],
    color: "#9CAF88",
  },
  quiet_strategist: {
    type: "quiet_strategist",
    name: "Quiet Strategist",
    description:
      "You think deeply before acting and prefer working alone. Your habits are most effective when they align with your inner values.",
    strengths: [
      "Deep reflection before action",
      "Independent and self-directed",
      "Values-driven commitment",
    ],
    riskZones: [
      "Over-analysis can delay starting",
      "May isolate during struggles",
      "External accountability feels intrusive",
    ],
    strategies: [
      "Connect each habit to your core values",
      "Journal your progress for private reflection",
      "Allow flexibility in how habits are completed",
    ],
    color: "#6B6B6B",
  },
  identity_builder: {
    type: "identity_builder",
    name: "Identity Builder",
    description:
      "You focus on becoming a certain type of person, not just achieving goals. Your habits are expressions of who you want to be.",
    strengths: [
      "Strong sense of purpose",
      "Habits tied to identity last longer",
      "Motivated by personal growth",
    ],
    riskZones: [
      "Identity shifts can disrupt habits",
      "May be hard on self when falling short",
      "Can set unrealistic identity standards",
    ],
    strategies: [
      "Frame habits as 'I am someone who...'",
      "Celebrate identity-affirming moments",
      "Allow your identity to evolve with your habits",
    ],
    color: "#C9A227",
  },
};

export function generateHabitProfile(onboardingData: {
  motivations: string[];
  rewardStyle: string[];
  changeStyle: string;
  relapseTriggers: string[];
}): HabitProfile {
  const { motivations, rewardStyle, changeStyle, relapseTriggers } =
    onboardingData;

  if (changeStyle === "all_in_fast") {
    return profiles.high_drive_sprinter;
  }

  if (changeStyle === "build_slowly" && relapseTriggers.includes("overwhelm")) {
    return profiles.gentle_sustainer;
  }

  if (
    rewardStyle.includes("building_identity") ||
    motivations.includes("becoming_my_best_self")
  ) {
    return profiles.identity_builder;
  }

  if (
    changeStyle === "wait_until_ready" ||
    relapseTriggers.includes("lack_of_structure")
  ) {
    return profiles.quiet_strategist;
  }

  if (
    motivations.includes("more_discipline") ||
    motivations.includes("better_routine")
  ) {
    return profiles.structured_rebuilder;
  }

  return profiles.gentle_sustainer;
}

export function getHabitProfile(type: HabitProfileType): HabitProfile {
  return profiles[type];
}

export function getAllProfiles(): HabitProfile[] {
  return Object.values(profiles);
}
