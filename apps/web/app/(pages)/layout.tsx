import { AppSidebar, Topbar } from "@/features/layout";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/ui/sidebar";

import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
