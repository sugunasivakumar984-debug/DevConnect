import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '@devconnect/shared';

/** Authentication + current profile state. */

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  loadProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  loadProfile: async () => {
    const userId = get().user?.id;
    if (!userId) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[auth] failed to load profile:', error.message);
      return null;
    }
    set({ profile: (data as Profile) ?? null });
    return (data as Profile) ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut().catch(() => undefined);
    set({ session: null, user: null, profile: null });
  },

  initialize: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false, initialized: true });
    if (data.session) await get().loadProfile();

    // Keep the store in sync with Supabase auth events.
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session) void get().loadProfile();
      else set({ profile: null });
    });
  },
}));

/** Selector helper for the signed-in user's id. */
export const selectUserId = (s: AuthState) => s.user?.id ?? null;
