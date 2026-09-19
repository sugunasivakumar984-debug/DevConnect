import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, MapPin } from 'lucide-react';
import { useLeaderboard } from '../api/hooks';
import { Avatar, Card, CardBody, EmptyState, Input, Skeleton, Reveal } from '../components/ui';
import { avatarGradient, cn } from '../lib/utils';
import type { LeaderboardEntry } from '@devconnect/shared';

const medalFor = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

export default function Leaderboard() {
  const [scope, setScope] = useState<'global' | 'skill' | 'location'>('global');
  const [value, setValue] = useState('');

  const { data, isLoading } = useLeaderboard(scope, scope === 'global' ? undefined : value);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#FF9500_0%,#FFCC00_100%)] text-white shadow-[0_8px_16px_rgba(255,149,0,0.25)] animate-fade-rise-sm">
          <Trophy size={32} />
        </div>
        <h1 className="text-heading-1 text-center">
          Leaderboard
        </h1>
        <p className="mt-3 text-[17px] text-label-secondary text-center max-w-md">
          Ranked by developer score — projects, endorsements, writing and activity.
        </p>
      </div>

      <Reveal>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-white/60 p-1 shadow-sm backdrop-blur-md">
            {(['global', 'skill', 'location'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setScope(s);
                  setValue('');
                }}
                className={cn(
                  'rounded-full px-5 py-2 text-[14px] font-medium transition-all duration-300',
                  scope === s
                    ? 'bg-apple-blue text-white shadow-md'
                    : 'text-label-secondary hover:text-label-primary hover:bg-apple-gray-6'
                )}
              >
                {s === 'global' ? 'Global' : s === 'skill' ? 'By skill' : 'By location'}
              </button>
            ))}
          </div>

          {scope !== 'global' && (
            <div className="w-full max-w-xs animate-fade-in">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={scope === 'skill' ? 'e.g. React' : 'e.g. Berlin'}
                className="w-full text-center"
              />
            </div>
          )}
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-4 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="mt-12">
          <EmptyState
            icon={<Medal size={32} />}
            title="No rankings yet"
            description={scope === 'global' ? 'Be the first to build a score.' : 'Try a different filter.'}
          />
        </div>
      )}

      <div className="space-y-4 mt-8 stagger-children">
        {data?.map((entry: LeaderboardEntry, index: number) => {
          const isTop3 = entry.rank <= 3;
          return (
            <Reveal key={entry.user.id} delay={index * 50}>
              <Card className={cn(
                "transition-transform duration-300 hover:scale-[1.01]",
                isTop3 ? "border-[rgba(255,149,0,0.3)] bg-gradient-to-r from-[rgba(255,149,0,0.05)] to-transparent" : ""
              )}>
                <CardBody className="flex items-center gap-5 p-5">
                  <span className="w-10 text-center text-xl font-bold text-label-primary tracking-tight">
                    {medalFor(entry.rank) ?? `#${entry.rank}`}
                  </span>
                  <Avatar
                    src={entry.user.avatar_url}
                    name={entry.user.full_name ?? entry.user.username}
                    size={48}
                    gradient={avatarGradient(entry.user.username)}
                    className={isTop3 ? "ring-2 ring-apple-orange/30 shadow-md" : ""}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/u/${entry.user.username}`} className="block truncate text-[16px] font-semibold text-label-primary hover:text-apple-blue transition-colors">
                      {entry.user.full_name ?? entry.user.username}
                    </Link>
                    <p className="flex items-center gap-2 truncate text-[14px] text-label-secondary mt-0.5">
                      {entry.user.headline ?? `@${entry.user.username}`}
                      {(entry.user as { location?: string | null }).location && (
                        <span className="flex items-center gap-1 text-label-tertiary before:content-['·'] before:mr-2">
                          <MapPin size={12} /> {(entry.user as { location?: string | null }).location}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={cn(
                    "rounded-full px-4 py-1.5 text-[14px] font-semibold",
                    isTop3 ? "bg-apple-orange/10 text-apple-orange" : "bg-apple-blue/10 text-apple-blue"
                  )}>
                    {entry.score} pts
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
