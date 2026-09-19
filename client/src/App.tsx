import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { useUiStore, applyTheme } from './stores/uiStore';
import { Spinner } from './components/ui';

// Route-level code splitting keeps the initial bundle small.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Feed = lazy(() => import('./pages/Feed'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPostPage = lazy(() => import('./pages/BlogPost'));
const BlogEditor = lazy(() => import('./pages/BlogEditor'));
const Developers = lazy(() => import('./pages/Developers'));
const Connections = lazy(() => import('./pages/Connections'));
const Messages = lazy(() => import('./pages/Messages'));
const Groups = lazy(() => import('./pages/Groups'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AiStudio = lazy(() => import('./pages/AiStudio'));
const Admin = lazy(() => import('./pages/Admin'));
const QandA = lazy(() => import('./pages/QandA'));
const Events = lazy(() => import('./pages/Events'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const NotFound = lazy(() => import('./pages/NotFound'));

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const theme = useUiStore((s) => s.theme);
  const accentColor = useUiStore((s) => s.accentColor);
  const fontSize = useUiStore((s) => s.fontSize);
  const compactMode = useUiStore((s) => s.compactMode);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    applyTheme(theme, accentColor, fontSize, compactMode);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme(theme, accentColor, fontSize, compactMode);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme, accentColor, fontSize, compactMode]);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Public marketing + auth */}
        <Route path="/" element={<Landing />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Public profile + blog read-only views live inside the app shell */}
        <Route element={<AppLayout />}>
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/questions" element={<QandA />} />
          <Route path="/events" element={<Events />} />
        </Route>

        {/* Authenticated app */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/blog/new" element={<BlogEditor />} />
            <Route path="/blog/:id/edit" element={<BlogEditor />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/ai" element={<AiStudio />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
