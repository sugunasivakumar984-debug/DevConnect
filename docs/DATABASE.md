# Database schema

PostgreSQL on Supabase. `auth.users` is managed by Supabase Auth; everything else lives
in the `public` schema. Migrations are in `supabase/migrations/` and applied in order.

```
00001_extensions_and_profiles.sql          extensions, profiles, experience, education, certifications
00002_projects_blog_interactions.sql       projects, collaborators, blog_posts, comments, likes, bookmarks
00003_skills_connections_social.sql        skills, user_skills, endorsements, connections, follows
00004_feed_messaging_groups.sql            feed_posts, reactions, conversations, messages, groups
00005_gamification_notifications_utilities.sql  notifications, badges, scores, streaks, Q&A, snippets, …
00006_rls_policies.sql                     Row Level Security for every table
00007_storage_and_realtime.sql             buckets, realtime publication, RPC functions
```

## Entity groups

### Identity
| Table | Key columns |
| --- | --- |
| `profiles` | `id` (→ auth.users), `username` unique, `role`, `availability`, `mentor_mode`, `ai_summary`, `years_experience` |
| `experience` | `profile_id`, `company`, `role`, `start_date`, `end_date`, `current` |
| `education` | `profile_id`, `school`, `degree`, `field` |
| `certifications` | `profile_id`, `name`, `issuer`, `date`, `url` |

A trigger on `auth.users` (`handle_new_user`) creates the matching `profiles` row and
resolves a unique username automatically, including for GitHub OAuth sign-ups.

### Work
| Table | Key columns |
| --- | --- |
| `projects` | `user_id`, `title`, `description`, `tech_stack text[]`, `images text[]`, `views`, `clicks` |
| `project_collaborators` | `project_id`, `user_id`, `status` |
| `blog_posts` | `user_id`, `slug` unique, `content`, `tags text[]`, `status`, `reading_time`, `like_count`, `comment_count`, `published_at` |
| `comments` | `post_id`, `user_id`, `parent_id` (threading) |
| `likes` / `bookmarks` | polymorphic `target_type` + `target_id` |

Counters (`comment_count`, `like_count`, `reaction_count`) are maintained by triggers so
list queries never need aggregates.

### Social
| Table | Key columns |
| --- | --- |
| `connections` | `requester_id`, `addressee_id`, `status` — a trigger blocks duplicate/reverse pending requests |
| `follows` | `follower_id`, `following_id` (one-way) |
| `user_skills` | `user_id`, `skill_id`, `proficiency` |
| `endorsements` | `endorser_id`, `endorsed_id`, `skill_id` unique triple |
| `groups` / `group_members` / `group_posts` | community features |

### Communication
| Table | Key columns |
| --- | --- |
| `conversations` | `user_a < user_b` (normalized pair), `last_message_at` |
| `messages` | `conversation_id`, `sender_id`, `receiver_id`, `read_at` |
| `notifications` | `user_id`, `actor_id`, `type`, `payload jsonb`, `read` |

### Engagement
| Table | Key columns |
| --- | --- |
| `badges` / `user_badges` | criteria stored as JSON, awarded by cron |
| `dev_scores` | `score`, `breakdown jsonb` |
| `streaks` / `streak_activity` | current/longest + daily heatmap cells |
| `profile_views` | analytics source |
| `ai_cache` / `ai_usage` | SHA-256 prompt cache + per-user quota ledger |
| `audit_logs` | `actor_id`, `action`, `ip`, `meta jsonb` |
| `reports` | moderation queue |

## RPC functions

| Function | Purpose |
| --- | --- |
| `get_endorsement_counts(user_id)` | Endorsement tallies per skill |
| `get_mutual_connections(user_id, other_id)` | Mutual connections |
| `search_developers(...)` | Filtered directory search (query, skills, location, availability, years) |
| `trending_skills(limit)` | Most adopted skills |
| `get_or_create_conversation(other_id)` | Normalized conversation upsert |
| `recompute_dev_score(user_id)` | Recalculate score + breakdown |
| `handle_new_user()` | Profile bootstrap on sign-up |
| `set_updated_at()` | Generic `updated_at` trigger |

## RLS policy summary

RLS is **enabled on all tables**. Key policies:

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | everyone | owner (`auth.uid() = id`) |
| `experience` / `education` / `certifications` | everyone | owner |
| `projects` | everyone | owner |
| `blog_posts` | published OR author | author |
| `comments` / `likes` | everyone | owner |
| `bookmarks` | owner | owner |
| `feed_posts` | public OR author | author |
| `skills` | everyone | authenticated insert |
| `user_skills` | everyone | owner |
| `endorsements` | everyone | insert only when an accepted connection exists; retract own |
| `connections` | both parties | requester inserts, both update/delete |
| `follows` | everyone | follower |
| `conversations` / `messages` | participants | sender inserts, participants update |
| `groups` | public groups, or members for private | owner |
| `group_posts` | members or public group | author (must be a member) |
| `notifications` | owner | owner |
| `badges` / `user_badges` / `dev_scores` / `streaks` | everyone | owner |
| `saved_searches` | owner | owner |
| `testimonials` | approved, author or target | author creates, author/target update |
| `reports` | reporter | reporter inserts |
| `audit_logs` | admin/moderator | service role |
| `profile_views` | profile owner | anyone inserts |
| `ai_cache` | authenticated | service role |
| `ai_usage` | owner | service role |

## Storage

Three public buckets with a **2 MB** file-size limit and an image-only MIME allowlist:

| Bucket | Path convention |
| --- | --- |
| `avatars` | `<user_id>/avatar-<ts>.<ext>` |
| `project-images` | `<user_id>/projects/<project_id>-<ts>.<ext>` |
| `blog-images` | `<user_id>/blog/<post_id>-<ts>.<ext>` |

Policies let any authenticated user read, but only the owning folder can be written —
enforced by `(storage.foldername(name))[1] = auth.uid()::text`.

## Realtime

`supabase_realtime` publication includes `messages`, `notifications`, `connections` and
`feed_posts`. Everything else uses channel broadcasts:

`notifications:<userId>`, `conversation:<id>`, `group:<id>`, `room:<id>`,
`online-users`, `global-feed`.

## Schema diagram (text)

```
auth.users 1────1 profiles
   profiles 1────* experience / education / certifications / projects / blog_posts
   profiles 1────* user_skills *────1 skills
   profiles 1────* endorsements *────1 skills     (endorsed_id, endorser_id → profiles)
   profiles *────* profiles  via connections (requester_id, addressee_id)
   profiles *────* profiles  via follows     (follower_id, following_id)
   profiles 1────* conversations (user_a, user_b) 1────* messages
   profiles 1────* notifications
   profiles 1────1 dev_scores / streaks
   profiles 1────* user_badges *────1 badges
   blog_posts 1────* comments (self-referential parent_id)
   groups 1────* group_members / group_posts
```
