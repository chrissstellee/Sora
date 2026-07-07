import { AuthFooter } from "./auth-footer";
import { AuthLogo } from "./auth-logo";

import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="mb-8">
          <AuthLogo />
        </div>

        <div className="flex w-full flex-col items-center">{children}</div>
      </div>

      <AuthFooter />
    </div>
  );
}
