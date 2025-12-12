export interface CommitmentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedCadence: string;
  suggestedProofMode: string;
  focusAreas: string[];
  motivationTags: string[];
  duration: number;
}

export const commitmentTemplates: CommitmentTemplate[] = [
  {
    id: "journaling_10min",
    title: "10 min journaling",
    description: "Daily reflection to process thoughts and build clarity",
    category: "mental_health",
    suggestedCadence: "daily",
    suggestedProofMode: "note_only",
    focusAreas: ["mind"],
    motivationTags: ["mental_clarity", "feeling_in_control"],
    duration: 90,
  },
  {
    id: "breathing_5min",
    title: "5 min breathing",
    description: "Short breathing practice to center yourself",
    category: "mental_health",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["mind"],
    motivationTags: ["inner_calm", "mental_clarity"],
    duration: 30,
  },
  {
    id: "digital_sunrise",
    title: "Digital sunrise",
    description: "No phone for first 30 minutes after waking",
    category: "personal_improvement",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["mind", "lifestyle"],
    motivationTags: ["more_focus", "feeling_in_control"],
    duration: 30,
  },
  {
    id: "move_20min",
    title: "Move for 20 min",
    description: "Any form of movement that gets your body active",
    category: "fitness",
    suggestedCadence: "daily",
    suggestedProofMode: "photo_optional",
    focusAreas: ["body"],
    motivationTags: ["more_energy", "more_discipline"],
    duration: 90,
  },
  {
    id: "hydration_streak",
    title: "Hydration streak",
    description: "Drink 8 glasses of water throughout the day",
    category: "nutrition",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["body"],
    motivationTags: ["more_energy", "better_routine"],
    duration: 30,
  },
  {
    id: "sleep_before_midnight",
    title: "Sleep before midnight",
    description: "Be in bed with lights out before 12:00 AM",
    category: "personal_improvement",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["body", "lifestyle"],
    motivationTags: ["more_energy", "better_routine"],
    duration: 30,
  },
  {
    id: "deep_work_25min",
    title: "25 min deep work",
    description: "One focused work session without distractions",
    category: "work",
    suggestedCadence: "daily",
    suggestedProofMode: "note_only",
    focusAreas: ["work"],
    motivationTags: ["more_focus", "more_discipline"],
    duration: 90,
  },
  {
    id: "no_scroll_mornings",
    title: "No scroll mornings",
    description: "Avoid social media before 10 AM",
    category: "personal_improvement",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["work", "mind"],
    motivationTags: ["more_focus", "feeling_in_control"],
    duration: 30,
  },
  {
    id: "plan_tomorrow",
    title: "Plan tomorrow before bed",
    description: "Spend 5 minutes planning the next day",
    category: "work",
    suggestedCadence: "daily",
    suggestedProofMode: "note_only",
    focusAreas: ["work"],
    motivationTags: ["better_routine", "more_discipline"],
    duration: 30,
  },
  {
    id: "creative_practice",
    title: "Creative practice",
    description: "15 minutes of any creative activity",
    category: "creativity",
    suggestedCadence: "daily",
    suggestedProofMode: "photo_optional",
    focusAreas: ["creativity"],
    motivationTags: ["becoming_my_best_self", "inner_calm"],
    duration: 60,
  },
  {
    id: "reading_20min",
    title: "Read for 20 min",
    description: "Daily reading practice for knowledge or enjoyment",
    category: "learning",
    suggestedCadence: "daily",
    suggestedProofMode: "note_only",
    focusAreas: ["mind", "creativity"],
    motivationTags: ["mental_clarity", "becoming_my_best_self"],
    duration: 90,
  },
  {
    id: "gratitude_practice",
    title: "Gratitude practice",
    description: "Write down 3 things you're grateful for",
    category: "mental_health",
    suggestedCadence: "daily",
    suggestedProofMode: "note_only",
    focusAreas: ["mind"],
    motivationTags: ["inner_calm", "feeling_in_control"],
    duration: 30,
  },
  {
    id: "cold_shower",
    title: "Cold shower",
    description: "End your shower with 30 seconds of cold water",
    category: "personal_improvement",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["body"],
    motivationTags: ["more_discipline", "more_energy"],
    duration: 30,
  },
  {
    id: "meditation_10min",
    title: "10 min meditation",
    description: "Quiet sitting practice for mental clarity",
    category: "mental_health",
    suggestedCadence: "daily",
    suggestedProofMode: "none",
    focusAreas: ["mind"],
    motivationTags: ["inner_calm", "mental_clarity"],
    duration: 60,
  },
  {
    id: "weekly_review",
    title: "Weekly review",
    description: "Reflect on your week and plan the next one",
    category: "work",
    suggestedCadence: "weekly",
    suggestedProofMode: "note_only",
    focusAreas: ["work", "mind"],
    motivationTags: ["better_routine", "feeling_in_control"],
    duration: 90,
  },
];

export function getRecommendedTemplates(
  focusArea: string,
  motivations: string[]
): CommitmentTemplate[] {
  const normalizedMotivations = motivations.map((m) =>
    m.toLowerCase().replace(/\s+/g, "_")
  );

  const scored = commitmentTemplates.map((template) => {
    let score = 0;

    if (template.focusAreas.includes(focusArea.toLowerCase())) {
      score += 3;
    }

    for (const tag of template.motivationTags) {
      if (normalizedMotivations.includes(tag)) {
        score += 2;
      }
    }

    return { template, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.template);
}

export function getTemplateById(id: string): CommitmentTemplate | undefined {
  return commitmentTemplates.find((t) => t.id === id);
}
