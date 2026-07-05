import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthLogo } from "@/features/auth/components/auth-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
      <div className="mb-10">
        <AuthLogo />
      </div>
      <div className="flex w-full flex-col items-center">{children}</div>
      <AuthFooter />
    </div>
  );
}
