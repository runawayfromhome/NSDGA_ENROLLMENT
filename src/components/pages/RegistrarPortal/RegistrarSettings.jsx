// Registrar account settings — Change Password + Multi-Factor Authentication.
import Header from '../../Header';
import RegistrarSidebar from '../../RegistrarSidebar';
import ChangePassword from '../../ChangePassword';
import MfaSettings from '../../MfaSettings';

const RegistrarSettings = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <RegistrarSidebar />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={true} />
      <main className="p-6 md:p-12 max-w-[1200px] w-full space-y-10">
        <h1 className="text-3xl font-bold text-slate-800">Account Settings &amp; Security</h1>
        <ChangePassword />
        <MfaSettings />
      </main>
    </div>
  </div>
);

export default RegistrarSettings;
