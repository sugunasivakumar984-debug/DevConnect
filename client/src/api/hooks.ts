import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import type {
  AiModerationResult,
  DeveloperSearchFilters,
  Profile,
  Project,
  BlogPost,
  UserRole,
} from '@devconnect/shared';
import * as db from '../lib/db';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const qk = {
  me: ['me'] as const,
  profile: (username: string) => ['profile', username] as const,
  currentProfile: ['profile', 'me'] as const,
  projects: (filters?: Record<string, unknown>) => ['projects', filters ?? {}] as const,
  project: (id: string) => ['project', id] as const,
  posts: (filters?: Record<string, unknown>) => ['posts', filters ?? {}] as const,
  post: (slug: string) => ['post', slug] as const,
  comments: (postId: string) => ['comments', postId] as const,
  feed: (rank?: string) => ['feed', rank ?? 'chrono'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  connections: ['connections'] as const,
  pendingConnections: ['connections', 'pending'] as const,
  suggestions: ['connections', 'suggestions'] as const,
  endorsements: (userId: string) => ['endorsements', userId] as const,
  notifications: ['notifications'] as const,
  leaderboard: (scope: string, value?: string) => ['leaderboard', scope, value ?? ''] as const,
  score: (userId: string) => ['score', userId] as const,
  streak: ['streak'] as const,
  badges: ['badges'] as const,
  searchDevelopers: (filters: DeveloperSearchFilters) => ['search', 'developers', filters] as const,
  trendingSkills: ['search', 'trending-skills'] as const,
  savedSearches: ['search', 'saved'] as const,
  analytics: (userId: string) => ['analytics', userId] as const,
  groups: ['groups'] as const,
  group: (id: string) => ['group', id] as const,
  groupPosts: (id: string) => ['group', id, 'posts'] as const,
  events: ['events'] as const,
  questions: ['questions'] as const,
  snippets: ['snippets'] as const,
  bookmarks: ['bookmarks'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminReports: ['admin', 'reports'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminAudit: ['admin', 'audit-logs'] as const,
  adminModeration: ['admin', 'moderation-queue'] as const,
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export function useProfile(username: string | undefined) {
  return useQuery({
    queryKey: qk.profile(username ?? ''),
    queryFn: () => db.getProfileByUsername(username!),
    enabled: Boolean(username),
  });
}

export function useCurrentProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: qk.currentProfile,
    queryFn: () => db.getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Profile>) => db.updateProfile(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.currentProfile });
      void useAuthStore.getState().loadProfile();
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => db.uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.currentProfile });
      void useAuthStore.getState().loadProfile();
    },
  });
}

export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => db.addExperience(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.currentProfile }),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteExperience(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.currentProfile }),
  });
}

export function useAddEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => db.addEducation(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.currentProfile }),
  });
}

export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { skill: string; proficiency?: number }) => db.addSkill(body.skill, body.proficiency),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.currentProfile }),
  });
}

export function useRemoveSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => db.removeSkill(skillId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.currentProfile }),
  });
}

export function useProfileAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: qk.analytics(userId ?? ''),
    queryFn: () => db.getProfileAnalytics(userId!),
    enabled: Boolean(userId),
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export function useProjects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.projects(filters),
    queryFn: () => db.getProjects(filters),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: qk.project(id ?? ''),
    queryFn: () => db.getProject(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Project>) => db.createProject(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Project> & { id: string }) => db.updateProject(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteProject(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useBookmarkProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Toggle bookmark via bookmarks table
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('target_id', id).eq('target_type', 'project').maybeSingle();
      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id);
        return { bookmarked: false };
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, target_id: id, target_type: 'project' });
        return { bookmarked: true };
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: qk.bookmarks });
    },
  });
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------
export function usePosts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.posts(filters),
    queryFn: () => db.getPosts(filters),
  });
}

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: qk.post(slug ?? ''),
    queryFn: () => db.getPost(slug!),
    enabled: Boolean(slug),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BlogPost>) => db.createPost(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<BlogPost> & { id: string }) => db.updatePost(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deletePost(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.likePost(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
      void qc.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: qk.comments(postId ?? ''),
    queryFn: () => db.getComments(postId!),
    enabled: Boolean(postId),
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; parent_id?: string | null }) =>
      db.addComment(postId, body.content, body.parent_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(postId) });
      void qc.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
export function useFeed(_rank?: 'ai') {
  return useQuery({
    queryKey: qk.feed(),
    queryFn: () => db.getFeed(),
  });
}

export function useCreateFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<FeedPost>) => db.createFeedPost(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useDeleteFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteFeedPost(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useReactToFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reaction }: { id: string; reaction: string }) =>
      db.reactToFeedPost(id, reaction),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

// ---------------------------------------------------------------------------
// Feed Comments
// ---------------------------------------------------------------------------
export function useFeedComments(postId: string) {
  return useQuery({
    queryKey: ['feed_comments', postId],
    queryFn: () => db.getFeedComments(postId),
    enabled: Boolean(postId),
  });
}

export function useCreateFeedComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => db.createFeedComment(postId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed_comments', postId] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteFeedComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteFeedComment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed_comments', postId] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------
export function useConnections() {
  return useQuery({ queryKey: qk.connections, queryFn: () => db.getConnections() });
}

export function usePendingConnections() {
  return useQuery({
    queryKey: qk.pendingConnections,
    queryFn: () => db.getPendingConnections(),
  });
}

export function useConnectionSuggestions() {
  return useQuery({
    queryKey: qk.suggestions,
    queryFn: () => db.getConnectionSuggestions(),
  });
}

export function useSendConnectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { addressee_id: string; message?: string }) =>
      db.sendConnectionRequest(body.addressee_id, body.message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pendingConnections });
      void qc.invalidateQueries({ queryKey: qk.suggestions });
    },
  });
}

export function useRespondToConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      db.respondToConnection(id, action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.connections });
      void qc.invalidateQueries({ queryKey: qk.pendingConnections });
    },
  });
}

export function useRemoveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.removeConnection(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.connections }),
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => db.toggleFollow(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export function useConversations() {
  return useQuery({ queryKey: qk.conversations, queryFn: () => db.getConversations() });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: qk.messages(conversationId ?? ''),
    queryFn: () => db.getMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => db.startConversation(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.conversations }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => db.sendMessage(conversationId, content),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.messages(conversationId) }),
  });
}

export function useMarkConversationRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => db.markConversationRead(conversationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.conversations }),
  });
}

export function useSendTyping(_conversationId: string) {
  // Typing indicators can be done via Supabase Realtime presence; no-op for now
  return useMutation({ mutationFn: async (_typing: boolean) => {} });
}

// ---------------------------------------------------------------------------
// Endorsements
// ---------------------------------------------------------------------------
export function useEndorsements(userId: string | undefined) {
  return useQuery({
    queryKey: qk.endorsements(userId ?? ''),
    queryFn: () => db.getEndorsements(userId!),
    enabled: Boolean(userId),
  });
}

export function useEndorseSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { endorsed_id: string; skill_id: string }) =>
      db.endorseSkill(body.endorsed_id, body.skill_id),
    onSuccess: (_data, vars) => void qc.invalidateQueries({ queryKey: qk.endorsements(vars.endorsed_id) }),
  });
}

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------
export function useDevScore(userId: string | undefined) {
  return useQuery({
    queryKey: qk.score(userId ?? ''),
    queryFn: () => db.getDevScore(userId!),
    enabled: Boolean(userId),
  });
}

export function useLeaderboard(scope = 'global', value?: string) {
  return useQuery({
    queryKey: [...qk.leaderboard('global'), scope, value ?? ''],
    queryFn: () => db.getLeaderboard(25, scope, value),
  });
}

export function useStreak() {
  return useQuery({ queryKey: qk.streak, queryFn: () => db.getStreak() });
}

export function useBadges(userId?: string) {
  return useQuery({
    queryKey: userId ? [...qk.badges, userId] : qk.badges,
    queryFn: () => db.getBadges(userId),
  });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export function useSearchDevelopers(filters: DeveloperSearchFilters) {
  return useQuery({
    queryKey: qk.searchDevelopers(filters),
    queryFn: () => db.searchDevelopers({ ...filters, skills: filters.skills?.join(',') } as any),
  });
}

export function useAiSearch() {
  return useMutation({
    mutationFn: (query: string) => db.ai.aiSearch(query),
  });
}

export function useTrendingSkills() {
  return useQuery({
    queryKey: qk.trendingSkills,
    queryFn: () => db.getTrendingSkills(),
  });
}

export function useSavedSearches() {
  return useQuery({ queryKey: qk.savedSearches, queryFn: () => db.getSavedSearches() });
}

export function useSaveSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; query: string; filters: Record<string, unknown> }) =>
      db.saveSearch(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.savedSearches }),
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => db.getNotifications(),
    enabled,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => db.markNotificationsRead(ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
export function useGroups(q?: string) {
  return useQuery({
    queryKey: [...qk.groups, q ?? ''],
    queryFn: () => db.getGroups(q),
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: qk.group(id ?? ''),
    queryFn: () => db.getGroup(id!),
    enabled: Boolean(id),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; is_private?: boolean }) =>
      db.createGroup(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.groups }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.joinGroup(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.groups }),
  });
}

export function useGroupPosts(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.groupPosts(groupId ?? ''),
    queryFn: () => db.getGroupPosts(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useCreateGroupPost(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => db.createGroupPost(groupId, content),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.groupPosts(groupId) }),
  });
}

// ---------------------------------------------------------------------------
// AI (calls Supabase Edge Functions)
// ---------------------------------------------------------------------------
export function useAiProfileSummary() {
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) => db.ai.profileSummary(body),
  });
}

export function useAiBlogAssist() {
  return useMutation({
    mutationFn: (draft: string) => db.ai.blogAssist(draft),
  });
}

export function useAiSkillGap() {
  return useMutation({
    mutationFn: (body: { skills: string[]; role: string; location?: string }) =>
      db.ai.skillGap(body),
  });
}

export function useAiProjectDescription() {
  return useMutation({
    mutationFn: (body: { repoUrl?: string; tech?: string[]; title?: string }) =>
      db.ai.projectDescription(body),
  });
}

export function useAiCodeReview() {
  return useMutation({
    mutationFn: (body: { language: string; code: string }) => db.ai.codeReview(body),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] }) =>
      db.ai.chat(body),
  });
}

export function useAiModerate() {
  // Moderation is a no-op without the server; return safe default
  return useMutation({
    mutationFn: async (_content: string): Promise<AiModerationResult> =>
      ({ flagged: false, categories: {}, scores: {} } as any),
  });
}

export function useAiResume() {
  return useMutation({
    mutationFn: () => db.ai.resume(),
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export function useAdminStats() {
  return useQuery({ queryKey: qk.adminStats, queryFn: () => db.getAdminStats() });
}

export function useAdminReports(status?: string) {
  return useQuery({
    queryKey: [...qk.adminReports, status ?? 'all'],
    queryFn: () => db.getAdminReports(status),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { supabase } = await import('../lib/supabase');
      return (await supabase.from('reports').update({ status }).eq('id', id).select().single()).data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.adminReports }),
  });
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: [...qk.adminUsers, q ?? ''],
    queryFn: () => db.getAdminUsers(q),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => db.updateUserRole(id, role),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.adminUsers }),
  });
}

export function useAuditLogs(action?: string) {
  return useQuery({
    queryKey: [...qk.adminAudit, action ?? 'all'],
    queryFn: () => db.getAuditLogs(action),
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export function useEvents() {
  return useQuery({ queryKey: qk.events, queryFn: () => db.getEvents() });
}

export function useQuestions(tag?: string) {
  return useQuery({
    queryKey: [...qk.questions, tag ?? ''],
    queryFn: () => db.getQuestions(tag),
  });
}

export function useSnippets(language?: string) {
  return useQuery({
    queryKey: [...qk.snippets, language ?? ''],
    queryFn: () => db.getSnippets(language),
  });
}

export function useBookmarks() {
  return useQuery({ queryKey: qk.bookmarks, queryFn: () => db.getBookmarks() });
}

// Health check — no server, just return ok
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => ({ status: 'ok' }),
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Missing type imports (FeedPost used inline above)
// ---------------------------------------------------------------------------
type FeedPost = any;

// ---------------------------------------------------------------------------
// Developer Platform Connections
// ---------------------------------------------------------------------------
export function useDeveloperPlatforms(userId: string | undefined) {
  return useQuery({
    queryKey: ['developer-platforms', userId ?? ''],
    queryFn: () => db.getDeveloperPlatforms(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 min — cached data stays fresh
  });
}

export function useConnectDeveloperPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      platform: string;
      platform_username: string;
      profile_url?: string;
      cached_data?: any;
      visibility?: string;
    }) => db.connectDeveloperPlatform(payload),
    onSuccess: () => {
      // Invalidate for the current user — we don't have userId here,
      // so invalidate all developer-platforms queries
      void qc.invalidateQueries({ queryKey: ['developer-platforms'] });
    },
  });
}

export function useDisconnectDeveloperPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.disconnectDeveloperPlatform(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['developer-platforms'] }),
  });
}

export function useRefreshDeveloperPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cachedData }: { id: string; cachedData: any }) =>
      db.refreshDeveloperPlatform(id, cachedData),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['developer-platforms'] }),
  });
}

export function useUpdatePlatformVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: string }) =>
      db.updateDeveloperPlatformVisibility(id, visibility),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['developer-platforms'] }),
  });
}

