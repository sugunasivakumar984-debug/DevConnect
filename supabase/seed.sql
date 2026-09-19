-- =============================================================================
-- seed.sql — idempotent demo data
-- Run AFTER migrations. Creates skill catalogue, badges, and sample groups.
-- Demo users are created through Supabase Auth (the profiles trigger fires
-- automatically); the SQL below only seeds reference data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Skill catalogue
-- ---------------------------------------------------------------------------
insert into public.skills (name, category) values
  ('JavaScript', 'language'), ('TypeScript', 'language'), ('Python', 'language'),
  ('Java', 'language'), ('Go', 'language'), ('Rust', 'language'), ('C++', 'language'),
  ('React', 'frontend'), ('Vue', 'frontend'), ('Angular', 'frontend'), ('Svelte', 'frontend'),
  ('Next.js', 'frontend'), ('Tailwind CSS', 'frontend'), ('Redux', 'frontend'),
  ('Node.js', 'backend'), ('Express', 'backend'), ('NestJS', 'backend'),
  ('Django', 'backend'), ('Flask', 'backend'), ('Spring Boot', 'backend'),
  ('PostgreSQL', 'database'), ('MySQL', 'database'), ('MongoDB', 'database'), ('Redis', 'database'),
  ('Supabase', 'database'), ('Firebase', 'database'),
  ('Docker', 'devops'), ('Kubernetes', 'devops'), ('AWS', 'devops'), ('GCP', 'devops'),
  ('Azure', 'devops'), ('CI/CD', 'devops'), ('Terraform', 'devops'),
  ('Git', 'tooling'), ('GraphQL', 'api'), ('REST APIs', 'api'), ('WebSockets', 'api'),
  ('Machine Learning', 'ai'), ('TensorFlow', 'ai'), ('PyTorch', 'ai'), ('LLMs', 'ai'),
  ('React Native', 'mobile'), ('Flutter', 'mobile'), ('Swift', 'mobile'), ('Kotlin', 'mobile'),
  ('Figma', 'design'), ('UI/UX', 'design'), ('Product Design', 'design'),
  ('Testing', 'quality'), ('Playwright', 'quality'), ('Jest', 'quality')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
insert into public.badges (name, icon, description, criteria, tier) values
  ('Early Adopter',   '🚀', 'Joined DevConnect in the first year.',                  '{"type":"signup_early"}',                      'bronze'),
  ('First Project',   '📦', 'Published your first project.',                          '{"type":"projects","count":1}',                'bronze'),
  ('Prolific Builder','🏗️', 'Published 10 or more projects.',                         '{"type":"projects","count":10}',               'gold'),
  ('Top Contributor', '⭐', 'Earned 50 endorsements.',                                '{"type":"endorsements","count":50}',           'gold'),
  ('100 Endorsements','💯', 'Received 100 endorsements.',                             '{"type":"endorsements","count":100}',          'platinum'),
  ('Wordsmith',       '✍️', 'Published 5 blog posts.',                                '{"type":"blog_posts","count":5}',              'silver'),
  ('Connector',       '🤝', 'Reached 50 connections.',                                '{"type":"connections","count":50}',            'silver'),
  ('Streak Master',   '🔥', 'Maintained a 30-day activity streak.',                   '{"type":"streak","count":30}',                 'gold'),
  ('Mentor',          '🧑‍🏫', 'Open to mentoring other developers.',                  '{"type":"mentor_mode"}',                       'silver'),
  ('Helpful',         '🙋', 'Answered 20 developer questions.',                       '{"type":"answers","count":20}',                'silver'),
  ('Code Reviewer',   '🔍', 'Ran 25 AI-assisted code reviews.',                       '{"type":"code_reviews","count":25}',           'bronze'),
  ('Verified GitHub', '🐙', 'Connected a verified GitHub account.',                   '{"type":"github_linked"}',                     'bronze')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Community groups
-- ---------------------------------------------------------------------------
insert into public.groups (name, slug, description, owner_id, is_private)
select 'React Developers', 'react-developers', 'Everything React, hooks, and the ecosystem.', p.id, false
from public.profiles p
order by p.created_at asc
limit 1
on conflict (slug) do nothing;

insert into public.groups (name, slug, description, owner_id, is_private)
select 'Open Source Contributors', 'open-source-contributors', 'Find collaborators and share OSS wins.', p.id, false
from public.profiles p
order by p.created_at asc
limit 1
on conflict (slug) do nothing;

insert into public.groups (name, slug, description, owner_id, is_private)
select 'AI & LLM Builders', 'ai-llm-builders', 'Ship AI-powered products. Prompting, RAG, agents.', p.id, false
from public.profiles p
order by p.created_at asc
limit 1
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- A few upcoming community events (owner = earliest profile, if any)
-- ---------------------------------------------------------------------------
insert into public.events (title, description, date, location, is_online, url, owner_id)
select 'DevConnect Launch Meetup', 'Kickoff meetup for the DevConnect community.', now() + interval '7 days', 'Remote', true, 'https://example.com/launch', p.id
from public.profiles p order by p.created_at asc limit 1
on conflict do nothing;

insert into public.events (title, description, date, location, is_online, url, owner_id)
select 'Full-Stack Portfolio Workshop', 'Build and ship your developer portfolio in one session.', now() + interval '14 days', 'Online', true, 'https://example.com/workshop', p.id
from public.profiles p order by p.created_at asc limit 1
on conflict do nothing;
