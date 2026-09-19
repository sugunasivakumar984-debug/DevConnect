# Architecture

## System overview

```
┌────────────────────────┐        ┌─────────────────────────┐        ┌──────────────────────┐
│  React 18 SPA (Vite)   │  HTTPS │  Express API (Node/TS)  │  SQL   │  Supabase            │
│  Tailwind · RQ · Zustand│ ─────▶ │  REST + Zod validation  │ ─────▶ │  Postgres + RLS      │
│  Supabase JS client    │        │  AI service (OpenRouter)│        │  Auth · Storage      │
└─────────┬──────────────┘        └───────────┬─────────────┘        │  Realtime            │
          │                                   │                       └──────────┬───────────┘
          │  Realtime websocket (supabase-js) │                                  │
          └───────────────────────────────────┼──────────────────────────────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │  OpenRouter (free)   │
                                   │  llama / qwen / ds   │
                                   └─────────────────────┘
```

Three deployables share one TypeScript contract:

| Layer | Tech | Responsibility |
| --- | --- | --- |
| `client/` | React 18, Vite, Tailwind, React Query, Zustand | UI, routing, client state, realtime subscriptions |
| `server/` | Express, TypeScript, Zod, Supabase service role | Validation, business rules, AI orchestration, audit |
| `shared/` | TypeScript types + constants + utils | Single source of truth for the API contract |
| `supabase/` | SQL migrations | Schema, RLS, RPC functions, storage, realtime |

## Data flow

1. **Auth** — the browser authenticates with Supabase (email/password or GitHub OAuth).
   The session (access + refresh token) is persisted by `supabase-js`.
2. **Requests** — Axios attaches the access token as `Authorization: Bearer …`.
   The server verifies it with `supabaseAdmin.auth.getUser(token)`, loads the profile
   and attaches it to the request.
3. **Reads/writes** — the server uses the **service-role** client for data access and
   therefore applies RLS-bypassing queries deliberately; user-scoped operations always
   filter by `auth.uid()`-equivalent (`req.user.id`).
4. **Realtime** — the browser holds a Realtime websocket directly to Supabase and
   subscribes to broadcast channels (`notifications:<userId>`, `conversation:<id>`,
   `online-users`, `global-feed`, `group:<id>`). Postgres Changes is enabled for
   `messages`, `notifications`, `connections` and `feed_posts`.
5. **AI** — the client calls `/api/ai/*`; the server builds a prompt, checks
   `ai_cache` by SHA-256 hash, calls OpenRouter with a fallback chain, caches the
   result and records usage for the per-user hourly quota.

## Why the service-role client?

Server-side operations need cross-user reads (a profile page shows another user's
projects) that would be painful as the caller's JWT. Using the service role keeps the
API simple, and authorization is enforced in the Express layer (`authenticate`,
`requireRole`, per-route ownership checks) plus RLS stays on for any direct
`supabase-js` access from the browser.

## RLS strategy

RLS is enabled on **every** table. The default posture is:

- Public read for directory-style data (`profiles`, `projects`, published `blog_posts`,
  `skills`, `endorsements`, `groups`, `questions`).
- Owner-only writes (`auth.uid() = user_id`).
- Participant-only access for private data (`conversations`, `messages`, `notifications`).
- Relationship-gated actions (endorsements require an accepted connection).

See `docs/DATABASE.md` for the full policy list.

## Developer score

`recompute_dev_score(user_id)` is a Postgres function that caps each contribution
category and stores a JSON breakdown. It is called by the server after meaningful
actions and nightly by a cron job. Weights live in `shared/src/constants.ts`:

```
projects 25 · endorsements 25 · blog_posts 20 · connections 15 · activity 10 · completeness 5
```

## Failure handling

- **AI**: a 429/5xx on the preferred model falls through to the next model in the
  fallback chain (up to 4 attempts); the cache is checked first so repeated identical
  prompts never hit the provider.
- **Realtime**: broadcast is best-effort and never fails the HTTP request; the client
  also refetches via React Query on reconnect.
- **Database**: every Supabase error is surfaced as a typed `AppError` and rendered
  through the standard error envelope.

## Directory map

```
server/src/
  config.ts              validated env
  lib/                   supabase clients, response helpers, errors, cache, helpers
  middleware/            auth, validation, rate limits, upload, error handling
  modules/               one folder per domain (auth, profile, projects, blog, feed,
                         connections, messages, search, endorsements, gamification,
                         groups, notifications, ai, admin, utilities)
  realtime/              presence + broadcast endpoints
  jobs/                  cron: scores, badges, digest, streaks, cache cleanup
  index.ts               app factory + route mounting

client/src/
  components/            ui primitives, layout, feed, ai
  pages/                 one component per route (lazy loaded)
  api/hooks.ts           every React Query hook + query keys
  lib/                   supabase, axios, realtime, utils
  stores/                Zustand auth + UI stores
```
