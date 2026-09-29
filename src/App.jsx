import './App.css';


import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/pages/Home';
import SHSOnlineAdmission from './components/pages/SHSOnlineAdmission';
import SHSOnCampus from './components/pages/SHSOnCampus'; // Ensure this file exists
import Kindergarten from './components/pages/Kindergarten';
import ElemOnCampus from './components/pages/ElemOnCampus';
import ElemOnline from './components/pages/ElemOnline';
import JHSOnCampus from './components/pages/JHSOnCampus';
import JHSOnline from './components/pages/JHSOnline';
import Calendar from './components/pages/Calendar';
import About from './components/pages/About';
import Login from './components/pages/StudentPortal/Login';
import Signup from './components/pages/StudentPortal/Signup';
import ForgotPass from './components/pages/StudentPortal/ForgotPass';
import ForgotPassOtp from './components/pages/StudentPortal/ForgotPassOtp';
import CreateNewPass from './components/pages/StudentPortal/CreateNewPass';
import LoginOtp from './components/pages/StudentPortal/LoginOtp';
import Apply from './components/pages/StudentPortal/Apply';
import Notification from './components/pages/StudentPortal/Notification';
import Application from './components/pages/StudentPortal/ApplicationStatus';
import StudentDashboard from './components/pages/StudentPortal/Dashboard';
import Documents from './components/pages/StudentPortal/Documents';
import Profile from './components/pages/StudentPortal/Profile';
import Setting from './components/pages/StudentPortal/Setting'; 
import LoginPage from './components/pages/RegistrarPortal/LoginPage';
import Dashboard from './components/pages/RegistrarPortal/Dashboard';
import Applications from './components/pages/RegistrarPortal/Applications';
import ApplicationDetails from './components/pages/RegistrarPortal/ApplicationDetails';
import MyProfile from './components/pages/RegistrarPortal/MyProfile';
import RegistrarSettings from './components/pages/RegistrarPortal/RegistrarSettings';
import StudentRecords from './components/pages/RegistrarPortal/StudentRecords';
import StudentProfile from './components/pages/RegistrarPortal/StudentProfile';
import Sections from './components/pages/RegistrarPortal/Sections';
import Document from './components/pages/RegistrarPortal/Documents';
import DocuStudentProfile from './components/pages/RegistrarPortal/DocuStudentProfile';
import EditContactUs from './components/pages/AdminPortal/EditContactUs';
import EditSchoolEvent from './components/pages/AdminPortal/EditSchoolEvent';
import EditExecutiveBoard from './components/pages/AdminPortal/EditExecutiveBoard';
import EditAcademicSched from './components/pages/AdminPortal/EditAcademicSched';
import EditEnrollment from './components/pages/AdminPortal/EditEnrollment';
import SectionApprovals from './components/pages/AdminPortal/SectionApprovals';
import Billing from './components/pages/AdminPortal/Billing';
// Auth + staff/head-admin portals
import ProtectedRoute from './auth/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/pages/AdminPortal/Login';
import AdminDashboard from './components/pages/AdminPortal/Dashboard';
import AdminProfile from './components/pages/AdminPortal/MyProfile';
import AdminSettings from './components/pages/AdminPortal/Settings';
import StaffProfileSetup from './components/pages/StaffProfile/ProfileSetup';
import MfaSetup from './components/pages/StaffProfile/MfaSetup';
import HeadAdminLogin from './components/pages/HeadAdminPortal/Login';
import HeadAdminAccounts from './components/pages/HeadAdminPortal/Accounts';
import HeadAdminAuditLog from './components/pages/HeadAdminPortal/AuditLog';
import HeadAdminReports from './components/pages/HeadAdminPortal/Reports';
import HeadAdminSystem from './components/pages/HeadAdminPortal/SystemUsage';
import HeadAdminSettings from './components/pages/HeadAdminPortal/Settings';


function App() {
  return (
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
      <Route path="/StudentPortal/Signup" element={<Signup />} />
      <Route path="/StudentPortal/ForgotPass" element={<ForgotPass />} />
      <Route path="/StudentPortal/ForgotPassOtp" element={<ForgotPassOtp />} />
      <Route path="/StudentPortal/CreateNewPass" element={<CreateNewPass />} />
      <Route path="/StudentPortal/LoginOtp" element={<LoginOtp />} />
      <Route path="/StudentPortal/Notifications" element={<Notification />} />
      <Route path="/StudentPortal/Dashboard" element={<StudentDashboard />} />
      <Route path="/StudentPortal/ApplicationStatus" element={<Application />} />
      <Route path="/StudentPortal/Documents" element={<Documents />} />
      <Route path="/StudentPortal/Profile" element={<Profile />} />
      <Route path="/StudentPortal/Settings" element={<Setting />} />
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
      <Route path="/AdminPortal/MfaSetup" element={<ProtectedRoute allow={['admin']} loginPath="/AdminPortal/Login" requireVerified skipMfaGate><MfaSetup /></ProtectedRoute>} />
      <Route path="/AdminPortal/EditContactUs" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditContactUs /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditSchoolEvent" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditSchoolEvent /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditExecutiveBoard" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditExecutiveBoard /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditAcademicSched" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditAcademicSched /></AdminLayout></ProtectedRoute>} />
      <Route path="/AdminPortal/EditEnrollment" element={<ProtectedRoute allow={['admin', 'headadmin']} loginPath="/AdminPortal/Login" requireVerified><AdminLayout><EditEnrollment /></AdminLayout></ProtectedRoute>} />

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
  )
}

export default App