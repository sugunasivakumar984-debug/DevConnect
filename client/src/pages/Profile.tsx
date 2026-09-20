import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  Globe,
  Github,
  Briefcase,
  GraduationCap,
  Award,
  MessageSquare,
  UserPlus,
  Trophy,
  FolderKanban,
  BadgeCheck,
  ThumbsUp,
  Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useEndorseSkill,
  useEndorsements,
  useProfile,
  useSendConnectionRequest,
  useStartConversation,
  useToggleFollow,
  useDevScore,
} from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Skeleton, Reveal } from '../components/ui';
import { avatarGradient, availabilityLabel, formatDate, mentorLabel, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import DeveloperPlatforms from '../components/profile/DeveloperPlatforms';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: profileData, isLoading, isError } = useProfile(username);
  const profile = profileData as any;
  const { data: endorsements } = useEndorsements(profile?.id);
  const { data: score } = useDevScore(profile?.id);
  const currentUser = useAuthStore((s) => s.user);

  const sendRequest = useSendConnectionRequest();
  const startConversation = useStartConversation();
  const toggleFollow = useToggleFollow();
  const endorse = useEndorseSkill();
  const [tab, setTab] = useState<'projects' | 'experience' | 'about' | 'developer'>('projects');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-[400px] rounded-card" />
      </div>
    );
  }

  if (isError || !profile) {
    return <EmptyState title="Developer not found" description="This profile may have been removed." />;
  }

  const isSelf = currentUser?.id === profile.id;
  const endorsementMap = new Map((endorsements ?? []).map((e: any) => [e.skill.id, e]));

  const onConnect = async () => {
    try {
      await sendRequest.mutateAsync({ addressee_id: profile.id });
      toast.success('Connection request sent');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onMessage = async () => {
    try {
      const conversation = await startConversation.mutateAsync(profile.id);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onEndorse = async (skillId: string) => {
    try {
      await endorse.mutateAsync({ endorsed_id: profile.id, skill_id: skillId });
      toast.success('Skill endorsed');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* ── Hero Card ──────────────────────────────────────── */}
      <Reveal>
        <Card className="overflow-hidden !p-0">
          <div
            className="h-40 w-full transition-colors duration-700"
            style={{
              background: `linear-gradient(135deg, rgba(0,122,255,0.15) 0%, rgba(175,82,222,0.15) 100%)`,
            }}
          />
          <div className="px-6 pb-8 -mt-16 relative">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-5">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name ?? profile.username}
                  size={120}
                  gradient={avatarGradient(profile.username)}
                  className="ring-4 ring-white shadow-level-2 bg-white"
                />
                <div className="pb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-heading-2">{profile.full_name ?? profile.username}</h1>
                    {profile.role !== 'user' && <Badge tone="purple">{profile.role}</Badge>}
                  </div>
                  <p className="text-[17px] text-label-secondary mt-0.5">@{profile.username}</p>
                </div>
              </div>

              {!isSelf && (
                <div className="flex flex-wrap gap-2.5 pb-2">
                  <Button size="md" onClick={() => void onConnect()} loading={sendRequest.isPending}>
                    <UserPlus size={16} /> Connect
                  </Button>
                  <Button size="md" variant="secondary" onClick={() => void onMessage()}>
                    <MessageSquare size={16} /> Message
                  </Button>
                  <Button size="md" variant="outline" onClick={() => void toggleFollow.mutateAsync(profile.id)}>
                    Follow
                  </Button>
                </div>
              )}
              {isSelf && (
                <Link to="/settings" className="pb-2">
                  <Button size="md" variant="secondary">
                    Edit profile
                  </Button>
                </Link>
              )}
            </div>

            <p className="mt-5 text-[17px] text-label-primary leading-relaxed max-w-2xl">
              {profile.headline ?? 'Developer on DevConnect'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-[15px] font-medium text-label-secondary">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 text-apple-blue hover:underline"
                >
                  <Globe size={16} /> Website
                </a>
              )}
              {profile.github_username && (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 hover:text-label-primary transition-colors"
                >
                  <Github size={16} /> {profile.github_username}
                </a>
              )}
              <span className="flex items-center gap-1.5 text-apple-orange">
                <Trophy size={16} /> Score {score?.score ?? 0}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone={profile.availability === 'open_to_work' ? 'success' : 'default'}>
                {availabilityLabel(profile.availability)}
              </Badge>
              {profile.mentor_mode !== 'none' && <Badge tone="brand">{mentorLabel(profile.mentor_mode)}</Badge>}
              <Badge tone="default">
                {profile.connection_count ?? 0} connections · {profile.follower_count ?? 0} followers
              </Badge>
            </div>

            {profile.ai_summary && (
              <div className="mt-6 rounded-[16px] border border-apple-purple/15 bg-apple-purple/5 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-apple-purple">
                  <BadgeCheck size={16} /> AI-generated summary
                </p>
                <p className="text-[15px] text-label-secondary leading-relaxed">
                  {profile.ai_summary}
                </p>
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      {/* ── Skills & Endorsements ──────────────────────────── */}
      <Reveal delay={100}>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-heading-3">Skills</h2>
            <span className="text-[13px] text-label-tertiary">Connect to endorse</span>
          </CardHeader>
          <CardBody>
            {profile.skills?.length ? (
              <div className="flex flex-wrap gap-2.5">
                {profile.skills.map((s: any) => {
                  const count = (endorsementMap.get(s.skill_id) as any)?.count ?? s.endorsement_count ?? 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isSelf}
                      onClick={() => void onEndorse(s.skill_id)}
                      className={cn(
                        'group flex items-center gap-2 rounded-pill border border-[rgba(0,0,0,0.08)] bg-white/50 px-4 py-2',
                        'text-[15px] font-medium text-label-primary shadow-sm',
                        'transition-all duration-fast ease-apple',
                        'enabled:hover:border-apple-blue enabled:hover:bg-apple-blue/5 enabled:hover:-translate-y-px',
                        'disabled:cursor-default'
                      )}
                      title={isSelf ? undefined : `Endorse ${s.skill?.name}`}
                    >
                      <span>{s.skill?.name}</span>
                      <span
                        className={cn(
                          'flex items-center gap-1 text-[13px] font-semibold',
                          count > 0 ? 'text-apple-blue' : 'text-label-tertiary'
                        )}
                      >
                        <ThumbsUp size={14} className={count > 0 ? 'fill-apple-blue/20' : ''} /> {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[15px] text-label-secondary">No skills listed yet.</p>
            )}
          </CardBody>
        </Card>
      </Reveal>

      {/* ── Content Tabs ───────────────────────────────────── */}
      <Reveal delay={200}>
        <div className="flex gap-6 border-b border-[rgba(0,0,0,0.06)] px-2 overflow-x-auto">
          {(['projects', 'experience', 'about', 'developer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative pb-3 text-[15px] font-semibold capitalize transition-colors whitespace-nowrap flex items-center gap-1.5',
                tab === t ? 'text-label-primary' : 'text-label-tertiary hover:text-label-secondary'
              )}
            >
              {t === 'developer' && <Code2 size={14} className={tab === t ? 'text-apple-blue' : 'text-label-quaternary'} />}
              {t === 'developer' ? 'Developer' : t}
              {tab === t && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-label-primary rounded-t-full animate-fade-in" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'projects' && (
            <div className="grid gap-5 sm:grid-cols-2">
              {profile.projects?.length ? (
                profile.projects.map((project: any, i: number) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="group rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/40 p-5 transition-all duration-fast hover:bg-white hover:border-black/[0.12] hover:shadow-level-2 animate-fade-rise-sm"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {project.images?.[0] && (
                      <div className="mb-4 overflow-hidden rounded-[12px]">
                        <img
                          src={project.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-40 w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3 className="text-[17px] font-semibold text-label-primary group-hover:text-apple-blue transition-colors">{project.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[15px] text-label-secondary leading-relaxed">{project.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(project.tech_stack ?? []).slice(0, 4).map((t: any) => (
                        <Badge key={t} tone="default">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="sm:col-span-2">
                  <EmptyState
                    icon={<FolderKanban size={28} />}
                    title="No projects yet"
                    description={isSelf ? 'Add your first project from settings.' : 'This developer has not published projects.'}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'experience' && (
            <div className="space-y-4">
              {profile.experience?.length ? (
                profile.experience.map((exp: any) => (
                  <Card key={exp.id} className="animate-fade-rise-sm">
                    <CardBody className="flex gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-apple-gray-6 text-label-primary">
                        <Briefcase size={20} />
                      </span>
                      <div>
                        <p className="text-[17px] font-semibold text-label-primary">
                          {exp.role}
                        </p>
                        <p className="text-[15px] font-medium text-label-secondary mt-0.5">
                          {exp.company}
                        </p>
                        <p className="text-[13px] text-label-tertiary mt-1">
                          {formatDate(exp.start_date)} – {exp.current ? 'Present' : formatDate(exp.end_date)}
                        </p>
                        {exp.description && <p className="mt-3 text-[15px] text-label-secondary leading-relaxed">{exp.description}</p>}
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <EmptyState icon={<Briefcase size={28} />} title="No experience listed" />
              )}

              {profile.education?.length ? (
                <div className="mt-8 space-y-4">
                  <h3 className="text-heading-3 px-1 mb-2">Education</h3>
                  {profile.education.map((edu: any) => (
                    <Card key={edu.id} className="animate-fade-rise-sm">
                      <CardBody className="flex gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-apple-gray-6 text-label-primary">
                          <GraduationCap size={20} />
                        </span>
                        <div>
                          <p className="text-[17px] font-semibold text-label-primary">
                            {edu.school}
                          </p>
                          <p className="text-[15px] font-medium text-label-secondary mt-0.5">
                            {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : null}

              {profile.certifications?.length ? (
                <div className="mt-8 space-y-4">
                  <h3 className="text-heading-3 px-1 mb-2">Certifications</h3>
                  {profile.certifications.map((cert: any) => (
                    <Card key={cert.id} className="animate-fade-rise-sm">
                      <CardBody className="flex gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-apple-gray-6 text-label-primary">
                          <Award size={20} />
                        </span>
                        <div>
                          <p className="text-[17px] font-semibold text-label-primary">{cert.name}</p>
                          <p className="text-[15px] font-medium text-label-secondary mt-0.5">
                            {cert.issuer}
                          </p>
                          <p className="text-[13px] text-label-tertiary mt-1">
                            {formatDate(cert.date)}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {tab === 'about' && (
            <Card className="animate-fade-rise-sm">
              <CardBody className="space-y-8">
                <div>
                  <h3 className="text-heading-3 mb-3">Bio</h3>
                  <p className="whitespace-pre-wrap text-[16px] text-label-secondary leading-relaxed">
                    {profile.bio ?? 'No bio yet.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-heading-3 mb-3">Details</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex justify-between rounded-[16px] bg-apple-gray-6/50 px-5 py-4 border border-[rgba(0,0,0,0.04)]">
                      <dt className="text-[15px] font-medium text-label-secondary">Experience</dt>
                      <dd className="text-[15px] font-semibold text-label-primary">{profile.years_experience} years</dd>
                    </div>
                    <div className="flex justify-between rounded-[16px] bg-apple-gray-6/50 px-5 py-4 border border-[rgba(0,0,0,0.04)]">
                      <dt className="text-[15px] font-medium text-label-secondary">Member since</dt>
                      <dd className="text-[15px] font-semibold text-label-primary">{formatDate(profile.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </CardBody>
            </Card>
          )}

          {tab === 'developer' && (
            <div className="animate-fade-rise-sm">
              <DeveloperPlatforms profileId={profile.id} isSelf={isSelf} />
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
