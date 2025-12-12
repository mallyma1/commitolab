import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "Warning: Missing OPENAI_API_KEY - OpenAI features will not work",
  );
}

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Note:
// - Keys must be provided via environment variables (shell/process manager).
// - Never log or store OPENAI_API_KEY in files or HTTP responses.
// - Model can be configured via OPENAI_MODEL_COMMITO; default is set in route handlers.
