# Testing

Two layers of automated tests plus end-to-end specs. Total: **31 unit/component tests**.

## Run everything

```bash
npm test               # server (Jest) + client (Vitest)
npm run typecheck      # all three workspaces
npm run test:e2e       # Playwright (needs the client running)
```

## Server — Jest (18 tests)

```bash
cd server
NODE_ENV=test \
SUPABASE_URL=https://test.supabase.co \
SUPABASE_ANON_KEY=test-anon-key \
SUPABASE_SERVICE_ROLE_KEY=test-service-key \
npm test
```

| File | Covers |
| --- | --- |
| `src/lib/errors.test.ts` | `AppError` factories/status codes, `errorMessage`, `parsePagination` clamping, `hashPrompt` determinism |
| `src/lib/shared.test.ts` | slugify, reading time, truncate/unique/groupBy/clamp, `timeAgo`, 2 MB cap, `:free`-only fallback chain, score weights = 100 |

## Client — Vitest (13 tests)

```bash
cd client && npm test
```

| File | Covers |
| --- | --- |
| `src/test/utils.test.ts` | initials, deterministic gradients, availability/mentor labels, safe date formatting, pluralisation, image validation (type + size) |
| `src/test/ui.test.tsx` | Button rendering/disabled-while-loading, Badge, Avatar initials fallback, EmptyState |

`src/test/setup.ts` stubs `matchMedia`, `scrollTo`, `scrollIntoView` and the `VITE_*`
env vars so components mount under jsdom.

## Client — Playwright (smoke)

```bash
cd client && npx playwright install && npm run test:e2e
```

`client/e2e/smoke.spec.ts` asserts (without a seeded database):

- the landing hero and CTA render;
- "Get started" navigates to `/register`;
- the login form is present and required-field validation keeps you on the page;
- unauthenticated `/dashboard` redirects to `/login`;
- unknown paths render the 404 page.

Runs on Desktop Chrome and Pixel 5 viewports.

## What is not covered

- Live database integration (needs a real Supabase project) — verified manually via the
  deployment checklist in `docs/DEPLOYMENT.md`.
- Live AI calls (need an OpenRouter key) — the pipeline is unit-verified for chain
  ordering and caching keys; endpoints return a clear configuration error without a key.
- Realtime delivery — verified manually with two browser sessions.
