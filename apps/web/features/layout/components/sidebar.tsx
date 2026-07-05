"use client";

import { LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAME } from "@/core/constants";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";

import { NAV_SECTIONS } from "../constants/nav-links";

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="gap-6 px-3 pt-4 pb-3">
        <div
          className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "justify-between")}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/sora-logo.png"
              alt="Sora"
              className="size-8 shrink-0 rounded-md object-cover"
            />
            {!isCollapsed && (
              <div className="flex flex-col gap-1 leading-none">
                <span className="font-display text-xl font-semibold tracking-tight">
                  {APP_NAME}
                </span>
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Enterprise RWA Node
                </span>
              </div>
            )}
          </Link>
          <SidebarTrigger />
        </div>

        <Button
          variant="gradient"
          className="w-full justify-center group-data-[collapsible=icon]:px-0"
        >
          <Plus className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Mint New Asset</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => {
                  const isActive = pathname === link.href;

                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={link.label}
                        className="border-l-3 border-transparent pl-3 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-foreground"
                      >
                        <Link href={link.href}>
                          <link.icon />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border px-1.5 py-3">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log Out">
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
