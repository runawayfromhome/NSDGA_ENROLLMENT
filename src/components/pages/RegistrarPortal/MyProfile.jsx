// Registrar "My Profile" — shows the logged-in registrar's own information.
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import StaffProfileView from '../../StaffProfileView';

const MyProfile = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <RegistrarSidebar />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={false} />
      <StaffProfileView />
    </div>
  </div>
);

export default MyProfile;
