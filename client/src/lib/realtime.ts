import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { REALTIME_CHANNELS } from '@devconnect/shared';
import type { RealtimeEventName, RealtimeEvents } from '@devconnect/shared';

/**
 * Thin typed wrapper over Supabase Realtime. Each subscribe returns an
 * unsubscribe function so React effects can clean up in one line.
 */

type Handler<K extends RealtimeEventName> = (payload: RealtimeEvents[K]) => void;

function subscribeBroadcast<K extends RealtimeEventName>(
  channelName: string,
  event: K,
  handler: Handler<K>
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on('broadcast', { event }, (message) => handler(message.payload as RealtimeEvents[K]))
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Subscribe to the current user's notification channel. */
export function subscribeNotifications(userId: string, handler: Handler<'notification:new'>) {
  return subscribeBroadcast(REALTIME_CHANNELS.notifications(userId), 'notification:new', handler);
}

/** Subscribe to a conversation (messages, typing, read receipts). */
export function subscribeConversation(conversationId: string, handlers: {
  onMessage?: Handler<'message:new'>;
  onTyping?: Handler<'message:typing'>;
  onRead?: Handler<'message:read'>;
}) {
  const channel = supabase.channel(REALTIME_CHANNELS.conversation(conversationId));
  if (handlers.onMessage) {
    channel.on('broadcast', { event: 'message:new' }, (m) => handlers.onMessage!(m.payload as RealtimeEvents['message:new']));
  }
  if (handlers.onTyping) {
    channel.on('broadcast', { event: 'message:typing' }, (m) => handlers.onTyping!(m.payload as RealtimeEvents['message:typing']));
  }
  if (handlers.onRead) {
    channel.on('broadcast', { event: 'message:read' }, (m) => handlers.onRead!(m.payload as RealtimeEvents['message:read']));
  }
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Subscribe to new feed posts. */
export function subscribeFeed(handler: Handler<'feed:new'>) {
  return subscribeBroadcast(REALTIME_CHANNELS.feed, 'feed:new', handler);
}

/** Subscribe to a group's posts. */
export function subscribeGroup(groupId: string, handler: Handler<'group:post'>) {
  return subscribeBroadcast(REALTIME_CHANNELS.group(groupId), 'group:post', handler);
}

/** Subscribe to presence updates (who is online). */
export function subscribePresence(handler: Handler<'presence:update'>) {
  return subscribeBroadcast(REALTIME_CHANNELS.presence, 'presence:update', handler);
}

/** Join a live coding room and receive code sync events. */
export function joinRoom(roomId: string, handler: Handler<'room:code'>) {
  const channel = supabase
    .channel(REALTIME_CHANNELS.room(roomId), { config: { presence: { key: roomId } } })
    .on('broadcast', { event: 'room:code' }, (m) => handler(m.payload as RealtimeEvents['room:code']))
    .subscribe();
  return {
    broadcastCode: (code: string, userId: string) =>
      channel.send({ type: 'broadcast', event: 'room:code', payload: { room_id: roomId, code, user_id: userId } }),
    leave: () => void supabase.removeChannel(channel),
  };
}
