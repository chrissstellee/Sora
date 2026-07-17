import { AuthCard } from "../components/auth-card";
import { EnterpriseNotice } from "../components/enterprise-notice";
import { AUTH_CARD } from "../constants/auth";
import { LoginForm } from "./components/login-form";

export function LoginPage() {
  return (
    <>
      <AuthCard title={AUTH_CARD.login.title} description={AUTH_CARD.login.description}>
        <LoginForm />
      </AuthCard>

      <EnterpriseNotice />
    </>
  );
}
