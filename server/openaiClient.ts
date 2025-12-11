import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: Missing OPENAI_API_KEY - OpenAI features will not work");
}

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;
