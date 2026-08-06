"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { ProjectSwitcher } from "@/shared/projects/project-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { IconCpu, IconFolder, IconHome, IconMessageCircle, IconSettings, IconUsers } from "@/shared/components/icons";

export const DEV_NAV: ShellNavItem[] = [
  { id: "dashboard", label: "Home", icon: <IconHome size={17} /> },
  // Orchestrator used to sit here as a console-level destination with its own project picker.
  // Agents only ever run against one project, so the run belongs inside that project rather
  // than behind a global entry point that asks which project you meant.
  { id: "projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project", "orchestrate"] },
  { id: "messages", label: "Messages", icon: <IconMessageCircle size={17} /> },
  { id: "groups", label: "Teams", icon: <IconUsers size={17} />, aliases: ["team", "repositories"] },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

export const DEV_TITLES: Record<string, string> = {
  dashboard: "Home",
  projects: "Projects",
  project: "Projects",
  // Reached from inside a project, so the crumb keeps saying Projects rather than introducing
  // a top-level section that no longer exists in the nav.
  orchestrate: "Projects",
  messages: "Messages",
  groups: "Teams",
  team: "Teams",
  repositories: "Teams",
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
        titles={DEV_TITLES}
        defaultRoute="dashboard"
        searchPlaceholder="Search tasks, repos, files, agents…"
        showSearch={false}
        showOnlineDot
        showSupport={false}
        showSecurity={false}
        hoverExpandSidebar
        brandInTopbar
        sidebarHeader={<></>}
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
