import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  FileText,
  Eye,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Trophy,
  Flame,
} from 'lucide-react';
import {
  useCurrentProfile,
  useConnectionSuggestions,
  useSendConnectionRequest,
  usePosts,
  useStreak,
  useDevScore,
} from '../api/hooks';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Skeleton, Reveal } from '../components/ui';
import { avatarGradient, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import type { ProfileWithRelations, Streak } from '@devconnect/shared';

export default function Dashboard() {
  const { data: profile, isLoading } = useCurrentProfile();
  const { data: suggestions, isPending: loadingSuggestions } = useConnectionSuggestions();
  const { data: trending } = usePosts({ pageSize: 4 });
  const { data: streak } = useStreak();
  const { data: score } = useDevScore(profile?.id);
  const sendRequest = useSendConnectionRequest();

  const streakData = streak as Streak | undefined;

  const onConnect = async (userId: string) => {
    try {
      await sendRequest.mutateAsync({ addressee_id: userId });
      toast.success('Connection request sent');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-heading-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-2 text-[17px] text-label-secondary">Here's what's happening in your network.</p>
        </div>
        <Link to="/feed">
          <Button>Share an update</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <Reveal delay={100}>
          <StatCard
            icon={<Trophy size={20} />}
            label="Developer score"
            value={isLoading ? '—' : String(score?.score ?? 0)}
            hint={score?.rank ? `Rank #${score.rank}` : 'Keep contributing'}
            loading={isLoading}
            tone="brand"
          />
        </Reveal>
        <Reveal delay={180}>
          <StatCard
            icon={<Flame size={20} />}
            label="Current streak"
            value={streakData ? `${streakData.current} days` : '—'}
            hint={streakData ? `Longest: ${streakData.longest}` : 'Start today'}
            loading={!streak}
            tone="warning"
          />
        </Reveal>
        <Reveal delay={260}>
          <StatCard
            icon={<FolderKanban size={20} />}
            label="Projects"
            value={isLoading ? '—' : String(profile?.projects?.length ?? 0)}
            hint="Showcase your work"
            loading={isLoading}
            tone="purple"
          />
        </Reveal>
        <Reveal delay={340}>
          <StatCard
            icon={<Users size={20} />}
            label="Connections"
            value={isLoading ? '—' : String(profile?.connection_count ?? 0)}
            hint="Grow your network"
            loading={isLoading}
            tone="teal"
          />
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        {/* Profile completeness + quick links */}
        <Reveal delay={420} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <h2 className="text-heading-3">Your profile</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="flex items-start gap-4">
                  <Avatar
                    src={profile?.avatar_url}
                    name={profile?.full_name ?? profile?.username}
                    size={64}
                    gradient={avatarGradient(profile?.username ?? 'dev')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-semibold text-label-primary">{profile?.full_name ?? profile?.username}</p>
                    <p className="truncate text-[15px] text-label-secondary mt-0.5">
                      {profile?.headline ?? 'Add a headline to stand out'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(profile?.skills ?? []).slice(0, 6).map((s: any) => (
                        <Badge key={s.id} tone="brand">
                          {s.skill?.name}
                        </Badge>
                      ))}
                      {!profile?.skills?.length && (
                        <span className="text-sm text-label-tertiary">No skills added yet</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-2">
                <Completeness profile={profile} loading={isLoading} />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/settings">
                  <Button variant="secondary" size="md">
                    Edit profile
                  </Button>
                </Link>
                <Link to={profile ? `/u/${profile.username}` : '#'}>
                  <Button variant="outline" size="md">
                    <Eye size={16} /> View public profile
                  </Button>
                </Link>
                <Link to="/ai">
                  <Button variant="outline" size="md" className="!border-apple-purple/30 !text-apple-purple hover:!bg-apple-purple/10">
                    <Lightbulb size={16} /> AI skill gap
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </Reveal>

        {/* Suggestions */}
        <Reveal delay={500}>
          <Card className="h-full">
            <CardHeader>
              <h2 className="text-heading-3">People to connect with</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {loadingSuggestions && (
                <>
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </>
              )}
              {!loadingSuggestions && !suggestions?.length && (
                <p className="py-4 text-sm text-label-secondary leading-relaxed">
                  Add skills to your profile to get matched with similar developers.
                </p>
              )}
              {(suggestions ?? []).slice(0, 4).map((person) => (
                <div key={person.id} className="flex items-center gap-3">
                  <Avatar
                    src={person.avatar_url}
                    name={person.full_name ?? person.username}
                    size={40}
                    gradient={avatarGradient(person.username)}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/u/${person.username}`} className="block truncate text-[15px] font-medium text-label-primary hover:text-apple-blue transition-colors">
                      {person.full_name ?? person.username}
                    </Link>
                    <p className="truncate text-[13px] text-label-tertiary">
                      {person.shared_skills ? `${person.shared_skills} shared skills` : person.headline ?? 'Developer'}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => void onConnect(person.id)}>
                    Connect
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </Reveal>
      </div>

      {/* Trending posts */}
      <Reveal delay={580} className="mt-8">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-heading-3">
              <TrendingUp size={20} className="text-apple-blue" /> Trending articles
            </h2>
            <Link to="/blog" className="text-sm font-medium text-apple-blue hover:text-apple-blue/80 transition-colors">
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {trending?.items?.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {trending.items.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group rounded-[18px] p-5 transition-all duration-fast"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border-soft)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg-strong)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-level-2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium text-label-tertiary">
                      <FileText size={14} /> {post.reading_time} min read · {post.views} views
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[17px] font-semibold text-label-primary group-hover:text-apple-blue transition-colors">{post.title}</h3>
                    <div className="mt-4 flex items-center gap-2.5">
                      <Avatar
                         src={post.author?.avatar_url}
                        name={post.author?.full_name ?? post.author?.username}
                        size={24}
                        gradient={avatarGradient(post.author?.username ?? 'dev')}
                      />
                      <span className="text-[13px] font-medium text-label-secondary">
                        {post.author?.full_name ?? post.author?.username} · <span className="text-label-tertiary font-normal">{formatDate(post.published_at)}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No articles yet"
                description="Be the first to publish a technical article."
                action={
                  <Link to="/blog/new">
                    <Button size="md">Write a post</Button>
                  </Link>
                }
              />
            )}
          </CardBody>
        </Card>
      </Reveal>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  loading?: boolean;
  tone: 'brand' | 'warning' | 'purple' | 'teal';
}) {
  const bgColors = {
    brand:   'bg-apple-blue/10 text-apple-blue',
    warning: 'bg-apple-orange/10 text-apple-orange',
    purple:  'bg-apple-purple/10 text-apple-purple',
    teal:    'bg-apple-teal/10 text-apple-teal',
  };

  return (
    <Card hover>
      <CardBody className="flex flex-col gap-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] ${bgColors[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium tracking-wide text-label-secondary">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="text-[28px] font-bold text-label-primary leading-tight mt-1">{value}</p>
          )}
          <p className="truncate text-[13px] text-label-tertiary mt-1">{hint}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function Completeness({ profile, loading }: { profile?: ProfileWithRelations | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-12" />;
  const checks = [
    Boolean(profile?.avatar_url),
    Boolean(profile?.headline),
    Boolean(profile?.bio && profile.bio.length > 20),
    Boolean(profile?.location),
    Boolean(profile?.skills?.length),
  ];
  const done = checks.filter(Boolean).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-[15px]">
        <span className="font-medium text-label-secondary">Profile completeness</span>
        <span className="font-semibold text-label-primary">{pct}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-apple-gray-5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-apple-blue to-apple-teal transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-label-secondary">
          <RefreshCw size={14} className="text-apple-blue" /> Complete your profile to rank higher in search.
        </p>
      )}
    </div>
  );
}
