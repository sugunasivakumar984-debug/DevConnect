-- =============================================================================
-- 00002_projects_blog_interactions.sql
-- Projects, blog posts, comments, likes, bookmarks
-- =============================================================================

do $$ begin
  create type post_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type target_type as enum ('post', 'project', 'comment', 'user', 'group_post');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
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
create index if not exists projects_user_idx on public.projects (user_id, created_at desc);
create index if not exists projects_tech_idx on public.projects using gin (tech_stack);
create index if not exists projects_created_idx on public.projects (created_at desc);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project collaborators
-- ---------------------------------------------------------------------------
create table if not exists public.project_collaborators (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text,
  status     text not null default 'invited' check (status in ('invited','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- blog posts
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 200),
  slug              text unique not null,
  excerpt           text,
  content           text not null default '',
  cover_image_url   text,
  tags              text[] not null default '{}',
  status            post_status not null default 'draft',
  views             int not null default 0,
  reading_time      int not null default 1,
  like_count        int not null default 0,
  comment_count     int not null default 0,
  seo_title         text,
  seo_description   text,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists blog_posts_user_idx on public.blog_posts (user_id, created_at desc);
create index if not exists blog_posts_status_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_tags_idx on public.blog_posts using gin (tags);
create index if not exists blog_posts_search_idx on public.blog_posts using gin (to_tsvector('english', title || ' ' || coalesce(excerpt, '')));

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- comments (self-referential for threading)
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.blog_posts(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  parent_id  uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- keep comment_count in sync
create or replace function public.sync_comment_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.blog_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.blog_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count_trigger on public.comments;
create trigger comments_count_trigger
  after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

-- ---------------------------------------------------------------------------
-- likes
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists likes_target_idx on public.likes (target_type, target_id);

-- keep blog post like_count in sync
create or replace function public.sync_like_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.target_type = 'post' then
    update public.blog_posts set like_count = like_count + 1 where id = new.target_id;
    return new;
  elsif tg_op = 'DELETE' and old.target_type = 'post' then
    update public.blog_posts set like_count = greatest(0, like_count - 1) where id = old.target_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_trigger on public.likes;
create trigger likes_count_trigger
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

-- ---------------------------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);
