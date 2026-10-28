// Admin → My Activity. The admin's own audit trail (section approvals, content
// edits, student account recovery, security) via the self-select RLS policy.
import AdminSidebar from '../../AdminSidebar';
import MyActivity from '../../MyActivity';

const Activity = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <AdminSidebar />
    <div className="flex-1 lg:ml-64 flex flex-col">
      <MyActivity title="My Activity" subtitle="Your section approvals, content edits, and account actions — newest first." />
    </div>
  </div>
);

export default Activity;
 