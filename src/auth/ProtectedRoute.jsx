// src/auth/ProtectedRoute.jsx
// Route guard. Waits for the async session to load, then enforces login + role
// + (optionally) a verified account. Verification status now comes from the
// session (backed by the Supabase profiles row + its RLS).
import { Navigate } from 'react-router-dom';
import { useSession } from '../contexts/useSession';
import { ROLE_HOME, PROFILE_SETUP_PATH, MFA_SETUP_PATH, STATUS } from './authStore';

export default function ProtectedRoute({ allow, loginPath = '/StudentPortal/Login', requireVerified = false, requireEnrolled = false, skipMfaGate = false, children }) {
  const { session, loading, mfaBypass } = useSession();

  // Don't decide anything until Supabase has told us who (if anyone) is logged in.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to={loginPath} replace />;

  // Signed in with password but still owes the authenticator code -> back to login
  // (the login page shows the code step).
  if (session.needsMfa) return <Navigate to={loginPath} replace />;

  if (allow && !allow.includes(session.role)) {
    return <Navigate to={ROLE_HOME[session.role] || '/Home'} replace />;
  }

  // A student who isn't enrolled yet can only use the applicant dashboard.
  if (requireEnrolled && session.role === 'student' && !session.isEnrolled) {
    return <Navigate to="/StudentPortal/ApplicationStatus" replace />;
  }

  if (requireVerified && session.status !== STATUS.VERIFIED) {
    const setupPath = PROFILE_SETUP_PATH[session.role];
    if (setupPath) return <Navigate to={setupPath} replace />;
  }

  // Roles that require MFA must enroll an authenticator before using the portal.
  // (mfaBypass is a DEMO escape hatch — remove for production.)
  if (!skipMfaGate && session.mfaSetupRequired && !mfaBypass) {
    const mfaPath = MFA_SETUP_PATH[session.role];
    if (mfaPath) return <Navigate to={mfaPath} replace />;
  }

  return children;
}
