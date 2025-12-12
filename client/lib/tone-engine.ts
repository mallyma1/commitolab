type ToneType = "direct" | "calm" | "data" | "hype" | "quiet";

interface ToneCopy {
  welcome: string;
  missedDay: string;
  streakGoing: string;
  noStreak: string;
  checkInNudge: string;
  keepGoing: string;
}

const COPY_SETS: Record<ToneType, ToneCopy> = {
  direct: {
    welcome: "No more half-measures.",
    missedDay: "You dropped the ball yesterday. Show up today.",
    streakGoing: "Keep the chain unbroken.",
    noStreak: "Start your streak today.",
    checkInNudge: "You said you were done slipping. Check in.",
    keepGoing: "Stay on track.",
  },
  calm: {
    welcome: "Let's rebuild gently.",
    missedDay: "You missed a day. That's human. Come back in today.",
    streakGoing: "One day at a time, you're doing it.",
    noStreak: "Today is a good day to begin.",
    checkInNudge: "One small step today is enough.",
    keepGoing: "Keep going, gently.",
  },
  data: {
    welcome: "We track what matters.",
    missedDay: "Gap detected in your streak. Resume today.",
    streakGoing: "Your streak data is clean.",
    noStreak: "Initialize your first streak.",
    checkInNudge: "Keep your streak data clean. Log today.",
    keepGoing: "Maintain consistency.",
  },
  hype: {
    welcome: "Time to show up for yourself!",
    missedDay: "Yesterday's gone. Today you rise!",
    streakGoing: "You're on fire! Keep it burning!",
    noStreak: "Let's get this started!",
    checkInNudge: "Future you is watching. Hit your check-in!",
    keepGoing: "You've got this!",
  },
  quiet: {
    welcome: "Fewer words. More action.",
    missedDay: "Resume.",
    streakGoing: "Continuing.",
    noStreak: "Begin.",
    checkInNudge: "Check in. Then get back to life.",
    keepGoing: "Continue.",
  },
};

const ARCHETYPE_TONES: Record<string, ToneType> = {
  athlete: "hype",
  focused_creative: "quiet",
  disciplined_builder: "direct",
  balanced_mind: "calm",
  better_everyday: "data",
};

export function getToneFromArchetype(
  archetype: string | null | undefined
): ToneType {
  if (!archetype) return "calm";
  return ARCHETYPE_TONES[archetype] || "calm";
}

export function getCopy(archetype: string | null | undefined): ToneCopy {
  const tone = getToneFromArchetype(archetype);
  return COPY_SETS[tone];
}

export function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const displayName = name || "there";

  if (hour < 12) {
    return `Good morning, ${displayName}`;
  } else if (hour < 17) {
    return `Good afternoon, ${displayName}`;
  } else {
    return `Good evening, ${displayName}`;
  }
}

export function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getFocusAreaLabel(category: string | null | undefined): string {
  if (!category) return "your goals";

  const labels: Record<string, string> = {
    fitness: "your body",
    learning: "your mind",
    work: "your craft",
    creativity: "your creative practice",
    mental_health: "your mental wellness",
    nutrition: "your nutrition",
    personal_improvement: "a better you",
    custom: "your goals",
  };

  return labels[category] || "your goals";
}

export function getCommitmentTip(
  tone: ToneType,
  currentStreak: number
): string {
  const tips: Record<ToneType, Record<string, string>> = {
    direct: {
      early: "You've started. Keep the momentum going.",
      mid: "You're proving to yourself. Don't stop now.",
      strong: "This is becoming part of who you are.",
    },
    calm: {
      early: "You're on your way. One day at a time.",
      mid: "You're building something real and lasting.",
      strong: "You've found your rhythm. Trust it.",
    },
    data: {
      early: "Streak initialized. Continue logging.",
      mid: "Consistency metrics looking strong.",
      strong: "Long-term trend data is positive.",
    },
    hype: {
      early: "You're in motion! Keep it rolling!",
      mid: "This streak is real! Keep showing up!",
      strong: "You're unstoppable! This is who you are!",
    },
    quiet: {
      early: "Getting started.",
      mid: "Building something solid.",
      strong: "This is working.",
    },
  };

  let phase = "early";
  if (currentStreak >= 30) phase = "strong";
  else if (currentStreak >= 7) phase = "mid";

  return tips[tone][phase];
}
