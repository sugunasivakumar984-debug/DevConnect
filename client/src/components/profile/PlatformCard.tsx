/**
 * PlatformCard.tsx
 *
 * Renders a single connected developer platform. The card design adapts to
 * each platform's data shape — GitHub gets a rich view with contribution graph
 * and repo list; competitive platforms show rating; display-only platforms
 * show a clean link card.
 */

import { useState } from 'react';
import { ExternalLink, RefreshCw, Trash2, Clock, Star,
  GitFork, Users, Code2, Trophy, BookOpen, Package,
  MessageSquare, BarChart2, Eye, EyeOff,
} from 'lucide-react';
import { Badge } from '../ui';
import { cn, timeAgo } from '../../lib/utils';
import { PLATFORM_META, getPlatformIcon } from '../../lib/platformMeta';
import type {
  GitHubProfile, LeetCodeProfile, CodeforcesProfile,
  StackOverflowProfile, HuggingFaceProfile,
  NpmProfile, DockerHubProfile,
} from '../../lib/platformServices';
import GitHubContributionGraph from './GitHubContributionGraph';

interface PlatformCardProps {
  connection: {
    id: string;
    platform: string;
    platform_username: string;
    profile_url: string | null;
    cached_data: any;
    last_synced_at: string | null;
    visibility: string;
  };
  isSelf: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
  onToggleVisibility: () => void;
  isRefreshing: boolean;
  isDisconnecting: boolean;
}

// ── Codeforces rank colors ────────────────────────────────────────────────
const CF_RANK_COLORS: Record<string, string> = {
  newbie:           '#808080',
  pupil:            '#008000',
  specialist:       '#03A89E',
  expert:           '#0000FF',
  'candidate master': '#AA00AA',
  master:           '#FF8C00',
  'international master': '#FF8C00',
  grandmaster:      '#FF0000',
  'international grandmaster': '#FF0000',
  'legendary grandmaster': '#FF0000',
};

function getRankColor(rank: string | null): string {
  if (!rank) return '#808080';
  return CF_RANK_COLORS[rank.toLowerCase()] ?? '#808080';
}

// ── Language colors ──────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  JavaScript: '#F7DF1E', TypeScript: '#3178C6', Python: '#3572A5',
  Java: '#B07219', 'C++': '#F34B7D', C: '#555555', 'C#': '#239120',
  Go: '#00ADD8', Rust: '#DEA584', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#FA7343', Kotlin: '#A97BFF', Dart: '#00B4AB', Shell: '#89E051',
  HTML: '#E34C26', CSS: '#563D7C', Vue: '#42B883', Svelte: '#FF3E00',
};

function getLangColor(lang: string): string {
  return LANG_COLORS[lang] ?? '#6E7681';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-label-secondary" title={label}>
      <span className="text-label-tertiary">{icon}</span>
      <span className="font-semibold text-label-primary">{value}</span>
    </div>
  );
}

function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wide mb-2">Top Languages</p>
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-2 gap-px">
        {sorted.map(([lang, bytes]) => (
          <div
            key={lang}
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
            className="transition-all duration-500"
            style={{ width: `${(bytes / total) * 100}%`, background: getLangColor(lang) }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {sorted.map(([lang, bytes]) => (
          <span key={lang} className="flex items-center gap-1 text-[12px] text-label-secondary">
            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: getLangColor(lang) }} />
            {lang}
            <span className="text-label-quaternary">{((bytes / total) * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TopRepos({ repos }: { repos: GitHubProfile['top_repos'] }) {
  if (!repos?.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wide mb-2">Top Repositories</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {repos.slice(0, 4).map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              'group block rounded-[12px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 bg-white/40 dark:bg-white/4',
              'px-3 py-2.5 transition-all duration-fast',
              'hover:border-[rgba(0,0,0,0.12)] dark:hover:border-white/14 hover:bg-white/70 dark:hover:bg-white/8 hover:shadow-sm',
            )}
          >
            <p className="text-[13px] font-semibold text-label-primary group-hover:text-apple-blue transition-colors truncate">
              {repo.name}
            </p>
            {repo.description && (
              <p className="text-[12px] text-label-tertiary mt-0.5 line-clamp-1">{repo.description}</p>
            )}
            <div className="flex items-center gap-2.5 mt-1.5">
              {repo.language && (
                <span className="flex items-center gap-1 text-[11px] text-label-tertiary">
                  <span className="h-2 w-2 rounded-full" style={{ background: getLangColor(repo.language) }} />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-label-tertiary">
                <Star size={10} /> {repo.stargazers_count}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-label-tertiary">
                <GitFork size={10} /> {repo.forks_count}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Platform-specific content ────────────────────────────────────────────────

function GitHubContent({ data }: { data: GitHubProfile }) {
  return (
    <div>
      {/* Profile header */}
      <div className="flex items-start gap-3 mb-4">
        <img
          src={data.avatar_url}
          alt={data.login}
          className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-white/10 shadow-sm"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-label-primary">{data.name ?? data.login}</p>
          {data.bio && <p className="text-[13px] text-label-secondary line-clamp-1 mt-0.5">{data.bio}</p>}
          {data.location && <p className="text-[12px] text-label-tertiary mt-0.5">📍 {data.location}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mb-4">
        <StatChip icon={<BookOpen size={13} />} label="Repositories" value={data.public_repos} />
        <StatChip icon={<Users size={13} />} label="Followers" value={data.followers} />
        <StatChip icon={<Star size={13} />} label="Stars" value={data.total_stars} />
        <StatChip icon={<GitFork size={13} />} label="Forks" value={data.total_forks} />
      </div>

      {/* Contribution graph */}
      {data.recent_events && data.recent_events.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wide mb-2">Public Activity</p>
          <GitHubContributionGraph events={data.recent_events} username={data.login} />
        </div>
      )}

      <LanguageBar languages={data.languages ?? {}} />
      <TopRepos repos={data.top_repos ?? []} />
    </div>
  );
}

function LeetCodeContent({ data }: { data: LeetCodeProfile }) {
  const solved = data.submitStats;
  return (
    <div className="space-y-3">
      {data.avatar && (
        <img src={data.avatar} alt={data.username} className="h-10 w-10 rounded-full ring-2 ring-white/10 shadow-sm" />
      )}
      {solved ? (
        <>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[28px] font-bold text-label-primary leading-none">{solved.totalSolved}</p>
              <p className="text-[11px] text-label-tertiary">solved</p>
            </div>
            {/* Difficulty breakdown */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              {([
                { label: 'Easy', count: solved.easySolved, color: '#34C759' },
                { label: 'Medium', count: solved.mediumSolved, color: '#FF9500' },
                { label: 'Hard', count: solved.hardSolved, color: '#FF3B30' },
              ] as const).map(({ label, count, color }) => (
                <div key={label} className="rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-2 py-2 text-center">
                  <p className="text-[14px] font-bold" style={{ color }}>{count}</p>
                  <p className="text-[10px] text-label-tertiary">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {data.ranking && (
            <div className="flex items-center gap-1.5 text-[13px] text-label-secondary">
              <Trophy size={13} className="text-apple-orange" />
              Rank #{data.ranking.toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-label-tertiary italic">
          LeetCode data unavailable from browser — view profile directly.
        </p>
      )}
    </div>
  );
}

function CodeforcesContent({ data }: { data: CodeforcesProfile }) {
  const rankColor = getRankColor(data.rank);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {data.avatar && (
          <img src={data.avatar} alt={data.handle} className="h-10 w-10 rounded-full ring-2 ring-white/10 shadow-sm" />
        )}
        <div>
          <p className="text-[15px] font-semibold text-label-primary">{data.handle}</p>
          {data.rank && (
            <p className="text-[13px] font-medium capitalize" style={{ color: rankColor }}>{data.rank}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {data.rating !== null && (
          <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-3 py-2 text-center">
            <p className="text-[20px] font-bold" style={{ color: rankColor }}>{data.rating}</p>
            <p className="text-[11px] text-label-tertiary">Current</p>
          </div>
        )}
        {data.maxRating !== null && (
          <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-3 py-2 text-center">
            <p className="text-[20px] font-bold text-label-primary">{data.maxRating}</p>
            <p className="text-[11px] text-label-tertiary">Peak</p>
          </div>
        )}
      </div>

      {/* Rating mini-graph (last 10 contests) */}
      {data.ratingHistory && data.ratingHistory.length > 1 && (
        <div>
          <p className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wide mb-1.5">Rating History</p>
          <RatingMiniChart history={data.ratingHistory.slice(-10)} color={rankColor} />
        </div>
      )}
    </div>
  );
}

function RatingMiniChart({ history, color }: { history: { newRating: number }[]; color: string }) {
  const min = Math.min(...history.map((h) => h.newRating));
  const max = Math.max(...history.map((h) => h.newRating));
  const range = max - min || 1;
  const W = 200; const H = 52;
  const pts = history.map((h, i) => ({
    x: (i / (history.length - 1)) * W,
    y: H - ((h.newRating - min) / range) * H,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${path} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`cf-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#cf-fill-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

function StackOverflowContent({ data }: { data: StackOverflowProfile }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {data.profile_image && (
          <img src={data.profile_image} alt={data.display_name} className="h-10 w-10 rounded-full ring-2 ring-white/10 shadow-sm" />
        )}
        <div>
          <p className="text-[15px] font-semibold text-label-primary">{data.display_name}</p>
          <p className="text-[22px] font-bold text-apple-orange leading-none">{data.reputation.toLocaleString()}</p>
          <p className="text-[11px] text-label-tertiary">reputation</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[13px]">
        <span className="flex items-center gap-1 text-label-secondary">
          <MessageSquare size={13} className="text-apple-blue" /> {data.answer_count} answers
        </span>
        <span className="flex items-center gap-1 text-label-secondary">
          <Code2 size={13} className="text-apple-green" /> {data.question_count} questions
        </span>
      </div>
      <div className="flex items-center gap-2">
        {data.badge_counts.gold > 0 && (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#D4A017]">
            🥇 {data.badge_counts.gold}
          </span>
        )}
        {data.badge_counts.silver > 0 && (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#9EA2A8]">
            🥈 {data.badge_counts.silver}
          </span>
        )}
        {data.badge_counts.bronze > 0 && (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#C18B58]">
            🥉 {data.badge_counts.bronze}
          </span>
        )}
      </div>
      {data.top_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.top_tags.map((tag) => (
            <span key={tag.tag_name} className="apple-pill bg-apple-orange/8 text-apple-orange text-[11px]">
              {tag.tag_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HuggingFaceContent({ data }: { data: HuggingFaceProfile }) {
  return (
    <div className="space-y-3">
      {data.avatar_url && (
        <img src={data.avatar_url} alt={data.username} className="h-10 w-10 rounded-full ring-2 ring-white/10" />
      )}
      <div className="grid grid-cols-3 gap-2">
        {data.num_models !== null && (
          <div className="rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-2 py-2 text-center">
            <p className="text-[16px] font-bold text-label-primary">{data.num_models}</p>
            <p className="text-[10px] text-label-tertiary">Models</p>
          </div>
        )}
        {data.num_datasets !== null && (
          <div className="rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-2 py-2 text-center">
            <p className="text-[16px] font-bold text-label-primary">{data.num_datasets}</p>
            <p className="text-[10px] text-label-tertiary">Datasets</p>
          </div>
        )}
        {data.num_spaces !== null && (
          <div className="rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-2 py-2 text-center">
            <p className="text-[16px] font-bold text-label-primary">{data.num_spaces}</p>
            <p className="text-[10px] text-label-tertiary">Spaces</p>
          </div>
        )}
      </div>
      {data.followerCount !== null && (
        <p className="text-[13px] text-label-secondary">
          <Users size={13} className="inline mr-1" /> {data.followerCount} followers
        </p>
      )}
    </div>
  );
}

function NpmContent({ data }: { data: NpmProfile }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-label-secondary flex items-center gap-1.5">
        <Package size={13} className="text-apple-red" />
        {data.packages.length} published package{data.packages.length !== 1 ? 's' : ''}
      </p>
      {data.packages.slice(0, 3).map((pkg) => (
        <a
          key={pkg.name}
          href={pkg.url}
          target="_blank"
          rel="noreferrer noopener"
          className="block rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-3 py-2 hover:bg-white/60 dark:hover:bg-white/8 transition-colors"
        >
          <p className="text-[13px] font-semibold text-label-primary">{pkg.name}</p>
          {pkg.description && <p className="text-[11px] text-label-tertiary mt-0.5 line-clamp-1">{pkg.description}</p>}
        </a>
      ))}
    </div>
  );
}

function DockerHubContent({ data }: { data: DockerHubProfile }) {
  return (
    <div className="space-y-2">
      {data.bio && <p className="text-[13px] text-label-secondary">{data.bio}</p>}
      {data.repositories.slice(0, 3).map((repo) => (
        <div key={repo.name} className="rounded-[10px] border border-[rgba(0,0,0,0.06)] dark:border-white/8 px-3 py-2">
          <p className="text-[13px] font-semibold text-label-primary">{repo.name}</p>
          <p className="text-[11px] text-label-tertiary mt-0.5">
            {repo.pull_count.toLocaleString()} pulls · ⭐ {repo.star_count}
          </p>
        </div>
      ))}
    </div>
  );
}

function DisplayOnlyContent({ platform: _platform, username, profileUrl }: { platform: string; username: string; profileUrl: string }) {
  return (
    <p className="text-[14px] text-label-secondary">
      <a
        href={profileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-1.5 text-apple-blue hover:underline"
      >
        <ExternalLink size={13} />
        View {username}'s profile
      </a>
    </p>
  );
}

function renderPlatformContent(platform: string, data: any, username: string, profileUrl: string) {
  if (!data) {
    return (
      <p className="text-[13px] text-label-tertiary italic">
        No data loaded. Click Refresh to fetch data.
      </p>
    );
  }
  switch (platform) {
    case 'github':      return <GitHubContent data={data as GitHubProfile} />;
    case 'leetcode':    return <LeetCodeContent data={data as LeetCodeProfile} />;
    case 'codeforces':  return <CodeforcesContent data={data as CodeforcesProfile} />;
    case 'stackoverflow': return <StackOverflowContent data={data as StackOverflowProfile} />;
    case 'huggingface': return <HuggingFaceContent data={data as HuggingFaceProfile} />;
    case 'npm':         return <NpmContent data={data as NpmProfile} />;
    case 'dockerhub':   return <DockerHubContent data={data as DockerHubProfile} />;
    default:
      return <DisplayOnlyContent platform={platform} username={username} profileUrl={profileUrl} />;
  }
}

// ── Main Card ────────────────────────────────────────────────────────────────

export default function PlatformCard({
  connection,
  isSelf,
  onRefresh,
  onDisconnect,
  onToggleVisibility,
  isRefreshing,
  isDisconnecting,
}: PlatformCardProps) {
  const [expanded, setExpanded] = useState(true);
  const meta = PLATFORM_META[connection.platform];
  const icon = getPlatformIcon(connection.platform);
  const profileUrl = connection.profile_url ?? '#';

  if (!meta) return null;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[22px]',
        'border border-[rgba(0,0,0,0.07)] dark:border-white/10',
        'bg-white/70 dark:bg-white/5',
        'backdrop-blur-[24px]',
        'shadow-[0_2px_16px_rgba(0,0,0,0.04)]',
        'transition-all duration-[300ms] ease-apple',
        'hover:shadow-[0_6px_30px_rgba(0,0,0,0.09)] hover:border-[rgba(0,0,0,0.11)]',
        'dark:hover:border-white/16',
      )}
    >
      {/* Top accent bar with brand colour */}
      <div
        className="h-1 w-full opacity-70"
        style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}80)` }}
      />

      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {/* Platform icon */}
          <div
            className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: meta.bgColor }}
          >
            {icon ? (
              <img src={icon} alt={meta.name} className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-[18px]">🔗</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-label-primary">{meta.name}</p>
              {connection.visibility !== 'public' && (
                <Badge tone="warning" className="text-[10px] py-0 px-1.5">
                  {connection.visibility === 'private' ? 'Private' : 'Connections'}
                </Badge>
              )}
            </div>
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className="text-[13px] text-label-tertiary hover:text-apple-blue transition-colors"
            >
              @{connection.platform_username}
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {connection.last_synced_at && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-label-quaternary mr-2">
              <Clock size={10} />
              {timeAgo(connection.last_synced_at)}
            </span>
          )}

          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full p-1.5 text-label-tertiary hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-white/8 hover:text-label-primary transition-all duration-fast"
            title="Open profile"
          >
            <ExternalLink size={14} />
          </a>

          {isSelf && (
            <>
              <button
                type="button"
                onClick={onToggleVisibility}
                className="rounded-full p-1.5 text-label-tertiary hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-white/8 hover:text-label-primary transition-all duration-fast"
                title={connection.visibility === 'public' ? 'Make private' : 'Make public'}
              >
                {connection.visibility === 'public' ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className={cn(
                  'rounded-full p-1.5 text-label-tertiary transition-all duration-fast',
                  'hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-white/8 hover:text-apple-blue',
                  isRefreshing && 'animate-spin text-apple-blue',
                )}
                title="Refresh data"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="rounded-full p-1.5 text-label-tertiary hover:bg-apple-red/10 hover:text-apple-red transition-all duration-fast"
                title="Disconnect"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          {/* Collapse chevron */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full p-1 text-label-quaternary hover:text-label-secondary transition-colors"
          >
            <BarChart2 size={14} className={cn('transition-transform duration-fast', expanded ? '' : 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="border-t border-[rgba(0,0,0,0.05)] dark:border-white/8 pt-4">
            {renderPlatformContent(
              connection.platform,
              connection.cached_data,
              connection.platform_username,
              profileUrl,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
