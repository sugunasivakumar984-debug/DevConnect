import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarkNotificationsRead, useNotifications } from '../api/hooks';
import { Avatar, Badge, Button, Card, CardBody, EmptyState, Skeleton } from '../components/ui';
import { avatarGradient, timeAgo } from '../lib/utils';
import type { Notification } from '@devconnect/shared';

const LABELS: Record<string, string> = {
  connection_request: 'sent you a connection request',
  connection_accepted: 'accepted your connection request',
  endorsement: 'endorsed your skill',
  like: 'liked your post',
  comment: 'commented on your post',
  message: 'sent you a message',
  follow: 'started following you',
  group_invite: 'invited you to a group',
  mention: 'mentioned you',
  system: 'New notification',
};

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const items = (data?.items ?? []).filter((n: Notification) => !unreadOnly || !n.read);

  const onMarkAll = async () => {
    try {
      await markRead.mutateAsync();
      toast.success('All notifications marked read');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell size={21} /> Notifications
          {data?.unread_count ? <Badge tone="danger">{data.unread_count} new</Badge> : null}
        </h1>
        <div className="flex gap-2">
          <Button variant={unreadOnly ? 'primary' : 'outline'} size="sm" onClick={() => setUnreadOnly((v) => !v)}>
            Unread only
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void onMarkAll()}>
            <Check size={14} /> Mark all read
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {!isLoading && !items.length && (
        <EmptyState
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description="Activity on your profile, posts and connections shows up here."
        />
      )}

      <div className="space-y-2">
        {items.map((n: Notification) => (
          <Card key={n.id} className={n.read ? 'opacity-70' : 'border-brand-500/20'}>
            <CardBody className="flex items-center gap-3">
              {n.actor ? (
                <Avatar
                  src={n.actor.avatar_url}
                  name={n.actor.full_name ?? n.actor.username}
                  size={36}
                  gradient={avatarGradient(n.actor.username)}
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/15 text-brand-300">
                  <Bell size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">
                  {n.actor && (
                    <Link to={`/u/${n.actor.username}`} className="font-medium hover:text-brand-300">
                      {n.actor.full_name ?? n.actor.username}{' '}
                    </Link>
                  )}
                  {LABELS[n.type] ?? LABELS.system}
                </p>
                <p className="text-xs text-slate-500">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => void markRead.mutateAsync([n.id])}
                  className="rounded-md p-1.5 text-slate-500 hover:text-emerald-400"
                  title="Mark as read"
                >
                  <X size={14} />
                </button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
