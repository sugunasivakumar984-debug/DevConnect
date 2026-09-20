import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Mail, Lock, AtSign, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Button, Input, Label, Reveal } from '../components/ui';
import { post } from '../lib/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,32}$/.test(form.username)) {
      toast.error('Username must be 3–32 characters: lowercase letters, numbers or underscores.');
      return;
    }
    setLoading(true);
    try {
      try {
        await post('/auth/register', form);
      } catch (apiErr) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { username: form.username, full_name: form.full_name } },
        });
        if (error) throw error;
        toast.success('Account created — check your email to verify.');
        navigate('/login');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        toast.success('Account created. Please sign in.');
        navigate('/login');
        return;
      }
      toast.success('Welcome to DevConnect!');
      navigate('/dashboard');
    } catch (err) {
      toast.error((err as Error).message || 'Could not create account');
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
      toast.error((err as Error).message || 'GitHub sign-up unavailable');
      setGithubLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 py-12 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="animate-drift absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 85% 50%, rgba(0,122,255,0.07), transparent 50%),' +
              'radial-gradient(circle at 15% 30%, rgba(175,82,222,0.07), transparent 50%)',
          }}
        />
        <div
          className="animate-drift-alt absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(52,199,89,0.05), transparent 50%)',
          }}
        />
      </div>

      <Reveal className="w-full max-w-[420px] relative z-10">
        <div className="mb-10 flex flex-col items-center justify-center gap-4">
          <Link to="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
            <img src="/Logo.png" alt="DevConnect Logo" className="h-[80px] w-auto object-contain scale-125" />
          </Link>
          <h1 className="text-heading-2 text-center tracking-tight">Create your account</h1>
          <p className="text-[15px] text-label-secondary text-center max-w-[280px]">Build your developer profile in under a minute.</p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full name</Label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input value={form.full_name} onChange={update('full_name')} placeholder="Ada Lovelace" className="pl-11 h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input
                  required
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                  placeholder="ada"
                  className="pl-11 h-12"
                />
              </div>
              <p className="mt-1.5 text-[12px] text-label-tertiary">Lowercase letters, numbers and underscores.</p>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" className="pl-11 h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 8 characters"
                  className="pl-11 h-12"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full text-[16px] rounded-full shadow-md hover:shadow-lg transition-all" loading={loading}>
                Create account
              </Button>
            </div>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[rgba(0,0,0,0.06)]" />
            <span className="text-[13px] font-semibold text-label-tertiary tracking-widest uppercase">OR</span>
            <div className="h-px flex-1 bg-[rgba(0,0,0,0.06)]" />
          </div>

          <Button variant="secondary" size="lg" className="w-full text-[16px] rounded-full hover:shadow-md transition-all" onClick={onGithub} loading={githubLoading}>
            <Github size={18} className="mr-1" /> Continue with GitHub
          </Button>

          <p className="mt-8 text-center text-[15px] text-label-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-apple-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
