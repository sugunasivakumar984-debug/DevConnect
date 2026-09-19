-- =============================================================================
-- 00007_storage_and_realtime.sql
-- Storage buckets + policies, realtime publication, useful RPC functions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Storage buckets (2 MB cap enforced at bucket level; server also validates)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']),
  ('project-images', 'project-images', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']),
  ('blog-images',    'blog-images',    true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "public read storage" on storage.objects;
create policy "public read storage" on storage.objects
  for select using (bucket_id in ('avatars','project-images','blog-images'));

-- Authenticated users upload into their own folder: {user_id}/filename
drop policy if exists "users upload own storage" on storage.objects;
create policy "users upload own storage" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars','project-images','blog-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own storage" on storage.objects;
create policy "users update own storage" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars','project-images','blog-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own storage" on storage.objects;
create policy "users delete own storage" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars','project-images','blog-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Realtime: publish the tables the client subscribes to
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'connections'
  ) then
    alter publication supabase_realtime add table public.connections;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feed_posts'
  ) then
    alter publication supabase_realtime add table public.feed_posts;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: skill endorsement tallies for a user
-- ---------------------------------------------------------------------------
create or replace function public.get_endorsement_counts(p_user_id uuid)
returns table (skill_id uuid, skill_name text, endorsement_count bigint)
language sql stable as $$
  select s.id, s.name, count(e.id)
  from public.user_skills us
  join public.skills s on s.id = us.skill_id
  left join public.endorsements e
    on e.skill_id = us.skill_id and e.endorsed_id = us.user_id
  where us.user_id = p_user_id
  group by s.id, s.name
  order by count(e.id) desc, s.name asc;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mutual connections between two users
-- ---------------------------------------------------------------------------
create or replace function public.get_mutual_connections(p_user_id uuid, p_other_id uuid)
returns setof public.profiles
language sql stable as $$
  with my_connections as (
    select case when requester_id = p_user_id then addressee_id else requester_id end as uid
    from public.connections
    where status = 'accepted' and (requester_id = p_user_id or addressee_id = p_user_id)
  ),
  their_connections as (
    select case when requester_id = p_other_id then addressee_id else requester_id end as uid
    from public.connections
    where status = 'accepted' and (requester_id = p_other_id or addressee_id = p_other_id)
  )
  select p.*
  from public.profiles p
  where p.id in (select uid from my_connections intersect select uid from their_connections);
$$;

-- ---------------------------------------------------------------------------
-- RPC: developer search with filters (used by the server search module)
-- ---------------------------------------------------------------------------
create or replace function public.search_developers(
  p_query       text default null,
  p_skills      text[] default null,
  p_location    text default null,
  p_availability text default null,
  p_open_to_work boolean default null,
  p_min_years   int default null,
  p_limit       int default 20,
  p_offset      int default 0
)
returns setof public.profiles
language sql stable as $$
  select p.*
  from public.profiles p
  where (p_query is null or p_query = ''
         or p.username ilike '%' || p_query || '%'
         or p.full_name ilike '%' || p_query || '%'
         or p.headline ilike '%' || p_query || '%')
    and (p_location is null or p.location ilike '%' || p_location || '%')
    and (p_availability is null or p.availability::text = p_availability)
    and (p_open_to_work is null or p.open_to_work = p_open_to_work)
    and (p_min_years is null or p.years_experience >= p_min_years)
    and (p_skills is null or array_length(p_skills, 1) is null or exists (
      select 1
      from public.user_skills us
      join public.skills s on s.id = us.skill_id
      where us.user_id = p.id and s.name = any(p_skills)
    ))
  order by p.created_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- RPC: trending skills (last 30 days of endorsements + user_skills)
-- ---------------------------------------------------------------------------
create or replace function public.trending_skills(p_limit int default 12)
returns table (skill_name text, usage_count bigint)
language sql stable as $$
  select s.name, count(*) as usage_count
  from public.user_skills us
  join public.skills s on s.id = us.skill_id
  group by s.name
  order by usage_count desc, s.name asc
  limit greatest(p_limit, 1);
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomic conversation upsert (normalizes the user pair)
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_conversation(p_other_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a uuid;
  b uuid;
  conv_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  a := least(auth.uid(), p_other_id);
  b := greatest(auth.uid(), p_other_id);
  select id into conv_id from public.conversations where user_a = a and user_b = b;
  if conv_id is null then
    insert into public.conversations (user_a, user_b) values (a, b) returning id into conv_id;
  end if;
  return conv_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: recompute a user's developer score
-- ---------------------------------------------------------------------------
create or replace function public.recompute_dev_score(p_user_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_projects int; v_endorsements int; v_posts int; v_connections int;
  v_activity int; v_completeness int; v_total int;
  b jsonb;
begin
  select count(*) into v_projects from public.projects where user_id = p_user_id;
  select count(*) into v_endorsements from public.endorsements where endorsed_id = p_user_id;
  select count(*) into v_posts from public.blog_posts where user_id = p_user_id and status = 'published';
  select count(*) into v_connections from public.connections
    where status = 'accepted' and (requester_id = p_user_id or addressee_id = p_user_id);
  select count(*) into v_activity
    from public.streak_activity where user_id = p_user_id and activity_on >= current_date - 30;
  select (
    (case when avatar_url is not null then 1 else 0 end) +
    (case when bio is not null and char_length(bio) > 20 then 1 else 0 end) +
    (case when headline is not null then 1 else 0 end) +
    (case when location is not null then 1 else 0 end) +
    (case when exists (select 1 from public.user_skills where user_id = p_user_id) then 1 else 0 end)
  ) into v_completeness
  from public.profiles where id = p_user_id;

  v_total := least(100, 
      least(25, v_projects * 5)
    + least(25, v_endorsements * 2)
    + least(20, v_posts * 4)
    + least(15, v_connections)
    + least(10, v_activity)
    + v_completeness
  );

  b := jsonb_build_object(
    'projects', least(25, v_projects * 5),
    'endorsements', least(25, v_endorsements * 2),
    'blog_posts', least(20, v_posts * 4),
    'connections', least(15, v_connections),
    'activity', least(10, v_activity),
    'completeness', v_completeness
  );

  insert into public.dev_scores (user_id, score, breakdown, updated_at)
  values (p_user_id, v_total, b, now())
  on conflict (user_id) do update
    set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  return v_total;
end;
$$;
