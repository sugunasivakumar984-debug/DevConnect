import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useSendTyping,
} from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Button, EmptyState, Skeleton } from '../components/ui';
import { avatarGradient, timeAgo } from '../lib/utils';
import { subscribeConversation } from '../lib/realtime';
import type { Conversation, Message } from '@devconnect/shared';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../api/hooks';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useConversations();
  const { data: messagePage, isLoading: loadingMessages } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId ?? '');
  const markRead = useMarkConversationRead(conversationId ?? '');
  const sendTyping = useSendTyping(conversationId ?? '');

  const [draft, setDraft] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => conversations?.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  // Realtime: new messages, typing and read receipts for the open conversation.
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeConversation(conversationId, {
      onMessage: () => {
        void queryClient.invalidateQueries({ queryKey: qk.messages(conversationId) });
        void queryClient.invalidateQueries({ queryKey: qk.conversations });
      },
      onTyping: (payload) => {
        if (payload.user_id !== user?.id) {
          setOtherTyping(payload.typing);
          if (payload.typing) setTimeout(() => setOtherTyping(false), 3000);
        }
      },
      onRead: () => void queryClient.invalidateQueries({ queryKey: qk.messages(conversationId) }),
    });
    return unsubscribe;
  }, [conversationId, queryClient, user?.id]);

  // Mark messages read when the conversation opens or a new message arrives.
  useEffect(() => {
    if (conversationId && active?.unread_count) {
      void markRead.mutateAsync().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, active?.unread_count]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagePage?.items?.length, otherTyping]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || !conversationId) return;
    setDraft('');
    try {
      await sendMessage.mutateAsync(content);
      void queryClient.invalidateQueries({ queryKey: qk.conversations });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto grid h-[calc(100vh-8rem)] max-w-6xl grid-cols-1 overflow-hidden rounded-xl border border-slate-800 lg:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <aside className={`overflow-y-auto border-r border-slate-800 ${conversationId ? 'hidden lg:block' : ''}`}>
        <div className="sticky top-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <h1 className="font-semibold">Messages</h1>
        </div>
        {isLoading && (
          <div className="space-y-2 p-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        )}
        {!isLoading && !conversations?.length && (
          <p className="p-6 text-center text-sm text-slate-500">
            No conversations yet. Message someone from their profile.
          </p>
        )}
        {conversations?.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            active={c.id === conversationId}
            onClick={() => navigate(`/messages/${c.id}`)}
          />
        ))}
      </aside>

      {/* Thread */}
      <section className={`flex flex-col ${conversationId ? '' : 'hidden lg:flex'}`}>
        {!conversationId ? (
          <div className="grid flex-1 place-items-center">
            <EmptyState
              icon={<MessageSquare size={28} />}
              title="Select a conversation"
              description="Choose a conversation on the left, or start a new one from a developer's profile."
            />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="rounded-md p-1 text-slate-400 hover:text-white lg:hidden"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              {active?.other_user && (
                <>
                  <Avatar
                    src={active.other_user.avatar_url}
                    name={active.other_user.full_name ?? active.other_user.username}
                    size={36}
                    gradient={avatarGradient(active.other_user.username)}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {active.other_user.full_name ?? active.other_user.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {otherTyping ? (
                        <span className="text-emerald-400">typing…</span>
                      ) : (
                        active.other_user.headline ?? `@${active.other_user.username}`
                      )}
                    </p>
                  </div>
                </>
              )}
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loadingMessages && <Skeleton className="h-32" />}
              {messagePage?.items?.map((m) => (
                <MessageBubble key={m.id} message={m} mine={m.sender_id === user?.id} />
              ))}
              {otherTyping && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Circle size={6} className="animate-pulse fill-current" /> typing…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800 p-3">
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  void sendTyping.mutateAsync(true).catch(() => undefined);
                }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void onSend())}
                placeholder="Write a message…"
                className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm focus:border-brand-500 focus:outline-none"
              />
              <Button size="icon" onClick={() => void onSend()} loading={sendMessage.isPending} aria-label="Send">
                <Send size={16} />
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const other = conversation.other_user;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-slate-800/60 px-4 py-3 text-left transition-colors ${
        active ? 'bg-brand-500/10' : 'hover:bg-slate-800/40'
      }`}
    >
      <Avatar
        src={other?.avatar_url}
        name={other?.full_name ?? other?.username}
        size={40}
        gradient={avatarGradient(other?.username ?? 'dev')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{other?.full_name ?? other?.username ?? 'Developer'}</span>
          {conversation.unread_count ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {conversation.unread_count}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(conversation.last_message_at)}</span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500">
          {conversation.last_message?.content ?? 'No messages yet'}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          mine ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-200'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-500'}`}>
          {timeAgo(message.created_at)}
          {mine && message.read_at ? ' · read' : ''}
        </p>
      </div>
    </div>
  );
}
