// Registrar → History. The registrar's own activity feed (application reviews,
// documents, sectioning, lifecycle) via the self-select RLS policy. Uses the
// shared MyActivity feed so Student / Registrar / Admin stay visually consistent.
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import MyActivity from '../../MyActivity';

const History = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <RegistrarSidebar activePage="History" />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={false} />
      <MyActivity title="My Activity History" subtitle="Your application reviews, documents, and sectioning — newest first." />
    </div>
  </div>
);

export default History;
