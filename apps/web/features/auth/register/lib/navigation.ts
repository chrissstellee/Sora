import type { AuthState } from "../../hooks/use-auth";

export function shouldRedirectFromRegister(authState: AuthState, isLoading: boolean): boolean {
  if (isLoading) return false;

  return !["onboarding-required", "verifying", "authenticated"].includes(authState);
}
