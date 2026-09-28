// HeadAdmin account settings — Change Password + Two-Factor Authentication.
import HeadAdminSidebar from '../../HeadAdminSidebar';
import ChangePassword from '../../ChangePassword';
import MfaCard from '../../MfaCard';
import MfaSettings from '../../MfaSettings';

const HeadAdminSettings = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <HeadAdminSidebar />
    <div className="flex-1 lg:ml-64 flex flex-col">
      <main className="px-6 pt-20 pb-8 md:p-12 max-w-[1200px] w-full space-y-10">
        <h1 className="text-3xl font-bold text-slate-800">Account Settings &amp; Security</h1>
        <ChangePassword />
        <div className="max-w-2xl"><MfaCard /></div>
        <MfaSettings />
      </main>
    </div>
  </div>
);

export default HeadAdminSettings;
