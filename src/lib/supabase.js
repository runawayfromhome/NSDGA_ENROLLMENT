// src/lib/supabase.js
// The single Supabase client for the whole app. Reads credentials from
// .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error('[supabase] Missing env vars — check .env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(url, anonKey);

// A throwaway client used ONLY when HeadAdmin creates a staff account. Signing a
// new user up on this client does not touch the main session, so HeadAdmin stays
// logged in. persistSession:false keeps it out of localStorage.
export function makeSignupClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'nsdga-signup-tmp' },
  });
}
