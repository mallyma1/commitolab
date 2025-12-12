/**
 * Client-side SDK for Commito AI endpoints
 *
 * Provides typed helpers for calling AI coaching, suggestions, and commitment assistance.
 * All endpoints return the standard CommitoAiResponseContract.
 */

const baseUrl = (() => {
  // Use EXPO_PUBLIC_API_URL only - hard default to production
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://api.committoo.space";
  
  console.log("[AI SDK] ═══════════════════════════════════════");
  console.log("[AI SDK] 🤖 AI SDK Configuration");
  console.log("[AI SDK] ─────────────────────────────────────");
  console.log(`[AI SDK] Base URL: ${apiUrl}`);
  console.log(`[AI SDK] EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || "❌ NOT SET"}`);
  console.log("[AI SDK] ═══════════════════════════════════════");
  
  return apiUrl;
})();

// Types matching backend contract
export type CommitoAiAction = {
  label: string;
  action_type: string;
  internal_key: string;
};

export type ProposedCommitment = {
  title: string;
  frequency: string;
  category: string;
};

export type CommitoAiMeta = {
  tone_used: string;
  science_mode: boolean;
  approx_read_time_seconds?: number;
  extra?: {
    proposed_commitment?: ProposedCommitment;
    rationale_tags?: string[];
  };
};

export type CommitoAiResponse = {
  summary_line: string;
  body: string[];
  actions?: CommitoAiAction[];
  meta: CommitoAiMeta;
};

// Request types
export type CommunicationPreferences = {
  tone?: string;
  detail_level?: string;
  science_detail?: string;
  length_preference?: string;
  language_style?: string;
};

export type SuggestionsRequest = {
  user_id: string;
  surface: string;
  mode: string;
  snapshot: {
    completion_rate_last_7_days: number;
    streak_longest_days: number;
    active_commitments_count: number;
    self_regulation_trend: "improving" | "stable" | "declining" | string;
  };
  communication_preferences?: CommunicationPreferences;
};

export type CommitmentHelpRequest = {
  user_id: string;
  draft_commitment: {
    title: string;
    category: string;
    target_frequency: string;
    notes?: string;
  };
  behaviour_state?: {
    recent_completion_rate?: number;
    current_commitments_count?: number;
  };
  communication_preferences?: CommunicationPreferences;
};

/**
 * Get coaching message based on minimal context
 */
export async function getCoaching(
  sessionId?: string
): Promise<CommitoAiResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionId) {
    headers["x-session-id"] = sessionId;
  }

  const response = await fetch(`${baseUrl}/api/ai/coaching`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Coaching request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get AI suggestions for a specific surface
 */
export async function getSuggestions(
  request: SuggestionsRequest
): Promise<CommitoAiResponse> {
  const response = await fetch(`${baseUrl}/api/ai/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Suggestions request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get AI help refining a commitment draft
 */
export async function getCommitmentHelp(
  request: CommitmentHelpRequest
): Promise<CommitoAiResponse> {
  const response = await fetch(`${baseUrl}/api/ai/commitment-help`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Commitment help request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a full context payload to the generic AI respond endpoint
 */
export async function sendAiContext(context: any): Promise<CommitoAiResponse> {
  const response = await fetch(`${baseUrl}/api/ai/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    throw new Error(`AI respond request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper: Build a suggestions request from current user state
 */
export function buildSuggestionsRequest(params: {
  userId: string;
  surface?: string;
  mode?: string;
  completionRate: number;
  longestStreak: number;
  activeCount: number;
  trend?: "improving" | "stable" | "declining";
  preferences?: CommunicationPreferences;
}): SuggestionsRequest {
  return {
    user_id: params.userId,
    surface: params.surface || "home_main",
    mode: params.mode || "quick_nudge",
    snapshot: {
      completion_rate_last_7_days: params.completionRate,
      streak_longest_days: params.longestStreak,
      active_commitments_count: params.activeCount,
      self_regulation_trend: params.trend || "stable",
    },
    communication_preferences: params.preferences,
  };
}

/**
 * Helper: Build a commitment help request from draft data
 */
export function buildCommitmentHelpRequest(params: {
  userId: string;
  title: string;
  category: string;
  frequency: string;
  notes?: string;
  recentCompletionRate?: number;
  currentCommitmentsCount?: number;
  preferences?: CommunicationPreferences;
}): CommitmentHelpRequest {
  return {
    user_id: params.userId,
    draft_commitment: {
      title: params.title,
      category: params.category,
      target_frequency: params.frequency,
      notes: params.notes,
    },
    behaviour_state: {
      recent_completion_rate: params.recentCompletionRate,
      current_commitments_count: params.currentCommitmentsCount,
    },
    communication_preferences: params.preferences,
  };
}
