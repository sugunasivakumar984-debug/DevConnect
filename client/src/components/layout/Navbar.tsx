import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Home,
  Users,
  FolderKanban,
  FileText,
  MessageSquare,
  Search,
  Trophy,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  LogOut,
  Sparkles,
  Settings,
  Command as CommandIcon,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useNotifications } from '../../api/hooks';
import { Avatar, Button } from '../ui';
import { avatarGradient, cn } from '../../lib/utils';


const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/feed',        label: 'Feed',         icon: Home },
  { to: '/developers',  label: 'Developers',   icon: Search },
  { to: '/projects',    label: 'Projects',     icon: FolderKanban },
  { to: '/blog',        label: 'Blog',         icon: FileText },
  { to: '/connections', label: 'Connections',  icon: Users },
  { to: '/messages',    label: 'Messages',     icon: MessageSquare },
  { to: '/groups',      label: 'Groups',       icon: Users },
  { to: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
];

export function Navbar() {
  const navigate               = useNavigate();
  const location               = useLocation();
  const { profile, user, signOut } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, toggleCommandPalette, theme, setTheme } = useUiStore();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [bellRing, setBellRing]   = useState(false);
  const prevUnread = useRef(0);
  const menuRef    = useRef<HTMLDivElement>(null);

  const { data: notifications } = useNotifications(Boolean(user));
  const unread = notifications?.unread_count ?? 0;

  /* Close menus on route change */
  useEffect(() => {
    setMenuOpen(false);
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  /* Navbar scroll blur */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Bell swing on new notification */
  useEffect(() => {
    if (unread > prevUnread.current) {
      setBellRing(true);
      setTimeout(() => setBellRing(false), 700);
    }
    prevUnread.current = unread;
  }, [unread]);

  /* Click-outside to close avatar menu */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const ThemeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;

  return (
    <>
      {/* ── Sticky glass navbar ───────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-40 glass-nav transition-all duration-[300ms] ease-apple',
          scrolled
            ? 'shadow-level-2'
            : 'shadow-none'
        )}
        style={{
          backdropFilter:         scrolled ? 'blur(32px) saturate(200%)' : 'blur(20px) saturate(180%)',
          WebkitBackdropFilter:   scrolled ? 'blur(32px) saturate(200%)' : 'blur(20px) saturate(180%)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Left section */}
          <div className="flex flex-1 items-center justify-start gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              className={cn(
                'rounded-xl p-2 text-label-tertiary lg:hidden',
                'hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.07)] hover:text-label-primary',
                'active:scale-90 transition-all duration-fast ease-apple'
              )}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center select-none"
            >
              <img src="/Logo.png" alt="DevConnect Logo" className="h-[60px] w-auto object-contain" style={{ transform: 'scale(1.15)', transformOrigin: 'left center' }} />
            </Link>
          </div>

          {/* Center section: Search */}
          <div className="flex flex-1 items-center justify-center px-4">
            <button
              type="button"
              onClick={toggleCommandPalette}
              className={[
                'hidden items-center justify-between md:flex w-full max-w-[460px]',
                'h-10 rounded-[12px] px-4 text-[14px] font-medium text-label-secondary',
                'transition-all duration-[250ms] ease-apple will-change-transform',
                'hover:text-label-primary hover:scale-[1.01]',
                'active:scale-[0.98] active:opacity-80'
              ].join(' ')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--separator)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-70" />
                <span>Search DevConnect...</span>
              </div>
              <kbd
                className="flex items-center gap-0.5 rounded-[6px] px-2 py-0.5 text-[11px] font-bold text-label-tertiary"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
              >
                <CommandIcon size={12} /> K
              </kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex flex-1 items-center justify-end gap-1">

            {/* Notification bell */}
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className={cn(
                'relative rounded-xl p-2 text-label-secondary',
                'hover:bg-black/[0.05] hover:text-label-primary',
                'active:scale-90 transition-all duration-fast ease-apple'
              )}
              aria-label="Notifications"
            >
              <Bell
                size={20}
                className={cn(bellRing && 'animate-bell-swing')}
              />
              {unread > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-apple-red px-1 text-[10px] font-bold text-white"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* AI */}
            <Link
              to="/ai"
              className={cn(
                'rounded-xl p-2 text-label-secondary',
                'hover:bg-apple-purple/8 hover:text-apple-purple',
                'active:scale-90 transition-all duration-fast ease-apple'
              )}
              aria-label="AI assistant"
            >
              <Sparkles size={20} />
            </Link>

            {/* Avatar + dropdown */}
            <div ref={menuRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  'flex items-center gap-2 rounded-xl p-1',
                  'hover:bg-black/[0.05]',
                  'active:scale-95 transition-all duration-fast ease-apple'
                )}
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.full_name ?? profile?.username}
                  size={32}
                  gradient={avatarGradient(profile?.username ?? 'dev')}
                />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 overflow-hidden animate-modal-in"
                  style={{
                    background:          'var(--glass-bg-strong)',
                    backdropFilter:      'blur(40px) saturate(200%)',
                    WebkitBackdropFilter:'blur(40px) saturate(200%)',
                    border:              '1px solid var(--glass-border)',
                    borderRadius:        '20px',
                    boxShadow:           'var(--shadow-modal)',
                  }}
                >
                  <div
                    className="px-4 py-3.5"
                    style={{ borderBottom: '1px solid var(--glass-border-soft)' }}
                  >
                    <p className="truncate text-sm font-semibold text-label-primary">
                      {profile?.full_name ?? 'Developer'}
                    </p>
                    <p className="truncate text-xs text-label-tertiary mt-0.5">
                      @{profile?.username ?? '—'}
                    </p>
                  </div>

                  <nav className="p-2 space-y-0.5">
                    <MenuItem to={profile ? `/u/${profile.username}` : '/'} label="View profile" />
                    <MenuItem to="/dashboard" label="Dashboard" />
                    <MenuItem to="/settings"  label="Settings" icon={<Settings size={15} />} />

                    <button
                      type="button"
                      onClick={() => setTheme(nextTheme)}
                      className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm text-label-secondary hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.07)] hover:text-label-primary transition-all duration-fast ease-apple"
                    >
                      <ThemeIcon size={15} className={theme === 'dark' ? 'text-apple-orange' : theme === 'light' ? 'text-apple-purple' : 'text-label-tertiary'} />
                      {theme === 'dark' ? 'Light mode' : theme === 'light' ? 'System mode' : 'Dark mode'}
                    </button>

                    <div
                      className="my-1 h-px"
                      style={{ background: 'var(--glass-border-soft)' }}
                    />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm text-apple-red hover:bg-[rgba(255,59,48,0.08)] dark:hover:bg-[rgba(255,59,48,0.12)] transition-all duration-fast ease-apple"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar drawer ─────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <nav
            className="absolute left-0 top-0 h-full w-[280px] overflow-y-auto p-4"
            style={{
              background:          'var(--glass-bg-strong)',
              backdropFilter:      'blur(40px) saturate(200%)',
              WebkitBackdropFilter:'blur(40px) saturate(200%)',
              borderRight:         '1px solid var(--glass-border-soft)',
              animation:           'fadeRise 350ms cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <img src="/Logo.png" alt="DevConnect Logo" className="h-12 w-auto object-contain scale-110 origin-left" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-1.5 text-label-tertiary hover:bg-black/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-0.5">
              {navItems.map((item, i) => (
                <SidebarLink
                  key={item.to}
                  {...item}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function MenuItem({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 rounded-[12px] px-3 py-2.5',
        'text-sm text-label-secondary',
        'hover:bg-black/[0.05] hover:text-label-primary',
        'transition-all duration-fast ease-apple'
      )}
    >
      {icon}
      {label}
      <ChevronRight size={14} className="ml-auto text-label-quaternary" />
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside
      className="sticky top-16 hidden h-[calc(100vh-64px)] w-[240px] shrink-0 lg:block xl:w-[260px]"
      style={{ padding: '12px 10px' }}
    >
      {/* Floating glass panel with scrollbar */}
      <div
        className="flex h-full flex-col rounded-[22px] overflow-y-auto overscroll-contain scroll-smooth"
        style={{
          background:          'var(--glass-bg)',
          backdropFilter:      'blur(30px) saturate(180%)',
          WebkitBackdropFilter:'blur(30px) saturate(180%)',
          border:              '1px solid var(--glass-border)',
          boxShadow:           'var(--shadow-glass)',
          scrollbarWidth:      'thin',
          scrollbarColor:      'rgba(0,0,0,0.15) transparent',
        }}
      >
        <nav className="space-y-0.5 p-3">
          {navItems.map((item, i) => (
            <SidebarLink key={item.to} {...item} style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </nav>

        {/* AI assistant promo card */}
        <div
          className="mx-3 mb-3 mt-1 rounded-[16px] p-4 shrink-0"
          style={{ background: 'rgba(175,82,222,0.08)', border: '1px solid rgba(175,82,222,0.15)' }}
        >
          <p className="flex items-center gap-2 text-[13px] font-semibold text-apple-purple">
            <Sparkles size={14} /> AI Assistant
          </p>
          <p className="mt-1 text-xs text-label-tertiary leading-relaxed">
            Generate bios, review code, find skill gaps and more.
          </p>
          <Link to="/ai" className="mt-3 block">
            <Button size="sm" className="w-full">
              Open assistant
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function SidebarLink({
  to,
  label,
  icon: Icon,
  onClick,
  style,
}: {
  to:      string;
  label:   string;
  icon:    LucideIcon;
  onClick?: () => void;
  style?:  React.CSSProperties;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={style}
      className={({ isActive }) =>
        cn('sidebar-item animate-fade-rise-sm', isActive && 'active')
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}
