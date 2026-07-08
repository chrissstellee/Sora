import { AppSidebar, Topbar } from "@/features/layout";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/ui/sidebar";

import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
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
