import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Image as ImageIcon, Code2, Link2, Send, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { EmojiReaction, FeedPost } from '@devconnect/shared';
import { EMOJI_REACTIONS } from '@devconnect/shared';
import { Avatar, Badge, Button } from '../ui';
import { avatarGradient, timeAgo, cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useCreateFeedPost, useDeleteFeedPost, useReactToFeedPost } from '../../api/hooks';
import { supabase } from '../../lib/supabase';
import { FeedComments } from './FeedComments';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);

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

      {post.media_urls && post.media_urls.length > 0 && (
        <>
          <div 
            className="mt-4 overflow-hidden rounded-[14px] border border-[rgba(0,0,0,0.06)] cursor-pointer hover:opacity-90 transition-opacity bg-black/5"
            onClick={() => setIsFullscreen(true)}
          >
            <img src={post.media_urls[0]} alt="Post media" className="w-full object-contain max-h-[300px]" />
          </div>

          {isFullscreen && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
              onClick={() => setIsFullscreen(false)}
            >
              <button 
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              >
                <X size={24} />
              </button>
              <img 
                src={post.media_urls[0]} 
                alt="Post media fullscreen" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
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

        <button 
          onClick={() => setShowComments(v => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors",
            showComments ? "bg-apple-gray-6 text-label-primary" : "text-label-secondary hover:bg-apple-gray-6 hover:text-label-primary"
          )}
        >
          <MessageCircle size={16} /> {post.comment_count || 'Comment'}
        </button>
      </footer>

      {showComments && <FeedComments postId={post.id} />}
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
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useCreateFeedPost();

  const submit = async () => {
    if (!content.trim()) {
      toast.error('Write something first');
      return;
    }
    try {
      await create.mutateAsync({
        content,
        media_urls: mediaUrl ? [mediaUrl] : [],
        code_snippet: showCode && code ? code : null,
        code_language: showCode ? language : null,
        link_url: showLink && link ? link : null,
      });
      setContent('');
      setCode('');
      setLink('');
      setShowCode(false);
      setShowLink(false);
      setMediaUrl(null);
      toast.success('Posted to your feed');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile) {
      toast.error('You must be logged in');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `feed_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `${profile.id}/${filename}`;

      const { error } = await supabase.storage.from('blog-images').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

          {mediaUrl && (
            <div className="mt-3 relative inline-block animate-fade-in">
              <img src={mediaUrl} alt="Upload preview" className="h-32 w-auto rounded-lg object-cover border border-[rgba(0,0,0,0.1)]" />
              <button
                type="button"
                onClick={() => setMediaUrl(null)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-[rgba(0,0,0,0.06)] hover:bg-apple-gray-6"
                title="Remove image"
              >
                <X size={14} className="text-label-secondary" />
              </button>
            </div>
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !!mediaUrl}
                className={cn(
                  "rounded-full p-2.5 transition-colors",
                  mediaUrl ? "bg-apple-blue/10 text-apple-blue" : "text-label-tertiary hover:bg-apple-gray-6 hover:text-label-primary disabled:opacity-50 cursor-pointer"
                )}
                title="Add image"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />
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
