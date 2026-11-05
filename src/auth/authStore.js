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

// ---- Active-account limits (per staff role) --------------------------------
// How many VERIFIED + ENABLED accounts a role may have at once. HeadAdmin-set,
// stored in site_content('account_limits'); defaults below. Students are never
// capped. Enforced when an account would BECOME active (verify / enable / role
// change) — creating a pending account is always allowed. Backed server-side by
// the trg_enforce_account_limit trigger (supabase/account-limits.sql).
export const ACCOUNT_LIMIT_DEFAULTS = { headadmin: 2, admin: 4, registrar: 15 };
const LIMITED_ROLES = ['headadmin', 'admin', 'registrar'];

export async function getAccountLimits() {
  const { data } = await supabase.from('site_content').select('content').eq('section', 'account_limits').maybeSingle();
  return { ...ACCOUNT_LIMIT_DEFAULTS, ...(data?.content || {}) };
}

// Saving account limits is step-up protected with the HeadAdmin's authenticator.
// The MFA verification elevates the session to AAL2 before the Edge Function
// accepts the update.
export async function saveAccountLimitsWithMfa(limits, accessToken = null) {
  const options = { body: { limits } };
  if (accessToken) options.headers = { Authorization: `Bearer ${accessToken}` };
  const { data, error } = await supabase.functions.invoke('admin-account-limits', options);
  if (error && !(data && data.error)) {
    let message = error.message || 'Could not save the limits.';
    try {
      const body = await error.context?.json();
      if (body?.error) message = body.error;
    } catch {
      // Keep Supabase's message when the response is not JSON or was already consumed.
    }
    return { ok: false, error: message };
  }
  if (data && data.error) return { ok: false, error: data.error };
  const l = data.limits || {};
  logAction('CONTENT_EDIT', `Updated account limits: HeadAdmin ${l.headadmin} · Admin ${l.admin} · Registrar ${l.registrar}`);
  return { ok: true, limits: l };
}

// Count of active (verified + enabled) accounts per limited role, with the cap.
export async function getAccountUsage() {
  const limits = await getAccountLimits();
  const { data } = await supabase.from('profiles').select('role, status, disabled').in('role', LIMITED_ROLES);
  const out = {};
  for (const r of LIMITED_ROLES) {
    const active = (data || []).filter((p) => p.role === r && p.status === STATUS.VERIFIED && !p.disabled).length;
    out[r] = { active, cap: Number(limits[r]) || 0 };
  }
  return out;
}

// Returns { ok } or { ok:false, error } — blocks if the role is already at its
// active cap. `excludeId` ignores one account (e.g. the one being changed).
async function enforceActiveCap(role, excludeId = null) {
  if (!LIMITED_ROLES.includes(role)) return { ok: true }; // students unlimited
  const limits = await getAccountLimits();
  const cap = Number(limits[role]) || 0;
  let q = supabase.from('profiles').select('id', { count: 'exact', head: true })
    .eq('role', role).eq('status', STATUS.VERIFIED).eq('disabled', false);
  if (excludeId) q = q.neq('id', excludeId);
  const { count, error } = await q;
  if (error) return { ok: true }; // fail-open: never block account ops on a count error
  if ((count || 0) >= cap) {
    const label = role === 'headadmin' ? 'Head Administrator' : role.charAt(0).toUpperCase() + role.slice(1);
    return { ok: false, error: `Active ${label} limit reached (${cap}). Disable an existing ${label} account first, or raise the limit in Settings → Account Limits.` };
  }
  return { ok: true };
}

// Create a staff account. Uses a Supabase Edge Function (`create-staff`) so it
// works with public sign-ups DISABLED. (Deployed in the #4 lockdown step — until
// then this returns a helpful error.)
export async function createAccount({ name, email, password, role }) {
  if (!name || !email || !password || !role) return { ok: false, error: 'All fields are required.' };
  // Creating only makes a PENDING account (not active), so it is never capped
  // here — the active-account cap is enforced when the account would BECOME
  // active: at verify / enable / role change.
  const { data, error } = await supabase.functions.invoke('create-staff', {
    body: { name, email, password, role },
  });
  if (error) {
    return { ok: false, error: (data && data.error) || error.message || 'Create failed — is the create-staff Edge Function deployed?' };
  }
  if (data && data.error) return { ok: false, error: data.error };
  logAction('ACCOUNT_CREATE', `Created ${role} account: ${name} (${email})`);
  return { ok: true, account: data };
}

// Name of a target account, for readable audit detail. Never throws.
async function targetName(id) {
  try { const p = await fetchProfileById(id); return p?.name || p?.email || id; } catch { return id; }
}

// HeadAdmin actions (RLS + the enforce trigger allow these only for HeadAdmin).
export async function setDisabled(id, disabled) {
  // Re-enabling a VERIFIED account makes it active again — respect the role cap.
  if (disabled === false) {
    const p = await fetchProfileById(id);
    if (p?.status === STATUS.VERIFIED) {
      const cap = await enforceActiveCap(p.role, id);
      if (!cap.ok) return cap;
    }
  }
  const { error } = await supabase.from('profiles').update({ disabled }).eq('id', id);
  if (!error) logAction(disabled ? 'ACCOUNT_DISABLE' : 'ACCOUNT_ENABLE', `${disabled ? 'Disabled' : 'Enabled'} account: ${await targetName(id)}`);
  return { ok: !error, error: error?.message };
}
export async function updateRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (!error) logAction('ROLE_CHANGE', `Changed role to ${role}: ${await targetName(id)}`);
  return { ok: !error, error: error?.message };
}

// Step-up security for role changes: email a 6-digit code to the acting
// HeadAdmin, then apply the change only after they verify it. Enforced by the
// admin-role-change Edge Function (HeadAdmin-only + OTP).
export async function requestAdminOtp() {
  const { data, error } = await supabase.functions.invoke('admin-role-change', { body: {} });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not send the code.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true, sentTo: data.sentTo };
}
export async function changeRoleWithOtp(targetUserId, newRole, code, targetName) {
  // Moving an ACTIVE account into a role that's already at its cap would push it
  // over — block before spending the OTP. (excludeId: this account doesn't count
  // toward the destination unless it's already that role.)
  const p = await fetchProfileById(targetUserId);
  if (p && p.status === STATUS.VERIFIED && !p.disabled && p.role !== newRole) {
    const cap = await enforceActiveCap(newRole, targetUserId);
    if (!cap.ok) return cap;
  }
  const { data, error } = await supabase.functions.invoke('admin-role-change', { body: { targetUserId, newRole, code } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Role change failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  logAction(newRole === 'headadmin' ? 'HEADADMIN_PROMOTE' : 'ROLE_CHANGE',
    `${newRole === 'headadmin' ? 'Promoted to HeadAdmin' : 'Changed role to ' + newRole}: ${targetName || targetUserId}`);
  return { ok: true };
}
// admin-set-password Edge Function (HeadAdmin→staff, Admin→student; OTP step-up): reset a password.
export async function requestSetPasswordOtp() {
  const { data, error } = await supabase.functions.invoke('admin-set-password', { body: {} });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not send the code.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true, sentTo: data.sentTo };
}
export async function setUserPassword(targetUserId, newPassword, code, targetName) {
  const { data, error } = await supabase.functions.invoke('admin-set-password', { body: { targetUserId, newPassword, code } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Password reset failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  logAction('PASSWORD_RESET', `Reset password for ${targetName || targetUserId}`);
  return { ok: true };
}

// admin-remove-mfa Edge Function (HeadAdmin→staff, Admin→student; OTP step-up):
// account recovery when a user loses their authenticator.
export async function requestRemoveMfaOtp() {
  const { data, error } = await supabase.functions.invoke('admin-remove-mfa', { body: {} });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not send the code.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true, sentTo: data.sentTo };
}
export async function removeUserMfa(targetUserId, code, targetName) {
  const { data, error } = await supabase.functions.invoke('admin-remove-mfa', { body: { targetUserId, code } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'MFA reset failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  logAction('MFA_RESET', `Removed MFA for ${targetName || targetUserId}`);
  return { ok: true };
}

export async function verifyAccount(id) {
  // Verifying makes the account active — respect the role cap.
  const p = await fetchProfileById(id);
  if (p) {
    const cap = await enforceActiveCap(p.role, id);
    if (!cap.ok) return cap;
  }
  const { error } = await supabase.from('profiles')
    .update({ status: STATUS.VERIFIED, verified_at: new Date().toISOString() }).eq('id', id);
  if (!error) logAction('ACCOUNT_VERIFY', `Verified account: ${await targetName(id)}`);
  return { ok: !error, error: error?.message };
}
export async function returnProfile(id, note) {
  const { error } = await supabase.from('profiles')
    .update({ status: STATUS.PENDING_PROFILE, return_note: note || 'Please review and resubmit your profile.' })
    .eq('id', id);
  if (!error) logAction('PROFILE_RETURN', `Returned profile for revision: ${await targetName(id)}`);
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
// All audit writes go through the log_event() SECURITY DEFINER function, which
// stamps email/name/role from the JWT — not from client input — so the audit
// trail can't be forged (see supabase/schema.sql). `entry.email`
// is used only as the attempted email for a FAILED login (no session yet).
export async function recordAudit(entry) {
  try {
    if (entry.action === 'LOGIN' && entry.status === 'FAILED') {
      await supabase.functions.invoke('log-event', {
        body: {
          action: entry.action,
          status: entry.status,
          reason: entry.reason || '',
          device: entry.device || shortDevice(),
          email: entry.email || null,
        },
      });
      return;
    }
    await supabase.rpc('log_event', {
      p_action: entry.action,
      p_status: entry.status || 'SUCCESS',
      p_reason: entry.reason || '',
      p_device: entry.device || shortDevice(),
      p_attempt_email: entry.email || null,
      p_ip: null,
    });
  } catch { /* never block the action being logged */ }
}

// Record an ACTION the current user performed (enroll, reject, etc.). Identity is
// derived server-side by log_event(). Fire-and-forget — never blocks the action.
export async function logAction(action, detail) {
  try {
    await supabase.rpc('log_event', { p_action: action, p_reason: detail || '', p_device: shortDevice() });
  } catch { /* logging must never break the action */ }
}

// Map of userId -> last_seen ISO string (for the presence column).
export async function getPresence() {
  const { data, error } = await supabase.from('presence').select('id, last_seen');
  if (error) return {};
  const map = {};
  (data || []).forEach((r) => { map[r.id] = r.last_seen; });
  return map;
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
  logAction('MFA_ENABLE', 'Enabled Multi-Factor Authentication');
  return { ok: true };
}

// Turn MFA off.
export async function disableMfa(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (!error) logAction('MFA_DISABLE', 'Disabled Multi-Factor Authentication');
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
  const { data: verified, error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (vErr) { await recordMfaFail('Invalid authenticator code (step-up)'); return { ok: false, error: 'Invalid authenticator code.' }; }
  const { data: sessionData } = await supabase.auth.getSession();
  return {
    ok: true,
    error: null,
    accessToken: verified?.session?.access_token || sessionData?.session?.access_token || null,
  };
}

// Record a failed MFA attempt to the audit log (fuels the HeadAdmin alert in
// mfaAlerts). Best-effort — never blocks the flow.
async function recordMfaFail(reason) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return;
    const p = await fetchProfileById(u.user.id);
    if (!p) return;
    await recordAudit({ email: p.email, name: p.name, role: p.role, action: 'MFA_FAIL', status: 'FAILED', reason: reason || 'Invalid authenticator code' });
  } catch { /* logging must never break auth */ }
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) logAction('PASSWORD_CHANGE', 'Changed own password');
  return { ok: !error, error: error?.message };
}

export async function verifyMfaLogin(factorId, code) {
  const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) return { ok: false, error: chErr.message };
  const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (vErr) { await recordMfaFail('Invalid authenticator code at login'); return { ok: false, error: 'Invalid code. Please try again.' }; }
  const { data: u } = await supabase.auth.getUser();
  const profile = await fetchProfileById(u.user.id);
  await recordAudit({ email: profile.email, name: profile.name, role: profile.role, action: 'LOGIN', status: 'SUCCESS' });
  return { ok: true, profile };
}

// HeadAdmin alert: scan the last hour of MFA_FAIL rows and flag users with a
// brute-force pattern — 5+ failures in 5 minutes, or 20+ in the last hour.
export async function mfaAlerts() {
  const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('audit_log')
    .select('email, name, created_at')
    .eq('action', 'MFA_FAIL').gte('created_at', sinceHour)
    .order('created_at', { ascending: false }).limit(2000);
  if (error) return [];
  const now = Date.now();
  const byUser = {};
  (data || []).forEach((r) => {
    const u = byUser[r.email] || (byUser[r.email] = { email: r.email, name: r.name, hour: 0, fiveMin: 0, lastAt: r.created_at });
    u.hour += 1;
    if (now - new Date(r.created_at).getTime() <= 5 * 60 * 1000) u.fiveMin += 1;
  });
  return Object.values(byUser).filter((u) => u.fiveMin >= 5 || u.hour >= 20);
}

export async function signOutWithAudit(sessionInfo) {
  if (sessionInfo) {
    await recordAudit({ email: sessionInfo.email, name: sessionInfo.name, role: sessionInfo.role, action: 'LOGOUT', status: 'SUCCESS' });
  }
  await supabase.auth.signOut();
}
