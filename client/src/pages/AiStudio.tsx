import { useState } from 'react';
import { Sparkles, User, FileText, Target, Code2, FileDown, MessageSquare, Tags, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAiBlogAssist,
  useAiChat,
  useAiCodeReview,
  useAiProfileSummary,
  useAiResume,
  useAiSkillGap,
} from '../api/hooks';
import { useCurrentProfile } from '../api/hooks';
import { Button, Card, CardBody, CardHeader, Input, Label, Select, Skeleton, Textarea } from '../components/ui';
import type { AiCodeReviewResult, AiSkillGapResult, AiBlogAssistResult } from '@devconnect/shared';

type Tab = 'summary' | 'skill-gap' | 'blog' | 'code' | 'resume' | 'chat';

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: 'summary',   label: 'Bio',         icon: User },
  { id: 'skill-gap', label: 'Skill Gap',   icon: Target },
  { id: 'blog',      label: 'Blog Assist', icon: FileText },
  { id: 'code',      label: 'Code Review', icon: Code2 },
  { id: 'resume',    label: 'Resume',      icon: FileDown },
  { id: 'chat',      label: 'Chat',        icon: MessageSquare },
];

export default function AiStudio() {
  const [tab, setTab] = useState<Tab>('summary');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="grid h-12 w-12 place-items-center rounded-[14px] text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #AF52DE 0%, #007AFF 100%)', boxShadow: '0 4px 16px rgba(175,82,222,0.35)' }}
        >
          <Sparkles size={22} />
        </span>
        <div>
          <h1 className="text-heading-2">AI Studio</h1>
          <p className="text-[14px] text-label-secondary mt-0.5">
            Powered by free AI models · 20 requests/hour · Cached results are free
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex flex-wrap gap-1 rounded-[16px] p-1"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--separator)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'flex items-center gap-2 rounded-[12px] px-4 py-2 text-[13px] font-semibold transition-all duration-[250ms] ease-apple',
              tab === t.id
                ? 'bg-white dark:bg-[#2C2C2E] text-label-primary shadow-level-1 scale-[1.02]'
                : 'text-label-secondary hover:text-label-primary hover:bg-white/50 dark:hover:bg-white/10',
            ].join(' ')}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary'   && <ProfileSummaryPanel />}
      {tab === 'skill-gap' && <SkillGapPanel />}
      {tab === 'blog'      && <BlogAssistPanel />}
      {tab === 'code'      && <CodeReviewPanel />}
      {tab === 'resume'    && <ResumePanel />}
      {tab === 'chat'      && <ChatPanel />}
    </div>
  );
}

function ProfileSummaryPanel() {
  const { data: profile, isLoading } = useCurrentProfile();
  const summary = useAiProfileSummary();
  const [result, setResult] = useState('');

  const generate = async () => {
    try {
      const res = await summary.mutateAsync({
        name: profile?.full_name ?? profile?.username,
        skills: profile?.skills?.map((s: any) => s.skill?.name ?? '').filter(Boolean),
        projects: profile?.projects?.map((p: any) => p.title),
        experience: profile?.experience?.map((e: any) => `${e.role} at ${e.company}`),
      });
      setResult(res.summary);
      toast.success('Bio generated!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-3">Professional bio generator</h2>
          <p className="text-[13px] text-label-tertiary mt-0.5">Uses your skills, projects, and experience</p>
        </div>
        <Button size="sm" onClick={() => void generate()} loading={summary.isPending}>
          <Sparkles size={14} /> Generate
        </Button>
      </CardHeader>
      <CardBody className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile?.skills ?? []).slice(0, 6).map((s: any) => (
              <span key={s.id} className="rounded-pill bg-apple-blue/10 text-apple-blue px-3 py-1 text-[12px] font-semibold">
                {s.skill?.name}
              </span>
            ))}
            {!profile?.skills?.length && (
              <p className="text-[14px] text-label-tertiary">Add skills in Settings to get a better bio.</p>
            )}
          </div>
        )}
        {result && (
          <div
            className="rounded-[16px] p-5 text-[15px] leading-relaxed text-label-primary"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--separator)' }}
          >
            {result}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function SkillGapPanel() {
  const { data: profile } = useCurrentProfile();
  const skillGap = useAiSkillGap();
  const [role, setRole] = useState('Full-Stack Developer');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState<AiSkillGapResult | null>(null);

  const analyse = async () => {
    const skills = profile?.skills?.map((s: any) => s.skill?.name ?? '').filter(Boolean) ?? [];
    if (!skills.length) { toast.error('Add skills to your profile first'); return; }
    try {
      const res = await skillGap.mutateAsync({ skills, role, location: location || undefined });
      setResult(res);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-heading-3">Skill gap analysis</h2>
        <p className="text-[13px] text-label-tertiary mt-0.5">Discover what skills you need for your target role</p>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </div>
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote, NYC, London…" />
          </div>
        </div>
        <Button onClick={() => void analyse()} loading={skillGap.isPending}>
          <Target size={15} /> Analyse my skills
        </Button>

        {result && (
          <div className="space-y-5 pt-2">
            <ResultSection title="Missing skills" color="text-apple-red">
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s) => (
                  <span key={s} className="rounded-pill bg-apple-red/10 text-apple-red px-3 py-1 text-[13px] font-medium">{s}</span>
                ))}
              </div>
            </ResultSection>
            <ResultSection title="Your strengths" color="text-apple-green">
              <div className="flex flex-wrap gap-2">
                {result.strengths.map((s) => (
                  <span key={s} className="rounded-pill bg-apple-green/10 text-apple-green px-3 py-1 text-[13px] font-medium">{s}</span>
                ))}
              </div>
            </ResultSection>
            <ResultSection title="Learning roadmap" color="text-apple-blue">
              <ol className="space-y-3">
                {result.roadmap.map((step) => (
                  <li key={step.step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue text-[12px] font-bold">{step.step}</span>
                    <div>
                      <p className="text-[14px] font-semibold text-label-primary">{step.title}</p>
                      <p className="text-[13px] text-label-secondary mt-0.5">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </ResultSection>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function BlogAssistPanel() {
  const assist = useAiBlogAssist();
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<AiBlogAssistResult | null>(null);

  const run = async () => {
    if (draft.trim().length < 50) { toast.error('Write at least a paragraph first'); return; }
    try { setResult(await assist.mutateAsync(draft)); }
    catch (err) { toast.error((err as Error).message); }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-heading-3">Blog assistant</h2>
        <p className="text-[13px] text-label-tertiary mt-0.5">Get title ideas, tags, grammar fixes, and an outline</p>
      </CardHeader>
      <CardBody className="space-y-4">
        <Textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Paste your blog draft here…" />
        <Button onClick={() => void run()} loading={assist.isPending}>
          <FileText size={15} /> Get suggestions
        </Button>

        {result && (
          <div className="space-y-5">
            <ResultSection title="Title ideas" color="text-apple-blue">
              <ul className="space-y-2">
                {result.titles.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-[14px] text-label-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-apple-blue shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </ResultSection>
            <ResultSection title="Suggested tags" color="text-apple-purple">
              <div className="flex flex-wrap gap-2">
                {result.tags.map((t) => (
                  <span key={t} className="rounded-pill border border-apple-purple/20 bg-apple-purple/10 text-apple-purple px-3 py-1 text-[12px] font-medium">#{t}</span>
                ))}
              </div>
            </ResultSection>
            <ResultSection title="Grammar & style" color="text-apple-orange">
              <ul className="space-y-2">
                {result.grammar_fixes.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-label-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-apple-orange shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </ResultSection>
            <ResultSection title="Improvement outline" color="text-apple-teal">
              <ol className="space-y-2">
                {result.outline.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-label-secondary">
                    <span className="text-apple-teal font-semibold shrink-0">{i + 1}.</span> {o}
                  </li>
                ))}
              </ol>
            </ResultSection>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CodeReviewPanel() {
  const review = useAiCodeReview();
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<AiCodeReviewResult | null>(null);

  const run = async () => {
    if (code.trim().length < 5) { toast.error('Paste some code to review'); return; }
    try { setResult(await review.mutateAsync({ language, code })); }
    catch (err) { toast.error((err as Error).message); }
  };

  const severityColor = (s: string) =>
    s === 'high' ? 'text-apple-red' : s === 'medium' ? 'text-apple-orange' : 'text-apple-green';

  return (
    <Card>
      <CardHeader>
        <h2 className="text-heading-3">Code review</h2>
        <p className="text-[13px] text-label-tertiary mt-0.5">Get instant AI-powered feedback on your code</p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="w-48">
          <Label>Language</Label>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
            <option value="c++">C++</option>
            <option value="sql">SQL</option>
          </Select>
        </div>
        <Textarea rows={10} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste code here…" className="font-mono text-[13px]" />
        <Button onClick={() => void run()} loading={review.isPending}>
          <Code2 size={15} /> Review code
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-[14px] px-4 py-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--separator)' }}>
              <span className="text-[14px] text-label-secondary">Overall severity:</span>
              <span className={`text-[14px] font-semibold ${severityColor(result.severity)}`}>{result.severity}</span>
            </div>
            <ResultSection title={`Issues (${result.issues.length})`} color="text-apple-red">
              {result.issues.length === 0 ? (
                <p className="text-[14px] text-apple-green">✓ No issues found — great code!</p>
              ) : (
                <ul className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-[12px] p-3" style={{ background: 'var(--bg-secondary)' }}>
                      <span className={`text-[11px] font-bold uppercase shrink-0 mt-0.5 ${severityColor(issue.severity)}`}>
                        {issue.severity}{issue.line ? ` L${issue.line}` : ''}
                      </span>
                      <span className="text-[13px] text-label-primary">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ResultSection>
            <ResultSection title="Suggestions" color="text-apple-blue">
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-label-secondary">
                    <span className="text-apple-blue font-semibold shrink-0">{i + 1}.</span> {s}
                  </li>
                ))}
              </ul>
            </ResultSection>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ResumePanel() {
  const resume = useAiResume();
  const [markdown, setMarkdown] = useState('');

  const generate = async () => {
    try {
      const res = await resume.mutateAsync();
      setMarkdown(res.markdown);
      toast.success('Resume generated!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resume.md'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-3">AI resume builder</h2>
          <p className="text-[13px] text-label-tertiary mt-0.5">One-page Markdown resume from your profile</p>
        </div>
        <div className="flex gap-2">
          {markdown && (
            <Button size="sm" variant="secondary" onClick={download}>Download .md</Button>
          )}
          <Button size="sm" onClick={() => void generate()} loading={resume.isPending}>
            <FileDown size={14} /> Generate
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {markdown ? (
          <pre
            className="max-h-[36rem] overflow-auto rounded-[16px] p-5 text-[13px] leading-relaxed text-label-primary font-mono whitespace-pre-wrap"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--separator)' }}
          >
            {markdown}
          </pre>
        ) : (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-apple-blue/10 text-apple-blue">
              <FileDown size={28} />
            </div>
            <p className="text-[15px] text-label-secondary max-w-sm">
              Generate a one-page resume from your profile — summary, skills, experience, projects and education.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ChatPanel() {
  const chat = useAiChat();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const send = async () => {
    const message = input.trim();
    if (!message) return;
    setInput('');
    const history = turns.slice(-6);
    setTurns((t) => [...t, { role: 'user', content: message }]);
    try {
      const res = await chat.mutateAsync({ message, history });
      setTurns((t) => [...t, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setTurns((t) => [...t, { role: 'assistant', content: `Error: ${(err as Error).message}` }]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-heading-3">AI chat assistant</h2>
        <p className="text-[13px] text-label-tertiary mt-0.5">Ask about code, architecture, career advice…</p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div
          className="min-h-[200px] max-h-96 space-y-3 overflow-y-auto rounded-[16px] p-4"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--separator)' }}
        >
          {!turns.length && (
            <p className="text-[14px] text-label-tertiary text-center pt-6">
              Ask anything — architecture questions, debugging help, career advice, or code examples.
            </p>
          )}
          {turns.map((t, i) => (
            <div
              key={i}
              className={[
                'max-w-[85%] whitespace-pre-wrap rounded-[14px] px-4 py-3 text-[14px] leading-relaxed',
                t.role === 'user'
                  ? 'ml-auto bg-apple-blue text-white'
                  : 'bg-white dark:bg-[#2C2C2E] text-label-primary shadow-level-1',
              ].join(' ')}
            >
              {t.content}
            </div>
          ))}
          {chat.isPending && (
            <div className="max-w-[85%] rounded-[14px] px-4 py-3 bg-white dark:bg-[#2C2C2E] shadow-level-1">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-label-tertiary animate-dot-bounce-1" />
                <span className="h-2 w-2 rounded-full bg-label-tertiary animate-dot-bounce-2" />
                <span className="h-2 w-2 rounded-full bg-label-tertiary animate-dot-bounce-3" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void send())}
            placeholder="Ask anything…"
          />
          <Button onClick={() => void send()} loading={chat.isPending} className="shrink-0">
            <Send size={16} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function ResultSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={`mb-3 flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase ${color}`}>
        <Tags size={13} /> {title}
      </h3>
      {children}
    </div>
  );
}
