// Student → My Activity. The student's own audit trail (applications, documents,
// security) read via the self-select RLS policy. Shared feed component.
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import MyActivity from '../../MyActivity';

const Activity = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <StudentSidebar activePage="Activity" />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={false} />
      <MyActivity title="My Activity" subtitle="Your applications, documents, and account activity — newest first." />
    </div>
  </div>
);

export default Activity;
