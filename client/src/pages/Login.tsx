import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Github, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Button, Input, Label, Reveal } from '../components/ui';
import { post } from '../lib/axios';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      try {
        const session = await post<{ access_token: string; refresh_token: string }>('/auth/login', {
          email,
          password,
        });
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      } catch {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  const onGithub = async () => {
    setGithubLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message || 'GitHub sign-in unavailable');
      setGithubLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="animate-drift absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 50%, rgba(0,122,255,0.08), transparent 50%),' +
              'radial-gradient(circle at 85% 30%, rgba(175,82,222,0.08), transparent 50%)',
          }}
        />
        <div
          className="animate-drift-alt absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(90,200,250,0.06), transparent 50%)',
          }}
        />
      </div>

      <Reveal className="w-full max-w-[420px] relative z-10">
        <div className="mb-10 flex flex-col items-center justify-center gap-4">
          <Link to="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
            <img src="/Logo.png" alt="DevConnect Logo" className="h-[80px] w-auto object-contain scale-125" />
          </Link>
          <h1 className="text-heading-2 text-center tracking-tight">Sign in</h1>
          <p className="text-[15px] text-label-secondary text-center max-w-[280px]">Welcome back. Let's get you networking.</p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-11 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <Link to="/forgot-password" className="text-[13px] font-medium text-apple-blue hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 h-12"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full text-[16px] rounded-full shadow-md hover:shadow-lg transition-all" loading={loading}>
                Sign in
              </Button>
            </div>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'var(--glass-border-soft)' }} />
            <span className="text-[13px] font-semibold text-label-tertiary tracking-widest uppercase">OR</span>
            <div className="h-px flex-1" style={{ background: 'var(--glass-border-soft)' }} />
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full text-[16px] rounded-full hover:shadow-md transition-all"
            onClick={onGithub}
            loading={githubLoading}
          >
            <Github size={18} className="mr-1" /> Continue with GitHub
          </Button>

          <p className="mt-8 text-center text-[15px] text-label-secondary">
            New here?{' '}
            <Link to="/register" className="font-semibold text-apple-blue hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
