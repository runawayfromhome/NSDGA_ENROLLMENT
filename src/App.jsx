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
import EnrollmentForm from './components/pages/StudentPortal/EnrollmentForm';
import Notification from './components/pages/StudentPortal/Notification';
import Application from './components/pages/StudentPortal/ApplicationStatus';
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
import Document from './components/pages/RegistrarPortal/Documents';
import DocuStudentProfile from './components/pages/RegistrarPortal/DocuStudentProfile';
import EditContactUs from './components/pages/AdminEdit/EditContactUs';
import EditSchoolEvent from './components/pages/AdminEdit/EditSchoolEvent';
import EditExecutiveBoard from './components/pages/AdminEdit/EditExecutiveBoard';
import EditAcademicSched from './components/pages/AdminEdit/EditAcademicSched';
  

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
      <Route path="/StudentPortal/Signup" element={<Signup />} />
      <Route path="/StudentPortal/ForgotPass" element={<ForgotPass />} />
      <Route path="/StudentPortal/ForgotPassOtp" element={<ForgotPassOtp />} />
      <Route path="/StudentPortal/CreateNewPass" element={<CreateNewPass />} />
      <Route path="/StudentPortal/LoginOtp" element={<LoginOtp />} />
      <Route path="/StudentPortal/EnrollmentForm" element={<EnrollmentForm />} />
      <Route path="/StudentPortal/Notifications" element={<Notification />} />
      <Route path="/StudentPortal/ApplicationStatus" element={<Application />} />
      <Route path="/StudentPortal/Documents" element={<Documents />} />
      <Route path="/StudentPortal/Profile" element={<Profile />} />
      <Route path="/StudentPortal/Settings" element={<Setting />} />
      <Route path="/RegistrarPortal/Login" element={<LoginPage />} />
      <Route path="/RegistrarPortal/Dashboard" element={<Dashboard />} />
      <Route path="/RegistrarPortal/Applications" element={<Applications />} />
      <Route path="/RegistrarPortal/Applications/:id" element={<ApplicationDetails />} />
      <Route path="/RegistrarPortal/Profile" element={<MyProfile />} />
      <Route path="/RegistrarPortal/Settings" element={<RegistrarSettings />} />
      <Route path="/RegistrarPortal/StudentRecords" element={<StudentRecords />} />
      <Route path="/RegistrarPortal/Documents" element={<Document />} />
      <Route path="/RegistrarPortal/DocuStudentProfile" element={<DocuStudentProfile />} />
      <Route path="/AdminEdit/EditContactUs" element={<EditContactUs />} />
      <Route path="/AdminEdit/EditSchoolEvent" element={<EditSchoolEvent />} />
      <Route path="/AdminEdit/EditExecutiveBoard" element={<EditExecutiveBoard />} />
      <Route path="/AdminEdit/EditAcademicSched" element={<EditAcademicSched />} />

      {/* Any unknown URL falls back to the homepage */}
      <Route path="*" element={<Navigate to="/Home" replace />} />
    </Routes>
  )
}

export default App