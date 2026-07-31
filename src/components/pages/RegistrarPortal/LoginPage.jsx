// Registrar login — reuses the shared staff LoginForm (student styling + real auth).
import LoginForm from '../../../auth/LoginForm';

const LoginPage = () => (
  <LoginForm
    portalName="Registrar Portal"
    subtitle="Sign in to review applications and manage student records."
  />
);

export default LoginPage;
