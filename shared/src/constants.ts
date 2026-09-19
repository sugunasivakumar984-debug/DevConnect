/**
 * Shared constants — API contract, enums, model IDs, limits.
 */

export const API_PREFIX = '/api';

export const AI_MODELS = {
  /** General purpose — profile summary, blog assist, feed ranking, chat */
  general: 'openai/gpt-4o-mini',
  /** Fast + cheap — tag generation, smart search, classification */
  fast: 'openai/gpt-4o-mini',
  /** Code specialist — code review, project description */
  code: 'openai/gpt-4o-mini',
  /** Reasoning — skill gap analysis, resume builder */
  reasoning: 'openai/gpt-4o-mini',
  /** Moderation */
  guard: 'openai/gpt-4o-mini',
} as const;

/** Ordered fallback chain used when a model 429s or errors. */
export const AI_FALLBACK_CHAIN = [
  'openai/gpt-4o-mini',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
] as const;

export const AI_LIMITS = {
  /** Per-user AI calls allowed per rolling hour. */
  USER_HOURLY: 20,
  /** Hard cap on prompt characters sent upstream (keeps free-tier costs sane). */
  MAX_PROMPT_CHARS: 12000,
  /** Timeout per upstream attempt in ms. */
  REQUEST_TIMEOUT_MS: 45_000,
  /** How many models in the fallback chain to try before giving up. */
  MAX_ATTEMPTS: 4,
} as const;

export const UPLOAD_LIMITS = {
  /** 2 MB max image upload (project constraint). */
  MAX_BYTES: 2 * 1024 * 1024,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
} as const;

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  projects: 'project-images',
  blog: 'blog-images',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

export const RATE_LIMITS = {
  windowMs: 60_000,
  max: 120,
  authMax: 20,
  aiMax: 20,
} as const;

export const DEV_SCORE_WEIGHTS = {
  projects: 25,
  endorsements: 25,
  blog_posts: 20,
  connections: 15,
  activity: 10,
  completeness: 5,
} as const;

export const AVAILABILITY_LABELS: Record<string, string> = {
  open_to_work: 'Open to work',
  hiring: 'Hiring',
  busy: 'Busy',
  not_looking: 'Not looking',
};

export const MENTOR_MODE_LABELS: Record<string, string> = {
  none: 'Not specified',
  open_to_mentor: 'Open to mentor',
  looking_for_mentor: 'Looking for a mentor',
};

export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Connected',
  rejected: 'Declined',
  blocked: 'Blocked',
};

export const EMOJI_REACTIONS = ['like', 'love', 'celebrate', 'insightful', 'funny'] as const;

export const REALTIME_CHANNELS = {
  notifications: (userId: string) => `notifications:${userId}`,
  presence: 'online-users',
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  feed: 'global-feed',
  group: (groupId: string) => `group:${groupId}`,
  room: (roomId: string) => `room:${roomId}`,
} as const;
