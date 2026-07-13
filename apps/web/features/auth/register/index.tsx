import { AuthCard } from "../components/auth-card";
import { AUTH_CARD } from "../constants/auth";
import { RegisterForm } from "./components/register-form";

export function CreateAccountPage() {
  return (
    <AuthCard title={AUTH_CARD.register.title} description={AUTH_CARD.register.description}>
      <RegisterForm />
    </AuthCard>
  );
}
