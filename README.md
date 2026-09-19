# DevConnect — Developer Networking & Portfolio Platform

A full-stack developer networking platform built as a 15-day internship project:
authentication, profile management, project showcase, technical blog, social feed,
developer search, skill endorsements, gamification, real-time messaging and
notifications, analytics, and 12 AI-powered features via OpenRouter (FREE models only).

**Live demo:** deploy per `docs/DEPLOYMENT.md`. Stack: React 18 + Vite + Tailwind → Express
(TypeScript) → Supabase (PostgreSQL/Auth/Storage/Realtime) → OpenRouter.

---

## Monorepo layout

```
devconnect/
├── client/          React 18 SPA (Vite, Tailwind, React Query, Zustand)
├── server/          Express + TypeScript REST API
├── shared/          Shared TypeScript types & constants (single source of truth)
├── supabase/        SQL migrations, RLS policies, seed data
├── docs/            Architecture, API reference, schema, deployment, AI docs
├── docker-compose.yml
├── package.json     npm workspaces root
└── .env.example
```

## Quick start

```bash
# 1. Install (npm workspaces installs all three packages)
npm install

# 2. Configure environment
cp .env.example .env            # fill Supabase + OpenRouter keys
cp .env client/.env             # Vite needs VITE_ prefixed vars
cp .env server/.env             # server reads root vars

# 3. Create the database (Supabase CLI or SQL editor)
supabase db push                # applies supabase/migrations/*.sql
# then run supabase/seed.sql for badges/skills demo data

# 4. Run everything
npm run dev                     # API :5000 + client :5173
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API + client concurrently |
| `npm run build` | Build shared → server → client |
| `npm run typecheck` | Type-check all workspaces |
| `npm run lint` | ESLint client + server |
| `npm test` | Vitest (client) + Jest (server) |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run db:migrate` | Push Supabase migrations |

## Documentation

- `docs/ARCHITECTURE.md` — layers, data flow, diagrams
- `docs/API.md` — every endpoint with request/response examples
- `docs/DATABASE.md` — schema + RLS policy reference
- `docs/AI_FEATURES.md` — prompts, models, fallback chain, caching
- `docs/DEPLOYMENT.md` — Vercel + Render + Supabase walkthrough

## Security

- RLS enabled on every table; owner-only writes.
- Service-role and OpenRouter keys live server-side only.
- JWT verified on every protected route; AI endpoints rate-limited + cached.
- Uploads validated (type + ≤ 2 MB) before Supabase Storage.

> Rotate any key that has ever been shared publicly. See `.env.example` and
> `docs/DEPLOYMENT.md` for the full secrets checklist.

## License

MIT.
