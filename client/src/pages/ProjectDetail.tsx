import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Github, Eye, Users, ArrowLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeleteProject, useProject } from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Badge, Button, Card, CardBody, EmptyState, Skeleton } from '../components/ui';
import { avatarGradient, formatDate } from '../lib/utils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: projectData, isLoading, isError } = useProject(id);
  const project = projectData as any;
  const currentUser = useAuthStore((s) => s.user);
  const remove = useDeleteProject();

  if (isLoading) return <div className="mx-auto max-w-4xl"><Skeleton className="h-96" /></div>;
  if (isError || !project) {
    return <EmptyState title="Project not found" description="It may have been deleted." />;
  }

  const isOwner = currentUser?.id === project.user_id;

  const onCollaborate = async () => {
    try {
      toast.success('Collaboration request sent');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this project permanently?')) return;
    try {
      await remove.mutateAsync(project.id);
      toast.success('Project deleted');
      window.location.href = '/projects';
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <Card className="overflow-hidden">
        {project.images?.[0] && (
          <img src={project.images[0]} alt={project.title} className="max-h-80 w-full object-cover" />
        )}
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye size={14} /> {project.views} views
                </span>
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noreferrer noopener">
                  <Button variant="secondary" size="sm">
                    <Github size={15} /> Code
                  </Button>
                </a>
              )}
              {project.live_url && (
                <a href={project.live_url} target="_blank" rel="noreferrer noopener">
                  <Button size="sm">
                    <ExternalLink size={15} /> Live demo
                  </Button>
                </a>
              )}
              {!isOwner && currentUser && (
                <Button size="sm" variant="outline" onClick={() => void onCollaborate()}>
                  <Users size={15} /> Collaborate
                </Button>
              )}
              {isOwner && (
                <Button size="sm" variant="danger" onClick={() => void onDelete()}>
                  <Trash2 size={15} /> Delete
                </Button>
              )}
            </div>
          </div>

          <p className="whitespace-pre-wrap leading-relaxed text-slate-300">{project.description}</p>

          <div className="flex flex-wrap gap-2">
            {(project.tech_stack ?? []).map((t: any) => (
              <Badge key={t} tone="brand">
                {t}
              </Badge>
            ))}
          </div>

          {project.owner && (
            <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
              <Avatar
                src={project.owner.avatar_url}
                name={project.owner.full_name ?? project.owner.username}
                size={36}
                gradient={avatarGradient(project.owner.username)}
              />
              <div>
                <Link to={`/u/${project.owner.username}`} className="text-sm font-medium hover:text-brand-300">
                  {project.owner.full_name ?? project.owner.username}
                </Link>
                <p className="text-xs text-slate-500">Project owner</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {project.images?.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {project.images.slice(1).map((img: any) => (
            <img key={img} src={img} alt="" loading="lazy" className="rounded-xl border border-slate-800" />
          ))}
        </div>
      )}
    </div>
  );
}
