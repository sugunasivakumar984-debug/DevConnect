# Deployment

Three pieces: **Supabase** (database/auth/storage/realtime), **Render** (API),
**Vercel** (client). No paid services required.

---

## 0. Security first — rotate exposed keys

If any key was ever shared in plaintext (chat, commit, screenshot), treat it as
compromised:

1. **OpenRouter** → delete the key at https://openrouter.ai/keys and create a new one.
2. **Supabase service role** → Project Settings → API → *Roll* the `service_role` key.
3. Never put `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` or `SUPABASE_JWT_SECRET`
   in the client. Only `VITE_*` variables reach the browser, and those must be the
   `anon`/publishable key.

---

## 1. Supabase

1. Create a project (free tier).
2. Open the **SQL Editor** and run the migrations in order, or use the CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Run `supabase/seed.sql` to load skills, badges, sample groups and events.
4. **Storage** → create the three buckets if they were not created by migration 00007:
   `avatars`, `project-images`, `blog-images` — each **public**, 2 MB limit, image MIME
   types only.
5. **Authentication → Providers → GitHub**: add your Client ID / Secret and set the
   callback to `https://<project-ref>.supabase.co/auth/v1/callback`.
6. **Authentication → URL configuration**: set Site URL to the deployed client and add
   `http://localhost:5173/**` plus your Vercel domain to the redirect allowlist.
7. Copy the project URL, `anon` key and `service_role` key for the next steps.

## 2. API on Render

1. New → **Web Service** → connect the repository.
2. Root directory: `server` (or leave blank and use the repo `Dockerfile`).
3. Build: `npm install && npm run build:shared && npm run build:server`
   Start: `node server/dist/index.js`
4. Environment:
   ```
   NODE_ENV=production
   PORT=10000
   APP_URL=https://<your-client>.vercel.app
   CLIENT_URL=https://<your-client>.vercel.app
   API_URL=https://<your-api>.onrender.com
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENROUTER_API_KEY=...
   OPENROUTER_HTTP_REFERER=https://<your-client>.vercel.app
   ```
5. Health check path: `/api/health`.
6. Deploy, then confirm `https://<your-api>.onrender.com/api/health/db` reports `"up"`.

> Railway and Fly.io work the same way; the `server/Dockerfile` is provided for both.

## 3. Client on Vercel

1. Import the repository; set **Root Directory** to `client`.
2. Build command: `npm install && npm run build --workspace client` (from the repo root)
   — or configure the Vercel project to install from the monorepo root.
3. Environment variables:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   VITE_API_URL=https://<your-api>.onrender.com
   VITE_APP_URL=https://<your-client>.vercel.app
   ```
4. Add a rewrite so client routes resolve (`vercel.json`):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
5. Deploy and add the Vercel domain to the CORS allowlist — it is read from
   `CLIENT_URL` / `APP_URL` on the API.

## 4. Local Docker

```bash
cp .env.example .env            # root values
cp .env server/.env
cp .env client/.env
docker compose up --build       # API :5000, client :5173
```

## 5. Post-deploy checklist

- [ ] `/api/health` and `/api/health/db` return ok/up.
- [ ] Register an account → profile row created (check Table Editor → `profiles`).
- [ ] GitHub OAuth round-trips back to `/dashboard`.
- [ ] Upload an avatar; confirm it appears in the `avatars` bucket.
- [ ] Create a project, publish a blog post, like and comment.
- [ ] Send a connection request from a second account and accept it.
- [ ] Endorse a connected user's skill.
- [ ] Open two browsers on `/messages` and confirm realtime delivery + typing indicator.
- [ ] Run one AI feature and confirm `_meta.cached` flips to `true` on a repeat call.
- [ ] `npm run typecheck` and `npm test` pass locally.

## 6. Environment reference

| Variable | Where | Required |
| --- | --- | --- |
| `NODE_ENV`, `PORT` | server | yes |
| `APP_URL`, `CLIENT_URL`, `API_URL` | server | yes (CORS + AI referer) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server | yes |
| `SUPABASE_JWT_SECRET` | server | optional (token verification uses `getUser`) |
| `OPENROUTER_API_KEY` (+ model overrides) | server | for AI features |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Supabase dashboard | for GitHub login |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` | client | yes |
| `AI_USER_HOURLY_LIMIT`, `API_RATE_*`, `MAX_UPLOAD_BYTES` | server | optional tunables |

## 7. Operations

- **Cron jobs** (scores, badges, weekly digest, streak reminders, cache cleanup) run
  inside the API process via `node-cron`. They are disabled outside production; set
  `FORCE_JOBS=true` to run them locally.
- **Logs**: Render captures stdout/stderr. The request id (`x-request-id`) is on every
  response for tracing.
- **Backups**: Supabase free tier includes daily backups; export via the dashboard
  before risky migrations.
