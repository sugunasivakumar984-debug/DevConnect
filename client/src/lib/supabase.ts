import { createClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client — long-lived sessions.
 *
 * Session strategy:
 *  • persistSession: true  → JWT + refresh token written to localStorage
 *  • autoRefreshToken: true → silently refreshed before expiry
 *  • flowType: 'pkce'      → most secure OAuth/magic-link flow
 *  • storage: localStorage → survives tab/browser close (not just sessionStorage)
 *
 * To maximise session lifetime:
 *   Supabase Dashboard → Auth → JWT expiry → set to 604800 (7 days)
 *   Supabase Dashboard → Auth → Enable "Refresh Token Rotation"
 */

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Copy client/.env to client/.env and fill them in.'
  );
}

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'devconnect-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: { params: { eventsPerSecond: 5 } },
});

/** Current access token, or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Ensure we have a valid session, refreshing if needed. */
export async function ensureSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  // If token expires within 60 s, refresh proactively
  const expiresAt = data.session.expires_at ?? 0;
  if (expiresAt - Date.now() / 1000 < 60) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session;
  }
  return data.session;
}
