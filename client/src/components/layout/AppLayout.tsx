import { Outlet, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import { Navbar, Sidebar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { NotificationToaster } from './NotificationToaster';
import { AiChatWidget } from '../ai/AiChatWidget';
import {
  Home, Users, FolderKanban, FileText, MessageSquare,
  Trophy, LayoutDashboard, Sparkles, X, Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileNavItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/feed',        icon: Home,             label: 'Feed' },
  { to: '/developers',  icon: Users,            label: 'People' },
  { to: '/messages',    icon: MessageSquare,    label: 'Messages' },
  { to: '/ai',          icon: Sparkles,         label: 'AI' },
];

/** Scroll-progress bar */
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const update = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = docH > 0 ? `${(window.scrollY / docH) * 100}%` : '0%';
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div ref={barRef} className="scroll-progress" style={{ width: '0%' }} aria-hidden />;
}

/** Ambient gradient background */
function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="animate-drift absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(0,122,255,0.06), transparent 60%),' +
            'radial-gradient(ellipse at bottom right, rgba(175,82,222,0.05), transparent 60%)',
        }}
      />
      <div
        className="animate-drift-alt absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(255,149,0,0.04), transparent 60%)' }}
      />
    </div>
  );
}

/** Mobile bottom navigation bar */
function MobileBottomNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const location = useLocation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around lg:hidden safe-area-pb"
      style={{
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderTop: '1px solid var(--separator)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {mobileNavItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-[12px] transition-all duration-[200ms]',
              active ? 'text-apple-blue' : 'text-label-tertiary'
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span className={cn('text-[10px] font-semibold', active ? 'opacity-100' : 'opacity-70')}>{label}</span>
          </Link>
        );
      })}
      {/* More / drawer trigger */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex flex-col items-center gap-0.5 px-3 py-2 text-label-tertiary rounded-[12px] transition-all"
      >
        <Menu size={22} strokeWidth={1.8} />
        <span className="text-[10px] font-semibold opacity-70">More</span>
      </button>
    </nav>
  );
}

/** Mobile drawer with full nav */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // close on backdrop click / escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const location = useLocation();

  const allItems = [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/feed',        icon: Home,             label: 'Feed' },
    { to: '/developers',  icon: Users,            label: 'Developers' },
    { to: '/projects',    icon: FolderKanban,     label: 'Projects' },
    { to: '/blog',        icon: FileText,         label: 'Blog' },
    { to: '/messages',    icon: MessageSquare,    label: 'Messages' },
    { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
    { to: '/ai',          icon: Sparkles,         label: 'AI Studio' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden transition-opacity duration-300', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderTop: '1px solid var(--glass-border)',
          borderRadius: '24px 24px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-label-quaternary" />
        </div>
        {/* Close */}
        <div className="flex items-center justify-between px-5 pb-3">
          <p className="text-[17px] font-bold text-label-primary">Navigation</p>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-label-secondary hover:bg-black/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2 px-4 pb-4">
          {allItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-[16px] px-4 py-3.5 text-[15px] font-medium transition-all duration-[200ms]',
                  active
                    ? 'bg-apple-blue/10 text-apple-blue'
                    : 'text-label-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

/** Main authenticated app shell */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <AmbientBackground />
      <ScrollProgress />

      <div className="relative z-10">
        <Navbar />

        {/* Content: sidebar + main */}
        <div className="mx-auto flex w-full max-w-screen-2xl">
          {/* Desktop sidebar — hidden on mobile/tablet */}
          <Sidebar />

          {/* Main content — responsive padding */}
          <main
            className={[
              'min-h-[calc(100vh-64px)] w-full min-w-0',
              'px-4 py-4',
              'sm:px-5 sm:py-5',
              'md:px-6 md:py-6',
              'xl:px-8 xl:py-8',
              // bottom padding on mobile to clear the bottom nav bar
              'pb-24 lg:pb-8',
            ].join(' ')}
          >
            <div className="page-enter mx-auto w-full max-w-5xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <CommandPalette />
      <NotificationToaster />
      <AiChatWidget />

      {/* Apple-style toasts */}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 76, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            background:           'rgba(255,255,255,0.88)',
            backdropFilter:       'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            color:                '#1D1D1F',
            border:               '1px solid rgba(0,0,0,0.08)',
            borderRadius:         '16px',
            boxShadow:            '0 12px 32px rgba(0,0,0,0.08)',
            padding:              '12px 16px',
            fontSize:             '14px',
            fontWeight:           500,
            maxWidth:             '360px',
          },
          success: { iconTheme: { primary: '#34C759', secondary: 'white' } },
          error:   { iconTheme: { primary: '#FF3B30', secondary: 'white' } },
        }}
      />
    </div>
  );
}
