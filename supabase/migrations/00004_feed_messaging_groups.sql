-- =============================================================================
-- 00004_feed_messaging_groups.sql
-- Feed posts, conversations, messages, groups, group posts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- feed posts
-- ---------------------------------------------------------------------------
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
create index if not exists feed_posts_user_idx on public.feed_posts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- feed reactions (emoji)
-- ---------------------------------------------------------------------------
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
  if tg_op = 'INSERT' then
    update public.feed_posts set reaction_count = reaction_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feed_posts set reaction_count = greatest(0, reaction_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists feed_reactions_count_trigger on public.feed_reactions;
create trigger feed_reactions_count_trigger
  after insert or delete on public.feed_reactions
  for each row execute function public.sync_reaction_count();

-- ---------------------------------------------------------------------------
-- conversations (normalized pair: user_a < user_b)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  receiver_id     uuid not null references public.profiles(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 5000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index if not exists messages_receiver_unread_idx on public.messages (receiver_id) where read_at is null;

create or replace function public.touch_conversation()
returns trigger language plpgsql as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
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
