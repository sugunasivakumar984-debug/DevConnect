/**
 * platformServices.ts
 *
 * Modular fetch adapters for each supported developer platform.
 * All calls use ONLY public, unauthenticated endpoints.
 * Returns typed data or throws with a descriptive error.
 *
 * IMPORTANT: No API keys, no OAuth tokens, no scraping.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 12_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (res.status === 404) throw new Error('NOT_FOUND');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

/** Sanitize a platform username — strip leading @, trim whitespace. */
export function sanitizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, '');
}

/** Extract a username from a profile URL for common patterns. */
export function extractUsernameFromUrl(url: string, platform: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const parts = u.pathname.split('/').filter(Boolean);
    switch (platform) {
      case 'github':
      case 'gitlab':
      case 'bitbucket':
      case 'codeberg':
      case 'leetcode':
      case 'huggingface':
      case 'kaggle':
      case 'devto':
      case 'hashnode':
      case 'twitter':
      case 'youtube':
      case 'codepen':
      case 'replit':
        return parts[0] ?? '';
      case 'stackoverflow':
        // /users/1234567/username
        return parts[1] ?? parts[0] ?? '';
      case 'npm':
        // /~username or /~username/packages
        return (parts[0] ?? '').replace(/^~/, '');
      default:
        return parts[0] ?? '';
    }
  } catch {
    return url.trim().replace(/^@/, '');
  }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface GitHubProfile {
  platform: 'github';
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  top_repos: GitHubRepo[];
  languages: Record<string, number>; // lang → byte count
  total_stars: number;
  total_forks: number;
  recent_events: GitHubEvent[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
}

export interface LeetCodeProfile {
  platform: 'leetcode';
  username: string;
  profile_url: string;
  submitStats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalQuestions: number;
  } | null;
  ranking: number | null;
  reputation: number | null;
  avatar: string | null;
}

export interface CodeforcesProfile {
  platform: 'codeforces';
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  maxRank: string | null;
  avatar: string;
  profile_url: string;
  ratingHistory: CodeforcesRatingPoint[];
  problemsSolved: number | null;
}

export interface CodeforcesRatingPoint {
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  newRating: number;
  oldRating: number;
}

export interface StackOverflowProfile {
  platform: 'stackoverflow';
  user_id: number;
  display_name: string;
  reputation: number;
  badge_counts: { gold: number; silver: number; bronze: number };
  profile_image: string;
  link: string;
  question_count: number;
  answer_count: number;
  top_tags: StackOverflowTag[];
}

export interface StackOverflowTag {
  tag_name: string;
  answer_count: number;
  question_count: number;
}

export interface DevToProfile {
  platform: 'devto';
  username: string;
  name: string;
  summary: string | null;
  twitter_username: string | null;
  github_username: string | null;
  profile_image: string;
  joined_at: string;
  profile_url: string;
  articles_count: number | null;
  comments_count: number | null;
}

export interface HuggingFaceProfile {
  platform: 'huggingface';
  username: string;
  fullname: string | null;
  avatar_url: string | null;
  profile_url: string;
  num_models: number | null;
  num_datasets: number | null;
  num_spaces: number | null;
  followerCount: number | null;
}

export interface NpmProfile {
  platform: 'npm';
  username: string;
  profile_url: string;
  packages: NpmPackage[];
}

export interface NpmPackage {
  name: string;
  description: string | null;
  version: string;
  url: string;
}

export interface PyPIProfile {
  platform: 'pypi';
  username: string;
  profile_url: string;
  packages: PyPIPackage[];
}

export interface PyPIPackage {
  name: string;
  description: string | null;
  version: string;
  url: string;
}

export interface DockerHubProfile {
  platform: 'dockerhub';
  username: string;
  profile_url: string;
  full_name: string | null;
  company: string | null;
  bio: string | null;
  repositories: DockerHubRepo[];
}

export interface DockerHubRepo {
  name: string;
  description: string | null;
  pull_count: number;
  star_count: number;
  is_private: boolean;
  last_updated: string;
}

export interface DisplayOnlyProfile {
  platform: string;
  username: string;
  profile_url: string;
}

export type PlatformData =
  | GitHubProfile
  | LeetCodeProfile
  | CodeforcesProfile
  | StackOverflowProfile
  | DevToProfile
  | HuggingFaceProfile
  | NpmProfile
  | PyPIProfile
  | DockerHubProfile
  | DisplayOnlyProfile;

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

export async function fetchGitHub(username: string): Promise<GitHubProfile> {
  const u = sanitizeUsername(username);
  if (!u) throw new Error('NOT_FOUND');

  const [user, repos, events] = await Promise.all([
    fetchJson<any>(`https://api.github.com/users/${encodeURIComponent(u)}`),
    fetchJson<any[]>(`https://api.github.com/users/${encodeURIComponent(u)}/repos?sort=stars&per_page=30&type=public`),
    fetchJson<any[]>(`https://api.github.com/users/${encodeURIComponent(u)}/events/public?per_page=30`).catch(() => [] as any[]),
  ]);

  // Aggregate languages across repos (top repos by stars first)
  const languages: Record<string, number> = {};
  let totalStars = 0;
  let totalForks = 0;

  const sortedRepos: GitHubRepo[] = (repos as any[])
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map((r) => {
      totalStars += r.stargazers_count;
      totalForks += r.forks_count;
      if (r.language) {
        languages[r.language] = (languages[r.language] ?? 0) + (r.size ?? 1);
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
      } as GitHubRepo;
    });

  const recentEvents: GitHubEvent[] = (events as any[]).slice(0, 10).map((e) => ({
    id: e.id,
    type: e.type,
    created_at: e.created_at,
    repo: { name: e.repo?.name ?? '' },
  }));

  return {
    platform: 'github',
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    location: user.location,
    company: user.company,
    blog: user.blog,
    html_url: user.html_url,
    followers: user.followers,
    following: user.following,
    public_repos: user.public_repos,
    public_gists: user.public_gists,
    created_at: user.created_at,
    top_repos: sortedRepos.slice(0, 6),
    languages,
    total_stars: totalStars,
    total_forks: totalForks,
    recent_events: recentEvents,
  };
}

// ---------------------------------------------------------------------------
// GitLab (public API, no auth needed for public profiles)
// ---------------------------------------------------------------------------
export async function fetchGitLab(username: string): Promise<DisplayOnlyProfile & { repos?: number; bio?: string; avatar?: string }> {
  const u = sanitizeUsername(username);
  try {
    const user = await fetchJson<any>(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(u)}`);
    const profile = Array.isArray(user) ? user[0] : null;
    if (!profile) throw new Error('NOT_FOUND');
    return {
      platform: 'gitlab',
      username: profile.username,
      profile_url: profile.web_url,
      bio: profile.bio,
      avatar: profile.avatar_url,
      repos: profile.public_repos ?? undefined,
    };
  } catch {
    return { platform: 'gitlab', username: u, profile_url: `https://gitlab.com/${u}` };
  }
}

// ---------------------------------------------------------------------------
// LeetCode — public GraphQL (may be blocked by CORS in some environments)
// ---------------------------------------------------------------------------
export async function fetchLeetCode(username: string): Promise<LeetCodeProfile> {
  const u = sanitizeUsername(username);
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
          userAvatar
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }
  `;

  try {
    const res = await fetchJson<any>('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username: u } }),
    });

    const user = res?.data?.matchedUser;
    if (!user) throw new Error('NOT_FOUND');

    const acStats = (user.submitStats?.acSubmissionNum ?? []) as { difficulty: string; count: number }[];
    const total = acStats.find((s: any) => s.difficulty === 'All')?.count ?? 0;
    const easy = acStats.find((s: any) => s.difficulty === 'Easy')?.count ?? 0;
    const medium = acStats.find((s: any) => s.difficulty === 'Medium')?.count ?? 0;
    const hard = acStats.find((s: any) => s.difficulty === 'Hard')?.count ?? 0;

    return {
      platform: 'leetcode',
      username: user.username,
      profile_url: `https://leetcode.com/${user.username}`,
      submitStats: { totalSolved: total, easySolved: easy, mediumSolved: medium, hardSolved: hard, totalQuestions: 0 },
      ranking: user.profile?.ranking ?? null,
      reputation: user.profile?.reputation ?? null,
      avatar: user.profile?.userAvatar ?? null,
    };
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') throw err;
    // CORS or network error — return partial profile
    return {
      platform: 'leetcode',
      username: u,
      profile_url: `https://leetcode.com/${u}`,
      submitStats: null,
      ranking: null,
      reputation: null,
      avatar: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Codeforces — fully public REST API
// ---------------------------------------------------------------------------
export async function fetchCodeforces(handle: string): Promise<CodeforcesProfile> {
  const u = sanitizeUsername(handle);

  const [userRes, ratingRes] = await Promise.all([
    fetchJson<any>(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(u)}`),
    fetchJson<any>(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(u)}`).catch(() => null),
  ]);

  if (userRes.status !== 'OK' || !userRes.result?.[0]) throw new Error('NOT_FOUND');
  const cf = userRes.result[0];

  const history: CodeforcesRatingPoint[] = (ratingRes?.status === 'OK' ? ratingRes.result : []).map((r: any) => ({
    contestName: r.contestName,
    rank: r.rank,
    ratingUpdateTimeSeconds: r.ratingUpdateTimeSeconds,
    newRating: r.newRating,
    oldRating: r.oldRating,
  }));

  return {
    platform: 'codeforces',
    handle: cf.handle,
    rating: cf.rating ?? null,
    maxRating: cf.maxRating ?? null,
    rank: cf.rank ?? null,
    maxRank: cf.maxRank ?? null,
    avatar: cf.avatar?.startsWith('//') ? `https:${cf.avatar}` : (cf.avatar ?? ''),
    profile_url: `https://codeforces.com/profile/${cf.handle}`,
    ratingHistory: history.slice(-20),
    problemsSolved: null, // Codeforces doesn't expose this in a single public call
  };
}

// ---------------------------------------------------------------------------
// Stack Overflow — fully public API v2.3
// ---------------------------------------------------------------------------
export async function fetchStackOverflow(identifier: string): Promise<StackOverflowProfile> {
  const u = sanitizeUsername(identifier);
  // identifier can be a numeric user_id or a username to search
  const isNumeric = /^\d+$/.test(u);

  let userId: number;

  if (isNumeric) {
    userId = parseInt(u, 10);
  } else {
    // Search by display name
    const searchRes = await fetchJson<any>(
      `https://api.stackexchange.com/2.3/users?inname=${encodeURIComponent(u)}&site=stackoverflow&pagesize=5&filter=default`
    );
    const found = searchRes?.items?.[0];
    if (!found) throw new Error('NOT_FOUND');
    userId = found.user_id;
  }

  const [profileRes, tagsRes] = await Promise.all([
    fetchJson<any>(
      `https://api.stackexchange.com/2.3/users/${userId}?site=stackoverflow&filter=default`
    ),
    fetchJson<any>(
      `https://api.stackexchange.com/2.3/users/${userId}/top-tags?site=stackoverflow&pagesize=5`
    ).catch(() => null),
  ]);

  const profile = profileRes?.items?.[0];
  if (!profile) throw new Error('NOT_FOUND');

  const topTags: StackOverflowTag[] = (tagsRes?.items ?? []).map((t: any) => ({
    tag_name: t.tag_name,
    answer_count: t.answer_count,
    question_count: t.question_count,
  }));

  return {
    platform: 'stackoverflow',
    user_id: profile.user_id,
    display_name: profile.display_name,
    reputation: profile.reputation,
    badge_counts: profile.badge_counts ?? { gold: 0, silver: 0, bronze: 0 },
    profile_image: profile.profile_image ?? '',
    link: profile.link,
    question_count: profile.question_count ?? 0,
    answer_count: profile.answer_count ?? 0,
    top_tags: topTags,
  };
}

// ---------------------------------------------------------------------------
// DEV.to — public API
// ---------------------------------------------------------------------------
export async function fetchDevTo(username: string): Promise<DevToProfile> {
  const u = sanitizeUsername(username);
  const profile = await fetchJson<any>(`https://dev.to/api/users/by_username?url=${encodeURIComponent(u)}`);
  if (!profile?.username) throw new Error('NOT_FOUND');

  return {
    platform: 'devto',
    username: profile.username,
    name: profile.name ?? profile.username,
    summary: profile.summary ?? null,
    twitter_username: profile.twitter_username ?? null,
    github_username: profile.github_username ?? null,
    profile_image: profile.profile_image ?? profile.profile_image_90 ?? '',
    joined_at: profile.joined_at ?? '',
    profile_url: `https://dev.to/${profile.username}`,
    articles_count: null, // separate call needed
    comments_count: null,
  };
}

// ---------------------------------------------------------------------------
// Hugging Face — public API
// ---------------------------------------------------------------------------
export async function fetchHuggingFace(username: string): Promise<HuggingFaceProfile> {
  const u = sanitizeUsername(username);
  const profile = await fetchJson<any>(`https://huggingface.co/api/users/${encodeURIComponent(u)}`);
  if (!profile?.name) throw new Error('NOT_FOUND');

  return {
    platform: 'huggingface',
    username: profile.name,
    fullname: profile.fullname ?? null,
    avatar_url: profile.avatarUrl ? `https://huggingface.co/${profile.avatarUrl}` : null,
    profile_url: `https://huggingface.co/${profile.name}`,
    num_models: profile.numModels ?? null,
    num_datasets: profile.numDatasets ?? null,
    num_spaces: profile.numSpaces ?? null,
    followerCount: profile.followerCount ?? null,
  };
}

// ---------------------------------------------------------------------------
// npm — public registry API
// ---------------------------------------------------------------------------
export async function fetchNpm(username: string): Promise<NpmProfile> {
  const u = sanitizeUsername(username);
  // npm search by maintainer username
  const searchRes = await fetchJson<any>(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(u)}&size=10`
  );
  const packages: NpmPackage[] = (searchRes?.objects ?? []).map((o: any) => ({
    name: o.package.name,
    description: o.package.description ?? null,
    version: o.package.version,
    url: `https://www.npmjs.com/package/${o.package.name}`,
  }));

  return {
    platform: 'npm',
    username: u,
    profile_url: `https://www.npmjs.com/~${u}`,
    packages,
  };
}

// ---------------------------------------------------------------------------
// PyPI — public API
// ---------------------------------------------------------------------------
export async function fetchPyPI(username: string): Promise<PyPIProfile> {
  const u = sanitizeUsername(username);
  // PyPI doesn't have a direct user profile API, but we can use the search
  const searchRes = await fetchJson<any>(
    `https://pypi.org/search/?q=&o=&c=&maintainer=${encodeURIComponent(u)}&format=json`
  ).catch(() => null);

  // Fallback: return display-only since PyPI's search API is limited
  return {
    platform: 'pypi',
    username: u,
    profile_url: `https://pypi.org/user/${u}/`,
    packages: (searchRes?.data ?? []).slice(0, 10).map((p: any) => ({
      name: p.name,
      description: p.description ?? null,
      version: p.version ?? '',
      url: `https://pypi.org/project/${p.name}/`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Docker Hub — public API
// ---------------------------------------------------------------------------
export async function fetchDockerHub(username: string): Promise<DockerHubProfile> {
  const u = sanitizeUsername(username);
  const [profileRes, reposRes] = await Promise.all([
    fetchJson<any>(`https://hub.docker.com/v2/users/${encodeURIComponent(u)}/`),
    fetchJson<any>(`https://hub.docker.com/v2/repositories/${encodeURIComponent(u)}/?page_size=10&ordering=last_updated`).catch(() => null),
  ]);

  if (!profileRes?.username) throw new Error('NOT_FOUND');

  const repos: DockerHubRepo[] = (reposRes?.results ?? []).map((r: any) => ({
    name: r.name,
    description: r.description ?? null,
    pull_count: r.pull_count ?? 0,
    star_count: r.star_count ?? 0,
    is_private: r.is_private ?? false,
    last_updated: r.last_updated ?? '',
  }));

  return {
    platform: 'dockerhub',
    username: profileRes.username,
    profile_url: `https://hub.docker.com/u/${profileRes.username}`,
    full_name: profileRes.full_name ?? null,
    company: profileRes.company ?? null,
    bio: profileRes.bio ?? null,
    repositories: repos,
  };
}

// ---------------------------------------------------------------------------
// Kaggle — no public API; returns display-only
// ---------------------------------------------------------------------------
export async function fetchKaggle(username: string): Promise<DisplayOnlyProfile> {
  const u = sanitizeUsername(username);
  return { platform: 'kaggle', username: u, profile_url: `https://www.kaggle.com/${u}` };
}

// ---------------------------------------------------------------------------
// CodeChef — no official public API; returns display-only
// ---------------------------------------------------------------------------
export async function fetchCodeChef(username: string): Promise<DisplayOnlyProfile> {
  const u = sanitizeUsername(username);
  return { platform: 'codechef', username: u, profile_url: `https://www.codechef.com/users/${u}` };
}

// ---------------------------------------------------------------------------
// HackerRank — no official public API; returns display-only
// ---------------------------------------------------------------------------
export async function fetchHackerRank(username: string): Promise<DisplayOnlyProfile> {
  const u = sanitizeUsername(username);
  return { platform: 'hackerrank', username: u, profile_url: `https://www.hackerrank.com/profile/${u}` };
}

// ---------------------------------------------------------------------------
// AtCoder — no official public API; returns display-only
// ---------------------------------------------------------------------------
export async function fetchAtCoder(username: string): Promise<DisplayOnlyProfile> {
  const u = sanitizeUsername(username);
  return { platform: 'atcoder', username: u, profile_url: `https://atcoder.jp/users/${u}` };
}

// ---------------------------------------------------------------------------
// Codeberg — Gitea-compatible public API
// ---------------------------------------------------------------------------
export async function fetchCodeberg(username: string): Promise<DisplayOnlyProfile & { avatar?: string; bio?: string; repos?: number }> {
  const u = sanitizeUsername(username);
  try {
    const user = await fetchJson<any>(`https://codeberg.org/api/v1/users/${encodeURIComponent(u)}`);
    if (!user?.login) throw new Error('NOT_FOUND');
    return {
      platform: 'codeberg',
      username: user.login,
      profile_url: `https://codeberg.org/${user.login}`,
      avatar: user.avatar_url ?? undefined,
      bio: user.description ?? undefined,
      repos: user.public_repos ?? undefined,
    };
  } catch {
    return { platform: 'codeberg', username: u, profile_url: `https://codeberg.org/${u}` };
  }
}

// ---------------------------------------------------------------------------
// Bitbucket — public API
// ---------------------------------------------------------------------------
export async function fetchBitbucket(username: string): Promise<DisplayOnlyProfile & { avatar?: string; repos?: number }> {
  const u = sanitizeUsername(username);
  try {
    const user = await fetchJson<any>(`https://api.bitbucket.org/2.0/users/${encodeURIComponent(u)}`);
    if (!user?.nickname) throw new Error('NOT_FOUND');
    return {
      platform: 'bitbucket',
      username: user.nickname,
      profile_url: `https://bitbucket.org/${user.nickname}`,
      avatar: user.links?.avatar?.href ?? undefined,
    };
  } catch {
    return { platform: 'bitbucket', username: u, profile_url: `https://bitbucket.org/${u}` };
  }
}

// ---------------------------------------------------------------------------
// Hashnode — public GraphQL API
// ---------------------------------------------------------------------------
export async function fetchHashnode(username: string): Promise<DisplayOnlyProfile & { name?: string; bio?: string; followersCount?: number; postsCount?: number; avatar?: string }> {
  const u = sanitizeUsername(username);
  const query = `
    query GetUser($username: String!) {
      user(username: $username) {
        name
        username
        bio { text }
        profilePicture
        followersCount
        publications(first: 1) {
          edges {
            node {
              postsCount
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchJson<any>('https://gql.hashnode.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username: u } }),
    });
    const user = res?.data?.user;
    if (!user) throw new Error('NOT_FOUND');
    return {
      platform: 'hashnode',
      username: user.username,
      profile_url: `https://hashnode.com/@${user.username}`,
      name: user.name ?? undefined,
      bio: user.bio?.text ?? undefined,
      followersCount: user.followersCount ?? undefined,
      postsCount: user.publications?.edges?.[0]?.node?.postsCount ?? undefined,
      avatar: user.profilePicture ?? undefined,
    };
  } catch {
    return { platform: 'hashnode', username: u, profile_url: `https://hashnode.com/@${u}` };
  }
}

// ---------------------------------------------------------------------------
// Display-only platforms (no API available or relevant)
// ---------------------------------------------------------------------------
export function buildDisplayOnly(platform: string, username: string): DisplayOnlyProfile {
  const urlMap: Record<string, string> = {
    linkedin:        `https://linkedin.com/in/${username}`,
    twitter:         `https://x.com/${username}`,
    youtube:         `https://youtube.com/@${username}`,
    codepen:         `https://codepen.io/${username}`,
    replit:          `https://replit.com/@${username}`,
    producthunt:     `https://www.producthunt.com/@${username}`,
    portfolio:       username, // treated as URL
    credly:          `https://www.credly.com/users/${username}`,
    microsoftlearn:  `https://learn.microsoft.com/en-us/users/${username}/`,
    googledeveloper: `https://developers.google.com/profile/${username}`,
  };
  return {
    platform,
    username,
    profile_url: urlMap[platform] ?? username,
  };
}

// ---------------------------------------------------------------------------
// Unified fetch dispatcher
// ---------------------------------------------------------------------------
export async function fetchPlatformData(platform: string, username: string): Promise<PlatformData> {
  const u = sanitizeUsername(username);
  switch (platform) {
    case 'github':       return fetchGitHub(u);
    case 'gitlab':       return fetchGitLab(u);
    case 'bitbucket':    return fetchBitbucket(u);
    case 'codeberg':     return fetchCodeberg(u);
    case 'leetcode':     return fetchLeetCode(u);
    case 'codeforces':   return fetchCodeforces(u);
    case 'codechef':     return fetchCodeChef(u);
    case 'hackerrank':   return fetchHackerRank(u);
    case 'atcoder':      return fetchAtCoder(u);
    case 'kaggle':       return fetchKaggle(u);
    case 'huggingface':  return fetchHuggingFace(u);
    case 'stackoverflow':return fetchStackOverflow(u);
    case 'npm':          return fetchNpm(u);
    case 'pypi':         return fetchPyPI(u);
    case 'dockerhub':    return fetchDockerHub(u);
    case 'devto':        return fetchDevTo(u);
    case 'hashnode':     return fetchHashnode(u);
    default:             return buildDisplayOnly(platform, u);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const USERNAME_PATTERNS: Record<string, RegExp> = {
  github:        /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
  gitlab:        /^[a-zA-Z0-9_.-]{1,255}$/,
  bitbucket:     /^[a-zA-Z0-9_-]{1,64}$/,
  codeberg:      /^[a-zA-Z0-9_-]{1,40}$/,
  leetcode:      /^[a-zA-Z0-9_-]{3,30}$/,
  codeforces:    /^[a-zA-Z0-9_-]{3,24}$/,
  codechef:      /^[a-zA-Z0-9_]{3,20}$/,
  hackerrank:    /^[a-zA-Z0-9_-]{1,30}$/,
  atcoder:       /^[a-zA-Z0-9_]{1,16}$/,
  kaggle:        /^[a-zA-Z0-9_-]{1,50}$/,
  huggingface:   /^[a-zA-Z0-9_-]{1,80}$/,
  stackoverflow: /^\d+$|^[a-zA-Z0-9_. -]{2,80}$/,
  devto:         /^[a-zA-Z0-9_]{1,50}$/,
  hashnode:      /^[a-zA-Z0-9_]{1,50}$/,
  npm:           /^[a-z0-9_-]{1,214}$/,
  pypi:          /^[a-zA-Z0-9_-]{1,100}$/,
  dockerhub:     /^[a-z0-9_-]{4,30}$/,
};

export function validatePlatformUsername(platform: string, username: string): { ok: boolean; error?: string } {
  const u = sanitizeUsername(username);
  if (!u) return { ok: false, error: 'Username cannot be empty.' };

  // For display-only platforms, just check non-empty
  const displayOnly = ['linkedin', 'twitter', 'youtube', 'codepen', 'replit', 'producthunt', 'portfolio', 'credly', 'microsoftlearn', 'googledeveloper'];
  if (displayOnly.includes(platform)) {
    if (u.length > 256) return { ok: false, error: 'Username or URL is too long.' };
    return { ok: true };
  }

  const pattern = USERNAME_PATTERNS[platform];
  if (pattern && !pattern.test(u)) {
    return { ok: false, error: `"${u}" doesn't look like a valid ${platform} username.` };
  }
  return { ok: true };
}
