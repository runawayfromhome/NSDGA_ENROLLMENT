import './App.css';
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Eager (small, used on every route):
import ProtectedRoute from './auth/ProtectedRoute';
import OfflineBanner from './components/OfflineBanner';
import AdminLayout from './components/AdminLayout';

// Lazy-loaded pages (code-split per route → smaller initial bundle).
const Home = lazy(() => import('./components/pages/Home'));
const SHSOnlineAdmission = lazy(() => import('./components/pages/SHSOnlineAdmission'));
const SHSOnCampus = lazy(() => import('./components/pages/SHSOnCampus'));
const Kindergarten = lazy(() => import('./components/pages/Kindergarten'));
const ElemOnCampus = lazy(() => import('./components/pages/ElemOnCampus'));
const ElemOnline = lazy(() => import('./components/pages/ElemOnline'));
const JHSOnCampus = lazy(() => import('./components/pages/JHSOnCampus'));
const JHSOnline = lazy(() => import('./components/pages/JHSOnline'));
const Calendar = lazy(() => import('./components/pages/Calendar'));
const About = lazy(() => import('./components/pages/About'));
const Login = lazy(() => import('./components/pages/StudentPortal/Login'));
const ForgotPass = lazy(() => import('./components/pages/StudentPortal/ForgotPass'));
const ForgotPassOtp = lazy(() => import('./components/pages/StudentPortal/ForgotPassOtp'));
const CreateNewPass = lazy(() => import('./components/pages/StudentPortal/CreateNewPass'));
const LoginOtp = lazy(() => import('./components/pages/StudentPortal/LoginOtp'));
const Apply = lazy(() => import('./components/pages/StudentPortal/Apply'));
const VerifyOtp = lazy(() => import('./components/pages/StudentPortal/VerifyOtp'));
const EnrollmentForm = lazy(() => import('./components/pages/StudentPortal/EnrollmentForm'));
const Notification = lazy(() => import('./components/pages/StudentPortal/Notification'));
const Application = lazy(() => import('./components/pages/StudentPortal/ApplicationStatus'));
const StudentDashboard = lazy(() => import('./components/pages/StudentPortal/Dashboard'));
const Documents = lazy(() => import('./components/pages/StudentPortal/Documents'));
const Profile = lazy(() => import('./components/pages/StudentPortal/Profile'));
const Setting = lazy(() => import('./components/pages/StudentPortal/Setting'));
const LoginPage = lazy(() => import('./components/pages/RegistrarPortal/LoginPage'));
const Dashboard = lazy(() => import('./components/pages/RegistrarPortal/Dashboard'));
const Applications = lazy(() => import('./components/pages/RegistrarPortal/Applications'));
const ApplicationDetails = lazy(() => import('./components/pages/RegistrarPortal/ApplicationDetails'));
const MyProfile = lazy(() => import('./components/pages/RegistrarPortal/MyProfile'));
const RegistrarSettings = lazy(() => import('./components/pages/RegistrarPortal/RegistrarSettings'));
const StudentRecords = lazy(() => import('./components/pages/RegistrarPortal/StudentRecords'));
const StudentProfile = lazy(() => import('./components/pages/RegistrarPortal/StudentProfile'));
const Sections = lazy(() => import('./components/pages/RegistrarPortal/Sections'));
const Document = lazy(() => import('./components/pages/RegistrarPortal/Documents'));
const DocuStudentProfile = lazy(() => import('./components/pages/RegistrarPortal/DocuStudentProfile'));
const EditContactUs = lazy(() => import('./components/pages/AdminPortal/EditContactUs'));
const EditSchoolEvent = lazy(() => import('./components/pages/AdminPortal/EditSchoolEvent'));
const EditExecutiveBoard = lazy(() => import('./components/pages/AdminPortal/EditExecutiveBoard'));
const EditAcademicSched = lazy(() => import('./components/pages/AdminPortal/EditAcademicSched'));
const EditEnrollment = lazy(() => import('./components/pages/AdminPortal/EditEnrollment'));
const EditStrands = lazy(() => import('./components/pages/AdminPortal/EditStrands'));
const SectionApprovals = lazy(() => import('./components/pages/AdminPortal/SectionApprovals'));
const Billing = lazy(() => import('./components/pages/AdminPortal/Billing'));
const StudentMfa = lazy(() => import('./components/pages/AdminPortal/StudentMfa'));
const AdminLogin = lazy(() => import('./components/pages/AdminPortal/Login'));
const AdminDashboard = lazy(() => import('./components/pages/AdminPortal/Dashboard'));
const AdminProfile = lazy(() => import('./components/pages/AdminPortal/MyProfile'));
const AdminSettings = lazy(() => import('./components/pages/AdminPortal/Settings'));
const StaffProfileSetup = lazy(() => import('./components/pages/StaffProfile/ProfileSetup'));
const MfaSetup = lazy(() => import('./components/pages/StaffProfile/MfaSetup'));
const HeadAdminLogin = lazy(() => import('./components/pages/HeadAdminPortal/Login'));
const HeadAdminAccounts = lazy(() => import('./components/pages/HeadAdminPortal/Accounts'));
const HeadAdminAuditLog = lazy(() => import('./components/pages/HeadAdminPortal/AuditLog'));
const HeadAdminReports = lazy(() => import('./components/pages/HeadAdminPortal/Reports'));
const HeadAdminSystem = lazy(() => import('./components/pages/HeadAdminPortal/SystemUsage'));
const HeadAdminSettings = lazy(() => import('./components/pages/HeadAdminPortal/Settings'));


function App() {
  return (
    <>
    <OfflineBanner />
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-slate-400 text-sm">Loading…</div>}>
    <Routes>
      {/* Send the root URL to the homepage */}
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/SHSOnline" element={<SHSOnlineAdmission />} />
      <Route path="/SHSOnCampus" element={<SHSOnCampus />} />
      <Route path="/Kindergarten" element={<Kindergarten />} />
      <Route path="/ElemOnCampus" element={<ElemOnCampus />} />
      <Route path="/ElemOnline" element={<ElemOnline />} />
      <Route path="/JHSOnCampus" element={<JHSOnCampus />} />
      <Route path="/JHSOnline" element={<JHSOnline />} />
      <Route path="/Calendar" element={<Calendar />} />
      <Route path="/About" element={<About />} />
      <Route path="/StudentPortal/Login" element={<Login />} />
      <Route path="/StudentPortal/Apply" element={<Apply />} />
      <Route path="/StudentPortal/VerifyOtp" element={<VerifyOtp />} />
      <Route path="/StudentPortal/EnrollmentForm" element={<ProtectedRoute allow={['student']}><EnrollmentForm /></ProtectedRoute>} />
      <Route path="/StudentPortal/ForgotPass" element={<ForgotPass />} />
      <Route path="/StudentPortal/ForgotPassOtp" element={<ForgotPassOtp />} />
      <Route path="/StudentPortal/CreateNewPass" element={<CreateNewPass />} />
      <Route path="/StudentPortal/LoginOtp" element={<LoginOtp />} />
      {/* Applicant pages — need login only */}
      <Route path="/StudentPortal/ApplicationStatus" element={<ProtectedRoute allow={['student']}><Application /></ProtectedRoute>} />
      {/* Full Student Portal — only after the Registrar enrolls the student */}
      <Route path="/StudentPortal/Dashboard" element={<ProtectedRoute allow={['student']} requireEnrolled><StudentDashboard /></ProtectedRoute>} />
      <Route path="/StudentPortal/Notifications" element={<ProtectedRoute allow={['student']} requireEnrolled><Notification /></ProtectedRoute>} />
      <Route path="/StudentPortal/Documents" element={<ProtectedRoute allow={['student']} requireEnrolled><Documents /></ProtectedRoute>} />
      <Route path="/StudentPortal/Profile" element={<ProtectedRoute allow={['student']} requireEnrolled><Profile /></ProtectedRoute>} />
      <Route path="/StudentPortal/Settings" element={<ProtectedRoute allow={['student']} requireEnrolled><Setting /></ProtectedRoute>} />
      {/* Registrar portal — login public; ProfileSetup requires login only; the rest require a VERIFIED registrar */}
      <Route path="/RegistrarPortal/Login" element={<LoginPage />} />
      <Route path="/RegistrarPortal/ProfileSetup" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login"><StaffProfileSetup /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Dashboard" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><Dashboard /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Applications" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><Applications /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Applications/:id" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><ApplicationDetails /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Profile" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><MyProfile /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Settings" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><RegistrarSettings /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/StudentRecords" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><StudentRecords /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Student/:studentId" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><StudentProfile /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Sections" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><Sections /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/Documents" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><Document /></ProtectedRoute>} />
      <Route path="/RegistrarPortal/DocuStudentProfile" element={<ProtectedRoute allow={['registrar']} loginPath="/RegistrarPortal/Login" requireVerified><DocuStudentProfile /></ProtectedRoute>} />

      {/* Admin portal — login public; ProfileSetup requires login only; the rest require a VERIFIED admin (headadmin always allowed) */}
      <Route path="/AdminPortal/Login" element={<AdminLogin />} />
      <Route path="/AdminPortal/ProfileSetup" element={<ProtectedRoute allow={['admin']} loginPath="/AdminPortal/Login"><StaffProfileSetup /></ProtectedRoute>} />
      <Route path="/AdminPortal/Dashboard" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminDashboard /></ProtectedRoute>} />
      <Route path="/AdminPortal/Profile" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminProfile /></ProtectedRoute>} />
      <Route path="/AdminPortal/Settings" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminSettings /></ProtectedRoute>} />
      <Route path="/AdminPortal/SectionApprovals" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><SectionApprovals /></ProtectedRoute>} />
      <Route path="/AdminPortal/Billing" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><Billing /></ProtectedRoute>} />
      <Route path="/AdminPortal/StudentMfa" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><StudentMfa /></ProtectedRoute>} />
      <Route path="/AdminPortal/MfaSetup" element={<ProtectedRoute allow={['admin']} loginPath="/AdminPortal/Login" requireVerified skipMfaGate><MfaSetup /></ProtectedRoute>} />
      <Route path="/AdminPortal/EditContactUs" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditContactUs /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditSchoolEvent" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditSchoolEvent /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditExecutiveBoard" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditExecutiveBoard /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditAcademicSched" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditAcademicSched /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditEnrollment" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditEnrollment /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditStrands" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditStrands /></AdminLayout></ProtectedRoute>} />

      {/* HeadAdmin portal — login public; management pages require the headadmin role */}
      <Route path="/HeadAdminPortal/Login" element={<HeadAdminLogin />} />
      <Route path="/HeadAdminPortal/Accounts" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login"><HeadAdminAccounts /></ProtectedRoute>} />
      <Route path="/HeadAdminPortal/AuditLog" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login"><HeadAdminAuditLog /></ProtectedRoute>} />
      <Route path="/HeadAdminPortal/Reports" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login"><HeadAdminReports /></ProtectedRoute>} />
      <Route path="/HeadAdminPortal/System" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login"><HeadAdminSystem /></ProtectedRoute>} />
      <Route path="/HeadAdminPortal/MfaSetup" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login" skipMfaGate><MfaSetup /></ProtectedRoute>} />
      <Route path="/HeadAdminPortal/Settings" element={<ProtectedRoute allow={['headadmin']} loginPath="/HeadAdminPortal/Login"><HeadAdminSettings /></ProtectedRoute>} />

      {/* Any unknown URL falls back to the homepage */}
      <Route path="*" element={<Navigate to="/Home" replace />} />
    </Routes>
    </Suspense>
    </>
  )
}

export default App