import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, Sparkles, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAiBlogAssist, useCreatePost, usePost, useUpdatePost } from '../api/hooks';
import { Button, Card, CardBody, Input, Label, Textarea } from '../components/ui';
import { readingTimeMinutes, slugify } from '@devconnect/shared';
import type { AiBlogAssistResult } from '@devconnect/shared';

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing } = usePost(id);
  const create = useCreatePost();
  const update = useUpdatePost();
  const assist = useAiBlogAssist();

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    seo_title: '',
    seo_description: '',
  });
  const [preview, setPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<AiBlogAssistResult | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        content: existing.content,
        excerpt: existing.excerpt ?? '',
        tags: (existing.tags ?? []).join(', '),
        seo_title: existing.seo_title ?? '',
        seo_description: existing.seo_description ?? '',
      });
    }
  }, [existing]);

  const payload = (status: 'draft' | 'published') => ({
    title: form.title,
    content: form.content,
    excerpt: form.excerpt || null,
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    status,
  });

  const save = async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('A title and body are required');
      return;
    }
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, ...payload(status) });
      } else {
        const created = await create.mutateAsync(payload(status));
        if (status === 'published' && (created as any).slug) {
          navigate(`/blog/${(created as any).slug}`);
          return;
        }
      }
      toast.success(status === 'published' ? 'Post published' : 'Draft saved');
      navigate('/blog');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onAssist = async () => {
    if (form.content.trim().length < 50) {
      toast.error('Write at least a paragraph before asking the AI.');
      return;
    }
    try {
      const result = await assist.mutateAsync(form.content);
      setSuggestions(result);
      toast.success('Suggestions ready');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="mb-1 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit post' : 'New post'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview((v) => !v)}>
            <Eye size={15} /> {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void onAssist()} loading={assist.isPending}>
            <Sparkles size={15} /> AI assist
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void save('draft')} loading={create.isPending || update.isPending}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => void save('published')}>
            <Save size={15} /> Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="A clear, specific title"
                />
                {form.title && (
                  <p className="mt-1 text-xs text-slate-500">Slug: /blog/{slugify(form.title)}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Body (Markdown)</Label>
                  <span className="mb-1.5 text-xs text-slate-500">
                    {readingTimeMinutes(form.content)} min read
                  </span>
                </div>
                {preview ? (
                  <div className="prose-devconnect min-h-64 rounded-lg border border-slate-800 p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '_Nothing to preview._'}</ReactMarkdown>
                  </div>
                ) : (
                  <Textarea
                    rows={18}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder={'# Heading\n\nWrite your article in Markdown…\n\n```ts\nconst hello = "world";\n```'}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="One-sentence summary shown in listings"
                />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="react, typescript, career"
                />
              </div>
              <div>
                <Label>SEO title</Label>
                <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
              </div>
              <div>
                <Label>SEO description</Label>
                <Textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                />
              </div>
            </CardBody>
          </Card>

          {suggestions && (
            <Card>
              <CardBody className="space-y-3 text-sm">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Sparkles size={15} className="text-brand-400" /> AI suggestions
                </h3>

                {suggestions.titles.length > 0 && (
                  <Suggestion title="Title ideas">
                    <ul className="list-disc space-y-1 pl-4 text-slate-300">
                      {suggestions.titles.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            className="text-left hover:text-brand-300"
                            onClick={() => setForm((f) => ({ ...f, title: t }))}
                          >
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Suggestion>
                )}

                {suggestions.tags.length > 0 && (
                  <Suggestion title="Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              tags: f.tags ? `${f.tags}, ${t}` : t,
                            }))
                          }
                          className="rounded-full border border-slate-700 px-2 py-0.5 text-xs hover:border-brand-500"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  </Suggestion>
                )}

                {suggestions.outline.length > 0 && (
                  <Suggestion title="Improvement outline">
                    <ol className="list-decimal space-y-1 pl-4 text-slate-300">
                      {suggestions.outline.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ol>
                  </Suggestion>
                )}

                {suggestions.grammar_fixes.length > 0 && (
                  <Suggestion title="Grammar & style">
                    <ul className="list-disc space-y-1 pl-4 text-slate-300">
                      {suggestions.grammar_fixes.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </Suggestion>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Suggestion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
