import { z } from "zod";

// Zod schemas for AI endpoint request validation

export const suggestionsRequestSchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  surface: z.string().min(1, "surface is required"),
  mode: z.string().min(1, "mode is required"),
  snapshot: z.object({
    completion_rate_last_7_days: z.number().min(0).max(1),
    streak_longest_days: z.number().int().min(0),
    active_commitments_count: z.number().int().min(0),
    self_regulation_trend: z
      .enum(["improving", "stable", "declining"])
      .or(z.string()),
  }),
  communication_preferences: z
    .object({
      tone: z.string().optional(),
      detail_level: z.string().optional(),
      science_detail: z.string().optional(),
      length_preference: z.string().optional(),
      language_style: z.string().optional(),
    })
    .optional(),
});

export const commitmentHelpRequestSchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  draft_commitment: z.object({
    title: z.string().min(1, "title is required"),
    category: z.string().min(1, "category is required"),
    target_frequency: z.string().min(1, "target_frequency is required"),
    notes: z.string().optional(),
  }),
  behaviour_state: z
    .object({
      recent_completion_rate: z.number().min(0).max(1).optional(),
      current_commitments_count: z.number().int().min(0).optional(),
    })
    .optional(),
  communication_preferences: z
    .object({
      tone: z.string().optional(),
      detail_level: z.string().optional(),
      science_detail: z.string().optional(),
      length_preference: z.string().optional(),
      language_style: z.string().optional(),
    })
    .optional(),
});

export type SuggestionsRequest = z.infer<typeof suggestionsRequestSchema>;
export type CommitmentHelpRequest = z.infer<typeof commitmentHelpRequestSchema>;
