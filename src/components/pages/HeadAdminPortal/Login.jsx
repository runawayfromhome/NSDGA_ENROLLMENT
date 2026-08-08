// HeadAdmin login — reuses the shared staff LoginForm (student styling + real auth).
import LoginForm from '../../../auth/LoginForm';

const HeadAdminLogin = () => (
  <LoginForm
    portalName="Head Administrator"
    role="headadmin"
    subtitle="Sign in to manage accounts, audit logs and school-wide reports."
  />
);

export default HeadAdminLogin;
