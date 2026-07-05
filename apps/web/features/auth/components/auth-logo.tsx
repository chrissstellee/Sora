import { APP_NAME } from "@/core/constants";

export function AuthLogo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <img src="/sora-logo.png" alt="Sora Logo" className="h-12 w-12 rounded-md object-cover" />
      <span className="font-display text-3xl font-bold tracking-tight">{APP_NAME}</span>
    </div>
  );
}
