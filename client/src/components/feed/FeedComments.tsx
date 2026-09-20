import { useState } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { Avatar } from '../ui';
import { timeAgo, avatarGradient } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useFeedComments, useCreateFeedComment, useDeleteFeedComment } from '../../api/hooks';
import toast from 'react-hot-toast';

export function FeedComments({ postId }: { postId: string }) {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useFeedComments(postId);
  const create = useCreateFeedComment(postId);
  const remove = useDeleteFeedComment(postId);

  const [content, setContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    try {
      await create.mutateAsync(content.trim());
      setContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      setCommentToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-4 border-t border-[rgba(0,0,0,0.04)] pt-4 animate-fade-in">
      {/* Comment Input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-5">
          <Avatar
            src={user.user_metadata?.avatar_url}
            name={user.user_metadata?.full_name || 'User'}
            size={36}
            gradient={avatarGradient(user.id)}
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full rounded-full border border-[rgba(0,0,0,0.08)] bg-apple-gray-6 px-4 py-2 pr-12 text-[14px] text-label-primary outline-none focus:border-apple-blue/50 transition-all"
            />
            <button
              type="submit"
              disabled={!content.trim() || create.isPending}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-apple-blue text-white disabled:opacity-50 transition-opacity"
            >
              {create.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="-ml-0.5" />}
            </button>
          </div>
        </form>
      )}

      {/* Comment List */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-label-tertiary" /></div>
      ) : comments?.length === 0 ? (
        <p className="text-center text-[13px] text-label-tertiary pb-2">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar
                src={comment.author?.avatar_url}
                name={comment.author?.full_name || comment.author?.username || 'User'}
                size={36}
                gradient={avatarGradient(comment.author?.username || comment.id)}
              />
              <div className="flex-1">
                <div className="inline-block rounded-2xl rounded-tl-sm bg-black/5 px-4 py-2.5 max-w-[95%] relative">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-label-primary">
                      {comment.author?.full_name || comment.author?.username || 'Developer'}
                    </span>
                    <span className="text-[11px] text-label-tertiary">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-label-secondary whitespace-pre-wrap">{comment.content}</p>
                  
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => setCommentToDelete(comment.id)}
                      className="absolute -right-8 top-2 p-1.5 text-label-tertiary hover:text-apple-red hover:bg-apple-red/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setCommentToDelete(null)}>
          <div className="bg-[#1D1D1F] border border-white/10 rounded-2xl p-6 max-w-[360px] w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-2">Delete comment?</h3>
            <p className="text-[14px] text-white/60 mb-6">This action cannot be undone. Are you sure you want to permanently delete this comment?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCommentToDelete(null)}
                className="px-4 py-2 rounded-full text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => void handleDelete(commentToDelete)}
                disabled={remove.isPending}
                className="px-4 py-2 rounded-full text-[14px] font-medium bg-apple-red text-white hover:bg-apple-red/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {remove.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
