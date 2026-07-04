"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { IconCreditCard, IconDatabase, IconFolder, IconHome, IconSettings } from "@/shared/components/icons";

const ADMIN_NAV: ShellNavItem[] = [
  { id: "overview", label: "Fleet", icon: <IconHome size={17} /> },
  { id: "projects", label: "Projects", icon: <IconFolder size={17} /> },
  { id: "providers", label: "Provider health", icon: <IconDatabase size={17} /> },
  { id: "cost", label: "Budgets", icon: <IconCreditCard size={17} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

const TITLES: Record<string, string> = {
  overview: "Fleet",
  projects: "Projects",
  providers: "Provider health",
  cost: "Budgets",
  settings: "Settings",
};

export function AdminConsoleShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rootLabel="Admin"
      basePath="/admin"
      rolePill="Admin"
      nav={ADMIN_NAV}
      titles={TITLES}
      defaultRoute="overview"
      searchPlaceholder="Search projects, providers, budgets…"
      personaName="Platform Admin"
      personaMeta="Alphaexplora · Control Plane"
    >
      {children}
    </AppShell>
  );
}
