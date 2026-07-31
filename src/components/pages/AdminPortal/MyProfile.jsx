// Admin "My Profile" — shows the logged-in admin's own information.
import AdminSidebar from '../../AdminSidebar';
import StaffProfileView from '../../StaffProfileView';

const AdminProfile = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <AdminSidebar />
    <div className="flex-1 lg:ml-64 flex flex-col">
      <StaffProfileView />
    </div>
  </div>
);

export default AdminProfile;
