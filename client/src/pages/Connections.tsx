import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Users, MessageSquare, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useConnections,
  usePendingConnections,
  useRemoveConnection,
  useRespondToConnection,
  useConnectionSuggestions,
  useSendConnectionRequest,
  useStartConversation,
} from '../api/hooks';
import { Avatar, Badge, Button, Card, CardBody, EmptyState, Skeleton } from '../components/ui';
import { avatarGradient } from '../lib/utils';
import type { Connection, Profile } from '@devconnect/shared';

export default function Connections() {
  const [tab, setTab] = useState<'connections' | 'requests' | 'suggestions'>('connections');
  const { data: connections, isLoading } = useConnections();
  const { data: pending, isLoading: loadingPending } = usePendingConnections();
  const { data: suggestions, isLoading: loadingSuggestions } = useConnectionSuggestions();
  const respond = useRespondToConnection();
  const remove = useRemoveConnection();
  const send = useSendConnectionRequest();
  const startConversation = useStartConversation();
  const navigate = useNavigate();

  const onRespond = async (id: string, action: 'accept' | 'reject') => {
    try {
      await respond.mutateAsync({ id, action });
      toast.success(action === 'accept' ? 'Connection accepted' : 'Request declined');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onMessage = async (userId: string) => {
    try {
      const conversation = await startConversation.mutateAsync(userId);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const incoming = pending?.incoming ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connections</h1>
        <Badge tone="brand">
          <Users size={12} /> {connections?.length ?? 0} total
        </Badge>
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {(
          [
            ['connections', 'Your network'],
            ['requests', `Requests${incoming.length ? ` (${incoming.length})` : ''}`],
            ['suggestions', 'Suggestions'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'border-brand-500 text-brand-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'connections' && (
        <div className="space-y-3">
          {isLoading && <Skeleton className="h-64" />}
          {!isLoading && !connections?.length && (
            <EmptyState
              icon={<Users size={26} />}
              title="No connections yet"
              description="Find developers and send your first connection request."
              action={
                <Link to="/developers">
                  <Button size="sm">
                    <Search size={15} /> Find developers
                  </Button>
                </Link>
              }
            />
          )}
          {(connections as Connection[] | undefined)?.map((c) => {
            const other = c.requester ?? c.addressee;
            if (!other) return null;
            return (
              <Card key={c.id}>
                <CardBody className="flex items-center gap-3">
                  <Avatar
                    src={other.avatar_url}
                    name={other.full_name ?? other.username}
                    size={40}
                    gradient={avatarGradient(other.username)}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/u/${other.username}`} className="block truncate font-medium hover:text-brand-300">
                      {other.full_name ?? other.username}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{other.headline ?? `@${other.username}`}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => void onMessage(other.id)}>
                    <MessageSquare size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void remove.mutateAsync(c.id).then(() => toast.success('Connection removed'))}
                  >
                    <X size={14} />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {loadingPending && <Skeleton className="h-40" />}
          {!loadingPending && !incoming.length && (
            <EmptyState title="No pending requests" description="You're all caught up." />
          )}
          {(incoming as Connection[]).map((req) => {
            const person = req.requester;
            if (!person) return null;
            return (
              <Card key={req.id}>
                <CardBody className="flex items-center gap-3">
                  <Avatar
                    src={person.avatar_url}
                    name={person.full_name ?? person.username}
                    size={40}
                    gradient={avatarGradient(person.username)}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/u/${person.username}`} className="block truncate font-medium hover:text-brand-300">
                      {person.full_name ?? person.username}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{person.headline ?? `@${person.username}`}</p>
                  </div>
                  <Button size="sm" onClick={() => void onRespond(req.id, 'accept')}>
                    <Check size={14} /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void onRespond(req.id, 'reject')}>
                    <X size={14} />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {loadingSuggestions && <Skeleton className="h-40" />}
          {!loadingSuggestions && !suggestions?.length && (
            <EmptyState
              title="No suggestions yet"
              description="Add skills to your profile so we can match you with similar developers."
            />
          )}
          {(suggestions as (Profile & { shared_skills?: number })[] | undefined)?.map((person) => (
            <Card key={person.id}>
              <CardBody className="flex items-center gap-3">
                <Avatar
                  src={person.avatar_url}
                  name={person.full_name ?? person.username}
                  size={40}
                  gradient={avatarGradient(person.username)}
                />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${person.username}`} className="block truncate font-medium hover:text-brand-300">
                    {person.full_name ?? person.username}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {person.shared_skills ? `${person.shared_skills} shared skills` : person.headline ?? 'Developer'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    void send
                      .mutateAsync({ addressee_id: person.id })
                      .then(() => toast.success('Request sent'))
                      .catch((err: Error) => toast.error(err.message))
                  }
                >
                  <UserPlus size={14} /> Connect
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
