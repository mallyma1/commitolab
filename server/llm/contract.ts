// Shared Commito AI response contract and runtime validator.
// Keys must be provided via environment variables (e.g., process manager or shell).
// Do not commit secrets to source control or tracked .env files.

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

export type CommitoAiResponseContract = {
  summary_line: string;
  body: string[];
  actions?: CommitoAiAction[];
  meta: CommitoAiMeta;
};

export function validateCommitoResponse(
  obj: any,
): CommitoAiResponseContract | null {
  try {
    if (!obj || typeof obj !== "object") return null;
    const { summary_line, body, actions, meta } = obj;
    if (typeof summary_line !== "string" || summary_line.trim().length === 0)
      return null;
    if (!Array.isArray(body) || !body.every((b) => typeof b === "string"))
      return null;
    if (!meta || typeof meta !== "object") return null;
    if (typeof meta.tone_used !== "string") return null;
    if (typeof meta.science_mode !== "boolean") return null;
    if (actions) {
      if (!Array.isArray(actions)) return null;
      for (const a of actions) {
        if (!a || typeof a !== "object") return null;
        if (
          typeof a.label !== "string" ||
          typeof a.action_type !== "string" ||
          typeof a.internal_key !== "string"
        )
          return null;
      }
    }
    return obj as CommitoAiResponseContract;
  } catch {
    return null;
  }
}
