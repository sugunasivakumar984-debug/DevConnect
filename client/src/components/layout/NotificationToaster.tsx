import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { subscribeNotifications } from '../../lib/realtime';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../../api/hooks';
import type { Notification } from '@devconnect/shared';

const MESSAGES: Record<string, (n: Notification) => string> = {
  connection_request: () => 'You have a new connection request',
  connection_accepted: () => 'Your connection request was accepted',
  endorsement: () => 'Someone endorsed your skill',
  like: () => 'Someone liked your post',
  comment: () => 'New comment on your post',
  message: () => 'New message',
  follow: () => 'You have a new follower',
  group_invite: () => 'You were invited to a group',
  mention: () => 'You were mentioned',
  system: () => 'New notification',
};

/**
 * Subscribes to the user's Realtime notification channel and surfaces a toast.
 * Mounted once inside the app shell.
 */
export function NotificationToaster() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeNotifications(user.id, (payload) => {
      const message = MESSAGES[payload.type]?.(payload) ?? 'New notification';
      toast(message, { icon: '🔔' });
      void queryClient.invalidateQueries({ queryKey: qk.notifications });
    });
    return unsubscribe;
  }, [user, queryClient]);

  return null;
}
