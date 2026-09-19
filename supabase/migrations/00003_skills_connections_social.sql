-- =============================================================================
-- 00003_skills_connections_social.sql
-- Skills, endorsements, connections, follows
-- =============================================================================

do $$ begin
  create type connection_status as enum ('pending', 'accepted', 'rejected', 'blocked');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- skills catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.skills (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  category text
);
create index if not exists skills_name_trgm_idx on public.skills using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- user_skills
-- ---------------------------------------------------------------------------
create table if not exists public.user_skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  skill_id    uuid not null references public.skills(id) on delete cascade,
  proficiency smallint not null default 3 check (proficiency between 1 and 5),
  created_at  timestamptz not null default now(),
  unique (user_id, skill_id)
);
create index if not exists user_skills_user_idx on public.user_skills (user_id);

-- ---------------------------------------------------------------------------
-- endorsements
-- ---------------------------------------------------------------------------
create table if not exists public.endorsements (
  id           uuid primary key default gen_random_uuid(),
  endorser_id  uuid not null references public.profiles(id) on delete cascade,
  endorsed_id  uuid not null references public.profiles(id) on delete cascade,
  skill_id     uuid not null references public.skills(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (endorser_id, endorsed_id, skill_id),
  check (endorser_id <> endorsed_id)
);
create index if not exists endorsements_endorsed_idx on public.endorsements (endorsed_id, created_at desc);

-- ---------------------------------------------------------------------------
-- connections (mutual, request/accept lifecycle)
-- ---------------------------------------------------------------------------
create table if not exists public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       connection_status not null default 'pending',
  message      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index if not exists connections_requester_idx on public.connections (requester_id, status);
create index if not exists connections_addressee_idx on public.connections (addressee_id, status);

drop trigger if exists connections_set_updated_at on public.connections;
create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- Prevent a second pending/duplicate request in the reverse direction.
create or replace function public.prevent_duplicate_connection()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.connections
    where requester_id = new.addressee_id
      and addressee_id = new.requester_id
      and status in ('pending', 'accepted')
  ) then
    raise exception 'A connection request already exists between these users';
  end if;
  return new;
end;
$$;

drop trigger if exists connections_dedupe_trigger on public.connections;
create trigger connections_dedupe_trigger
  before insert on public.connections
  for each row execute function public.prevent_duplicate_connection();

-- ---------------------------------------------------------------------------
-- follows (one-way)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists follows_follower_idx on public.follows (follower_id);
