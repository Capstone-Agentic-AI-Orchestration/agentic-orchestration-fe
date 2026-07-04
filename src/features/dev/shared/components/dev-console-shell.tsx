"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { ProjectSwitcher } from "@/shared/projects/project-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { IconCpu, IconFolder, IconHome, IconSettings } from "@/shared/components/icons";

const DEV_NAV: ShellNavItem[] = [
  { id: "dashboard", label: "Queue", icon: <IconHome size={17} /> },
  { id: "projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project"] },
  { id: "orchestrator", label: "Live run", icon: <IconCpu size={17} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

const TITLES: Record<string, string> = {
  dashboard: "Queue",
  projects: "Projects",
  project: "Projects",
  orchestrator: "Live run",
  settings: "Settings",
};

export function DevConsoleShell({ children }: { children: ReactNode }) {
  return (
    <SelectedProjectProvider storageKey="devflow.dev.selectedProjectId">
      <AppShell
        rootLabel="Dev"
        basePath="/dev"
        rolePill="Dev"
        nav={DEV_NAV}
        titles={TITLES}
        defaultRoute="dashboard"
        searchPlaceholder="Search tasks, repos, files, agents…"
        showSearchHint
        showOnlineDot
        personaName="Developer"
        personaMeta="Alphaexplora · Internal"
        rightSlot={
          <>
            <ProjectSwitcher compact />
            <DevFlowNotificationBell />
          </>
        }
      >
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
