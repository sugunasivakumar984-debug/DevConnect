import { useState } from 'react';
import { Shield, Users, Flag, Activity, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminStats,
  useAdminUsers,
  useAuditLogs,
  useResolveReport,
  useAdminReports,
  useUpdateUserRole,
} from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from '../components/ui';
import { avatarGradient, timeAgo } from '../lib/utils';
import type { Profile, UserRole } from '@devconnect/shared';

type Tab = 'overview' | 'users' | 'reports' | 'audit';

export default function Admin() {
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');

  if (profile && profile.role === 'user') {
    return (
      <EmptyState
        icon={<Shield size={26} />}
        title="Admins only"
        description="You do not have permission to view the admin dashboard."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Shield size={22} /> Admin
        </h1>
        <p className="text-sm text-slate-400">Moderation, analytics and platform management.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {(
          [
            ['overview', 'Overview', BarChart3],
            ['users', 'Users', Users],
            ['reports', 'Reports', Flag],
            ['audit', 'Audit log', Activity],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'border-brand-500 text-brand-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <UsersTable />}
      {tab === 'reports' && <ReportsTable />}
      {tab === 'audit' && <AuditTable />}
    </div>
  );
}

function Overview() {
  const { data, isLoading } = useAdminStats();
  const entries: [string, number][] = data
    ? Object.entries(data).map(([k, v]) => [k.replace(/_/g, ' '), Number(v)])
    : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      {entries.map(([label, value]) => (
        <Card key={label}>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function UsersTable() {
  const { data, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();

  const onChangeRole = async (id: string, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success('Role updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Users ({data?.total ?? 0})</h2>
      </CardHeader>
      <CardBody className="space-y-2">
        {(data?.items as Profile[] | undefined)?.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
            <Avatar src={u.avatar_url} name={u.full_name ?? u.username} size={34} gradient={avatarGradient(u.username)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.full_name ?? u.username}</p>
              <p className="truncate text-xs text-slate-500">@{u.username}</p>
            </div>
            <select
              value={u.role}
              onChange={(e) => void onChangeRole(u.id, e.target.value as UserRole)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs"
            >
              <option value="user">user</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function ReportsTable() {
  const [status, setStatus] = useState<string | undefined>('open');
  const { data, isLoading } = useAdminReports(status);
  const resolve = useResolveReport();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['open', 'reviewing', 'resolved', 'dismissed', undefined].map((s) => (
          <Button key={s ?? 'all'} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)}>
            {s ?? 'all'}
          </Button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && !data?.items?.length && <EmptyState title="No reports" description="Nothing to moderate here." />}

      <div className="space-y-2">
        {(data?.items as Record<string, unknown>[] | undefined)?.map((r) => (
          <Card key={String(r.id)}>
            <CardBody className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone={r.status === 'open' ? 'danger' : 'default'}>{String(r.status)}</Badge>
                  <span className="text-xs text-slate-500">
                    {String(r.target_type)} · {timeAgo(String(r.created_at))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{String(r.reason)}</p>
                <p className="text-xs text-slate-500">target: {String(r.target_id)}</p>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      void resolve
                        .mutateAsync({ id: String(r.id), status: 'resolved' })
                        .then(() => toast.success('Resolved'))
                        .catch((err: Error) => toast.error(err.message))
                    }
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void resolve.mutateAsync({ id: String(r.id), status: 'dismissed' })}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditTable() {
  const { data, isLoading } = useAuditLogs();

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Audit log</h2>
      </CardHeader>
      <CardBody className="space-y-1.5">
        {(data?.items as Record<string, unknown>[] | undefined)?.map((log) => (
          <div key={String(log.id)} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2 text-sm">
            <span className="font-mono text-xs text-brand-300">{String(log.action)}</span>
            <span className="text-xs text-slate-500">
              {String((log.actor as { username?: string } | null)?.username ?? 'system')} ·{' '}
              {timeAgo(String(log.created_at))}
            </span>
          </div>
        ))}
        {!data?.items?.length && <p className="text-sm text-slate-500">No audit entries yet.</p>}
      </CardBody>
    </Card>
  );
}
