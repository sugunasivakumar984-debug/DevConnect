-- =============================================================================
-- DevConnect — FULL SCHEMA
-- Paste this ENTIRE file into Supabase SQL Editor and click Run.
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin create type user_role as enum ('user','moderator','admin');
exception when duplicate_object then null; end $$;
do $$ begin create type availability_status as enum ('open_to_work','hiring','busy','not_looking');
exception when duplicate_object then null; end $$;
do $$ begin create type mentor_mode as enum ('none','open_to_mentor','looking_for_mentor');
exception when duplicate_object then null; end $$;
do $$ begin create type post_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;
do $$ begin create type target_type as enum ('post','project','comment','user','group_post');
exception when duplicate_object then null; end $$;
do $$ begin create type connection_status as enum ('pending','accepted','rejected','blocked');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Shared trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ===========================================================================
-- TABLES
-- ===========================================================================

-- profiles (1:1 with auth.users)
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
create index if not exists profiles_username_idx       on public.profiles (username);
create index if not exists profiles_location_idx       on public.profiles (location);
create index if not exists profiles_username_trgm_idx  on public.profiles using gin (username gin_trgm_ops);
create index if not exists profiles_full_name_trgm_idx on public.profiles using gin (full_name gin_trgm_ops);
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- user_preferences (NEW: per-user notification + privacy settings)
create table if not exists public.user_preferences (
  user_id                  uuid primary key references public.profiles(id) on delete cascade,
  notif_email_connections  boolean not null default true,
  notif_email_messages     boolean not null default true,
  notif_email_endorsements boolean not null default true,
  notif_email_comments     boolean not null default true,
  notif_push_connections   boolean not null default true,
  notif_push_messages      boolean not null default true,
  notif_push_mentions      boolean not null default true,
  notif_weekly_digest      boolean not null default true,
  profile_visible          boolean not null default true,
  show_email               boolean not null default false,
  show_location            boolean not null default true,
  allow_messages_from      text not null default 'connections'
                           check (allow_messages_from in ('everyone','connections','nobody')),
  show_online_status       boolean not null default true,
  indexable_by_search      boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- experience
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

-- education
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

-- certifications
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

-- projects
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 160),
  description  text not null default '',
  tech_stack   text[] not null default '{}',
  live_url     text,
  repo_url     text,
  images       text[] not null default '{}',
  featured     boolean not null default false,
  views        int not null default 0,
  clicks       int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists projects_user_idx    on public.projects (user_id, created_at desc);
create index if not exists projects_tech_idx    on public.projects using gin (tech_stack);
create index if not exists projects_created_idx on public.projects (created_at desc);
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- project collaborators
create table if not exists public.project_collaborators (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text,
  status     text not null default 'invited' check (status in ('invited','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- blog posts
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 200),
  slug            text unique not null,
  excerpt         text,
  content         text not null default '',
  cover_image_url text,
  tags            text[] not null default '{}',
  status          post_status not null default 'draft',
  views           int not null default 0,
  reading_time    int not null default 1,
  like_count      int not null default 0,
  comment_count   int not null default 0,
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists blog_posts_user_idx   on public.blog_posts (user_id, created_at desc);
create index if not exists blog_posts_status_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_tags_idx   on public.blog_posts using gin (tags);
create index if not exists blog_posts_search_idx on public.blog_posts
  using gin (to_tsvector('english', title || ' ' || coalesce(excerpt,'')));
create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);
drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- comments
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.blog_posts(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  parent_id  uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

create or replace function public.sync_comment_count()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then update public.blog_posts set comment_count=comment_count+1 where id=new.post_id; return new;
  elsif tg_op='DELETE' then update public.blog_posts set comment_count=greatest(0,comment_count-1) where id=old.post_id; return old;
  end if; return null;
end; $$;
drop trigger if exists comments_count_trigger on public.comments;
create trigger comments_count_trigger after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

-- likes
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists likes_target_idx on public.likes (target_type, target_id);

create or replace function public.sync_like_count()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' and new.target_type='post' then update public.blog_posts set like_count=like_count+1 where id=new.target_id; return new;
  elsif tg_op='DELETE' and old.target_type='post' then update public.blog_posts set like_count=greatest(0,like_count-1) where id=old.target_id; return old;
  end if; return null;
end; $$;
drop trigger if exists likes_count_trigger on public.likes;
create trigger likes_count_trigger after insert or delete on public.likes
  for each row execute function public.sync_like_count();

-- bookmarks
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

-- skills
create table if not exists public.skills (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  category text
);
create index if not exists skills_name_trgm_idx on public.skills using gin (name gin_trgm_ops);

-- user_skills
create table if not exists public.user_skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  skill_id    uuid not null references public.skills(id) on delete cascade,
  proficiency smallint not null default 3 check (proficiency between 1 and 5),
  created_at  timestamptz not null default now(),
  unique (user_id, skill_id)
);
create index if not exists user_skills_user_idx on public.user_skills (user_id);

-- endorsements
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

-- connections
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
create trigger connections_set_updated_at before update on public.connections
  for each row execute function public.set_updated_at();

create or replace function public.prevent_duplicate_connection()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.connections where requester_id=new.addressee_id and addressee_id=new.requester_id and status in ('pending','accepted'))
  then raise exception 'A connection request already exists between these users'; end if;
  return new;
end; $$;
drop trigger if exists connections_dedupe_trigger on public.connections;
create trigger connections_dedupe_trigger before insert on public.connections
  for each row execute function public.prevent_duplicate_connection();

-- follows
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists follows_follower_idx  on public.follows (follower_id);

-- feed_posts
create table if not exists public.feed_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  content        text not null default '',
  media_urls     text[] not null default '{}',
  code_snippet   text,
  code_language  text,
  link_url       text,
  visibility     text not null default 'public' check (visibility in ('public','connections')),
  reaction_count int not null default 0,
  comment_count  int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_user_idx    on public.feed_posts (user_id, created_at desc);

-- feed_reactions
create table if not exists public.feed_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.feed_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  reaction   text not null default 'like' check (reaction in ('like','love','celebrate','insightful','funny')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create or replace function public.sync_reaction_count()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then update public.feed_posts set reaction_count=reaction_count+1 where id=new.post_id; return new;
  elsif tg_op='DELETE' then update public.feed_posts set reaction_count=greatest(0,reaction_count-1) where id=old.post_id; return old;
  end if; return null;
end; $$;
drop trigger if exists feed_reactions_count_trigger on public.feed_reactions;
create trigger feed_reactions_count_trigger after insert or delete on public.feed_reactions
  for each row execute function public.sync_reaction_count();

-- conversations
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists conversations_a_idx on public.conversations (user_a, last_message_at desc);
create index if not exists conversations_b_idx on public.conversations (user_b, last_message_at desc);

-- messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  receiver_id     uuid not null references public.profiles(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 5000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx    on public.messages (conversation_id, created_at desc);
create index if not exists messages_receiver_unread_idx on public.messages (receiver_id) where read_at is null;

create or replace function public.touch_conversation()
returns trigger language plpgsql as $$
begin update public.conversations set last_message_at=new.created_at where id=new.conversation_id; return new; end; $$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- groups
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  avatar_url  text,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  is_private  boolean not null default false,
  created_at  timestamptz not null default now()
);
create table if not exists public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);
create table if not exists public.group_posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists group_posts_group_idx on public.group_posts (group_id, created_at desc);

-- notifications
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

-- badges + user_badges
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

-- dev_scores
create table if not exists public.dev_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references public.profiles(id) on delete cascade,
  score      int not null default 0,
  breakdown  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists dev_scores_score_idx on public.dev_scores (score desc);

-- streaks
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

-- saved_searches
create table if not exists public.saved_searches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  query          text not null default '',
  filters        jsonb not null default '{}'::jsonb,
  alerts_enabled boolean not null default false,
  created_at     timestamptz not null default now()
);

-- events + rsvps
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

-- Q&A
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

-- snippets
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

-- testimonials
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

-- reports
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

-- audit_logs
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
create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- profile_views
create table if not exists public.profile_views (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id  uuid references public.profiles(id) on delete set null,
  source     text default 'direct',
  created_at timestamptz not null default now()
);
create index if not exists profile_views_profile_idx on public.profile_views (profile_id, created_at desc);

-- ai_cache + ai_usage
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
create table if not exists public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  feature    text not null,
  model      text not null,
  cached     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at desc);

-- ===========================================================================
-- AUTO-CREATE PROFILE + PREFERENCES ON SIGN-UP
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text; final_username text; suffix int := 0;
begin
  base_username := coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1));
  base_username := regexp_replace(lower(base_username),'[^a-z0-9_]','','g');
  if char_length(base_username) < 3 then base_username := 'dev' || substr(new.id::text,1,8); end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1; final_username := base_username || suffix::text;
  end loop;
  insert into public.profiles (id, username, full_name, avatar_url, github_username)
  values (new.id, final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name')
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================
alter table public.profiles            enable row level security;
alter table public.user_preferences    enable row level security;
alter table public.experience          enable row level security;
alter table public.education           enable row level security;
alter table public.certifications      enable row level security;
alter table public.projects            enable row level security;
alter table public.project_collaborators enable row level security;
alter table public.blog_posts          enable row level security;
alter table public.comments            enable row level security;
alter table public.likes               enable row level security;
alter table public.bookmarks           enable row level security;
alter table public.skills              enable row level security;
alter table public.user_skills         enable row level security;
alter table public.endorsements        enable row level security;
alter table public.connections         enable row level security;
alter table public.follows             enable row level security;
alter table public.feed_posts          enable row level security;
alter table public.feed_reactions      enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.group_posts         enable row level security;
alter table public.notifications       enable row level security;
alter table public.badges              enable row level security;
alter table public.user_badges         enable row level security;
alter table public.dev_scores          enable row level security;
alter table public.streaks             enable row level security;
alter table public.streak_activity     enable row level security;
alter table public.saved_searches      enable row level security;
alter table public.events              enable row level security;
alter table public.event_rsvps         enable row level security;
alter table public.questions           enable row level security;
alter table public.answers             enable row level security;
alter table public.snippets            enable row level security;
alter table public.testimonials        enable row level security;
alter table public.reports             enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.profile_views       enable row level security;
alter table public.ai_cache            enable row level security;
alter table public.ai_usage            enable row level security;

-- profiles
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_preferences
drop policy if exists "user_preferences owner all" on public.user_preferences;
create policy "user_preferences owner all" on public.user_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- child profile tables
do $$ declare t text;
begin foreach t in array array['experience','education','certifications'] loop
  execute format('drop policy if exists "%s public read" on public.%I', t, t);
  execute format('create policy "%s public read" on public.%I for select using (true)', t, t);
  execute format('drop policy if exists "%s owner write" on public.%I', t, t);
  execute format($f$create policy "%s owner write" on public.%I for all using (profile_id = auth.uid()) with check (profile_id = auth.uid())$f$, t, t);
end loop; end $$;

-- projects
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select using (true);
drop policy if exists "projects owner write" on public.projects;
create policy "projects owner write" on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "collaborators public read" on public.project_collaborators;
create policy "collaborators public read" on public.project_collaborators for select using (true);
drop policy if exists "collaborators managed by project owner or self" on public.project_collaborators;
create policy "collaborators managed by project owner or self" on public.project_collaborators
  for all using (user_id=auth.uid() or exists(select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()))
  with check (user_id=auth.uid() or exists(select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()));

-- blog
drop policy if exists "published posts public read" on public.blog_posts;
create policy "published posts public read" on public.blog_posts for select using (status='published' or user_id=auth.uid());
drop policy if exists "posts author write" on public.blog_posts;
create policy "posts author write" on public.blog_posts for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments owner write" on public.comments;
create policy "comments owner write" on public.comments for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "likes public read" on public.likes;
create policy "likes public read" on public.likes for select using (true);
drop policy if exists "likes owner write" on public.likes;
create policy "likes owner write" on public.likes for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "bookmarks owner read" on public.bookmarks;
create policy "bookmarks owner read" on public.bookmarks for select using (user_id=auth.uid());
drop policy if exists "bookmarks owner write" on public.bookmarks;
create policy "bookmarks owner write" on public.bookmarks for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- skills
drop policy if exists "skills public read" on public.skills;
create policy "skills public read" on public.skills for select using (true);
drop policy if exists "skills authenticated insert" on public.skills;
create policy "skills authenticated insert" on public.skills for insert to authenticated with check (true);
drop policy if exists "user_skills public read" on public.user_skills;
create policy "user_skills public read" on public.user_skills for select using (true);
drop policy if exists "user_skills owner write" on public.user_skills;
create policy "user_skills owner write" on public.user_skills for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- endorsements
drop policy if exists "endorsements public read" on public.endorsements;
create policy "endorsements public read" on public.endorsements for select using (true);
drop policy if exists "connected users can endorse" on public.endorsements;
create policy "connected users can endorse" on public.endorsements for insert with check (
  endorser_id=auth.uid() and exists(select 1 from public.connections c where c.status='accepted'
    and ((c.requester_id=auth.uid() and c.addressee_id=endorsed_id) or (c.addressee_id=auth.uid() and c.requester_id=endorsed_id))));
drop policy if exists "endorser can delete endorsement" on public.endorsements;
create policy "endorser can delete endorsement" on public.endorsements for delete using (endorser_id=auth.uid());

-- connections
drop policy if exists "connections party read" on public.connections;
create policy "connections party read" on public.connections for select using (requester_id=auth.uid() or addressee_id=auth.uid());
drop policy if exists "connections requester insert" on public.connections;
create policy "connections requester insert" on public.connections for insert with check (requester_id=auth.uid());
drop policy if exists "connections party update" on public.connections;
create policy "connections party update" on public.connections for update using (requester_id=auth.uid() or addressee_id=auth.uid());
drop policy if exists "connections party delete" on public.connections;
create policy "connections party delete" on public.connections for delete using (requester_id=auth.uid() or addressee_id=auth.uid());

-- follows
drop policy if exists "follows public read" on public.follows;
create policy "follows public read" on public.follows for select using (true);
drop policy if exists "follows owner write" on public.follows;
create policy "follows owner write" on public.follows for all using (follower_id=auth.uid()) with check (follower_id=auth.uid());

-- feed
drop policy if exists "feed public read" on public.feed_posts;
create policy "feed public read" on public.feed_posts for select using (visibility='public' or user_id=auth.uid());
drop policy if exists "feed owner write" on public.feed_posts;
create policy "feed owner write" on public.feed_posts for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "reactions public read" on public.feed_reactions;
create policy "reactions public read" on public.feed_reactions for select using (true);
drop policy if exists "reactions owner write" on public.feed_reactions;
create policy "reactions owner write" on public.feed_reactions for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- messaging
drop policy if exists "conversations participant read" on public.conversations;
create policy "conversations participant read" on public.conversations for select using (user_a=auth.uid() or user_b=auth.uid());
drop policy if exists "conversations participant insert" on public.conversations;
create policy "conversations participant insert" on public.conversations for insert with check (user_a=auth.uid() or user_b=auth.uid());
drop policy if exists "conversations participant update" on public.conversations;
create policy "conversations participant update" on public.conversations for update using (user_a=auth.uid() or user_b=auth.uid());
drop policy if exists "messages participant read" on public.messages;
create policy "messages participant read" on public.messages for select using (sender_id=auth.uid() or receiver_id=auth.uid());
drop policy if exists "messages sender insert" on public.messages;
create policy "messages sender insert" on public.messages for insert with check (sender_id=auth.uid());
drop policy if exists "messages receiver update read" on public.messages;
create policy "messages receiver update read" on public.messages for update using (receiver_id=auth.uid() or sender_id=auth.uid());

-- groups
drop policy if exists "public groups read; private members only" on public.groups;
create policy "public groups read; private members only" on public.groups for select using (
  is_private=false or owner_id=auth.uid() or exists(select 1 from public.group_members m where m.group_id=id and m.user_id=auth.uid()));
drop policy if exists "groups owner write" on public.groups;
create policy "groups owner write" on public.groups for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists "group members read" on public.group_members;
create policy "group members read" on public.group_members for select using (true);
drop policy if exists "group members self join or owner manage" on public.group_members;
create policy "group members self join or owner manage" on public.group_members
  for all using (user_id=auth.uid() or exists(select 1 from public.groups g where g.id=group_id and g.owner_id=auth.uid()))
  with check (user_id=auth.uid() or exists(select 1 from public.groups g where g.id=group_id and g.owner_id=auth.uid()));
drop policy if exists "group posts members read" on public.group_posts;
create policy "group posts members read" on public.group_posts for select using (
  exists(select 1 from public.group_members m where m.group_id=group_id and m.user_id=auth.uid())
  or exists(select 1 from public.groups g where g.id=group_id and g.is_private=false));
drop policy if exists "group posts member write" on public.group_posts;
create policy "group posts member write" on public.group_posts for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- notifications
drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read" on public.notifications for select using (user_id=auth.uid());
drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "notifications owner delete" on public.notifications;
create policy "notifications owner delete" on public.notifications for delete using (user_id=auth.uid());

-- gamification
drop policy if exists "badges public read" on public.badges;
create policy "badges public read" on public.badges for select using (true);
drop policy if exists "user_badges public read" on public.user_badges;
create policy "user_badges public read" on public.user_badges for select using (true);
drop policy if exists "user_badges owner write" on public.user_badges;
create policy "user_badges owner write" on public.user_badges for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "dev_scores public read" on public.dev_scores;
create policy "dev_scores public read" on public.dev_scores for select using (true);
drop policy if exists "dev_scores owner write" on public.dev_scores;
create policy "dev_scores owner write" on public.dev_scores for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "streaks public read" on public.streaks;
create policy "streaks public read" on public.streaks for select using (true);
drop policy if exists "streaks owner write" on public.streaks;
create policy "streaks owner write" on public.streaks for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "streak_activity public read" on public.streak_activity;
create policy "streak_activity public read" on public.streak_activity for select using (true);
drop policy if exists "streak_activity owner write" on public.streak_activity;
create policy "streak_activity owner write" on public.streak_activity for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "saved_searches owner all" on public.saved_searches;
create policy "saved_searches owner all" on public.saved_searches for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- events
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (true);
drop policy if exists "events owner write" on public.events;
create policy "events owner write" on public.events for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists "rsvps public read" on public.event_rsvps;
create policy "rsvps public read" on public.event_rsvps for select using (true);
drop policy if exists "rsvps owner write" on public.event_rsvps;
create policy "rsvps owner write" on public.event_rsvps for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Q&A
drop policy if exists "questions public read" on public.questions;
create policy "questions public read" on public.questions for select using (true);
drop policy if exists "questions owner write" on public.questions;
create policy "questions owner write" on public.questions for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "answers public read" on public.answers;
create policy "answers public read" on public.answers for select using (true);
drop policy if exists "answers owner write" on public.answers;
create policy "answers owner write" on public.answers for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- snippets
drop policy if exists "snippets public read" on public.snippets;
create policy "snippets public read" on public.snippets for select using (true);
drop policy if exists "snippets owner write" on public.snippets;
create policy "snippets owner write" on public.snippets for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- testimonials
drop policy if exists "testimonials visible" on public.testimonials;
create policy "testimonials visible" on public.testimonials for select using (approved=true or author_id=auth.uid() or target_id=auth.uid());
drop policy if exists "testimonials author insert" on public.testimonials;
create policy "testimonials author insert" on public.testimonials for insert with check (author_id=auth.uid());
drop policy if exists "testimonials author or target update" on public.testimonials;
create policy "testimonials author or target update" on public.testimonials for update using (author_id=auth.uid() or target_id=auth.uid());
drop policy if exists "testimonials author delete" on public.testimonials;
create policy "testimonials author delete" on public.testimonials for delete using (author_id=auth.uid());

-- reports
drop policy if exists "reports reporter read" on public.reports;
create policy "reports reporter read" on public.reports for select using (reporter_id=auth.uid());
drop policy if exists "reports reporter insert" on public.reports;
create policy "reports reporter insert" on public.reports for insert with check (reporter_id=auth.uid());

-- audit logs
drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read" on public.audit_logs for select using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','moderator')));

-- profile_views
drop policy if exists "profile_views owner read" on public.profile_views;
create policy "profile_views owner read" on public.profile_views for select using (profile_id=auth.uid());
drop policy if exists "profile_views anyone insert" on public.profile_views;
create policy "profile_views anyone insert" on public.profile_views for insert with check (true);

-- ai
drop policy if exists "ai_cache authenticated read" on public.ai_cache;
create policy "ai_cache authenticated read" on public.ai_cache for select to authenticated using (true);
drop policy if exists "ai_usage owner read" on public.ai_usage;
create policy "ai_usage owner read" on public.ai_usage for select using (user_id=auth.uid());

-- ===========================================================================
-- STORAGE BUCKETS
-- ===========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',        'avatars',        true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']),
  ('project-images', 'project-images', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']),
  ('blog-images',    'blog-images',    true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public read storage" on storage.objects;
create policy "public read storage" on storage.objects for select using (bucket_id in ('avatars','project-images','blog-images'));
drop policy if exists "users upload own storage" on storage.objects;
create policy "users upload own storage" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','project-images','blog-images') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users update own storage" on storage.objects;
create policy "users update own storage" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','project-images','blog-images') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users delete own storage" on storage.objects;
create policy "users delete own storage" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','project-images','blog-images') and (storage.foldername(name))[1]=auth.uid()::text);

-- ===========================================================================
-- REALTIME
-- ===========================================================================
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages')
  then alter publication supabase_realtime add table public.messages; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications')
  then alter publication supabase_realtime add table public.notifications; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='connections')
  then alter publication supabase_realtime add table public.connections; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='feed_posts')
  then alter publication supabase_realtime add table public.feed_posts; end if;
end $$;

-- ===========================================================================
-- RPC FUNCTIONS
-- ===========================================================================
create or replace function public.get_endorsement_counts(p_user_id uuid)
returns table (skill_id uuid, skill_name text, endorsement_count bigint) language sql stable as $$
  select s.id, s.name, count(e.id) from public.user_skills us
  join public.skills s on s.id=us.skill_id
  left join public.endorsements e on e.skill_id=us.skill_id and e.endorsed_id=us.user_id
  where us.user_id=p_user_id group by s.id, s.name order by count(e.id) desc, s.name asc; $$;

create or replace function public.get_mutual_connections(p_user_id uuid, p_other_id uuid)
returns setof public.profiles language sql stable as $$
  with my_c as (select case when requester_id=p_user_id then addressee_id else requester_id end as uid
    from public.connections where status='accepted' and (requester_id=p_user_id or addressee_id=p_user_id)),
  their_c as (select case when requester_id=p_other_id then addressee_id else requester_id end as uid
    from public.connections where status='accepted' and (requester_id=p_other_id or addressee_id=p_other_id))
  select p.* from public.profiles p where p.id in (select uid from my_c intersect select uid from their_c); $$;

create or replace function public.search_developers(
  p_query text default null, p_skills text[] default null, p_location text default null,
  p_availability text default null, p_open_to_work boolean default null,
  p_min_years int default null, p_limit int default 20, p_offset int default 0)
returns setof public.profiles language sql stable as $$
  select p.* from public.profiles p
  where (p_query is null or p_query='' or p.username ilike '%'||p_query||'%' or p.full_name ilike '%'||p_query||'%' or p.headline ilike '%'||p_query||'%')
    and (p_location is null or p.location ilike '%'||p_location||'%')
    and (p_availability is null or p.availability::text=p_availability)
    and (p_open_to_work is null or p.open_to_work=p_open_to_work)
    and (p_min_years is null or p.years_experience>=p_min_years)
    and (p_skills is null or array_length(p_skills,1) is null or exists(
      select 1 from public.user_skills us join public.skills s on s.id=us.skill_id where us.user_id=p.id and s.name=any(p_skills)))
  order by p.created_at desc limit greatest(p_limit,1) offset greatest(p_offset,0); $$;

create or replace function public.trending_skills(p_limit int default 12)
returns table (skill_name text, usage_count bigint) language sql stable as $$
  select s.name, count(*) as usage_count from public.user_skills us join public.skills s on s.id=us.skill_id
  group by s.name order by usage_count desc, s.name asc limit greatest(p_limit,1); $$;

create or replace function public.get_or_create_conversation(p_other_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare a uuid; b uuid; conv_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  a:=least(auth.uid(),p_other_id); b:=greatest(auth.uid(),p_other_id);
  select id into conv_id from public.conversations where user_a=a and user_b=b;
  if conv_id is null then insert into public.conversations(user_a,user_b) values(a,b) returning id into conv_id; end if;
  return conv_id;
end; $$;

create or replace function public.recompute_dev_score(p_user_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare vp int; ve int; vb int; vc int; va int; vx int; vt int; b jsonb;
begin
  select count(*) into vp from public.projects where user_id=p_user_id;
  select count(*) into ve from public.endorsements where endorsed_id=p_user_id;
  select count(*) into vb from public.blog_posts where user_id=p_user_id and status='published';
  select count(*) into vc from public.connections where status='accepted' and (requester_id=p_user_id or addressee_id=p_user_id);
  select count(*) into va from public.streak_activity where user_id=p_user_id and activity_on>=current_date-30;
  select ((case when avatar_url is not null then 1 else 0 end)+(case when bio is not null and char_length(bio)>20 then 1 else 0 end)+(case when headline is not null then 1 else 0 end)+(case when location is not null then 1 else 0 end)+(case when exists(select 1 from public.user_skills where user_id=p_user_id) then 1 else 0 end)) into vx from public.profiles where id=p_user_id;
  vt:=least(100,least(25,vp*5)+least(25,ve*2)+least(20,vb*4)+least(15,vc)+least(10,va)+vx);
  b:=jsonb_build_object('projects',least(25,vp*5),'endorsements',least(25,ve*2),'blog_posts',least(20,vb*4),'connections',least(15,vc),'activity',least(10,va),'completeness',vx);
  insert into public.dev_scores(user_id,score,breakdown,updated_at) values(p_user_id,vt,b,now())
  on conflict(user_id) do update set score=excluded.score,breakdown=excluded.breakdown,updated_at=now();
  return vt;
end; $$;

-- Done! All tables, RLS policies, storage, realtime, and RPC functions created.
