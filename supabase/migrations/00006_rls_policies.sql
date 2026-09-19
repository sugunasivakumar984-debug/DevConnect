-- =============================================================================
-- 00006_rls_policies.sql
-- Row Level Security: enabled on EVERY table.
-- Public data is readable by all; writes are owner-scoped via auth.uid().
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- child profile tables: public read, owner write
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['experience','education','certifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s public read" on public.%I', t, t);
    execute format('create policy "%s public read" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "%s owner write" on public.%I', t, t);
    execute format($f$create policy "%s owner write" on public.%I for all using (profile_id = auth.uid()) with check (profile_id = auth.uid())$f$, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- projects + collaborators
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select using (true);
drop policy if exists "projects owner write" on public.projects;
create policy "projects owner write" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.project_collaborators enable row level security;
drop policy if exists "collaborators public read" on public.project_collaborators;
create policy "collaborators public read" on public.project_collaborators for select using (true);
drop policy if exists "collaborators managed by project owner or self" on public.project_collaborators;
create policy "collaborators managed by project owner or self" on public.project_collaborators
  for all using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- blog posts: published posts public; drafts author only
-- ---------------------------------------------------------------------------
alter table public.blog_posts enable row level security;
drop policy if exists "published posts public read" on public.blog_posts;
create policy "published posts public read" on public.blog_posts
  for select using (status = 'published' or user_id = auth.uid());
drop policy if exists "posts author write" on public.blog_posts;
create policy "posts author write" on public.blog_posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.comments enable row level security;
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments owner write" on public.comments;
create policy "comments owner write" on public.comments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.likes enable row level security;
drop policy if exists "likes public read" on public.likes;
create policy "likes public read" on public.likes for select using (true);
drop policy if exists "likes owner write" on public.likes;
create policy "likes owner write" on public.likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.bookmarks enable row level security;
drop policy if exists "bookmarks owner read" on public.bookmarks;
create policy "bookmarks owner read" on public.bookmarks for select using (user_id = auth.uid());
drop policy if exists "bookmarks owner write" on public.bookmarks;
create policy "bookmarks owner write" on public.bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- feed
-- ---------------------------------------------------------------------------
alter table public.feed_posts enable row level security;
drop policy if exists "feed public read" on public.feed_posts;
create policy "feed public read" on public.feed_posts
  for select using (visibility = 'public' or user_id = auth.uid());
drop policy if exists "feed owner write" on public.feed_posts;
create policy "feed owner write" on public.feed_posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.feed_reactions enable row level security;
drop policy if exists "reactions public read" on public.feed_reactions;
create policy "reactions public read" on public.feed_reactions for select using (true);
drop policy if exists "reactions owner write" on public.feed_reactions;
create policy "reactions owner write" on public.feed_reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------
alter table public.skills enable row level security;
drop policy if exists "skills public read" on public.skills;
create policy "skills public read" on public.skills for select using (true);
drop policy if exists "skills authenticated insert" on public.skills;
create policy "skills authenticated insert" on public.skills
  for insert to authenticated with check (true);

alter table public.user_skills enable row level security;
drop policy if exists "user_skills public read" on public.user_skills;
create policy "user_skills public read" on public.user_skills for select using (true);
drop policy if exists "user_skills owner write" on public.user_skills;
create policy "user_skills owner write" on public.user_skills
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- endorsements: public read; only connected users may endorse
-- ---------------------------------------------------------------------------
alter table public.endorsements enable row level security;
drop policy if exists "endorsements public read" on public.endorsements;
create policy "endorsements public read" on public.endorsements for select using (true);
drop policy if exists "connected users can endorse" on public.endorsements;
create policy "connected users can endorse" on public.endorsements
  for insert with check (
    endorser_id = auth.uid()
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = auth.uid() and c.addressee_id = endorsed_id)
          or (c.addressee_id = auth.uid() and c.requester_id = endorsed_id))
    )
  );
drop policy if exists "endorser can delete endorsement" on public.endorsements;
create policy "endorser can delete endorsement" on public.endorsements
  for delete using (endorser_id = auth.uid());

-- ---------------------------------------------------------------------------
-- connections: visible to both parties; requester inserts; addressee updates
-- ---------------------------------------------------------------------------
alter table public.connections enable row level security;
drop policy if exists "connections party read" on public.connections;
create policy "connections party read" on public.connections
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "connections requester insert" on public.connections;
create policy "connections requester insert" on public.connections
  for insert with check (requester_id = auth.uid());
drop policy if exists "connections party update" on public.connections;
create policy "connections party update" on public.connections
  for update using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "connections party delete" on public.connections;
create policy "connections party delete" on public.connections
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
alter table public.follows enable row level security;
drop policy if exists "follows public read" on public.follows;
create policy "follows public read" on public.follows for select using (true);
drop policy if exists "follows owner write" on public.follows;
create policy "follows owner write" on public.follows
  for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- messaging: only conversation participants
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
drop policy if exists "conversations participant read" on public.conversations;
create policy "conversations participant read" on public.conversations
  for select using (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists "conversations participant insert" on public.conversations;
create policy "conversations participant insert" on public.conversations
  for insert with check (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists "conversations participant update" on public.conversations;
create policy "conversations participant update" on public.conversations
  for update using (user_a = auth.uid() or user_b = auth.uid());

alter table public.messages enable row level security;
drop policy if exists "messages participant read" on public.messages;
create policy "messages participant read" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
drop policy if exists "messages sender insert" on public.messages;
create policy "messages sender insert" on public.messages
  for insert with check (sender_id = auth.uid());
drop policy if exists "messages receiver update read" on public.messages;
create policy "messages receiver update read" on public.messages
  for update using (receiver_id = auth.uid() or sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
alter table public.groups enable row level security;
drop policy if exists "public groups read; private members only" on public.groups;
create policy "public groups read; private members only" on public.groups
  for select using (
    is_private = false
    or owner_id = auth.uid()
    or exists (select 1 from public.group_members m where m.group_id = id and m.user_id = auth.uid())
  );
drop policy if exists "groups owner write" on public.groups;
create policy "groups owner write" on public.groups
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table public.group_members enable row level security;
drop policy if exists "group members read" on public.group_members;
create policy "group members read" on public.group_members for select using (true);
drop policy if exists "group members self join or owner manage" on public.group_members;
create policy "group members self join or owner manage" on public.group_members
  for all using (
    user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

alter table public.group_posts enable row level security;
drop policy if exists "group posts members read" on public.group_posts;
create policy "group posts members read" on public.group_posts
  for select using (
    exists (select 1 from public.group_members m where m.group_id = group_id and m.user_id = auth.uid())
    or exists (select 1 from public.groups g where g.id = group_id and g.is_private = false)
  );
drop policy if exists "group posts member write" on public.group_posts;
create policy "group posts member write" on public.group_posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications: owner only
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications owner delete" on public.notifications;
create policy "notifications owner delete" on public.notifications for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- gamification: public read, owner write
-- ---------------------------------------------------------------------------
alter table public.badges enable row level security;
drop policy if exists "badges public read" on public.badges;
create policy "badges public read" on public.badges for select using (true);

alter table public.user_badges enable row level security;
drop policy if exists "user_badges public read" on public.user_badges;
create policy "user_badges public read" on public.user_badges for select using (true);
drop policy if exists "user_badges owner write" on public.user_badges;
create policy "user_badges owner write" on public.user_badges
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.dev_scores enable row level security;
drop policy if exists "dev_scores public read" on public.dev_scores;
create policy "dev_scores public read" on public.dev_scores for select using (true);
drop policy if exists "dev_scores owner write" on public.dev_scores;
create policy "dev_scores owner write" on public.dev_scores
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.streaks enable row level security;
drop policy if exists "streaks public read" on public.streaks;
create policy "streaks public read" on public.streaks for select using (true);
drop policy if exists "streaks owner write" on public.streaks;
create policy "streaks owner write" on public.streaks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.streak_activity enable row level security;
drop policy if exists "streak_activity public read" on public.streak_activity;
create policy "streak_activity public read" on public.streak_activity for select using (true);
drop policy if exists "streak_activity owner write" on public.streak_activity;
create policy "streak_activity owner write" on public.streak_activity
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- saved searches: owner only
-- ---------------------------------------------------------------------------
alter table public.saved_searches enable row level security;
drop policy if exists "saved_searches owner all" on public.saved_searches;
create policy "saved_searches owner all" on public.saved_searches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- events + rsvps
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (true);
drop policy if exists "events owner write" on public.events;
create policy "events owner write" on public.events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table public.event_rsvps enable row level security;
drop policy if exists "rsvps public read" on public.event_rsvps;
create policy "rsvps public read" on public.event_rsvps for select using (true);
drop policy if exists "rsvps owner write" on public.event_rsvps;
create policy "rsvps owner write" on public.event_rsvps
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Q&A
-- ---------------------------------------------------------------------------
alter table public.questions enable row level security;
drop policy if exists "questions public read" on public.questions;
create policy "questions public read" on public.questions for select using (true);
drop policy if exists "questions owner write" on public.questions;
create policy "questions owner write" on public.questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.answers enable row level security;
drop policy if exists "answers public read" on public.answers;
create policy "answers public read" on public.answers for select using (true);
drop policy if exists "answers owner write" on public.answers;
create policy "answers owner write" on public.answers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- snippets
-- ---------------------------------------------------------------------------
alter table public.snippets enable row level security;
drop policy if exists "snippets public read" on public.snippets;
create policy "snippets public read" on public.snippets for select using (true);
drop policy if exists "snippets owner write" on public.snippets;
create policy "snippets owner write" on public.snippets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- testimonials: approved public; author creates; target approves
-- ---------------------------------------------------------------------------
alter table public.testimonials enable row level security;
drop policy if exists "testimonials visible" on public.testimonials;
create policy "testimonials visible" on public.testimonials
  for select using (approved = true or author_id = auth.uid() or target_id = auth.uid());
drop policy if exists "testimonials author insert" on public.testimonials;
create policy "testimonials author insert" on public.testimonials
  for insert with check (author_id = auth.uid());
drop policy if exists "testimonials author or target update" on public.testimonials;
create policy "testimonials author or target update" on public.testimonials
  for update using (author_id = auth.uid() or target_id = auth.uid());
drop policy if exists "testimonials author delete" on public.testimonials;
create policy "testimonials author delete" on public.testimonials for delete using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports: reporter can create/read own; admins handled via service role
-- ---------------------------------------------------------------------------
alter table public.reports enable row level security;
drop policy if exists "reports reporter read" on public.reports;
create policy "reports reporter read" on public.reports for select using (reporter_id = auth.uid());
drop policy if exists "reports reporter insert" on public.reports;
create policy "reports reporter insert" on public.reports for insert with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit logs: admin/mod read via service role only (deny by default in RLS)
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;
drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
  );

-- ---------------------------------------------------------------------------
-- profile views: owner sees received views; anyone can insert
-- ---------------------------------------------------------------------------
alter table public.profile_views enable row level security;
drop policy if exists "profile_views owner read" on public.profile_views;
create policy "profile_views owner read" on public.profile_views
  for select using (profile_id = auth.uid());
drop policy if exists "profile_views anyone insert" on public.profile_views;
create policy "profile_views anyone insert" on public.profile_views
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- ai_cache: readable/writable through server (service role). Allow authenticated
-- read so cached results can be surfaced; writes require service role.
-- ---------------------------------------------------------------------------
alter table public.ai_cache enable row level security;
drop policy if exists "ai_cache authenticated read" on public.ai_cache;
create policy "ai_cache authenticated read" on public.ai_cache for select to authenticated using (true);

alter table public.ai_usage enable row level security;
drop policy if exists "ai_usage owner read" on public.ai_usage;
create policy "ai_usage owner read" on public.ai_usage for select using (user_id = auth.uid());
