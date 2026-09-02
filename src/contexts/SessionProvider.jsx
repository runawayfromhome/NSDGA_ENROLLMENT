// src/contexts/SessionProvider.jsx
// Holds the logged-in user's combined session (auth user + their profile row)
// from Supabase. Everything is async now, so it exposes a `loading` flag while
// the session/profile are being fetched.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SessionContext } from './SessionContext';
import { supabase } from '../lib/supabase';
import { signIn as storeSignIn, signOutWithAudit, fetchProfileById, verifyMfaLogin, MFA_REQUIRED_ROLES } from '../auth/authStore';

// Merge the Supabase auth user + their profile row into one flat object the
// whole app reads (session.id / name / email / role / status / profile).
function combine(user, profile) {
  if (!user || !profile) return null;
  return {
    id: user.id,
    email: user.email,
    name: profile.name || user.email,
    role: profile.role,
    status: profile.status,
    disabled: profile.disabled,
    profile: profile.profile,
    returnNote: profile.return_note,
  };
}

export default function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // DEMO ONLY: lets a required-MFA user skip enrollment. Remove for production.
  const [mfaBypass, setMfaBypass] = useState(() => sessionStorage.getItem('nsdga_mfa_bypass') === '1');
  const bypassMfa = useCallback(() => {
    sessionStorage.setItem('nsdga_mfa_bypass', '1');
    setMfaBypass(true);
  }, []);
  // Keep a ref to the latest session so logout() can read it without being
  // re-created on every session change. Updated in an effect (not during render).
  const sessionRef = useRef(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const loadFrom = useCallback(async (sbSession) => {
    if (!sbSession?.user) { setSession(null); return null; }
    const profile = await fetchProfileById(sbSession.user.id);
    const combined = combine(sbSession.user, profile);
    // Flag whether the user still owes an MFA code (has an authenticator but is
    // only at AAL1). ProtectedRoute uses this to hold them at the login step.
    if (combined) {
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        combined.needsMfa = aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2';
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === 'verified') || factors?.totp?.[0];
        if (combined.needsMfa) combined.mfaFactorId = totp?.id;
        // Required-role users must enroll an authenticator — but ONLY once their
        // account is verified. A still-pending account finishes profile
        // verification first (otherwise ProfileSetup <-> MfaSetup loop forever).
        combined.mfaSetupRequired =
          MFA_REQUIRED_ROLES.includes(profile.role) && profile.status === 'verified' && !totp;
      } catch { /* ignore */ }
    }
    setSession(combined);
    return combined;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      await loadFrom(data.session);
      setLoading(false);
    })();

    // Keep the session in sync (token refresh, sign-in/out in another tab, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sbSession) => {
      loadFrom(sbSession);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadFrom]);

  // Presence heartbeat: while someone is logged in, quietly stamp their
  // `last_seen` now and every ~90s, so Head Admin can see who's online. Best
  // effort — failures are ignored (e.g. before presence.sql is run).
  useEffect(() => {
    const uid = session?.id;
    if (!uid) return;
    let alive = true;
    const beat = () => { if (alive) supabase.from('presence').upsert({ id: uid, last_seen: new Date().toISOString() }).then(() => {}, () => {}); };
    beat();
    const iv = setInterval(beat, 90000);
    return () => { alive = false; clearInterval(iv); };
  }, [session?.id]);

  const login = useCallback(async (email, password, expectedRole = null) => {
    const result = await storeSignIn(email, password, expectedRole);
    if (result.ok) {
      const { data } = await supabase.auth.getSession();
      await loadFrom(data.session);
    }
    return result; // { ok, error, profile }
  }, [loadFrom]);

  const logout = useCallback(async () => {
    await signOutWithAudit(sessionRef.current);
    sessionStorage.removeItem('nsdga_mfa_bypass'); // DEMO ONLY
    setMfaBypass(false);
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return loadFrom(data.session);
  }, [loadFrom]);

  // Finish an MFA login: verify the code, then reload the (now AAL2) session.
  const completeMfa = useCallback(async (factorId, code) => {
    const res = await verifyMfaLogin(factorId, code);
    if (res.ok) await refresh();
    return res;
  }, [refresh]);

  const value = useMemo(
    () => ({ session, loading, login, logout, refresh, completeMfa, mfaBypass, bypassMfa, isAuthenticated: !!session, role: session?.role || null }),
    [session, loading, login, logout, refresh, completeMfa, mfaBypass, bypassMfa]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
