/**
 * DeveloperStatsBar.tsx
 *
 * Aggregated summary stats computed from real connected platform data.
 * Only shows stats that can actually be computed from available data.
 * Never invents or hardcodes values.
 */

import type { GitHubProfile, LeetCodeProfile, CodeforcesProfile, StackOverflowProfile, HuggingFaceProfile, NpmProfile } from '../../lib/platformServices';
import { cn } from '../../lib/utils';

interface PlatformConnection {
  platform: string;
  cached_data: any;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function buildStats(connections: PlatformConnection[]): StatCard[] {
  const stats: StatCard[] = [];

  let totalRepos = 0;
  let totalStars = 0;
  let problemsSolved = 0;
  let cfRating: number | null = null;
  let soReputation: number | null = null;
  let hfModels: number | null = null;
  let npmPackages = 0;
  let articles = 0;
  let hasGithub = false;
  let hasSo = false;
  let hasLeetCode = false;
  let hasCf = false;
  let hasHF = false;

  for (const conn of connections) {
    const d = conn.cached_data;
    if (!d) continue;

    switch (conn.platform) {
      case 'github': {
        const gh = d as GitHubProfile;
        totalRepos += gh.public_repos ?? 0;
        totalStars += gh.total_stars ?? 0;
        hasGithub = true;
        break;
      }
      case 'leetcode': {
        const lc = d as LeetCodeProfile;
        if (lc.submitStats?.totalSolved) {
          problemsSolved += lc.submitStats.totalSolved;
          hasLeetCode = true;
        }
        break;
      }
      case 'codeforces': {
        const cf = d as CodeforcesProfile;
        if (cf.rating !== null) { cfRating = cf.rating; hasCf = true; }
        break;
      }
      case 'stackoverflow': {
        const so = d as StackOverflowProfile;
        soReputation = so.reputation ?? null;
        hasSo = true;
        break;
      }
      case 'huggingface': {
        const hf = d as HuggingFaceProfile;
        hfModels = hf.num_models ?? null;
        hasHF = true;
        break;
      }
      case 'npm': {
        const n = d as NpmProfile;
        npmPackages += n.packages?.length ?? 0;
        break;
      }
      case 'devto':
      case 'hashnode': {
        if (d.articles_count) articles += d.articles_count;
        break;
      }
    }
  }

  if (hasGithub && totalRepos > 0) {
    stats.push({ label: 'Repositories', value: totalRepos, icon: '📁', color: '#24292f' });
  }
  if (hasGithub && totalStars > 0) {
    stats.push({ label: 'Stars Earned', value: totalStars, icon: '⭐', color: '#FF9500' });
  }
  if (hasLeetCode && problemsSolved > 0) {
    stats.push({ label: 'Problems Solved', value: problemsSolved, icon: '🧩', color: '#FFA116' });
  }
  if (hasCf && cfRating !== null) {
    stats.push({ label: 'CF Rating', value: cfRating, icon: '🏆', color: '#1F8DD6' });
  }
  if (hasSo && soReputation !== null) {
    const repStr = soReputation >= 1000 ? `${(soReputation / 1000).toFixed(1)}k` : String(soReputation);
    stats.push({ label: 'SO Reputation', value: repStr, icon: '💬', color: '#F48024' });
  }
  if (hasHF && hfModels !== null) {
    stats.push({ label: 'HF Models', value: hfModels, icon: '🤗', color: '#FF9D00' });
  }
  if (npmPackages > 0) {
    stats.push({ label: 'npm Packages', value: npmPackages, icon: '📦', color: '#CB3837' });
  }
  if (articles > 0) {
    stats.push({ label: 'Articles', value: articles, icon: '✍️', color: '#2563EB' });
  }

  return stats;
}

export default function DeveloperStatsBar({ connections }: { connections: PlatformConnection[] }) {
  const stats = buildStats(connections);
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'group relative overflow-hidden rounded-[18px]',
            'border border-[rgba(0,0,0,0.06)] bg-white/60',
            'dark:bg-white/5 dark:border-white/10',
            'backdrop-blur-[20px]',
            'px-4 py-4',
            'transition-all duration-[250ms] ease-apple',
            'hover:border-[rgba(0,0,0,0.12)] hover:shadow-level-2 hover:-translate-y-px',
            'dark:hover:border-white/15',
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-label-tertiary mb-1">{stat.label}</p>
              <p className="text-[24px] font-bold text-label-primary leading-none tracking-tight">
                {stat.value}
              </p>
            </div>
            <span className="text-[22px] opacity-80 group-hover:scale-110 transition-transform duration-fast">
              {stat.icon}
            </span>
          </div>
          {/* Subtle colour accent bar */}
          <div
            className="absolute bottom-0 left-0 h-0.5 w-full opacity-30 group-hover:opacity-60 transition-opacity duration-fast"
            style={{ background: stat.color }}
          />
        </div>
      ))}
    </div>
  );
}
