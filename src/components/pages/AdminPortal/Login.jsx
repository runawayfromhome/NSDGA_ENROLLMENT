// Admin login — reuses the shared staff LoginForm (student styling + real auth).
import LoginForm from '../../../auth/LoginForm';

const AdminLogin = () => (
  <LoginForm
    portalName="Admin Portal"
    subtitle="Sign in to manage website content and school information."
  />
);

export default AdminLogin;
