import { useState } from 'react';
import { Users, Plus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateGroup, useGroups, useJoinGroup } from '../api/hooks';
import { Badge, Button, Card, CardBody, EmptyState, Input, Label, Modal, Skeleton, Textarea } from '../components/ui';
import type { Group } from '@devconnect/shared';

export default function Groups() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_private: false });

  const { data, isLoading } = useGroups(query);
  const create = useCreateGroup();
  const join = useJoinGroup();

  const onCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    try {
      await create.mutateAsync(form);
      setOpen(false);
      setForm({ name: '', description: '', is_private: false });
      toast.success('Group created');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-sm text-slate-400">Communities built around shared interests.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New group
        </Button>
      </div>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups…" className="max-w-sm" />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!isLoading && !data?.items?.length && (
        <EmptyState
          icon={<Users size={26} />}
          title="No groups found"
          description="Create the first community for your niche."
          action={<Button size="sm" onClick={() => setOpen(true)}>Create a group</Button>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.items as Group[] | undefined)?.map((group) => (
          <Card key={group.id} className="card-hover">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 font-semibold text-white">
                  {group.name[0]?.toUpperCase()}
                </span>
                <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-xs text-slate-500">/{group.slug}</p>
                </div>
                {group.is_private && <Badge tone="warning">Private</Badge>}
              </div>
              <p className="line-clamp-2 text-sm text-slate-400">{group.description ?? 'No description.'}</p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  void join
                    .mutateAsync(group.id)
                    .then(() => toast.success('Joined group'))
                    .catch((err: Error) => toast.error(err.message))
                }
              >
                <LogIn size={14} /> Join group
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a group">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900"
            />
            Private group (members only)
          </label>
          <Button onClick={() => void onCreate()} loading={create.isPending} className="w-full">
            Create group
          </Button>
        </div>
      </Modal>
    </div>
  );
}
