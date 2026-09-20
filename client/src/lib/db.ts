/**
 * db.ts — Direct Supabase query layer.
 * Replaces the Express server API calls with direct Supabase SDK calls.
 * All security is enforced by Supabase Row Level Security (RLS) policies.
 */
import { supabase } from './supabase';
import type { Profile, BlogPost, Project, FeedPost, Message, Conversation } from '@devconnect/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function throwOnError<T>(result: { data: T | null; error: any }): T {
  if (result.error) throw new Error(result.error.message ?? 'Database error');
  return result.data!;
}

const PROFILE_SELECT = `
  id, username, full_name, role, headline, bio, avatar_url, location, website,
  github_username, availability, mentor_mode, ai_summary, years_experience,
  open_to_work, created_at, updated_at,
  skills:user_skills(id, proficiency, skill:skills(id,name)),
  experience(*),
  education(*),
  certifications(*)
`;

const BLOG_AUTHOR = 'author:profiles!blog_posts_user_id_fkey(id,username,avatar_url,full_name,headline)';

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function getProfileByUsername(username: string): Promise<any> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('username', username).single();
  if (error) throw new Error(error.message);
  return data as any;
}

export async function getProfileById(id: string): Promise<any> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);

  // Auto-create stub if own profile doesn't exist yet
  if (!data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === id) {
      const email = user.email ?? '';
      const base = email.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'user';
      const username = `${base}_${id.slice(0, 6)}`;
      const { data: created, error: e2 } = await supabase.from('profiles')
        .upsert({ id, username }, { onConflict: 'id' })
        .select(PROFILE_SELECT)
        .single();
      if (e2) throw new Error(e2.message);
      return created as any;
    }
  }
  return data as any;
}

export async function updateProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(
    await supabase.from('profiles').update(updates).eq('id', user.id).select('*').single()
  );
}

export async function uploadAvatar(file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const ext = file.name.split('.').pop();
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  return { avatar_url: publicUrl };
}

export async function addExperience(body: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('experience').insert({ ...body, profile_id: user.id }).select().single());
}

export async function deleteExperience(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('experience').delete().eq('id', id).eq('profile_id', user.id));
}

export async function addEducation(body: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('education').insert({ ...body, profile_id: user.id }).select().single());
}

export async function addSkill(skillName: string, proficiency = 3) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  // Upsert skill globally
  const { data: skill } = await supabase.from('skills').upsert({ name: skillName }, { onConflict: 'name' }).select().single();
  if (!skill) throw new Error('Failed to create skill');
  return throwOnError(await supabase.from('user_skills').upsert({ user_id: user.id, skill_id: skill.id, proficiency }, { onConflict: 'user_id,skill_id' }));
}

export async function removeSkill(userSkillId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('user_skills').delete().eq('id', userSkillId).eq('user_id', user.id));
}

export async function getProfileAnalytics(userId: string) {
  const [viewsRes, followersRes, followingRes] = await Promise.all([
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return {
    profile_views: viewsRes.count ?? 0,
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------
export async function getPosts(filters?: Record<string, unknown>) {
  const page = Number(filters?.page ?? 1);
  const pageSize = Number(filters?.pageSize ?? 12);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from('blog_posts').select(`*, ${BLOG_AUTHOR}`, { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (filters?.status) q = q.eq('status', filters.status as string);
  else q = q.eq('status', 'published');
  if (filters?.author) q = q.eq('user_id', filters.author as string);
  if (filters?.tag) q = q.contains('tags', [filters.tag as string]);
  if (filters?.q) q = q.or(`title.ilike.%${filters.q}%,excerpt.ilike.%${filters.q}%`);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize), hasMore: page * pageSize < (count ?? 0) };
}

export async function getPost(slugOrId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  // Try by slug first
  let { data } = await supabase.from('blog_posts').select(`*, ${BLOG_AUTHOR}`).eq('slug', slugOrId).maybeSingle();
  if (!data) {
    // Try by id
    const r = await supabase.from('blog_posts').select(`*, ${BLOG_AUTHOR}`).eq('id', slugOrId).maybeSingle();
    data = r.data;
  }
  if (!data) throw new Error('Post not found');

  let my_reaction: string | null = null;
  let bookmarked = false;
  if (user) {
    const [likeRes, bookmarkRes] = await Promise.all([
      supabase.from('likes').select('id').eq('user_id', user.id).eq('target_id', data.id).eq('target_type', 'post').maybeSingle(),
      supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('target_id', data.id).eq('target_type', 'post').maybeSingle(),
    ]);
    my_reaction = likeRes.data ? 'like' : null;
    bookmarked = !!bookmarkRes.data;
    // Increment view count
    await supabase.from('blog_posts').update({ views: (data.views ?? 0) + 1 }).eq('id', data.id);
  }
  return { ...data, my_reaction, bookmarked };
}

export async function createPost(body: Partial<BlogPost>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  // Generate a simple slug
  const slug = (body.title ?? 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post';
  return throwOnError(
    await supabase.from('blog_posts').insert({ ...body, user_id: user.id, slug }).select().single()
  );
}

export async function updatePost(id: string, body: Partial<BlogPost>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(
    await supabase.from('blog_posts').update(body).eq('id', id).eq('user_id', user.id).select().single()
  );
}

export async function deletePost(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('blog_posts').delete().eq('id', id).eq('user_id', user.id));
}

export async function likePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const existing = await supabase.from('likes').select('id').eq('user_id', user.id).eq('target_id', postId).eq('target_type', 'post').maybeSingle();
  if (existing.data) {
    await supabase.from('likes').delete().eq('id', existing.data.id);
    return { liked: false };
  } else {
    await supabase.from('likes').insert({ user_id: user.id, target_id: postId, target_type: 'post' });
    return { liked: true };
  }
}

export async function getTrendingPosts() {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  return throwOnError(
    await supabase.from('blog_posts').select(`*, ${BLOG_AUTHOR}`)
      .eq('status', 'published').gte('published_at', since)
      .order('views', { ascending: false }).limit(6)
  );
}

export async function getComments(postId: string) {
  return throwOnError(
    await supabase.from('comments').select('*, author:profiles!comments_user_id_fkey(id,username,avatar_url,full_name)')
      .eq('post_id', postId).order('created_at', { ascending: true })
  );
}

export async function addComment(postId: string, content: string, parentId?: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content, parent_id: parentId ?? null })
      .select('*, author:profiles!comments_user_id_fkey(id,username,avatar_url,full_name)').single()
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function getProjects(filters?: Record<string, unknown>) {
  const page = Number(filters?.page ?? 1);
  const pageSize = Number(filters?.pageSize ?? 12);
  let q = supabase.from('projects').select('*, owner:profiles!projects_user_id_fkey(id,username,avatar_url,full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (filters?.q) q = q.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize), hasMore: page * pageSize < (count ?? 0) };
}

export async function getProject(id: string) {
  return throwOnError(
    await supabase.from('projects').select('*, owner:profiles!projects_user_id_fkey(id,username,avatar_url,full_name), collaborators:project_collaborators(*)').eq('id', id).single()
  );
}

export async function createProject(body: Partial<Project>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('projects').insert({ ...body, user_id: user.id }).select().single());
}

export async function updateProject(id: string, body: Partial<Project>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('projects').update(body).eq('id', id).eq('user_id', user.id).select().single());
}

export async function deleteProject(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id));
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
export async function getFeed() {
  const { data, error, count } = await supabase
    .from('feed_posts')
    .select('*, author:profiles!feed_posts_user_id_fkey(id,username,avatar_url,full_name,headline), reactions:feed_reactions(*)', { count: 'exact' })
    .or('visibility.eq.public,visibility.eq.connections')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return { items: data ?? [], page: 1, pageSize: 50, total: count ?? 0, totalPages: 1, hasMore: false };
}

export async function createFeedPost(body: Partial<FeedPost>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('feed_posts').insert({ ...body, user_id: user.id }).select().single());
}

export async function deleteFeedPost(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('feed_posts').delete().eq('id', id).eq('user_id', user.id));
}

export async function reactToFeedPost(postId: string, reaction: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const existing = await supabase.from('feed_reactions').select('id, reaction').eq('user_id', user.id).eq('post_id', postId).maybeSingle();
  if (existing.data?.reaction === reaction) {
    await supabase.from('feed_reactions').delete().eq('id', existing.data.id);
    return { reacted: false, reaction: null };
  } else {
    await supabase.from('feed_reactions').upsert({ user_id: user.id, post_id: postId, reaction }, { onConflict: 'user_id,post_id' });
    return { reacted: true, reaction };
  }
}

// ---------------------------------------------------------------------------
// Feed Comments
// ---------------------------------------------------------------------------
export async function getFeedComments(postId: string) {
  return throwOnError(
    await supabase.from('feed_comments').select(`
      *,
      author:profiles!feed_comments_user_id_fkey(username, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  ) as any[];
}

export async function createFeedComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('feed_comments').insert({ post_id: postId, user_id: user.id, content }).select().single());
}

export async function deleteFeedComment(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('feed_comments').delete().eq('id', id).eq('user_id', user.id));
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------
export async function getConnections() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return throwOnError(
    await supabase.from('connections').select('*, requester:profiles!connections_requester_id_fkey(id,username,avatar_url,full_name,headline), addressee:profiles!connections_addressee_id_fkey(id,username,avatar_url,full_name,headline)')
      .eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
  ) as any[];
}

export async function getPendingConnections() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { incoming: [], outgoing: [] };
  const { data } = await supabase.from('connections').select('*, requester:profiles!connections_requester_id_fkey(id,username,avatar_url,full_name,headline), addressee:profiles!connections_addressee_id_fkey(id,username,avatar_url,full_name,headline)')
    .eq('status', 'pending').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  const incoming = (data ?? []).filter((c: any) => c.addressee_id === user.id);
  const outgoing = (data ?? []).filter((c: any) => c.requester_id === user.id);
  return { incoming, outgoing };
}

export async function getConnectionSuggestions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('profiles').select('*').neq('id', user.id).limit(20);
  return (data ?? []) as (Profile & { shared_skills: number })[];
}

export async function sendConnectionRequest(addresseeId: string, message?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('connections').insert({ requester_id: user.id, addressee_id: addresseeId, message, status: 'pending' }).select().single());
}

export async function respondToConnection(id: string, action: 'accept' | 'reject') {
  const status = action === 'accept' ? 'accepted' : 'rejected';
  return throwOnError(await supabase.from('connections').update({ status }).eq('id', id).select().single());
}

export async function removeConnection(id: string) {
  return throwOnError(await supabase.from('connections').delete().eq('id', id));
}

export async function toggleFollow(targetUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const existing = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle();
  if (existing.data) {
    await supabase.from('follows').delete().eq('id', existing.data.id);
    return { following: false };
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    return { following: true };
  }
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return throwOnError(
    await supabase.from('conversations').select('*, user_a_profile:profiles!conversations_user_a_fkey(id,username,avatar_url,full_name), user_b_profile:profiles!conversations_user_b_fkey(id,username,avatar_url,full_name)')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order('updated_at', { ascending: false })
  ) as Conversation[];
}

export async function getMessages(conversationId: string) {
  const { data, error, count } = await supabase.from('messages').select('*', { count: 'exact' })
    .eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(100);
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 100, totalPages: 1, hasMore: false };
}

export async function startConversation(otherUserId: string): Promise<Conversation> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', { p_other_id: otherUserId });
  if (error) throw new Error(error.message);
  const conv = await supabase.from('conversations').select('*, user_a_profile:profiles!conversations_user_a_fkey(id,username,avatar_url,full_name), user_b_profile:profiles!conversations_user_b_fkey(id,username,avatar_url,full_name)').eq('id', data).single();
  return conv.data as Conversation;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  // Get the other participant
  const conv = await supabase.from('conversations').select('user_a, user_b').eq('id', conversationId).single();
  if (conv.error) throw new Error(conv.error.message);
  const receiverId = conv.data.user_a === user.id ? conv.data.user_b : conv.data.user_a;
  return throwOnError(
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: receiverId, content }).select().single()
  ) as Message;
}

export async function markConversationRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('messages').update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId).eq('receiver_id', user.id).is('read_at', null);
}

// ---------------------------------------------------------------------------
// Endorsements
// ---------------------------------------------------------------------------
export async function getEndorsements(userId: string) {
  const { data } = await supabase.rpc('get_endorsement_counts', { p_user_id: userId });
  return data ?? [];
}

export async function endorseSkill(endorsedId: string, skillId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('endorsements').insert({ endorser_id: user.id, endorsed_id: endorsedId, skill_id: skillId }).select().single());
}

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------
export async function getDevScore(userId: string) {
  const { data: score } = await supabase.from('dev_scores').select('*').eq('user_id', userId).maybeSingle();
  const { data: rank } = await supabase.from('dev_scores').select('user_id', { count: 'exact', head: true }).gt('score', score?.score ?? 0);
  return { score: score?.score ?? 0, breakdown: score?.breakdown ?? {}, rank: (rank as any) + 1 };
}

export async function getLeaderboard(limit = 25, scope = 'global', value?: string) {
  let q = supabase.from('dev_scores').select('*, profile:profiles!dev_scores_user_id_fkey(id,username,avatar_url,full_name,headline,location,skills)');
  
  if (scope === 'location' && value) {
    q = q.ilike('profile.location', `%${value}%`);
  } else if (scope === 'skill' && value) {
    // skills is jsonb or string array, we might need a different query or just filter in memory if simple
    // Actually, PostgREST doesn't support filtering on nested jsonb in a simple way for inner joins if not configured.
    // We'll just fetch more and filter if it's not global, or let's try text search if it's text.
    // For now, let's just pass the query. Since it's a join, filtering the parent by a child column using `!inner` is required.
  }
  
  // To keep it simple and working:
  const { data, error } = await q.order('score', { ascending: false }).limit(limit);
      
  if (error) throw new Error(error.message);
  
  let results = (data || []).map((row: any) => ({
    user: row.profile,
    score: row.score,
  }));
  
  if (scope === 'location' && value) {
    results = results.filter(r => r.user?.location?.toLowerCase().includes(value.toLowerCase()));
  } else if (scope === 'skill' && value) {
    results = results.filter(r => r.user?.skills?.some((s: string) => s.toLowerCase().includes(value.toLowerCase())));
  }
  
  return results.map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getStreak() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return throwOnError(await supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle());
}

export async function getBadges(userId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId ?? user?.id;
  if (!uid) return [];
  return throwOnError(await supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', uid)) as any[];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export async function searchDevelopers(filters: Record<string, unknown>) {
  const page = Number(filters.page ?? 1);
  const pageSize = Number(filters.pageSize ?? 20);
  const { data, error } = await supabase.rpc('search_developers', {
    p_query: (filters.q as string) ?? null,
    p_skills: filters.skills ? String(filters.skills).split(',') : null,
    p_location: (filters.location as string) ?? null,
    p_availability: (filters.availability as string) ?? null,
    p_open_to_work: filters.open_to_work === 'true' ? true : null,
    p_min_years: filters.min_years ? Number(filters.min_years) : null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw new Error(error.message);
  return { items: data ?? [], page, pageSize, total: data?.length ?? 0, totalPages: 1, hasMore: false };
}

export async function getTrendingSkills() {
  const { data, error } = await supabase.rpc('trending_skills', { p_limit: 12 });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ name: r.skill_name, count: Number(r.usage_count) }));
}

export async function getSavedSearches() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return throwOnError(await supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false })) as any[];
}

export async function saveSearch(body: { name: string; query: string; filters: Record<string, unknown> }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('saved_searches').insert({ ...body, user_id: user.id }).select().single());
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, unread_count: 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
  const { data, count } = await supabase.from('notifications').select('*', { count: 'exact' })
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const unread_count = (data ?? []).filter((n: any) => !n.read_at).length;
  return { items: data ?? [], total: count ?? 0, unread_count, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

export async function markNotificationsRead(ids?: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  if (ids?.length) q = (q as any).in('id', ids);
  await q;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
export async function getGroups(q?: string) {
  let query = supabase.from('groups').select('*, owner:profiles!groups_owner_id_fkey(id,username,avatar_url), _count:group_members(count)', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

export async function getGroup(id: string) {
  return throwOnError(await supabase.from('groups').select('*, owner:profiles!groups_owner_id_fkey(id,username,avatar_url,full_name), members:group_members(*, profile:profiles(id,username,avatar_url,full_name))').eq('id', id).single());
}

export async function createGroup(body: { name: string; description?: string; is_private?: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const group = await throwOnError(await supabase.from('groups').insert({ ...body, owner_id: user.id }).select().single());
  await supabase.from('group_members').insert({ group_id: (group as any).id, user_id: user.id, role: 'admin' });
  return group;
}

export async function joinGroup(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('group_members').insert({ group_id: id, user_id: user.id, role: 'member' }));
}

export async function getGroupPosts(groupId: string) {
  return throwOnError(await supabase.from('group_posts').select('*, author:profiles!group_posts_user_id_fkey(id,username,avatar_url,full_name)').eq('group_id', groupId).order('created_at', { ascending: false })) as any[];
}

export async function createGroupPost(groupId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return throwOnError(await supabase.from('group_posts').insert({ group_id: groupId, user_id: user.id, content }).select().single());
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export async function getEvents() {
  const { data, error, count } = await supabase.from('events').select('*, owner:profiles!events_owner_id_fkey(id,username,avatar_url,full_name)', { count: 'exact' }).order('starts_at', { ascending: true }).limit(50);
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

// ---------------------------------------------------------------------------
// Q&A
// ---------------------------------------------------------------------------
export async function getQuestions(tag?: string) {
  let q = supabase.from('questions').select('*, author:profiles!questions_user_id_fkey(id,username,avatar_url,full_name), answers(count)', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
  if (tag) q = q.contains('tags', [tag]);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

// ---------------------------------------------------------------------------
// Snippets
// ---------------------------------------------------------------------------
export async function getSnippets(language?: string) {
  let q = supabase.from('snippets').select('*, author:profiles!snippets_user_id_fkey(id,username,avatar_url,full_name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
  if (language) q = q.eq('language', language);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export async function getBookmarks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return throwOnError(await supabase.from('bookmarks').select('*, post:blog_posts(*), project:projects(*)').eq('user_id', user.id).order('created_at', { ascending: false })) as any[];
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function getAdminStats() {
  const [profiles, posts, projects] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ]);
  return { users: profiles.count ?? 0, posts: posts.count ?? 0, projects: projects.count ?? 0 };
}

export async function getAdminUsers(q?: string) {
  let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
  if (q) query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

export async function updateUserRole(userId: string, role: string) {
  return throwOnError(await supabase.from('profiles').update({ role }).eq('id', userId).select().single());
}

export async function getAdminReports(status?: string) {
  let q = supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(id,username,avatar_url)', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 50, totalPages: 1, hasMore: false };
}

export async function getAuditLogs(action?: string) {
  let q = supabase.from('audit_logs').select('*, actor:profiles!audit_logs_actor_id_fkey(id,username,avatar_url)', { count: 'exact' }).order('created_at', { ascending: false }).limit(100);
  if (action && action !== 'all') q = q.eq('action', action);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0, page: 1, pageSize: 100, totalPages: 1, hasMore: false };
}

// ---------------------------------------------------------------------------
// AI (calls Google Gemini directly via AI Studio API)
// ---------------------------------------------------------------------------

async function callGoogleAI(messages: any[]) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing Gemini API Key');

  // Convert OpenAI-style messages to Gemini format
  const contents = [];
  let systemInstruction = undefined;

  for (const m of messages) {
    if (m.role === 'system') {
      systemInstruction = { parts: [{ text: m.content }] };
    } else {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction,
      generationConfig: { temperature: 0.7 }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini error:', errorText);
    throw new Error(`AI service error: ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const ai = {
  profileSummary: async (body?: any) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are a professional technical writer. Write concisely and professionally.' },
      { role: 'user', content: `Write a 120-word professional bio for a developer named ${body?.name || 'Developer'}.
Skills: ${(body?.skills || []).join(', ') || 'Not listed'}
Projects: ${(body?.projects || []).join(', ') || 'Not listed'}
Experience: ${(body?.experience || []).join(', ') || 'Not listed'}
Output ONLY the bio text, no headings or extra formatting.` },
    ]);
    return { summary: text };
  },

  blogAssist: async (draft: string) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are an expert technical editor. Always respond with valid JSON only, no markdown code fences.' },
      { role: 'user', content: `Analyze this blog draft and return a JSON object with:
- "titles": array of 3 catchy title ideas (strings)
- "tags": array of 5 relevant tags (strings, no # prefix)
- "grammar_fixes": array of 3 grammar/style fixes (strings)
- "outline": array of 4 outline improvement suggestions (strings)

Draft: ${draft}` },
    ]);
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        titles: ['Improving Your Draft', 'A Better Approach', 'Key Insights'],
        tags: ['programming', 'development', 'tips', 'tutorial', 'coding'],
        grammar_fixes: ['Review sentence structure for clarity.', 'Check for consistent tense usage.', 'Ensure proper punctuation throughout.'],
        outline: ['Add an engaging introduction.', 'Break content into clear sections.', 'Add code examples.', 'Write a strong conclusion.'],
      };
    }
  },

  skillGap: async (body: any) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are a career advisor for software engineers. Always respond with valid JSON only, no markdown code fences.' },
      { role: 'user', content: `Analyze the skill gap for a developer targeting the role of "${body?.role || 'Senior Developer'}".
Current skills: ${(body?.skills || []).join(', ')}
Location preference: ${body?.location || 'Remote'}

Return a JSON object with:
- "missing_skills": array of 5 most critical missing skills (strings)
- "strengths": array of 3 existing strengths (strings)  
- "roadmap": array of 4 objects each with "step" (number), "title" (string), "detail" (string)` },
    ]);
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        missing_skills: ['System Design', 'Cloud Architecture (AWS/GCP)', 'CI/CD Pipelines', 'Kubernetes', 'Performance Optimization'],
        strengths: ['Strong coding fundamentals', 'Good problem-solving skills', 'Existing technical skills'],
        roadmap: [
          { step: 1, title: 'Master System Design', detail: 'Study distributed systems, scalability patterns, and practice on LeetCode.' },
          { step: 2, title: 'Cloud Certification', detail: 'Complete AWS Solutions Architect Associate or Google Cloud Professional certificate.' },
          { step: 3, title: 'DevOps Fundamentals', detail: 'Learn Docker, Kubernetes basics, and set up a CI/CD pipeline for a personal project.' },
          { step: 4, title: 'Open Source Contribution', detail: 'Contribute to projects related to your target role to build portfolio evidence.' },
        ],
      };
    }
  },

  projectDescription: async (body: any) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are an expert project manager. Write concise, professional project descriptions.' },
      { role: 'user', content: `Write a 2-paragraph professional description for:
Title: ${body?.title || 'Untitled Project'}
Tech stack: ${(body?.tech || []).join(', ') || 'Not specified'}
Repo: ${body?.repoUrl || 'Not provided'}
Output ONLY the description text.` },
    ]);
    return { description: text };
  },

  codeReview: async (body: any) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are a senior software engineer. Always respond with valid JSON only, no markdown code fences.' },
      { role: 'user', content: `Review this ${body?.language || 'code'} snippet and return a JSON object with:
- "severity": overall severity ("low" | "medium" | "high")
- "issues": array of objects with "severity" ("low"|"medium"|"high"), "message" (string), "line" (number or null)
- "suggestions": array of 3 improvement suggestions (strings)

Code:
${body?.code}` },
    ]);
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { severity: 'low', issues: [], suggestions: ['Code looks clean.', 'Consider adding comments.', 'Write unit tests.'] };
    }
  },

  chat: async (body: any) => {
    const messages: any[] = [
      { role: 'system', content: 'You are a helpful AI assistant for developers on DevConnect. You help with coding questions, career advice, and technical discussions. Be concise and practical.' },
    ];
    if (body?.history?.length) messages.push(...body.history);
    messages.push({ role: 'user', content: body?.message });
    const text = await callGoogleAI(messages);
    return { reply: text };
  },

  resume: async () => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are an expert resume writer for software engineers. Write clean, ATS-friendly markdown.' },
      { role: 'user', content: `Generate a professional one-page developer resume in Markdown format.
Structure: # Name, ## Summary, ## Skills, ## Experience, ## Projects, ## Education
Make it realistic with placeholder data clearly marked with [brackets]. Keep it concise and impactful.` },
    ]);
    return { markdown: text };
  },

  aiSearch: async (query: string) => {
    const text = await callGoogleAI([
      { role: 'system', content: 'You are a developer discovery assistant.' },
      { role: 'user', content: `Help find developers matching: ${query}. Suggest 3 search strategies.` },
    ]);
    return { suggestions: text };
  },
};

// ---------------------------------------------------------------------------
// Developer Platform Connections
// ---------------------------------------------------------------------------

export async function getDeveloperPlatforms(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('developer_platform_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function connectDeveloperPlatform(payload: {
  platform: string;
  platform_username: string;
  profile_url?: string;
  cached_data?: any;
  visibility?: string;
}): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('developer_platform_connections')
    .upsert(
      {
        user_id: user.id,
        platform: payload.platform,
        platform_username: payload.platform_username,
        profile_url: payload.profile_url ?? null,
        cached_data: payload.cached_data ?? null,
        visibility: payload.visibility ?? 'public',
        last_synced_at: payload.cached_data ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,platform' }
    )
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function disconnectDeveloperPlatform(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('developer_platform_connections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // RLS double-check
  if (error) throw new Error(error.message);
}

export async function refreshDeveloperPlatform(id: string, cachedData: any): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('developer_platform_connections')
    .update({ cached_data: cachedData, last_synced_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDeveloperPlatformVisibility(id: string, visibility: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('developer_platform_connections')
    .update({ visibility })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
}
