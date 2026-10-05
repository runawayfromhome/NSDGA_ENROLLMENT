// src/lib/password.js
// One password policy used everywhere a password is set, so the rules stay
// consistent. Policy is role-based: students get a friendly floor; staff (who
// hold privileged access to school data) must use a strong password.
export const STAFF_ROLES = ['registrar', 'admin', 'headadmin'];

// Returns a { label: boolean } map of the rules that apply to this role.
export function passwordChecks(pw, role) {
  const s = pw || '';
  if (STAFF_ROLES.includes(role)) {
    return {
      'At least 12 characters': s.length >= 12,
      'Upper & lower case letters': /[a-z]/.test(s) && /[A-Z]/.test(s),
      'At least one number': /\d/.test(s),
      'At least one special character': /[^A-Za-z0-9]/.test(s),
    };
  }
  return {
    'At least 8 characters': s.length >= 8,
    'A letter and a number': /[A-Za-z]/.test(s) && /\d/.test(s),
  };
}

// True when every rule for the role passes.
export function isPasswordValid(pw, role) {
  return Object.values(passwordChecks(pw, role)).every(Boolean);
}

// { ok } or { ok:false, error } — for inline form validation.
export function validatePassword(pw, role) {
  if (isPasswordValid(pw, role)) return { ok: true };
  return {
    ok: false,
    error: STAFF_ROLES.includes(role)
      ? 'Password must be at least 12 characters with upper & lower case, a number, and a special character.'
      : 'Password must be at least 8 characters and include a letter and a number.',
  };
}
