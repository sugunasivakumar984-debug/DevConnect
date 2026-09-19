-- =============================================================================
-- 00001_extensions_and_profiles.sql
-- Core: extensions, profiles, experience, education, certifications
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_status as enum ('open_to_work', 'hiring', 'busy', 'not_looking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mentor_mode as enum ('none', 'open_to_mentor', 'looking_for_mentor');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique not null check (char_length(username) between 3 and 32),
  full_name        text,
  role             user_role not null default 'user',
  headline         text check (char_length(headline) <= 160),
  bio              text check (char_length(bio) <= 2000),
  avatar_url       text,
  location         text,
  website          text,
  github_username  text,
  availability     availability_status not null default 'not_looking',
  mentor_mode      mentor_mode not null default 'none',
  ai_summary       text,
  years_experience int not null default 0 check (years_experience >= 0),
  open_to_work     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_location_idx on public.profiles (location);
create index if not exists profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);
create index if not exists profiles_full_name_trgm_idx on public.profiles using gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- experience
-- ---------------------------------------------------------------------------
create table if not exists public.experience (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  company     text not null,
  role        text not null,
  start_date  date not null,
  end_date    date,
  current     boolean not null default false,
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists experience_profile_idx on public.experience (profile_id, start_date desc);

-- ---------------------------------------------------------------------------
-- education
-- ---------------------------------------------------------------------------
create table if not exists public.education (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  school     text not null,
  degree     text not null,
  field      text,
  start_date date,
  end_date   date,
  created_at timestamptz not null default now()
);
create index if not exists education_profile_idx on public.education (profile_id);

-- ---------------------------------------------------------------------------
-- certifications
-- ---------------------------------------------------------------------------
create table if not exists public.certifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  issuer     text not null,
  date       date,
  url        text,
  created_at timestamptz not null default now()
);
create index if not exists certifications_profile_idx on public.certifications (profile_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if char_length(base_username) < 3 then
    base_username := 'dev' || substr(new.id::text, 1, 8);
  end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url, github_username)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
