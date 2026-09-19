/**
 * Shared domain types for DevConnect.
 * Consumed by both `server` (Express) and `client` (React) so the API contract
 * has a single source of truth.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type UUID = string;
export type ISODateString = string;

export type UserRole = 'user' | 'moderator' | 'admin';
export type Availability = 'open_to_work' | 'hiring' | 'busy' | 'not_looking';
export type MentorMode = 'none' | 'open_to_mentor' | 'looking_for_mentor';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type PostStatus = 'draft' | 'published' | 'archived';
export type TargetType = 'post' | 'project' | 'comment' | 'user' | 'group_post';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ModerationLabel = 'SAFE' | 'SPAM' | 'INAPPROPRIATE';

// ---------------------------------------------------------------------------
// API envelope — every endpoint returns this exact shape
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiFailure {
  success: false;
  data: null;
  message: string;
  error?: { code: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Profile & people
// ---------------------------------------------------------------------------

export interface Profile {
  id: UUID;
  username: string;
  full_name: string | null;
  role: UserRole;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  github_username: string | null;
  availability: Availability;
  mentor_mode: MentorMode;
  ai_summary: string | null;
  years_experience: number;
  open_to_work: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProfileWithRelations extends Profile {
  skills: UserSkill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects?: Project[];
  dev_score?: number;
  follower_count?: number;
  following_count?: number;
  connection_count?: number;
}

export interface Experience {
  id: UUID;
  profile_id: UUID;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string | null;
  created_at: ISODateString;
}

export interface Education {
  id: UUID;
  profile_id: UUID;
  school: string;
  degree: string;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: ISODateString;
}

export interface Certification {
  id: UUID;
  profile_id: UUID;
  name: string;
  issuer: string;
  date: string | null;
  url: string | null;
  created_at: ISODateString;
}

export interface Skill {
  id: UUID;
  name: string;
  category: string | null;
}

export interface UserSkill {
  id: UUID;
  user_id: UUID;
  skill_id: UUID;
  proficiency: 1 | 2 | 3 | 4 | 5;
  skill?: Skill;
  endorsement_count?: number;
}

export interface Endorsement {
  id: UUID;
  endorser_id: UUID;
  endorsed_id: UUID;
  skill_id: UUID;
  created_at: ISODateString;
  endorser?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  skill?: Skill;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface Project {
  id: UUID;
  user_id: UUID;
  title: string;
  description: string;
  tech_stack: string[];
  live_url: string | null;
  repo_url: string | null;
  images: string[];
  featured: boolean;
  views: number;
  clicks: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  owner?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  bookmark_count?: number;
  collaborators?: ProjectCollaborator[];
}

export interface ProjectCollaborator {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  role: string | null;
  status: 'invited' | 'accepted' | 'declined';
  user?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogPost {
  id: UUID;
  user_id: UUID;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  status: PostStatus;
  views: number;
  reading_time: number;
  like_count: number;
  comment_count: number;
  seo_title: string | null;
  seo_description: string | null;
  published_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
}

export interface Comment {
  id: UUID;
  user_id: UUID;
  post_id: UUID;
  content: string;
  parent_id: UUID | null;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  replies?: Comment[];
}

export interface Like {
  id: UUID;
  user_id: UUID;
  target_type: TargetType;
  target_id: UUID;
  created_at: ISODateString;
}

export interface Bookmark {
  id: UUID;
  user_id: UUID;
  target_type: TargetType;
  target_id: UUID;
  created_at: ISODateString;
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export interface FeedPost {
  id: UUID;
  user_id: UUID;
  content: string;
  media_urls: string[];
  code_snippet: string | null;
  code_language: string | null;
  link_url: string | null;
  visibility: 'public' | 'connections';
  reaction_count: number;
  comment_count: number;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
  reactions?: Record<EmojiReaction, number>;
  my_reaction?: EmojiReaction | null;
}

export type EmojiReaction = 'like' | 'love' | 'celebrate' | 'insightful' | 'funny';

// ---------------------------------------------------------------------------
// Connections / follows
// ---------------------------------------------------------------------------

export interface Connection {
  id: UUID;
  requester_id: UUID;
  addressee_id: UUID;
  status: ConnectionStatus;
  message: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  requester?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
  addressee?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
}

export interface Follow {
  id: UUID;
  follower_id: UUID;
  following_id: UUID;
  created_at: ISODateString;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export interface Conversation {
  id: UUID;
  user_a: UUID;
  user_b: UUID;
  last_message_at: ISODateString;
  created_at: ISODateString;
  other_user?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  content: string;
  read_at: ISODateString | null;
  created_at: ISODateString;
  sender?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

// ---------------------------------------------------------------------------
// Groups / communities
// ---------------------------------------------------------------------------

export interface Group {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: UUID;
  is_private: boolean;
  member_count?: number;
  created_at: ISODateString;
}

export interface GroupMember {
  id: UUID;
  group_id: UUID;
  user_id: UUID;
  role: 'owner' | 'moderator' | 'member';
  joined_at: ISODateString;
}

export interface GroupPost {
  id: UUID;
  group_id: UUID;
  user_id: UUID;
  content: string;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'endorsement'
  | 'like'
  | 'comment'
  | 'message'
  | 'group_invite'
  | 'follow'
  | 'mention'
  | 'system';

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: ISODateString;
  actor?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------

export interface Badge {
  id: UUID;
  name: string;
  icon: string;
  description: string | null;
  criteria: Record<string, unknown>;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserBadge {
  id: UUID;
  user_id: UUID;
  badge_id: UUID;
  earned_at: ISODateString;
  badge?: Badge;
}

export interface ScoreBreakdown {
  projects: number;
  endorsements: number;
  blog_posts: number;
  connections: number;
  activity: number;
  completeness: number;
}

export interface DevScore {
  user_id: UUID;
  score: number;
  breakdown: ScoreBreakdown;
  rank: number | null;
  updated_at: ISODateString;
}

export interface Streak {
  user_id: UUID;
  current: number;
  longest: number;
  last_activity: string | null;
  heatmap?: { date: string; count: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'headline'>;
  score: number;
  value?: number;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface DeveloperSearchFilters {
  q?: string;
  skills?: string[];
  location?: string;
  availability?: Availability;
  open_to_work?: boolean;
  mentor_mode?: MentorMode;
  min_years?: number;
  max_years?: number;
  page?: number;
  pageSize?: number;
  sort?: 'relevance' | 'recent' | 'score';
}

export interface SmartSearchQuery {
  skills: string[];
  location?: string;
  minYears?: number;
  availability?: string;
  role?: string;
}

export interface SavedSearch {
  id: UUID;
  user_id: UUID;
  name: string;
  query: string;
  filters: DeveloperSearchFilters;
  alerts_enabled: boolean;
  created_at: ISODateString;
}

// ---------------------------------------------------------------------------
// Utilities / extras
// ---------------------------------------------------------------------------

export interface Event {
  id: UUID;
  title: string;
  description: string | null;
  date: ISODateString;
  location: string | null;
  is_online: boolean;
  url: string | null;
  owner_id: UUID;
  rsvp_count?: number;
  my_rsvp?: 'going' | 'interested' | 'declined' | null;
}

export interface Question {
  id: UUID;
  user_id: UUID;
  title: string;
  body: string;
  tags: string[];
  answer_count: number;
  votes: number;
  accepted_answer_id: UUID | null;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

export interface Answer {
  id: UUID;
  question_id: UUID;
  user_id: UUID;
  body: string;
  votes: number;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

export interface Snippet {
  id: UUID;
  user_id: UUID;
  title: string;
  language: string;
  code: string;
  tags: string[];
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

export interface Testimonial {
  id: UUID;
  author_id: UUID;
  target_id: UUID;
  content: string;
  approved: boolean;
  created_at: ISODateString;
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
}

export interface Report {
  id: UUID;
  reporter_id: UUID;
  target_type: TargetType;
  target_id: UUID;
  reason: string;
  status: ReportStatus;
  created_at: ISODateString;
}

export interface AuditLog {
  id: UUID;
  actor_id: UUID | null;
  action: string;
  target_type: string | null;
  target_id: UUID | null;
  meta: Record<string, unknown>;
  ip: string | null;
  created_at: ISODateString;
}

export interface ProfileView {
  id: UUID;
  profile_id: UUID;
  viewer_id: UUID | null;
  source: string | null;
  created_at: ISODateString;
}

export interface ProfileAnalytics {
  views_total: number;
  views_30d: number;
  views_by_day: { date: string; count: number }[];
  traffic_sources: { source: string; count: number }[];
  endorsement_trend: { date: string; count: number }[];
  connection_growth: { date: string; count: number }[];
}

export interface AiCacheEntry {
  id: UUID;
  hash: string;
  response: string;
  model: string;
  feature: string;
  hit_count: number;
  created_at: ISODateString;
}

// ---------------------------------------------------------------------------
// AI feature contracts
// ---------------------------------------------------------------------------

export interface AiProfileSummaryRequest {
  name?: string;
  skills?: string[];
  projects?: string[];
  experience?: string[];
}

export interface AiBlogAssistRequest {
  draft: string;
}

export interface AiBlogAssistResult {
  titles: string[];
  tags: string[];
  grammar_fixes: string[];
  outline: string[];
}

export interface AiSkillGapRequest {
  skills: string[];
  role: string;
  location?: string;
}

export interface AiSkillGapResult {
  missing_skills: string[];
  strengths: string[];
  roadmap: { step: number; title: string; detail: string }[];
}

export interface AiProjectDescriptionRequest {
  repoUrl?: string;
  tech?: string[];
  title?: string;
}

export interface AiCodeReviewRequest {
  language: string;
  code: string;
}

export interface AiCodeReviewResult {
  issues: { severity: 'low' | 'medium' | 'high'; message: string; line?: number }[];
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface AiResumeRequest {
  profile: ProfileWithRelations;
}

export interface AiSmartSearchRequest {
  query: string;
}

export interface AiChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AiTagRequest {
  content: string;
}

export interface AiModerationRequest {
  content: string;
}

export interface AiModerationResult {
  label: ModerationLabel;
  confidence: number;
  reason: string;
}

export interface AiUsage {
  model: string;
  cached: boolean;
  tokens_used: number;
  remaining_hourly: number;
}

export type AiResult<T> = T & { _meta?: AiUsage };

// ---------------------------------------------------------------------------
// Realtime event contracts
// ---------------------------------------------------------------------------

export interface RealtimeEvents {
  'notification:new': Notification;
  'connection:request': Connection;
  'connection:accepted': Connection;
  'endorsement:new': Endorsement;
  'message:new': Message;
  'message:typing': { conversation_id: UUID; user_id: UUID; typing: boolean };
  'message:read': { conversation_id: UUID; reader_id: UUID; read_at: ISODateString };
  'presence:update': { user_id: UUID; online: boolean; last_seen: ISODateString };
  'feed:new': FeedPost;
  'group:post': GroupPost;
  'room:join': { room_id: string; user_id: UUID };
  'room:code': { room_id: string; code: string; user_id: UUID };
}

export type RealtimeEventName = keyof RealtimeEvents;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: UUID;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
