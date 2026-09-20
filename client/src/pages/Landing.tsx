import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Code2, Users, Sparkles, FileText, Trophy, MessageSquare, Github, Zap, Shield, Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const features = [
  {
    icon: Code2,
    title: 'Project showcase',
    body: 'Publish projects with screenshots, tech stacks and live links. Track views and collaborator requests.',
    color: '#007AFF',
    bg:    'rgba(0,122,255,0.08)',
  },
  {
    icon: Users,
    title: 'Real connections',
    body: 'Send connection requests, follow developers, and discover people who share your stack.',
    color: '#34C759',
    bg:    'rgba(52,199,89,0.08)',
  },
  {
    icon: FileText,
    title: 'Technical blog',
    body: 'Markdown editor with live preview, syntax highlighting, tags, reading time and SEO metadata.',
    color: '#FF9500',
    bg:    'rgba(255,149,0,0.08)',
  },
  {
    icon: Sparkles,
    title: '12 AI features',
    body: 'Profile summaries, skill-gap analysis, code review, resume generation and more.',
    color: '#AF52DE',
    bg:    'rgba(175,82,222,0.08)',
  },
  {
    icon: MessageSquare,
    title: 'Realtime messaging',
    body: 'Direct messages with typing indicators, read receipts and online presence.',
    color: '#5AC8FA',
    bg:    'rgba(90,200,250,0.08)',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    body: 'Developer score, badges, streaks and leaderboards that reward consistent contribution.',
    color: '#FF9500',
    bg:    'rgba(255,149,0,0.08)',
  },
];

const stats = [
  { label: 'Features', value: '50+' },
  { label: 'AI tools', value: '12' },
  { label: 'Real-time', value: '✓' },
  { label: 'Free',     value: '∞' },
];

/** Animates headline letter by letter */
function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animation: `fadeRise 600ms cubic-bezier(0.25,0.46,0.45,0.94) ${100 + i * 28}ms both`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

/** Floating glass mockup of the app */
function GlassMockup() {
  return (
    <div
      className="animate-float mx-auto mt-16 max-w-2xl"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 40%',
      }}
    >
      <div
        className="relative overflow-hidden rounded-[28px]"
        style={{
          background:          'rgba(255,255,255,0.65)',
          backdropFilter:      'blur(40px) saturate(200%)',
          WebkitBackdropFilter:'blur(40px) saturate(200%)',
          border:              '1px solid rgba(255,255,255,0.85)',
          boxShadow:           '0 32px 80px rgba(0,122,255,0.15), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          transform:           'rotateX(4deg) rotateY(-2deg)',
        }}
      >
        {/* Mock header bar */}
        <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] px-5 py-4">
          <div className="h-3 w-3 rounded-full bg-apple-red/70" />
          <div className="h-3 w-3 rounded-full bg-apple-orange/70" />
          <div className="h-3 w-3 rounded-full bg-apple-green/70" />
          <div className="ml-4 h-5 flex-1 rounded-full bg-[rgba(0,0,0,0.04)]" />
        </div>
        {/* Mock content rows */}
        <div className="p-5 space-y-3">
          {[90, 70, 80, 55, 75].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${['#007AFF','#34C759','#AF52DE','#FF9500','#5AC8FA'][i]} 0%, #fff 200%)`, opacity: 0.7 }}
              />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded-full bg-[rgba(0,0,0,0.07)]" style={{ width: `${w}%` }} />
                <div className="h-2 rounded-full bg-[rgba(0,0,0,0.04)]" style={{ width: `${w * 0.65}%` }} />
              </div>
              <div
                className="h-6 rounded-full px-3 flex items-center text-[11px] font-semibold"
                style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF', whiteSpace: 'nowrap' }}
              >
                {['Connect','Following','Endorse','View','Message'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const session = useAuthStore(s => s.session);
  const { theme, setTheme } = useUiStore();
  
  const nextTheme = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;

  const featuresRef = useRef<HTMLDivElement>(null);

  // Scroll-reveal for feature cards
  useEffect(() => {
    const cards = featuresRef.current?.querySelectorAll('.feature-card');
    if (!cards) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0) scale(1)';
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  // Redirect if logged in
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-bg-primary text-label-primary transition-colors duration-300"
    >
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="animate-drift absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top,    rgba(0,122,255,0.08), transparent 55%),' +
              'radial-gradient(ellipse at bottom right, rgba(175,82,222,0.07), transparent 55%)',
          }}
        />
        <div
          className="animate-drift-alt absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at bottom left, rgba(255,149,0,0.05), transparent 55%)',
          }}
        />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header
        className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center select-none">
            <img src="/Logo.png" alt="DevConnect Logo" className="h-[44px] w-auto object-contain scale-110 origin-left drop-shadow-md" />
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setTheme(nextTheme)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-label-secondary hover:text-label-primary transition-all"
            aria-label="Toggle theme"
          >
            <ThemeIcon size={18} />
          </button>
          
          <Link
            to="/blog"
            className="hidden text-[15px] font-medium text-label-secondary hover:text-label-primary transition-colors sm:block px-2"
          >
            Blog
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-8 text-center">
        {/* Eyebrow chip */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-8 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-label-secondary"
          style={{
            animation:  'fadeRise 600ms 80ms both',
          }}
        >
          <Sparkles size={14} className="text-apple-blue" />
          The professional network for developers
        </div>

        {/* Main headline */}
        <h1
          className="text-display mb-6"
          style={{ animation: 'none' }}
        >
          <AnimatedHeadline text="Where developers" className="block" />
          <AnimatedHeadline
            text="connect."
            className="block bg-clip-text text-transparent"
          />
        </h1>
        {/* Gradient on "connect." */}
        <style>{`
          h1 span:last-child span {
            background: linear-gradient(135deg, #007AFF 0%, #AF52DE 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>

        <p
          className="mx-auto max-w-2xl text-[19px] text-label-secondary leading-relaxed mb-10"
          style={{ animation: 'fadeRise 600ms 400ms both' }}
        >
          Showcase projects, publish technical articles, get endorsed for your skills,
          and find your next collaborator — all in one beautiful place.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap items-center justify-center gap-4"
          style={{ animation: 'fadeRise 600ms 550ms both' }}
        >
          <Link to="/register">
            <button
              className="btn-apple-primary h-14 px-8 text-[17px] rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Create your profile <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/developers">
            <button className="btn-apple-glass h-14 px-8 text-[17px] rounded-full hover:shadow-md transition-all">
              Explore developers
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-8"
          style={{ animation: 'fadeRise 600ms 700ms both' }}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold tracking-[-0.02em]" style={{ color: '#007AFF' }}>
                {s.value}
              </div>
              <div className="text-sm text-label-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Glass Mockup ───────────────────────────────────── */}
      <div
        className="relative z-10"
        style={{ animation: 'fadeRise 800ms 800ms both' }}
      >
        <GlassMockup />
      </div>

      {/* ── Features grid ──────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2
            className="text-heading-1 mb-4"
            style={{ animation: 'none' }}
          >
            Everything you need
          </h2>
          <p className="text-[17px] text-label-secondary max-w-xl mx-auto">
            One platform for your entire developer journey.
          </p>
        </div>

        <div ref={featuresRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feature-card glass-card p-7 cursor-default"
              style={{
                opacity:    0,
                transform:  'translateY(24px) scale(0.98)',
                transition: `opacity 600ms ease, transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)`,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div
                className="mb-5 inline-flex items-center justify-center rounded-[16px] p-3"
                style={{ background: f.bg, color: f.color }}
              >
                <f.icon size={22} strokeWidth={1.75} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
              <p className="text-[15px] text-label-secondary leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <div
          className="glass-card p-14 text-center border border-black/5 dark:border-white/10"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-6 bg-apple-blue/10 text-apple-blue"
          >
            <Zap size={14} /> Free forever
          </div>
          <h2 className="text-heading-1 mb-4">
            Your work deserves a better portfolio
          </h2>
          <p className="text-[17px] text-label-secondary max-w-lg mx-auto mb-8">
            Join developers who use DevConnect to learn in public, earn endorsements and grow their network.
          </p>
          <Link to="/register">
            <button className="btn-apple-primary h-14 px-10 text-[17px] rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Get started — it&apos;s free <ArrowRight size={18} />
            </button>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-label-tertiary">
            <Shield size={14} /> No credit card required
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-10 relative z-10 border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-label-tertiary sm:flex-row">
          <p>© {new Date().getFullYear()} DevConnect</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 hover:text-label-primary transition-colors"
          >
            <Github size={15} /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
