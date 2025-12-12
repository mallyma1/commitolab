# Commito AI Integration - Implementation Summary

## Overview
Complete AI coaching system with OpenAI integration, type-safe endpoints, and client SDK.

## Files Created

### Backend
- **server/llm/contract.ts** - Shared AI response contract types and validator
- **server/llm/systemPrompt.ts** - Commito LLM system prompt template
- **server/llm/responseBuilder.ts** - Deterministic fallback response builder
- **server/llm/requestSchemas.ts** - Zod validation schemas for AI endpoints

### Client
- **client/features/ai/sdk.ts** - Typed SDK for calling AI endpoints

## API Endpoints

### 1. POST /api/ai/respond
Generic endpoint accepting full context JSON per backend spec.

**Response**: `CommitoAiResponseContract`

### 2. GET /api/ai/coaching
Minimal context coaching with optional session ID.

**Headers**: `x-session-id` (optional)
**Response**: `CommitoAiResponseContract`

### 3. POST /api/ai/suggestions
Domain-specific suggestions from lightweight snapshot.

**Request**:
```json
{
  "user_id": "string",
  "surface": "home_main",
  "mode": "quick_nudge",
  "snapshot": {
    "completion_rate_last_7_days": 0.75,
    "streak_longest_days": 14,
    "active_commitments_count": 3,
    "self_regulation_trend": "improving"
  },
  "communication_preferences": { ... }
}
```

**Response**: `CommitoAiResponseContract`

### 4. POST /api/ai/commitment-help
Assists in refining commitment drafts.

**Request**:
```json
{
  "user_id": "string",
  "draft_commitment": {
    "title": "Run 60 minutes daily",
    "category": "health",
    "target_frequency": "daily",
    "notes": "Want to build consistency"
  },
  "behaviour_state": {
    "recent_completion_rate": 0.4,
    "current_commitments_count": 2
  },
  "communication_preferences": { ... }
}
```

**Response**: `CommitoAiResponseContract` with `meta.extra.proposed_commitment`

## Response Contract

All endpoints return:
```typescript
{
  summary_line: string;
  body: string[];
  actions?: Array<{
    label: string;
    action_type: string;
    internal_key: string;
  }>;
  meta: {
    tone_used: string;
    science_mode: boolean;
    approx_read_time_seconds?: number;
    extra?: {
      proposed_commitment?: {
        title: string;
        frequency: string;
        category: string;
      };
      rationale_tags?: string[];
    };
  };
}
```

## Environment Configuration

### Required
```bash
export OPENAI_API_KEY=sk-proj-...
```

### Optional
```bash
export OPENAI_MODEL_COMMITO=gpt-4.1-mini  # default if not set
```

## Client Usage

```typescript
import {
  getCoaching,
  getSuggestions,
  getCommitmentHelp,
  buildSuggestionsRequest,
  buildCommitmentHelpRequest,
} from "@/features/ai/sdk";

// Get coaching
const coaching = await getCoaching(userId);

// Get suggestions
const suggestionsReq = buildSuggestionsRequest({
  userId: user.id,
  completionRate: 0.75,
  longestStreak: 14,
  activeCount: 3,
  trend: "improving",
});
const suggestions = await getSuggestions(suggestionsReq);

// Get commitment help
const helpReq = buildCommitmentHelpRequest({
  userId: user.id,
  title: "Run 60 minutes daily",
  category: "health",
  frequency: "daily",
  recentCompletionRate: 0.4,
});
const help = await getCommitmentHelp(helpReq);

// Use the proposed commitment
if (help.meta.extra?.proposed_commitment) {
  const { title, frequency, category } = help.meta.extra.proposed_commitment;
  // Create commitment with refined values
}
```

## Safety Features

1. **Environment-only secrets** - No hardcoded keys
2. **Request validation** - Zod schemas enforce correct input
3. **Response validation** - Runtime validator ensures contract compliance
4. **Graceful fallback** - Deterministic responses when OpenAI unavailable
5. **No DB dependency** - AI endpoints work without database
6. **Error handling** - All endpoints catch and log errors, return valid fallback

## Type Safety

- All endpoints use `CommitoAiResponseContract`
- Request bodies validated with zod schemas
- Client SDK provides TypeScript helpers
- No `any` types in critical paths

## Testing Locally

```bash
# Set API key (don't commit!)
export OPENAI_API_KEY=sk-proj-...

# Start backend
npm run server:dev

# Test coaching endpoint
curl http://localhost:5000/api/ai/coaching

# Test suggestions
curl -X POST http://localhost:5000/api/ai/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test","surface":"home_main","mode":"quick_nudge","snapshot":{"completion_rate_last_7_days":0.75,"streak_longest_days":14,"active_commitments_count":3,"self_regulation_trend":"improving"}}'

# Test commitment help
curl -X POST http://localhost:5000/api/ai/commitment-help \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test","draft_commitment":{"title":"Run 60 minutes daily","category":"health","target_frequency":"daily"}}'
```

## Production Checklist

- [ ] Set `OPENAI_API_KEY` in production environment
- [ ] Configure `OPENAI_MODEL_COMMITO` if using different model
- [ ] Monitor API usage and costs
- [ ] Rotate keys on schedule or if compromised
- [ ] Set up error alerting for AI endpoint failures
- [ ] Review and tune system prompt for brand voice
- [ ] Test fallback behavior without OpenAI key
- [ ] Validate response times and consider caching

## Security Notes

- Never commit `OPENAI_API_KEY` to version control
- Don't store keys in tracked `.env` files
- Use environment variables or secret managers
- Rotate keys if exposure suspected
- Keys are never logged or returned in responses
- All validation errors return 400 (no internal details leaked)
