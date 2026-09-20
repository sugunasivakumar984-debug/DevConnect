import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  Home,
  FolderKanban,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
  Trophy,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
  keywords?: string;
}

/** ⌘K / Ctrl+K command palette. */
export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme } = useUiStore();
  const { signOut } = useAuthStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (commandPaletteOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [commandPaletteOpen, shouldRender]);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Go to Dashboard', icon: Home, run: () => navigate('/dashboard'), keywords: 'home overview' },
      { id: 'feed', label: 'Go to Feed', icon: Home, run: () => navigate('/feed'), keywords: 'timeline posts' },
      { id: 'developers', label: 'Search developers', icon: Search, run: () => navigate('/developers'), keywords: 'people find' },
      { id: 'projects', label: 'Browse projects', icon: FolderKanban, run: () => navigate('/projects'), keywords: 'showcase portfolio' },
      { id: 'blog', label: 'Read the blog', icon: FileText, run: () => navigate('/blog'), keywords: 'articles posts' },
      { id: 'connections', label: 'Manage connections', icon: Users, run: () => navigate('/connections'), keywords: 'network requests' },
      { id: 'messages', label: 'Open messages', icon: MessageSquare, run: () => navigate('/messages'), keywords: 'chat dm' },
      { id: 'groups', label: 'Browse groups', icon: Users, run: () => navigate('/groups'), keywords: 'communities' },
      { id: 'leaderboard', label: 'View leaderboard', icon: Trophy, run: () => navigate('/leaderboard'), keywords: 'ranking score' },
      { id: 'ai', label: 'Open AI assistant', icon: Sparkles, run: () => navigate('/ai'), keywords: 'generate summary chat' },
      { id: 'settings', label: 'Open settings', icon: Settings, run: () => navigate('/settings'), keywords: 'profile account' },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? Sun : Moon,
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        keywords: 'dark mode appearance',
      },
      {
        id: 'signout',
        label: 'Sign out',
        icon: Settings,
        run: () => {
          void signOut();
          navigate('/login');
        },
        keywords: 'logout exit',
      },
    ],
    [navigate, setTheme, signOut, theme]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!shouldRender) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      filtered[activeIndex].run();
      setCommandPaletteOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={() => setCommandPaletteOpen(false)}
      />
      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-[560px] overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Search row */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          <Search size={18} className="shrink-0 text-label-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands or navigate…"
            className="w-full bg-transparent text-[15px] text-label-primary placeholder:text-label-quaternary focus:outline-none"
          />
          <kbd
            className="shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold text-label-tertiary"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
            ESC
          </kbd>
        </div>
        {/* Results */}
        <ul className="max-h-72 overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-[14px] text-label-tertiary">
              No matching commands
            </li>
          )}
          {filtered.map((command, i) => (
            <li key={command.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  command.run();
                  setCommandPaletteOpen(false);
                  setQuery('');
                }}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium transition-all duration-fast ${
                  i === activeIndex
                    ? 'bg-apple-blue/10 text-apple-blue'
                    : 'text-label-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${i === activeIndex ? 'bg-apple-blue/15' : 'bg-black/[0.05] dark:bg-white/[0.06]'}`}>
                  <command.icon size={15} />
                </span>
                {command.label}
              </button>
            </li>
          ))}
        </ul>
        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[11px] text-label-quaternary"
          style={{ borderTop: '1px solid var(--separator)' }}
        >
          <span className="flex items-center gap-1"><kbd className="inline-block rounded px-1 py-0.5 font-mono text-[10px]" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="inline-block rounded px-1 py-0.5 font-mono text-[10px]" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>↵</kbd> select</span>
        </div>
      </div>
    </div>
  );
}
