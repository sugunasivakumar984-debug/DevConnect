-- =============================================================================
-- 00005_gamification_notifications_utilities.sql
-- Badges, scores, streaks, notifications, events, Q&A, snippets,
-- testimonials, reports, audit logs, profile views, ai_cache, saved searches
-- =============================================================================

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- badges + user_badges
-- ---------------------------------------------------------------------------
create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  icon        text not null default '🏅',
  description text,
  criteria    jsonb not null default '{}'::jsonb,
  tier        text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum'))
);

create table if not exists public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
create index if not exists user_badges_user_idx on public.user_badges (user_id);

-- ---------------------------------------------------------------------------
-- dev_scores
-- ---------------------------------------------------------------------------
create table if not exists public.dev_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references public.profiles(id) on delete cascade,
  score      int not null default 0,
  breakdown  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists dev_scores_score_idx on public.dev_scores (score desc);

-- ---------------------------------------------------------------------------
-- streaks
-- ---------------------------------------------------------------------------
create table if not exists public.streaks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique not null references public.profiles(id) on delete cascade,
  current       int not null default 0,
  longest       int not null default 0,
  last_activity date
);

create table if not exists public.streak_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_on date not null default current_date,
  count       int not null default 1,
  unique (user_id, activity_on)
);

-- ---------------------------------------------------------------------------
-- saved searches
-- ---------------------------------------------------------------------------
create table if not exists public.saved_searches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  query          text not null default '',
  filters        jsonb not null default '{}'::jsonb,
  alerts_enabled boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events + rsvps
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  date        timestamptz not null,
  location    text,
  is_online   boolean not null default false,
  url         text,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists events_date_idx on public.events (date);

create table if not exists public.event_rsvps (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references public.events(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  status    text not null default 'going' check (status in ('going','interested','declined')),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Q&A
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  title              text not null,
  body               text not null default '',
  tags               text[] not null default '{}',
  votes              int not null default 0,
  answer_count       int not null default 0,
  accepted_answer_id uuid,
  created_at         timestamptz not null default now()
);

create table if not exists public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  votes       int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists answers_question_idx on public.answers (question_id);

-- ---------------------------------------------------------------------------
-- snippets
-- ---------------------------------------------------------------------------
create table if not exists public.snippets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  language   text not null default 'plaintext',
  code       text not null,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists snippets_user_idx on public.snippets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  approved   boolean not null default false,
  created_at timestamptz not null default now(),
  check (author_id <> target_id)
);
create index if not exists testimonials_target_idx on public.testimonials (target_id, approved);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at  timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- audit logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- profile views
-- ---------------------------------------------------------------------------
create table if not exists public.profile_views (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id  uuid references public.profiles(id) on delete set null,
  source     text default 'direct',
  created_at timestamptz not null default now()
);
create index if not exists profile_views_profile_idx on public.profile_views (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ai_cache
-- ---------------------------------------------------------------------------
create table if not exists public.ai_cache (
  id         uuid primary key default gen_random_uuid(),
  hash       text unique not null,
  feature    text not null,
  response   text not null,
  model      text not null,
  hit_count  int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_cache_hash_idx on public.ai_cache (hash);

-- Per-user AI usage ledger (enforces the hourly cap)
create table if not exists public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  feature    text not null,
  model      text not null,
  cached     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at desc);
