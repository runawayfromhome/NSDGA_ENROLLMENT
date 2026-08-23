// src/auth/authStore.js
// ---------------------------------------------------------------------------
// Data-access layer, now backed by SUPABASE (was localStorage in Phase 1).
// Every function here talks to Supabase Auth + the `profiles` / `audit_log`
// tables. The UI keeps calling these same names; only the internals changed.
// ---------------------------------------------------------------------------
import { supabase, makeSignupClient } from '../lib/supabase';

export const ROLES = {
  STUDENT: 'student',
  REGISTRAR: 'registrar',
  ADMIN: 'admin',
  HEADADMIN: 'headadmin',
};

export const STATUS = {
  PENDING_PROFILE: 'pending_profile',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
};

export const ROLE_HOME = {
  student: '/StudentPortal/Dashboard',
  registrar: '/RegistrarPortal/Dashboard',
  admin: '/AdminPortal/Dashboard',
  headadmin: '/HeadAdminPortal/Accounts',
};

export const PROFILE_SETUP_PATH = {
  registrar: '/RegistrarPortal/ProfileSetup',
  admin: '/AdminPortal/ProfileSetup',
};

// Roles that MUST have MFA. Set to [] to make MFA fully optional again.
// Temporarily turned OFF (was ['admin', 'headadmin']) — re-enable when ready.
export const MFA_REQUIRED_ROLES = [];

// Where a required-role user is sent to enroll an authenticator.
export const MFA_SETUP_PATH = {
  admin: '/AdminPortal/MfaSetup',
  headadmin: '/HeadAdminPortal/MfaSetup',
};

// Friendly labels + which role each login page accepts.
export const PORTAL_LABEL = { registrar: 'Registrar', admin: 'Admin', headadmin: 'Head Administrator' };

// --- profiles ----------------------------------------------------------------
export async function fetchProfileById(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// Staff accounts HeadAdmin manages (RLS lets only HeadAdmin read all rows).
export async function getStaffAccounts() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['registrar', 'admin'])
    .order('created_at', { ascending: true });
  if (error) return [];
  return data;
}

// Create a staff account. Uses a Supabase Edge Function (`create-staff`) so it
// works with public sign-ups DISABLED. (Deployed in the #4 lockdown step — until
// then this returns a helpful error.)
export async function createAccount({ name, email, password, role }) {
  if (!name || !email || !password || !role) return { ok: false, error: 'All fields are required.' };
  const { data, error } = await supabase.functions.invoke('create-staff', {
    body: { name, email, password, role },
  });
  if (error) {
    return { ok: false, error: (data && data.error) || error.message || 'Create failed — is the create-staff Edge Function deployed?' };
  }
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true, account: data };
}

// HeadAdmin actions (RLS + the enforce trigger allow these only for HeadAdmin).
export async function setDisabled(id, disabled) {
  const { error } = await supabase.from('profiles').update({ disabled }).eq('id', id);
  return { ok: !error, error: error?.message };
}
export async function updateRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  return { ok: !error, error: error?.message };
}
export async function verifyAccount(id) {
  const { error } = await supabase.from('profiles')
    .update({ status: STATUS.VERIFIED, verified_at: new Date().toISOString() }).eq('id', id);
  return { ok: !error, error: error?.message };
}
export async function returnProfile(id, note) {
  const { error } = await supabase.from('profiles')
    .update({ status: STATUS.PENDING_PROFILE, return_note: note || 'Please review and resubmit your profile.' })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

// Employee submits their profile + new password.
export async function submitProfile(id, profileData, newPassword) {
  if (newPassword) {
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
    if (pwErr) return { ok: false, error: pwErr.message };
  }
  const { error } = await supabase.from('profiles')
    .update({ profile: profileData, status: STATUS.PENDING_VERIFICATION, return_note: '', submitted_at: new Date().toISOString() })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

// A user updates their own profile fields (e.g. My Profile contact info).
export async function updateProfile(id, partial) {
  const current = await fetchProfileById(id);
  const merged = { ...(current?.profile || {}), ...partial };
  const { error } = await supabase.from('profiles').update({ profile: merged }).eq('id', id);
  return { ok: !error, error: error?.message };
}

// --- audit log ---------------------------------------------------------------
export async function getAuditLog() {
  const { data, error } = await supabase
    .from('audit_log').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) return [];
  return data;
}
export async function recordAudit(entry) {
  await supabase.from('audit_log').insert({ device: shortDevice(), ...entry });
}
function shortDevice() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/Edg/.test(ua)) return 'Edge';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Browser';
}

// --- auth --------------------------------------------------------------------
// Returns { ok, error, profile }. Records the attempt in the audit log.
export async function signIn(email, password, expectedRole = null) {
  const clean = (email || '').trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (error) {
    await recordAudit({ email: clean, name: clean, role: 'unknown', action: 'LOGIN', status: 'FAILED', reason: error.message });
    return { ok: false, error: 'Invalid email or password.' };
  }
  const profile = await fetchProfileById(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: 'No profile is linked to this account. Contact the administrator.' };
  }
  if (profile.disabled) {
    await recordAudit({ email: clean, name: profile.name, role: profile.role, action: 'LOGIN', status: 'FAILED', reason: 'Account disabled' });
    await supabase.auth.signOut();
    return { ok: false, error: 'This account has been disabled. Please contact the administrator.' };
  }
  // Each portal's login only accepts its own role (no cross-portal login).
  if (expectedRole && profile.role !== expectedRole) {
    await recordAudit({ email: clean, name: profile.name, role: profile.role, action: 'LOGIN', status: 'FAILED', reason: `Wrong portal (expected ${expectedRole})` });
    await supabase.auth.signOut();
    return { ok: false, error: `This is the ${PORTAL_LABEL[expectedRole] || expectedRole} login. Your account isn't a ${PORTAL_LABEL[expectedRole] || expectedRole} — please use the correct portal.` };
  }
  // If the user has an authenticator enrolled, the password alone is not enough —
  // the login isn't "complete" until they enter the 6-digit code.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === 'verified') || factors?.totp?.[0];
    return { ok: true, mfaRequired: true, factorId: totp?.id, profile };
  }
  await recordAudit({ email: clean, name: profile.name, role: profile.role, action: 'LOGIN', status: 'SUCCESS' });
  return { ok: true, profile };
}

// --- MFA (TOTP authenticator app) --------------------------------------------
// Returns the user's active (verified) authenticator factor, or null.
export async function getMfaFactor() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return null;
  return data?.totp?.find((f) => f.status === 'verified') || null;
}

// Begin enrolling an authenticator; returns the QR + secret to show the user.
export async function enrollMfa() {
  // Clear any half-finished (unverified) factors first so re-enrolling is clean.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of (existing?.all || []).filter((x) => x.status === 'unverified')) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'authenticator-' + Date.now() });
  if (error) return { ok: false, error: error.message };
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

// Finish enrollment: verify the first code from the authenticator app.
export async function activateMfa(factorId, code) {
  const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) return { ok: false, error: chErr.message };
  const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (vErr) return { ok: false, error: 'That code was not accepted. Check the app and try again.' };
  return { ok: true };
}

// Turn MFA off.
export async function disableMfa(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return { ok: !error, error: error?.message };
}

// At login: verify the code to raise the session to AAL2 and finish signing in.
// --- change password (step-up: current password + MFA code) ------------------
// Verify the current password WITHOUT disturbing the live session — we do it on a
// throwaway client, so a user at AAL2 (MFA) stays at AAL2.
export async function verifyCurrentPassword(currentPassword) {
  const { data: u } = await supabase.auth.getUser();
  const email = u?.user?.email;
  if (!email) return { ok: false, error: 'You are not signed in.' };
  const tmp = makeSignupClient();
  const { error } = await tmp.auth.signInWithPassword({ email, password: currentPassword });
  return { ok: !error, error: error ? 'Current password is incorrect.' : null };
}

// Verify a fresh authenticator code (step-up for a sensitive action).
export async function verifyMfaChallenge(factorId, code) {
  const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) return { ok: false, error: chErr.message };
  const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  return { ok: !vErr, error: vErr ? 'Invalid authenticator code.' : null };
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { ok: !error, error: error?.message };
}

export async function verifyMfaLogin(factorId, code) {
  const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) return { ok: false, error: chErr.message };
  const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (vErr) return { ok: false, error: 'Invalid code. Please try again.' };
  const { data: u } = await supabase.auth.getUser();
  const profile = await fetchProfileById(u.user.id);
  await recordAudit({ email: profile.email, name: profile.name, role: profile.role, action: 'LOGIN', status: 'SUCCESS' });
  return { ok: true, profile };
}

export async function signOutWithAudit(sessionInfo) {
  if (sessionInfo) {
    await recordAudit({ email: sessionInfo.email, name: sessionInfo.name, role: sessionInfo.role, action: 'LOGOUT', status: 'SUCCESS' });
  }
  await supabase.auth.signOut();
}
