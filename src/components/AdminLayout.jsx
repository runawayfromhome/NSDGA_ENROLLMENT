// src/components/AdminLayout.jsx
// Wraps any Admin page with the AdminSidebar so the existing content-edit pages
// become part of a connected portal WITHOUT editing each page individually.
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => (
  <div className="flex min-h-screen bg-[#F3F4F6]">
    <AdminSidebar />
    <div className="flex-1 lg:ml-64 min-w-0">{children}</div>
  </div>
);

export default AdminLayout;
