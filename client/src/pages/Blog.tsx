import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, FileText, Heart, MessageCircle, Eye } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePosts } from '../api/hooks';
import { Avatar, Badge, Button, Card, CardBody, Chip, EmptyState, Input, Skeleton } from '../components/ui';
import { avatarGradient, formatDate } from '../lib/utils';

const TOP_TAGS = ['javascript', 'react', 'typescript', 'python', 'nodejs', 'supabase', 'career', 'ai'];

export default function Blog() {
  const { user } = useAuthStore();
  const [tag, setTag] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [mine, setMine] = useState(false);

  const { data, isLoading } = usePosts({
    ...(tag ? { tag } : {}),
    ...(query ? { q: query } : {}),
    ...(mine ? { mine: 'true' } : {}),
    pageSize: 12,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-slate-400">Technical writing from the community.</p>
        </div>
        {user && (
          <div className="flex gap-2">
            <Button variant={mine ? 'primary' : 'outline'} size="sm" onClick={() => setMine((v) => !v)}>
              {mine ? 'My posts' : 'Show mine'}
            </Button>
            <Link to="/blog/new">
              <Button size="sm">
                <PenLine size={15} /> Write
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="max-w-xs"
        />
        <Chip active={!tag} onClick={() => setTag(undefined)}>
          All
        </Chip>
        {TOP_TAGS.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? undefined : t)}>
            #{t}
          </Chip>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!isLoading && !data?.items?.length && (
        <EmptyState
          icon={<FileText size={28} />}
          title="No articles found"
          description={mine ? 'You have not written any posts yet.' : 'Try another tag or search term.'}
          action={
            user ? (
              <Link to="/blog/new">
                <Button size="sm">Write the first one</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="space-y-4">
        {data?.items?.map((post) => (
          <Card key={post.id} className="card-hover">
            <CardBody className="flex flex-col gap-4 sm:flex-row">
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="h-32 w-full rounded-lg object-cover sm:w-48"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {post.status !== 'published' && <Badge tone="warning">{post.status}</Badge>}
                  <span className="text-xs text-slate-500">{post.reading_time} min read</span>
                </div>
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="mt-1 line-clamp-2 text-lg font-semibold hover:text-brand-300">{post.title}</h2>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{post.excerpt ?? post.content.slice(0, 180)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={post.author?.avatar_url}
                      name={post.author?.full_name ?? post.author?.username}
                      size={22}
                      gradient={avatarGradient(post.author?.username ?? 'dev')}
                    />
                    <span className="text-xs text-slate-400">
                      {post.author?.full_name ?? post.author?.username} · {formatDate(post.published_at ?? post.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {post.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {post.views}
                    </span>
                  </div>
                </div>

                {post.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 4).map((t: any) => (
                      <Badge key={t}>#{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
