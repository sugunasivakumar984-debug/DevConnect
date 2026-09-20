-- =============================================================================
-- 00009_feed_comments.sql
-- Comments for feed posts
-- =============================================================================

create table if not exists public.feed_comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.feed_posts(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists feed_comments_post_idx on public.feed_comments (post_id, created_at asc);

alter table public.feed_comments enable row level security;

create policy "feed_comments read"
  on public.feed_comments
  for select
  using (true);

create policy "feed_comments insert"
  on public.feed_comments
  for insert
  with check (auth.uid() = user_id);

create policy "feed_comments delete"
  on public.feed_comments
  for delete
  using (auth.uid() = user_id);

-- keep comment_count in sync
create or replace function public.sync_feed_comment_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feed_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists feed_comments_count_trigger on public.feed_comments;
create trigger feed_comments_count_trigger
  after insert or delete on public.feed_comments
  for each row execute function public.sync_feed_comment_count();
