import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heart, Bookmark, ArrowLeft, MessageCircle, Eye, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddComment, useComments, useLikePost, usePost } from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Badge, Button, Card, CardBody, EmptyState, Skeleton, Textarea } from '../components/ui';
import { avatarGradient, formatDate, timeAgo } from '../lib/utils';
import { post as apiPost } from '../lib/axios';
import type { Comment } from '@devconnect/shared';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = usePost(slug);
  const { data: comments } = useComments(post?.id);
  const like = useLikePost();
  const addComment = useAddComment(post?.id ?? '');
  const [comment, setComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !post) {
    return <EmptyState title="Post not found" description="It may have been unpublished." />;
  }

  const onLike = async () => {
    try {
      await like.mutateAsync(post.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onBookmark = async () => {
    try {
      const result = await apiPost<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`);
      setBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? 'Saved to reading list' : 'Removed from reading list');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({ content: comment });
      setComment('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={15} /> Back to blog
      </Link>

      <article>
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Avatar
              src={post.author?.avatar_url}
              name={post.author?.full_name ?? post.author?.username}
              size={32}
              gradient={avatarGradient(post.author?.username ?? 'dev')}
            />
            <div>
              <Link to={`/u/${post.author?.username}`} className="font-medium text-slate-200 hover:text-brand-300">
                {post.author?.full_name ?? post.author?.username}
              </Link>
              <p className="text-xs">{formatDate(post.published_at ?? post.created_at)}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {post.reading_time} min read
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> {post.views}
          </span>
        </div>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt="" className="mt-6 w-full rounded-xl border border-slate-800" />
        )}

        <div className="prose-devconnect mt-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t: any) => (
              <Badge key={t} tone="brand">
                #{t}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 border-y border-slate-800 py-4">
          <Button variant={post.my_reaction ? 'primary' : 'outline'} size="sm" onClick={() => void onLike()}>
            <Heart size={15} /> {post.like_count} {post.my_reaction ? 'Liked' : 'Like'}
          </Button>
          <Button variant={bookmarked ? 'primary' : 'outline'} size="sm" onClick={() => void onBookmark()}>
            <Bookmark size={15} /> Save
          </Button>
        </div>
      </article>

      {/* Comments */}
      <Card>
        <CardBody className="space-y-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageCircle size={17} /> Comments ({post.comment_count})
          </h2>

          {user ? (
            <div className="space-y-2">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts…"
              />
              <Button size="sm" onClick={() => void onComment()} loading={addComment.isPending}>
                <Send size={14} /> Post comment
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              <Link to="/login" className="text-brand-400 hover:text-brand-300">
                Sign in
              </Link>{' '}
              to join the discussion.
            </p>
          )}

          <div className="space-y-4">
            {(comments ?? []).map((c) => (
              <CommentThread key={c.id} comment={c} />
            ))}
            {!comments?.length && <p className="text-sm text-slate-500">No comments yet — be the first.</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function CommentThread({ comment }: { comment: Comment }) {
  return (
    <div>
      <div className="flex gap-3">
        <Avatar
          src={comment.author?.avatar_url}
          name={comment.author?.full_name ?? comment.author?.username}
          size={32}
          gradient={avatarGradient(comment.author?.username ?? 'dev')}
        />
        <div className="min-w-0 flex-1 rounded-lg bg-slate-800/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author?.full_name ?? comment.author?.username}</span>
            <span className="text-xs text-slate-500">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{comment.content}</p>
        </div>
      </div>
      {comment.replies?.length ? (
        <div className="ml-11 mt-3 space-y-3 border-l border-slate-800 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
