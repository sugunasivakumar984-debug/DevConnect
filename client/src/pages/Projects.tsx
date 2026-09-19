import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Eye, ExternalLink, Github, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookmarkProject, useCreateProject, useProjects } from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Badge, Button, Card, CardBody, EmptyState, Input, Label, Modal, Skeleton, Textarea } from '../components/ui';
import { avatarGradient } from '../lib/utils';
import { useAiProjectDescription } from '../api/hooks';

export default function Projects() {
  const { user, profile } = useAuthStore();
  const [techFilter, setTechFilter] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tech_stack: '', repo_url: '', live_url: '' });

  const { data, isLoading } = useProjects({
    ...(techFilter ? { tech: techFilter } : {}),
    ...(query ? { q: query } : {}),
    pageSize: 24,
  });
  const create = useCreateProject();
  const bookmark = useBookmarkProject();
  const aiDescription = useAiProjectDescription();

  const onCreate = async () => {
    if (!form.title || !form.description) {
      toast.error('Title and description are required');
      return;
    }
    try {
      await create.mutateAsync({
        title: form.title,
        description: form.description,
        tech_stack: form.tech_stack
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        repo_url: form.repo_url || null,
        live_url: form.live_url || null,
      });
      setOpen(false);
      setForm({ title: '', description: '', tech_stack: '', repo_url: '', live_url: '' });
      toast.success('Project published');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onAiDescribe = async () => {
    try {
      const result = await aiDescription.mutateAsync({
        repoUrl: form.repo_url || undefined,
        title: form.title || undefined,
        tech: form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setForm((f) => ({ ...f, description: result.description }));
      toast.success('Description generated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-slate-400">Discover what developers are building.</p>
        </div>
        {user && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New project
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects by title…"
          className="max-w-xs"
        />
        <Input
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          placeholder="Filter by tech (e.g. React)"
          className="max-w-xs"
        />
      </div>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {!isLoading && !data?.items?.length && (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects found"
          description="Try a different filter or publish the first one."
          action={user ? <Button size="sm" onClick={() => setOpen(true)}>Create a project</Button> : undefined}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items?.map((project) => (
          <Card key={project.id} className="card-hover overflow-hidden">
            {project.images?.[0] && (
              <img src={project.images[0]} alt={project.title} loading="lazy" className="h-40 w-full object-cover" />
            )}
            <CardBody>
              <Link to={`/projects/${project.id}`} className="block">
                <h3 className="line-clamp-1 font-semibold hover:text-brand-300">{project.title}</h3>
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(project.tech_stack ?? []).slice(0, 3).map((t: any) => (
                  <Badge key={t} tone="brand">
                    {t}
                  </Badge>
                ))}
                {(project.tech_stack ?? []).length > 3 && <Badge>+{project.tech_stack.length - 3}</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={project.owner?.avatar_url}
                    name={project.owner?.full_name ?? project.owner?.username}
                    size={22}
                    gradient={avatarGradient(project.owner?.username ?? 'dev')}
                  />
                  <span className="text-xs text-slate-400">@{project.owner?.username}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {project.views}
                  </span>
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noreferrer noopener" className="hover:text-slate-200">
                      <Github size={13} />
                    </a>
                  )}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer noopener" className="hover:text-slate-200">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {profile && project.user_id !== profile.id && (
                    <button
                      type="button"
                      onClick={() => void bookmark.mutateAsync(project.id)}
                      className="hover:text-brand-300"
                      aria-label="Bookmark"
                    >
                      <Bookmark size={13} />
                    </button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New project">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <button
                type="button"
                onClick={() => void onAiDescribe()}
                disabled={!form.repo_url && !form.title}
                className="mb-1.5 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-40"
              >
                ✨ Generate with AI
              </button>
            </div>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Tech stack (comma separated)</Label>
            <Input
              value={form.tech_stack}
              onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
              placeholder="React, TypeScript, Supabase"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Repository URL</Label>
              <Input value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} placeholder="https://github.com/…" />
            </div>
            <div>
              <Label>Live URL</Label>
              <Input value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          <Button onClick={() => void onCreate()} loading={create.isPending} className="w-full">
            Publish project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
