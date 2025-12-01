"use client";

import * as React from "react";
import { Suspense } from "react";
import { IconChartBar, IconDashboard, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ViewpointGroupSelectorWrapper } from "./viewpoint-group-selector-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard,
  },
  {
    title: "Elections",
    url: "/elections",
    icon: IconChartBar,
  },
  {
    title: "Jurisdictions",
    url: "/jurisdictions",
    icon: IconUsers,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <span className="text-base font-semibold">Sway Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense
              fallback={
                <div className="space-y-2 px-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              }
            >
              <ViewpointGroupSelectorWrapper />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link href={item.url}>
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
