import type { CommitoAiResponseContract, ProposedCommitment } from "./contract";

type CommitoContext = {
  user_profile?: { name?: string };
  communication_preferences?: {
    tone?: string;
    length_preference?: "short" | "medium" | "long" | string;
    language_style?: string;
    science_detail?: "low" | "medium" | "high" | string;
  };
  behaviour_state?: {
    commitments?: {
      title?: string;
      difficulty?: string;
      frequency?: string;
      streak_days?: number;
      completion_rate_last_30_days?: number;
      last_completed_at?: string;
    }[];
    check_ins?: {
      total_last_7_days?: number;
      total_planned_last_7_days?: number;
      completion_rate_last_7_days?: number;
      missed_streak_events_last_30_days?: number;
    };
    self_regulation?: {
      latest_score?: number;
      previous_score?: number;
      trend?: "improving" | "stable" | "declining" | string;
      latest_date?: string;
      previous_date?: string;
    };
  };
  session_context?: {
    interaction_type?: string;
  };
  user_message?: string;
  request_flags?: {
    needs_scientific_explanation?: boolean;
    needs_soft_tone?: boolean;
    explicit_request_for_data?: boolean;
  };
};

function pickTone(
  prefs?: CommitoContext["communication_preferences"],
  flags?: CommitoContext["request_flags"],
): string {
  if (prefs?.tone) return prefs.tone;
  if (flags?.needs_soft_tone) return "soft_supportive";
  return "soft_supportive";
}

function estimateReadTime(lengthPref?: string): number {
  switch (lengthPref) {
    case "long":
      return 25;
    case "medium":
      return 18;
    default:
      return 12;
  }
}

/**
 * Lightweight, deterministic fallback that follows the output contract
 * without calling an LLM. Uses minimal heuristics from context.
 */
export function buildFallbackCoachingResponse(
  ctx: CommitoContext,
  options?: {
    mode?: "commitment_help";
    draft?: { title?: string; category?: string; target_frequency?: string };
  },
): CommitoAiResponseContract {
  const name = ctx.user_profile?.name || "You";
  const tone = pickTone(ctx.communication_preferences, ctx.request_flags);
  const lengthPref =
    ctx.communication_preferences?.length_preference || "short";
  const sciencePref = ctx.communication_preferences?.science_detail || "medium";
  const interaction =
    ctx.session_context?.interaction_type || "check_in_confirmation";

  const commitments = ctx.behaviour_state?.commitments || [];
  const primary = commitments[0];
  const streak = primary?.streak_days ?? 0;
  const weekly =
    ctx.behaviour_state?.check_ins?.completion_rate_last_7_days ?? 0;
  const trend = ctx.behaviour_state?.self_regulation?.trend || "stable";

  const body: string[] = [];
  const useShort = lengthPref === "short";

  // Normalise + Reflect
  body.push(
    `${name} ${streak >= 3 ? "you\'re building consistency" : "you\'re getting started"}. ${primary?.title ? `Today\'s focus: ${primary.title}.` : "Keep your focus small and clear."}`,
  );

  if (!useShort) {
    if (sciencePref !== "low") {
      body.push(
        "Frequent repetition over weeks matters more than perfection; small actions compound.",
      );
    }
    if (weekly > 0 && weekly < 0.5) {
      body.push(
        "Your recent completion rate is on the low side; simplifying can help repetition.",
      );
    } else if (weekly >= 0.5) {
      body.push(
        "You\'re completing most planned actions; keep the cadence steady as it becomes easier.",
      );
    }
    if (trend === "improving") {
      body.push(
        "Self regulation is trending up; maintain stable routines and clear cues.",
      );
    }
  }

  // Recommend (one small step)
  body.push(
    "Plan the same time tomorrow for a repeat. Set a 1-minute prep cue.",
  );

  const response: CommitoAiResponseContract = {
    summary_line:
      interaction === "check_in_missed"
        ? "Lapses happen—make it smaller and try again at a clear time."
        : "Steady repetition builds the habit—nice work today.",
    body,
    actions: [
      {
        label: "Plan tomorrow",
        action_type: "suggested_next_step",
        internal_key: "PLAN_NEXT_DAY",
      },
    ],
    meta: {
      tone_used: tone,
      science_mode: sciencePref === "high",
      approx_read_time_seconds: estimateReadTime(lengthPref),
    },
  };

  if (options?.mode === "commitment_help") {
    const proposed: ProposedCommitment = {
      title: options.draft?.title
        ? options.draft.title.replace(/\b(\d{2,})\b/, (m) =>
            String(Math.max(5, Math.min(20, Number(m)))),
          )
        : "Simplified daily check-in",
      frequency: options.draft?.target_frequency || "daily",
      category: options.draft?.category || "personal_improvement",
    };
    response.summary_line = "Let\'s make this simpler and more repeatable.";
    response.actions = [
      {
        label: "Use proposed version",
        action_type: "suggested_next_step",
        internal_key: "APPLY_PROPOSED_COMMITMENT",
      },
      {
        label: "Tweak details",
        action_type: "suggested_next_step",
        internal_key: "OPEN_EDIT_COMMITMENT",
      },
    ];
    response.meta.extra = {
      proposed_commitment: proposed,
      rationale_tags: ["reduce_scope", "build_consistency_first"],
    };
  }

  return response;
}
