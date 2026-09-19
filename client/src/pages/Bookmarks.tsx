import { Link } from 'react-router-dom';
import { Bookmark, FolderKanban, FileText } from 'lucide-react';
import { useBookmarks } from '../api/hooks';
import { Card, CardBody, EmptyState, Skeleton } from '../components/ui';

interface BookmarkRow {
  id: string;
  target_type: 'post' | 'project';
  target_id: string;
  target?: { id: string; title: string; slug?: string; excerpt?: string; description?: string };
}

export default function Bookmarks() {
  const { data, isLoading } = useBookmarks();
  const rows = (data as BookmarkRow[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bookmark size={22} /> Reading list
        </h1>
        <p className="text-sm text-slate-400">Saved articles and projects.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {!isLoading && !rows.length && (
        <EmptyState
          icon={<Bookmark size={26} />}
          title="Nothing saved yet"
          description="Bookmark posts and projects to read or revisit later."
        />
      )}

      <div className="space-y-3">
        {rows.map((bm) => {
          const isPost = bm.target_type === 'post';
          const href = isPost && bm.target?.slug ? `/blog/${bm.target.slug}` : `/projects/${bm.target_id}`;
          return (
            <Link key={bm.id} to={href}>
              <Card className="card-hover">
                <CardBody className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
                    {isPost ? <FileText size={17} /> : <FolderKanban size={17} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{bm.target?.title ?? 'Saved item'}</p>
                    <p className="truncate text-sm text-slate-400">
                      {bm.target?.excerpt ?? bm.target?.description ?? ''}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
