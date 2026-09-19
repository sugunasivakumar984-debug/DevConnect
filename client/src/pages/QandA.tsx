import { useState } from 'react';
import { HelpCircle, MessageCircle, ThumbsUp, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuestions } from '../api/hooks';
import { Badge, Button, Card, CardBody, Chip, EmptyState, Input, Label, Modal, Skeleton, Textarea } from '../components/ui';
import { timeAgo } from '../lib/utils';
import { post } from '../lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../api/hooks';
import type { Question } from '@devconnect/shared';

const TAGS = ['javascript', 'react', 'python', 'database', 'career', 'devops'];

export default function QandA() {
  const [tag, setTag] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const { data, isLoading } = useQuestions(tag);
  const queryClient = useQueryClient();

  const onCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and question body are required');
      return;
    }
    try {
      await post('/questions', {
        title: form.title,
        body: form.body,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setOpen(false);
      setForm({ title: '', body: '', tags: '' });
      void queryClient.invalidateQueries({ queryKey: qk.questions });
      toast.success('Question posted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <HelpCircle size={22} /> Developer Q&amp;A
          </h1>
          <p className="text-sm text-slate-400">Ask questions, share answers, help the community.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Ask a question
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={!tag} onClick={() => setTag(undefined)}>
          All
        </Chip>
        {TAGS.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? undefined : t)}>
            #{t}
          </Chip>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {!isLoading && !data?.items?.length && (
        <EmptyState
          icon={<HelpCircle size={26} />}
          title="No questions yet"
          description="Ask the first question to get the conversation started."
        />
      )}

      <div className="space-y-3">
        {(data?.items as Question[] | undefined)?.map((q) => (
          <Card key={q.id} className="card-hover">
            <CardBody className="flex gap-4">
              <div className="flex w-14 shrink-0 flex-col items-center gap-1 text-center">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <ThumbsUp size={13} /> {q.votes}
                </span>
                <span className="text-xs text-slate-500">{q.answer_count} ans</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{q.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{q.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {q.tags?.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                  <span className="text-xs text-slate-500">
                    {q.author?.username ? `@${q.author.username}` : ''} · {timeAgo(q.created_at)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ask a question">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="A clear, specific question"
            />
          </div>
          <div>
            <Label>Details</Label>
            <Textarea
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What have you tried? Include code if relevant."
            />
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <Button onClick={() => void onCreate()} className="w-full">
            <MessageCircle size={15} /> Post question
          </Button>
        </div>
      </Modal>
    </div>
  );
}
