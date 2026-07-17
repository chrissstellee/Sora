import { redirect } from "next/navigation";

import { getServerSession } from "@/core/lib/server-session";
import { AppSidebar, Topbar } from "@/features/layout";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/ui/sidebar";

import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession().catch(() => null);
  if (!session) redirect("/login");
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <Topbar />
        <div className="min-w-0 flex-1 px-8 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
