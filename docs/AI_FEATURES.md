# AI features

All AI runs server-side through **OpenRouter with free models only**. The API key never
reaches the browser. See `server/src/modules/ai/`.

## Pipeline

```
client ──POST /api/ai/<feature>──▶ authenticate ──▶ aiLimiter (20/h per user)
                                        │
                                        ▼
                               hash feature+model+prompt
                                        │
                              ┌── cache hit ──▶ return cached (no quota used)
                              │
                              ▼
                        OpenRouter attempt #1 (preferred model)
                              │ 429 / 5xx / timeout
                              ▼
                        attempt #2..#4 (fallback chain)
                              │
                              ▼
                     store in ai_cache ──▶ record ai_usage ──▶ respond with _meta
```

## Models

| Key | Model ID | Used by |
| --- | --- | --- |
| general | `meta-llama/llama-3.3-70b-instruct:free` | profile summary, blog assist, feed ranking, chat |
| fast | `meta-llama/llama-3.1-8b-instruct:free` | tags, smart search |
| code | `qwen/qwen-2.5-coder-32b-instruct:free` | code review, project description |
| reasoning | `deepseek/deepseek-r1:free` | skill gap, resume |
| guard | `meta-llama/llama-guard-3-8b` | content moderation |

**Fallback chain** (tried in order, max 4 attempts):

```
meta-llama/llama-3.3-70b-instruct:free
meta-llama/llama-3.1-8b-instruct:free
mistralai/mistral-7b-instruct:free
google/gemma-2-9b-it:free
```

A model is only skipped for retryable failures (429, 408, 5xx, network). Non-retryable
errors (e.g. 400 bad request) stop the loop immediately.

## Feature list

| # | Feature | Endpoint | Model | Notes |
| --- | --- | --- | --- | --- |
| 1 | AI Profile Summary | `POST /ai/profile-summary` | general | Enriches from stored skills when the body omits them |
| 2 | AI Skill Matching | `/connections/suggestions` + `POST /ai/rank-feed` | fast/general | Shared-skill scoring with AI ranking |
| 3 | AI Blog Assistant | `POST /ai/blog-assist` | general | Returns titles, tags, grammar fixes, outline as JSON |
| 4 | Smart Search | `POST /ai/smart-search` + `/search/ai` | fast | NL → `{skills, location, minYears, availability, role}` |
| 5 | AI Skill Gap Analysis | `POST /ai/skill-gap` | reasoning | Missing skills, strengths, roadmap |
| 6 | AI Project Description | `POST /ai/project-description` | code | From repo URL / tech / title |
| 7 | AI Code Review | `POST /ai/code-review` | code | Issues with severity + line, suggestions |
| 8 | AI Resume Builder | `POST /ai/resume` | reasoning | One-page markdown resume from the profile |
| 9 | AI Content Moderation | `POST /ai/moderate` (+ inline on comments/feed/group posts) | guard | SAFE / SPAM / INAPPROPRIATE |
| 10 | AI Feed Ranking | `POST /ai/rank-feed` (+ `GET /feed?rank=ai`) | general | Orders post ids for a user |
| 11 | AI Chat Assistant | `POST /ai/chat` | general | Multi-turn, last 6 turns of history |
| 12 | AI Tag Generator | `POST /ai/tags` | fast | 8 lowercase tags; auto-runs on new posts with no tags |

## Prompt design

Prompts are centralised in `server/src/modules/ai/prompts.ts`. Two system prompts are
reused:

- `SYSTEM_DEV_ASSISTANT` — concise senior-engineer tone for prose features.
- `SYSTEM_JSON` — forces a single JSON object for structured features.

Structured features use `response_format: { type: 'json_object' }` **and** a tolerant
parser (`extractJson`) that strips markdown fences and finds the outermost `{…}`/`[…]`
block, so a chatty model still yields usable data. Every parsed result is normalised and
length-capped before returning (e.g. 5 titles, 8 tags, 5 missing skills).

## Caching

- Key: `sha256(JSON.stringify({ feature, model, system, prompt, json, temperature }))`.
- Stored in `ai_cache` with `hit_count` bumped on every read.
- A cache hit consumes **no** hourly quota, which is the main defence against the free
  tier's low daily limits.
- Entries older than 30 days are purged weekly by a cron job.

## Rate limiting

Two layers:

1. `express-rate-limit` keyed by user id — 20 AI requests/hour (`aiLimiter`).
2. `ai_usage` rows counted over a rolling hour inside `guardQuota()`, which throws a
   `429` before any upstream call when exceeded.

Cached responses bypass both, so popular queries are effectively unlimited.

## Error behaviour

- Provider failure after all retries → `500 INTERNAL_ERROR` with the last upstream message.
- Missing API key → `500` with a clear configuration message (checked before the loop).
- Moderation blocks user content → `422 MODERATION_BLOCKED` with the label and reason.
- Moderation calls never consume the user's quota and are wrapped so a guard outage
  fails **open** (content is allowed) rather than blocking posting.

## Tests & verification

`server/src/lib/shared.test.ts` asserts the fallback chain contains only `:free` models
and that the score weights total 100. The AI service itself is integration-tested by
exercising the endpoints with a configured key; without a key the routes return the
configuration error above, so the server still boots cleanly.
