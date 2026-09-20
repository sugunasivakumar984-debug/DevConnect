-- =============================================================================
-- 00008_developer_platform_connections.sql
-- Developer platform connections: GitHub, LeetCode, Codeforces, etc.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- developer_platform_connections
-- Stores a user's connected developer platform accounts.
-- cached_data (jsonb) holds the last-fetched public API response so the
-- profile page renders instantly without hitting the external API every load.
-- ---------------------------------------------------------------------------
create table if not exists public.developer_platform_connections (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  platform             text not null check (
    platform in (
      -- Source code
      'github', 'gitlab', 'bitbucket', 'codeberg',
      -- Competitive programming
      'leetcode', 'codeforces', 'codechef', 'hackerrank', 'atcoder',
      -- AI / ML
      'kaggle', 'huggingface',
      -- Developer community
      'stackoverflow', 'devto', 'hashnode',
      -- Packages
      'npm', 'pypi', 'dockerhub',
      -- Social / Portfolio (display-only — no API fetch)
      'linkedin', 'twitter', 'youtube', 'codepen', 'replit',
      'producthunt', 'portfolio',
      -- Certifications (display-only)
      'credly', 'microsoftlearn', 'googledeveloper'
    )
  ),
  platform_username    text not null check (char_length(platform_username) between 1 and 128),
  profile_url          text,
  cached_data          jsonb,                  -- last-fetched public API payload
  visibility           text not null default 'public'
                         check (visibility in ('public', 'connections', 'private')),
  last_synced_at       timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- One connection per platform per user
  unique (user_id, platform)
);

create index if not exists dev_platform_connections_user_idx
  on public.developer_platform_connections (user_id);

-- updated_at trigger
drop trigger if exists dev_platform_connections_set_updated_at
  on public.developer_platform_connections;
create trigger dev_platform_connections_set_updated_at
  before update on public.developer_platform_connections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.developer_platform_connections enable row level security;

-- Owners can do anything with their own connections
drop policy if exists "platform_connections owner all" on public.developer_platform_connections;
create policy "platform_connections owner all"
  on public.developer_platform_connections
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public connections are readable by everyone (anonymous or logged-in)
drop policy if exists "platform_connections public read" on public.developer_platform_connections;
create policy "platform_connections public read"
  on public.developer_platform_connections
  for select
  using (visibility = 'public');

-- Connections-only visibility: readable by the owner and by users who have
-- an accepted connection with them
drop policy if exists "platform_connections connections read" on public.developer_platform_connections;
create policy "platform_connections connections read"
  on public.developer_platform_connections
  for select
  using (
    visibility = 'connections'
    and (
      auth.uid() = user_id
      or exists (
        select 1 from public.connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.addressee_id = user_id)
            or (c.addressee_id = auth.uid() and c.requester_id = user_id)
          )
      )
    )
  );
