# API Reference

Base URL: `http://localhost:5000/api` (dev) — set `API_URL` for other environments.

Every response uses the same envelope:

```jsonc
// success
{ "success": true, "data": { }, "message": "OK" }

// failure
{ "success": false, "data": null, "message": "Why it failed",
  "error": { "code": "BAD_REQUEST", "details": null } }
```

Authentication: `Authorization: Bearer <supabase-access-token>`.

Error codes: `BAD_REQUEST` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT`
· `VALIDATION_ERROR` · `RATE_LIMITED` · `MODERATION_BLOCKED` · `INTERNAL_ERROR`.

---

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness + version |
| GET | `/health/db` | — | Database latency check |

## Auth — `/auth`

| Method | Path | Auth | Body / Notes |
| --- | --- | --- | --- |
| POST | `/register` | — | `{ email, password, username, full_name? }` |
| POST | `/login` | — | `{ email, password }` → session tokens |
| POST | `/logout` | ✔ | Invalidates the session |
| GET | `/me` | ✔ | Current user + profile |
| GET | `/github` | — | Returns the Supabase GitHub OAuth URL |
| GET | `/github/callback` | — | `?code=` → exchanges for a session |
| POST | `/refresh` | — | `{ refresh_token }` |
| POST | `/verify-email` | — | `{ email, token }` |
| POST | `/forgot-password` | — | `{ email }` (never reveals existence) |
| POST | `/reset-password` | ✔ | `{ password }` |
| POST | `/2fa/enable` | ✔ | Returns TOTP QR + secret |
| POST | `/2fa/verify` | ✔ | `{ factorId, code }` |
| GET | `/sessions` | ✔ | Recent sign-in audit entries |

## Profile — `/profile`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/:username` | opt | Full profile + counts, records a view |
| PUT | `/` | ✔ | Update profile fields |
| POST | `/avatar` | ✔ | multipart `avatar` (≤ 2 MB) |
| POST/DELETE | `/experience[/:id]` | ✔ | Add / remove experience |
| POST/DELETE | `/education[/:id]` | ✔ | Add / remove education |
| POST/DELETE | `/certifications[/:id]` | ✔ | Add / remove certification |
| POST | `/skills` | ✔ | `{ skill, proficiency? }` |
| DELETE | `/skills/:skillId` | ✔ | Remove a skill |
| GET | `/id/:id/analytics` | ✔ owner | Views, traffic sources, trends |
| GET | `/id/:id/resume` | — | Printable HTML resume (→ PDF) |

## Projects — `/projects`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | opt | `?user=&tech=&q=&page=&pageSize=` |
| GET | `/:id` | opt | Increments the view counter |
| POST | `/` | ✔ | Create |
| PUT | `/:id` | ✔ owner | Update |
| DELETE | `/:id` | ✔ owner | Delete |
| POST | `/:id/images` | ✔ owner | multipart `images` (≤ 5 × 2 MB) |
| POST | `/:id/collaborate` | ✔ | Request to collaborate |
| POST | `/:id/bookmark` | ✔ | Toggle bookmark |

## Blog — `/posts`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | opt | `?tag=&q=&mine=true&author=` |
| GET | `/trending` | — | Top viewed posts, last 30 days |
| GET | `/:slug` | opt | By slug or uuid |
| POST | `/` | ✔ | Create (auto-tags when none supplied) |
| PUT | `/:id` | ✔ owner | Update (regenerates slug/reading time) |
| DELETE | `/:id` | ✔ owner | Delete |
| POST | `/:id/like` | ✔ | Toggle like |
| POST | `/:id/bookmark` | ✔ | Toggle bookmark |
| GET | `/:id/comments` | — | Threaded comments |
| POST | `/:id/comment` | ✔ | AI-moderated |
| POST | `/:id/cover` | ✔ owner | multipart `cover` |

## Feed — `/feed`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | opt | `?rank=ai` for AI ranking |
| POST | `/posts` | ✔ | AI-moderated, broadcasts `feed:new` |
| DELETE | `/posts/:id` | ✔ owner | Delete |
| POST | `/posts/:id/react` | ✔ | `{ reaction }` one of the emoji set |

## Connections — `/connections`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/request` | ✔ | `{ addressee_id, message? }` |
| GET | `/` | ✔ | Accepted connections |
| GET | `/pending` | ✔ | `{ incoming, outgoing }` |
| POST | `/:id/accept` | ✔ | Accept a request |
| POST | `/:id/reject` | ✔ | Decline a request |
| DELETE | `/:id` | ✔ | Remove / withdraw |
| GET | `/mutual/:userId` | ✔ | Mutual connections (RPC) |
| GET | `/suggestions` | ✔ | Shared-skill matches |
| POST | `/follow/:userId` | ✔ | Toggle follow |
| GET | `/followers/:userId` · `/following/:userId` | ✔ | Lists |

## Messaging — `/conversations`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | ✔ | Conversations with unread counts |
| POST | `/` | ✔ | `{ user_id }` — get or create |
| GET | `/:id/messages` | ✔ participant | Paginated, newest last |
| POST | `/:id/messages` | ✔ participant | Sends + broadcasts |
| POST | `/:id/read` | ✔ | Marks received messages read |
| POST | `/:id/typing` | ✔ | Broadcasts a typing indicator |

## Search — `/search`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/developers` | opt | `?q=&skills=&location=&availability=&open_to_work=&min_years=&sort=` |
| POST | `/ai` | ✔ | Natural language → filters → results |
| GET | `/skills` | — | Skill catalogue / autocomplete |
| GET | `/trending-skills` | — | Top skills by adoption |
| GET | `/saved` · POST `/saved` · DELETE `/saved/:id` | ✔ | Saved searches |
| GET | `/map` | — | Developers with locations |

## Endorsements — `/endorsements`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/` | ✔ | `{ endorsed_id, skill_id }` — connection required |
| DELETE | `/:id` | ✔ | Retract own endorsement |
| GET | `/:userId` | opt | Counts per skill + endorsers |

## Gamification (mounted at `/api`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/score/:userId` | opt | Score, breakdown, rank |
| GET | `/leaderboard` | opt | `?scope=global\|skill\|location&skill=&location=` |
| GET | `/badges` | — | Badge catalogue |
| GET | `/badges/:userId` | — | Earned badges |
| GET | `/streak` | ✔ | Current/longest + heatmap |
| POST | `/streak/ping` | ✔ | Record activity |

## Groups — `/groups`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | opt | `?q=` paginated |
| POST | `/` | ✔ | Create (owner auto-joins) |
| GET | `/:id` | opt | Group + membership |
| POST | `/:id/join` · `/:id/leave` | ✔ | Membership |
| GET/POST | `/:id/posts` | opt / ✔ member | Group feed |
| GET | `/:id/members` | — | Member list |
| POST | `/:id/invite` | ✔ owner | Invite a user |

## Notifications — `/notifications`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | ✔ | `?unread=true` + unread count |
| GET | `/count` | ✔ | Unread count only |
| POST | `/read` | ✔ | Mark all, or `{ ids: [] }` |
| DELETE | `/:id` | ✔ | Dismiss |

## AI — `/ai` (authenticated, 20 calls/hour)

| Method | Path | Body | Model |
| --- | --- | --- | --- |
| POST | `/profile-summary` | `{ name?, skills?, projects?, experience? }` | llama-3.3-70b:free |
| POST | `/blog-assist` | `{ draft }` | llama-3.3-70b:free |
| POST | `/skill-gap` | `{ skills, role, location? }` | deepseek-r1:free |
| POST | `/project-description` | `{ repoUrl?, tech?, title? }` | qwen-2.5-coder:free |
| POST | `/code-review` | `{ language, code }` | qwen-2.5-coder:free |
| POST | `/resume` | — (uses profile) | deepseek-r1:free |
| POST | `/smart-search` | `{ query }` | llama-3.1-8b:free |
| POST | `/chat` | `{ message, history? }` | llama-3.3-70b:free |
| POST | `/tags` | `{ content }` | llama-3.1-8b:free |
| POST | `/rank-feed` | `{ interests, connections, posts }` | llama-3.3-70b:free |
| POST | `/moderate` | `{ content }` (mod/admin) | llama-guard-3-8b |

Every AI response includes `_meta: { model, cached, tokens_used, remaining_hourly }`.

## Admin — `/admin` (moderator or admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/users` | `?q=&role=` |
| PATCH | `/users/:id/role` | admin only |
| GET | `/reports` | `?status=` |
| POST | `/reports/:id/resolve` | `{ status, note? }` |
| POST | `/reports` | Submit a report (any authenticated user) |
| GET | `/audit-logs` | `?action=` |
| GET | `/stats` | Platform counters |
| GET | `/moderation-queue` | Open reports enriched with AI verdicts |

## Utilities

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET/POST | `/events` | opt / ✔ | Events |
| POST | `/events/:id/rsvp` | ✔ | RSVP |
| GET/POST | `/questions` · GET `/questions/:id` · POST `/questions/:id/answers` | mixed | Q&A |
| GET/POST | `/snippets` | mixed | Code snippets |
| GET | `/testimonials/:userId` · POST `/testimonials` | mixed | Recommendations |
| GET | `/bookmarks` | ✔ | Reading list |

## Realtime — `/realtime`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/heartbeat` | Presence ping |
| POST | `/offline` | Leave presence |
| GET | `/online` | Who is online |
| POST/GET | `/typing/:conversationId` | Typing state (REST fallback) |
| POST | `/room` | Broadcast code to a live coding room |
| GET | `/config` | Channel names for the client |

## Rate limits

| Scope | Window | Max |
| --- | --- | --- |
| All API | 60 s | 120 requests |
| Auth | 60 s | 20 requests |
| Writes (feed, messages, comments) | 60 s | 30 requests |
| AI (per user) | 1 h | 20 uncached calls |
