import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Image as ImageIcon, Code2, Link2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import type { EmojiReaction, FeedPost } from '@devconnect/shared';
import { EMOJI_REACTIONS } from '@devconnect/shared';
import { Avatar, Badge, Button } from '../ui';
import { avatarGradient, timeAgo, cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useCreateFeedPost, useDeleteFeedPost, useReactToFeedPost } from '../../api/hooks';

const REACTION_ICONS: Record<EmojiReaction, string> = {
  like: '👍',
  love: '❤️',
  celebrate: '🎉',
  insightful: '💡',
  funny: '😂',
};

export function FeedPostCard({ post }: { post: FeedPost }) {
  const currentUser = useAuthStore((s) => s.user);
  const react = useReactToFeedPost();
  const remove = useDeleteFeedPost();
  const [showReactions, setShowReactions] = useState(false);

  const isOwner = currentUser?.id === post.user_id;
  const myReaction = post.my_reaction ?? null;

  const onReact = async (reaction: EmojiReaction) => {
    setShowReactions(false);
    try {
      await react.mutateAsync({ id: post.id, reaction });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await remove.mutateAsync(post.id);
      toast.success('Post deleted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <article className="glass-card p-5 animate-fade-rise-sm">
      <header className="flex items-start gap-4">
        <Link to={post.author ? `/u/${post.author.username}` : '#'}>
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.full_name ?? post.author?.username}
            size={44}
            gradient={avatarGradient(post.author?.username ?? 'dev')}
          />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <Link
              to={post.author ? `/u/${post.author.username}` : '#'}
              className="truncate text-[15px] font-semibold text-label-primary hover:text-apple-blue transition-colors"
            >
              {post.author?.full_name ?? post.author?.username ?? 'Developer'}
            </Link>
            {post.visibility === 'connections' && <Badge tone="warning">Connections</Badge>}
          </div>
          <p className="truncate text-[13px] text-label-tertiary mt-0.5">
            {post.author?.headline ?? `@${post.author?.username ?? 'developer'}`} · {timeAgo(post.created_at)}
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded-full p-2 text-label-tertiary hover:bg-apple-red/10 hover:text-apple-red transition-colors"
            aria-label="Delete post"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {post.content && (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-label-secondary">{post.content}</p>
      )}

      {post.code_snippet && (
        <div className="mt-4 overflow-hidden rounded-[14px] border border-[rgba(0,0,0,0.06)] bg-[#1D1D1F]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">{post.code_language ?? 'Code'}</span>
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] text-white/90">
            <code>{post.code_snippet}</code>
          </pre>
        </div>
      )}

      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 flex items-center gap-2 text-[14px] font-medium text-apple-blue hover:underline"
        >
          <Link2 size={16} /> {post.link_url}
        </a>
      )}

      {post.media_urls?.length > 0 && (
        <div className={`mt-4 grid gap-2 overflow-hidden rounded-[16px] ${post.media_urls.length > 1 ? 'grid-cols-2' : ''}`}>
          {post.media_urls.slice(0, 4).map((url) => (
            <img key={url} src={url} alt="" loading="lazy" className="max-h-80 w-full object-cover border border-[rgba(0,0,0,0.06)]" />
          ))}
        </div>
      )}

      <footer className="mt-5 flex items-center gap-5 border-t border-[rgba(0,0,0,0.04)] pt-4 text-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactions((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors",
              myReaction ? "bg-apple-blue/10 text-apple-blue" : "hover:bg-apple-gray-6 text-label-secondary hover:text-label-primary"
            )}
          >
            <span>{myReaction ? REACTION_ICONS[myReaction] : <Heart size={16} />}</span>
            <span>{post.reaction_count || 'Like'}</span>
          </button>
          {showReactions && (
            <div className="absolute bottom-12 left-0 z-10 flex animate-fade-rise-sm gap-1.5 rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-xl p-2 shadow-level-2">
              {EMOJI_REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => void onReact(r)}
                  className="grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-black/5 hover:scale-110 transition-transform origin-bottom"
                  title={r}
                >
                  {REACTION_ICONS[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium text-label-secondary hover:bg-apple-gray-6 hover:text-label-primary transition-colors">
          <MessageCircle size={16} /> {post.comment_count || 'Comment'}
        </button>
      </footer>
    </article>
  );
}

export function FeedComposer() {
  const { profile } = useAuthStore();
  const [content, setContent] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [link, setLink] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const create = useCreateFeedPost();

  const submit = async () => {
    if (!content.trim()) {
      toast.error('Write something first');
      return;
    }
    try {
      await create.mutateAsync({
        content,
        code_snippet: showCode && code ? code : null,
        code_language: showCode ? language : null,
        link_url: showLink && link ? link : null,
      });
      setContent('');
      setCode('');
      setLink('');
      setShowCode(false);
      setShowLink(false);
      toast.success('Posted to your feed');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="glass-card p-5 overflow-hidden">
      <div className="flex gap-4">
        <Avatar
          src={profile?.avatar_url}
          name={profile?.full_name ?? profile?.username}
          size={44}
          gradient={avatarGradient(profile?.username ?? 'dev')}
        />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Share an update, a win, or something you learned…"
            className="w-full resize-none bg-transparent text-[16px] text-label-primary placeholder:text-label-tertiary focus:outline-none"
          />

          {showCode && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="language"
                className="h-9 w-32 rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-apple-gray-6 px-3 text-[13px] text-label-primary outline-none focus:border-apple-blue"
              />
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={5}
                placeholder="Paste your code…"
                className="w-full rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-apple-gray-6 p-4 font-mono text-[13px] text-label-primary outline-none focus:border-apple-blue"
              />
            </div>
          )}

          {showLink && (
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="mt-3 h-10 w-full rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-apple-gray-6 px-4 text-[14px] text-label-primary outline-none focus:border-apple-blue animate-fade-in"
            />
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.04)] pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className={cn(
                  "rounded-full p-2.5 transition-colors",
                  showCode ? "bg-apple-blue/10 text-apple-blue" : "text-label-tertiary hover:bg-apple-gray-6 hover:text-label-primary"
                )}
                title="Add code snippet"
              >
                <Code2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowLink((v) => !v)}
                className={cn(
                  "rounded-full p-2.5 transition-colors",
                  showLink ? "bg-apple-blue/10 text-apple-blue" : "text-label-tertiary hover:bg-apple-gray-6 hover:text-label-primary"
                )}
                title="Add link"
              >
                <Link2 size={18} />
              </button>
              <span className="rounded-full p-2.5 text-label-tertiary/50 cursor-not-allowed" title="Image upload coming from profile media">
                <ImageIcon size={18} />
              </span>
            </div>
            <Button size="md" onClick={() => void submit()} loading={create.isPending} className="!rounded-full px-5">
              <Send size={16} /> Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
