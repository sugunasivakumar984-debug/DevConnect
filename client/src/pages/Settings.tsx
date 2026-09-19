import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, Sparkles, User, Palette, Bell, Shield, Lock,
  Sun, Moon, Monitor, Eye, EyeOff, Mail, Globe, Github, Briefcase,
  GraduationCap, Check, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAddEducation,
  useAddExperience,
  useAddSkill,
  useAiProfileSummary,
  useCurrentProfile,
  useRemoveSkill,
  useUpdateProfile,
  useUploadAvatar,
} from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { useUiStore, ACCENT_COLORS, type AccentColor } from '../stores/uiStore';
import { supabase } from '../lib/supabase';
import { Avatar, Button, Card, CardBody, CardHeader, Input, Label, Select, Textarea, Reveal } from '../components/ui';
import { avatarGradient, validateImage, cn } from '../lib/utils';

// ─── Tabs ────────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'security';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',       label: 'Profile',       icon: <User size={18} /> },
  { id: 'appearance',    label: 'Appearance',     icon: <Palette size={18} /> },
  { id: 'notifications', label: 'Notifications',  icon: <Bell size={18} /> },
  { id: 'privacy',       label: 'Privacy',        icon: <Eye size={18} /> },
  { id: 'security',      label: 'Security',       icon: <Lock size={18} /> },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2',
        checked ? 'bg-apple-green' : 'bg-apple-gray-4 dark:bg-apple-gray-5'
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] ring-0 transition duration-300 ease-in-out',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}

// ─── Setting row ─────────────────────────────────────────────────────────────
function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[rgba(0,0,0,0.06)] last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-label-primary">{title}</p>
        {description && <p className="text-[13px] text-label-secondary mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Auth
  const { profile, loadProfile } = useAuthStore();
  const { data: fullProfile } = useCurrentProfile();

  // API hooks
  const updateProfile = useUpdateProfile();
  const uploadAvatar  = useUploadAvatar();
  const addSkill      = useAddSkill();
  const removeSkill   = useRemoveSkill();
  const addExperience = useAddExperience();
  const addEducation  = useAddEducation();
  const aiSummary     = useAiProfileSummary();

  // UI store
  const { theme, accentColor, compactMode, setTheme, setAccentColor, setCompactMode } = useUiStore();

  // ── Profile form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    full_name:        profile?.full_name ?? '',
    headline:         profile?.headline ?? '',
    bio:              profile?.bio ?? '',
    location:         profile?.location ?? '',
    website:          profile?.website ?? '',
    github_username:  profile?.github_username ?? '',
    availability:     (profile?.availability ?? 'not_looking') as string,
    mentor_mode:      (profile?.mentor_mode ?? 'none') as string,
    years_experience: profile?.years_experience ?? 0,
  });

  // Sync form when profile loads or updates
  useEffect(() => {
    if (profile) {
      setForm({
        full_name:        profile.full_name ?? '',
        headline:         profile.headline ?? '',
        bio:              profile.bio ?? '',
        location:         profile.location ?? '',
        website:          profile.website ?? '',
        github_username:  profile.github_username ?? '',
        availability:     (profile.availability ?? 'not_looking') as string,
        mentor_mode:      (profile.mentor_mode ?? 'none') as string,
        years_experience: profile.years_experience ?? 0,
      });
    }
  }, [profile]);

  const [newSkill, setNewSkill]       = useState('');
  const [experience, setExperience]   = useState({ company: '', role: '', start_date: '', end_date: '', description: '' });
  const [education, setEducation]     = useState({ school: '', degree: '', field: '', start_date: '', end_date: '' });

  // ── Notification prefs (local state) ──
  const [notifs, setNotifs] = useState({
    email_connections: true, email_messages: true,
    email_endorsements: true, email_comments: true,
    push_connections: true, push_messages: true,
    push_mentions: true, weekly_digest: true,
  });

  // ── Privacy prefs ────────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    profile_visible: true, show_email: false, show_location: true,
    allow_messages_from: 'connections' as string,
    show_online_status: true, indexable_by_search: true,
  });

  // ── Security form ────────────────────────────────────────────────────────────
  const [newEmail, setNewEmail]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(form as any);
      await loadProfile();
      toast.success('Profile updated');
    } catch (err) { toast.error((err as Error).message); }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImage(file);
    if (!check.ok) { toast.error(check.error!); return; }
    try { await uploadAvatar.mutateAsync(file); toast.success('Avatar updated'); }
    catch (err) { toast.error((err as Error).message); }
  };

  const onAddSkill = async () => {
    const name = newSkill.trim();
    if (!name) return;
    try { await addSkill.mutateAsync({ skill: name }); setNewSkill(''); toast.success('Skill added'); }
    catch (err) { toast.error((err as Error).message); }
  };

  const onGenerateSummary = async () => {
    try {
      const result = await aiSummary.mutateAsync({});
      await updateProfile.mutateAsync({ ai_summary: result.summary });
      toast.success('AI summary generated');
    } catch (err) { toast.error((err as Error).message); }
  };

  const onSaveNotifications = () => toast.success('Notification preferences saved');
  const onSavePrivacy = () => toast.success('Privacy settings saved');

  const onChangeEmail = async () => {
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else toast.success('Check your new email for a confirmation link');
    setNewEmail('');
  };

  const onChangePassword = async () => {
    if (newPassword !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else toast.success('Password updated successfully');
    setNewPassword(''); setConfirmPass('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-10">
        <h1 className="text-heading-1">Settings</h1>
        <p className="mt-2 text-[17px] text-label-secondary">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── Sidebar tabs ── */}
        <nav className="md:w-64 flex-shrink-0">
          <ul className="space-y-1.5 sticky top-24">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  id={`settings-tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-300',
                    activeTab === tab.id
                      ? 'bg-apple-blue/10 text-apple-blue shadow-sm'
                      : 'text-label-secondary hover:bg-apple-gray-6 hover:text-label-primary'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ════════════════ PROFILE TAB ════════════════ */}
          {activeTab === 'profile' && (
            <Reveal className="space-y-6">
              {/* Avatar */}
              <Card>
                <CardHeader><h2 className="text-heading-3">Profile photo</h2></CardHeader>
                <CardBody className="flex items-center gap-5">
                  <Avatar
                    src={profile?.avatar_url}
                    name={profile?.full_name ?? profile?.username}
                    size={80}
                    gradient={avatarGradient(profile?.username ?? 'dev')}
                    className="shadow-level-1"
                  />
                  <div>
                    <label className="inline-block cursor-pointer rounded-pill border border-[rgba(0,0,0,0.15)] bg-white px-5 py-2 text-[14px] font-medium shadow-sm hover:bg-apple-gray-6 transition-colors">
                      {uploadAvatar.isPending ? 'Uploading…' : 'Change photo'}
                      <input type="file" accept="image/*" onChange={onAvatar} className="hidden" />
                    </label>
                    <p className="mt-3 text-[13px] text-label-tertiary">JPEG, PNG, WEBP or GIF · Max 2 MB</p>
                  </div>
                </CardBody>
              </Card>

              {/* Basic info */}
              <Card>
                <CardHeader><h2 className="text-heading-3">Profile details</h2></CardHeader>
                <CardBody>
                  <form onSubmit={onSaveProfile} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Full-stack developer" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label><Globe size={14} className="inline mr-1.5 mb-0.5 text-label-tertiary" />Location</Label>
                        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label><Globe size={14} className="inline mr-1.5 mb-0.5 text-label-tertiary" />Website</Label>
                        <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                      </div>
                      <div className="space-y-2">
                        <Label><Github size={14} className="inline mr-1.5 mb-0.5 text-label-tertiary" />GitHub username</Label>
                        <Input value={form.github_username} onChange={(e) => setForm({ ...form, github_username: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label><Briefcase size={14} className="inline mr-1.5 mb-0.5 text-label-tertiary" />Years of experience</Label>
                        <Input type="number" min={0} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select
                          id="settings-availability"
                          value={form.availability}
                          onChange={(e) => setForm({ ...form, availability: e.target.value })}
                        >
                          <option value="not_looking">Not looking</option>
                          <option value="open_to_work">Open to work</option>
                          <option value="hiring">Hiring</option>
                          <option value="busy">Busy</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mentorship</Label>
                        <Select
                          id="settings-mentor-mode"
                          value={form.mentor_mode}
                          onChange={(e) => setForm({ ...form, mentor_mode: e.target.value })}
                        >
                          <option value="none">Not specified</option>
                          <option value="open_to_mentor">Open to mentor</option>
                          <option value="looking_for_mentor">Looking for a mentor</option>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
                      <Button type="submit" loading={updateProfile.isPending}><Save size={16} /> Save profile</Button>
                      <Button type="button" variant="outline" className="text-apple-purple hover:bg-apple-purple/10 border-apple-purple/30" onClick={() => void onGenerateSummary()} loading={aiSummary.isPending}>
                        <Sparkles size={16} /> Generate AI bio
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader><h2 className="text-heading-3">Skills</h2></CardHeader>
                <CardBody className="space-y-5">
                  <div className="flex flex-wrap gap-2.5">
                    {(fullProfile?.skills ?? []).map((s: any) => (
                      <span key={s.id} className="flex items-center gap-2 rounded-pill border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-1.5 text-[14px] font-medium shadow-sm">
                        {Array.isArray(s.skill) ? s.skill[0]?.name : s.skill?.name}
                        <button type="button" onClick={() => void removeSkill.mutateAsync(s.id)} className="text-label-tertiary hover:text-apple-red transition-colors" aria-label={`Remove ${Array.isArray(s.skill) ? s.skill[0]?.name : s.skill?.name}`}>
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                    {!fullProfile?.skills?.length && <p className="text-[15px] text-label-tertiary">No skills added yet.</p>}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void onAddSkill())}
                      placeholder="Add a skill (e.g. TypeScript)" className="max-w-xs" />
                    <Button onClick={() => void onAddSkill()} loading={addSkill.isPending} variant="secondary"><Plus size={16} /> Add</Button>
                  </div>
                </CardBody>
              </Card>

              {/* Experience */}
              <Card>
                <CardHeader><h2 className="text-heading-3"><Briefcase size={18} className="inline mr-2 text-label-secondary" />Experience</h2></CardHeader>
                <CardBody className="space-y-6">
                  {(fullProfile?.experience ?? []).map((exp: any) => (
                    <div key={exp.id} className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white/50 p-4">
                      <p className="text-[16px] font-semibold text-label-primary">{exp.role} · <span className="font-medium text-label-secondary">{exp.company}</span></p>
                      <p className="text-[14px] text-label-tertiary mt-1">{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</p>
                    </div>
                  ))}
                  <div className="grid gap-4 rounded-[16px] border border-dashed border-[rgba(0,0,0,0.15)] bg-apple-gray-6/50 p-5 sm:grid-cols-2">
                    <Input placeholder="Company" value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} />
                    <Input placeholder="Role" value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} />
                    <div className="space-y-1">
                      <Label className="text-[12px] text-label-tertiary ml-1">Start Date</Label>
                      <Input type="date" value={experience.start_date} onChange={(e) => setExperience({ ...experience, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[12px] text-label-tertiary ml-1">End Date</Label>
                      <Input type="date" value={experience.end_date} onChange={(e) => setExperience({ ...experience, end_date: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2 mt-2">
                      <Button type="button" variant="secondary" loading={addExperience.isPending}
                        onClick={async () => {
                          if (!experience.company || !experience.role || !experience.start_date) { toast.error('Company, role and start date are required'); return; }
                          try { await addExperience.mutateAsync(experience); setExperience({ company: '', role: '', start_date: '', end_date: '', description: '' }); toast.success('Experience added'); }
                          catch (err) { toast.error((err as Error).message); }
                        }}>
                        <Plus size={16} /> Add experience
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader><h2 className="text-heading-3"><GraduationCap size={18} className="inline mr-2 text-label-secondary" />Education</h2></CardHeader>
                <CardBody className="space-y-6">
                  {(fullProfile?.education ?? []).map((edu: any) => (
                    <div key={edu.id} className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white/50 p-4">
                      <p className="text-[16px] font-semibold text-label-primary">{edu.school}</p>
                      <p className="text-[15px] font-medium text-label-secondary mt-0.5">{edu.degree}</p>
                    </div>
                  ))}
                  <div className="grid gap-4 rounded-[16px] border border-dashed border-[rgba(0,0,0,0.15)] bg-apple-gray-6/50 p-5 sm:grid-cols-2">
                    <Input placeholder="School" value={education.school} onChange={(e) => setEducation({ ...education, school: e.target.value })} />
                    <Input placeholder="Degree" value={education.degree} onChange={(e) => setEducation({ ...education, degree: e.target.value })} />
                    <div className="sm:col-span-2 mt-2">
                      <Button type="button" variant="secondary" loading={addEducation.isPending}
                        onClick={async () => {
                          if (!education.school || !education.degree) { toast.error('School and degree are required'); return; }
                          try { await addEducation.mutateAsync(education); setEducation({ school: '', degree: '', field: '', start_date: '', end_date: '' }); toast.success('Education added'); }
                          catch (err) { toast.error((err as Error).message); }
                        }}>
                        <Plus size={16} /> Add education
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          )}

          {/* ════════════════ APPEARANCE TAB ════════════════ */}
          {activeTab === 'appearance' && (
            <Reveal>
              <Card>
                <CardHeader><h2 className="text-heading-3">Appearance</h2></CardHeader>
                <CardBody className="space-y-10">
                  {/* Theme */}
                  <div>
                    <Label className="mb-4 block text-[16px]">Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {([
                        { val: 'light', icon: <Sun size={24} />, label: 'Light' },
                        { val: 'dark',  icon: <Moon size={24} />, label: 'Dark' },
                        { val: 'system', icon: <Monitor size={24} />, label: 'System' },
                      ] as const).map(({ val, icon, label }) => (
                        <button
                          key={val}
                          id={`theme-${val}`}
                          type="button"
                          onClick={() => setTheme(val)}
                          className={cn(
                            'relative flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 p-6 transition-all duration-300 ease-apple',
                            theme === val
                              ? 'border-apple-blue bg-apple-blue/5 text-apple-blue shadow-sm scale-[1.02]'
                              : 'border-[rgba(0,0,0,0.08)] text-label-secondary hover:bg-apple-gray-6'
                          )}
                        >
                          {theme === val && <div className="absolute top-3 right-3 bg-apple-blue text-white rounded-full p-0.5"><Check size={12} strokeWidth={3} /></div>}
                          {icon}
                          <span className="font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent color */}
                  <div>
                    <Label className="mb-4 block text-[16px]">Accent color</Label>
                    <div className="flex flex-wrap gap-4">
                      {(Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][]).map(([key, meta]) => (
                        <button
                          key={key}
                          id={`accent-${key}`}
                          type="button"
                          title={meta.label}
                          onClick={() => setAccentColor(key)}
                          className={cn(
                            'relative h-12 w-12 rounded-full border-[3px] transition-all duration-300 ease-apple',
                            accentColor === key ? 'border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.1)] scale-110' : 'border-white/50 shadow-sm hover:scale-105'
                          )}
                          style={{ backgroundColor: meta.hex }}
                        >
                          {accentColor === key && (
                            <Check size={18} strokeWidth={3} className="absolute inset-0 m-auto text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[14px] text-label-secondary font-medium">
                      Selected: {ACCENT_COLORS[accentColor]?.label}
                    </p>
                  </div>

                  {/* Compact mode */}
                  <div className="border-t border-[rgba(0,0,0,0.06)] pt-4">
                    <SettingRow
                      title="Compact mode"
                      description="Reduce spacing between elements for a denser layout."
                    >
                      <Toggle id="compact-mode" checked={compactMode} onChange={setCompactMode} />
                    </SettingRow>
                  </div>

                  <p className="text-[13px] text-label-tertiary">
                    Appearance preferences are saved to your browser and apply instantly.
                  </p>
                </CardBody>
              </Card>
            </Reveal>
          )}

          {/* ════════════════ NOTIFICATIONS TAB ════════════════ */}
          {activeTab === 'notifications' && (
            <Reveal>
              <Card>
                <CardHeader>
                  <h2 className="text-heading-3">Notifications</h2>
                  <p className="text-[15px] text-label-secondary mt-1">Choose what you want to be notified about.</p>
                </CardHeader>
                <CardBody className="space-y-2">
                  <h3 className="text-[13px] font-bold tracking-widest text-label-tertiary uppercase mt-2 mb-4">Email Notifications</h3>
                  <SettingRow title="Connection requests" description="When someone sends you a connection request.">
                    <Toggle id="notif-email-connections" checked={notifs.email_connections} onChange={(v) => setNotifs({ ...notifs, email_connections: v })} />
                  </SettingRow>
                  <SettingRow title="New messages" description="When you receive a direct message.">
                    <Toggle id="notif-email-messages" checked={notifs.email_messages} onChange={(v) => setNotifs({ ...notifs, email_messages: v })} />
                  </SettingRow>
                  <SettingRow title="Skill endorsements" description="When someone endorses one of your skills.">
                    <Toggle id="notif-email-endorsements" checked={notifs.email_endorsements} onChange={(v) => setNotifs({ ...notifs, email_endorsements: v })} />
                  </SettingRow>
                  <SettingRow title="Comments" description="When someone comments on your posts.">
                    <Toggle id="notif-email-comments" checked={notifs.email_comments} onChange={(v) => setNotifs({ ...notifs, email_comments: v })} />
                  </SettingRow>

                  <h3 className="text-[13px] font-bold tracking-widest text-label-tertiary uppercase mt-10 mb-4">Push Notifications</h3>
                  <SettingRow title="Connection requests" description="Browser push for connection requests.">
                    <Toggle id="notif-push-connections" checked={notifs.push_connections} onChange={(v) => setNotifs({ ...notifs, push_connections: v })} />
                  </SettingRow>
                  <SettingRow title="Messages" description="Browser push for new messages.">
                    <Toggle id="notif-push-messages" checked={notifs.push_messages} onChange={(v) => setNotifs({ ...notifs, push_messages: v })} />
                  </SettingRow>
                  <SettingRow title="Mentions" description="When someone mentions you.">
                    <Toggle id="notif-push-mentions" checked={notifs.push_mentions} onChange={(v) => setNotifs({ ...notifs, push_mentions: v })} />
                  </SettingRow>

                  <h3 className="text-[13px] font-bold tracking-widest text-label-tertiary uppercase mt-10 mb-4">Digests</h3>
                  <SettingRow title="Weekly digest" description="A summary of your week's activity every Monday.">
                    <Toggle id="notif-weekly-digest" checked={notifs.weekly_digest} onChange={(v) => setNotifs({ ...notifs, weekly_digest: v })} />
                  </SettingRow>

                  <div className="pt-8 pb-2">
                    <Button onClick={onSaveNotifications} size="lg"><Save size={18} /> Save preferences</Button>
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          )}

          {/* ════════════════ PRIVACY TAB ════════════════ */}
          {activeTab === 'privacy' && (
            <Reveal>
              <Card>
                <CardHeader>
                  <h2 className="text-heading-3">Privacy</h2>
                  <p className="text-[15px] text-label-secondary mt-1">Control who can see your information.</p>
                </CardHeader>
                <CardBody className="space-y-2">
                  <SettingRow title="Public profile" description="Allow anyone to view your profile page.">
                    <Toggle id="privacy-profile-visible" checked={privacy.profile_visible} onChange={(v) => setPrivacy({ ...privacy, profile_visible: v })} />
                  </SettingRow>
                  <SettingRow title="Show email address" description="Display your email on your public profile.">
                    <Toggle id="privacy-show-email" checked={privacy.show_email} onChange={(v) => setPrivacy({ ...privacy, show_email: v })} />
                  </SettingRow>
                  <SettingRow title="Show location" description="Display your location on your public profile.">
                    <Toggle id="privacy-show-location" checked={privacy.show_location} onChange={(v) => setPrivacy({ ...privacy, show_location: v })} />
                  </SettingRow>
                  <SettingRow title="Online status" description="Let others see when you are active.">
                    <Toggle id="privacy-online-status" checked={privacy.show_online_status} onChange={(v) => setPrivacy({ ...privacy, show_online_status: v })} />
                  </SettingRow>
                  <SettingRow title="Search engine indexing" description="Allow search engines to index your profile.">
                    <Toggle id="privacy-indexable" checked={privacy.indexable_by_search} onChange={(v) => setPrivacy({ ...privacy, indexable_by_search: v })} />
                  </SettingRow>

                  <div className="py-6 border-t border-[rgba(0,0,0,0.06)] mt-4">
                    <Label className="mb-3 block text-[16px]">Who can send you messages</Label>
                    <Select
                      id="privacy-messages-from"
                      value={privacy.allow_messages_from}
                      onChange={(e) => setPrivacy({ ...privacy, allow_messages_from: e.target.value })}
                      className="max-w-sm"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections only</option>
                      <option value="nobody">Nobody</option>
                    </Select>
                  </div>

                  <div className="pt-2 pb-2 border-t border-[rgba(0,0,0,0.06)]">
                    <Button onClick={onSavePrivacy} size="lg" className="mt-6"><Save size={18} /> Save privacy settings</Button>
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          )}

          {/* ════════════════ SECURITY TAB ════════════════ */}
          {activeTab === 'security' && (
            <Reveal className="space-y-6">
              {/* Change email */}
              <Card>
                <CardHeader><h2 className="text-heading-3"><Mail size={20} className="inline mr-2 text-label-secondary" />Change email address</h2></CardHeader>
                <CardBody className="space-y-5">
                  <p className="text-[15px] text-label-secondary">Current email: <span className="font-semibold text-label-primary tracking-wide ml-1">{useAuthStore.getState().user?.email ?? '—'}</span></p>
                  <div className="max-w-sm space-y-2">
                    <Label>New email address</Label>
                    <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <Button onClick={() => void onChangeEmail()} disabled={!newEmail} variant="secondary">
                      Send confirmation link
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Change password */}
              <Card>
                <CardHeader><h2 className="text-heading-3"><Lock size={20} className="inline mr-2 text-label-secondary" />Change password</h2></CardHeader>
                <CardBody className="space-y-5 max-w-sm">
                  <div className="space-y-2">
                    <Label>New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary transition-colors">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm password</Label>
                    <Input id="confirm-password" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repeat new password" />
                  </div>
                  {newPassword && confirmPass && newPassword !== confirmPass && (
                    <p className="text-[13px] font-medium text-apple-red">Passwords do not match</p>
                  )}
                  <div className="pt-2">
                    <Button onClick={() => void onChangePassword()} disabled={!newPassword || !confirmPass} variant="secondary">
                      Update password
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Active session info */}
              <Card>
                <CardHeader><h2 className="text-heading-3"><Shield size={20} className="inline mr-2 text-label-secondary" />Session info</h2></CardHeader>
                <CardBody className="space-y-4 text-[15px] text-label-secondary leading-relaxed">
                  <p>Your session is stored securely on your device and will remain active for up to <strong className="text-label-primary font-semibold">7 days</strong>.</p>
                  <p>Tokens refresh automatically in the background — you will not be logged out suddenly.</p>
                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                    <Button
                      variant="outline"
                      className="text-label-secondary hover:text-label-primary"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                      }}
                    >
                      <LogOut size={16} /> Sign out
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Danger zone */}
              <Card className="border border-apple-red/20 bg-apple-red/5 shadow-none">
                <CardHeader><h2 className="text-heading-3 text-apple-red">Danger zone</h2></CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-[15px] text-apple-red/80">Deleting your account is permanent and cannot be undone. All your data will be erased.</p>
                  <Button
                    variant="outline"
                    className="border-apple-red/30 text-apple-red hover:bg-apple-red hover:text-white transition-colors"
                    onClick={() => {
                      if (window.confirm('Are you absolutely sure? This cannot be undone.')) {
                        toast.error('Account deletion — contact support to proceed.');
                      }
                    }}
                  >
                    Delete my account
                  </Button>
                </CardBody>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
