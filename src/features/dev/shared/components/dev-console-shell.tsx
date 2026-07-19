"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { ProjectSwitcher } from "@/shared/projects/project-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { ProjectContextStrip } from "@/shared/components/journey";
import { IconFolder, IconGitHub, IconHome, IconMessageCircle, IconSettings, IconUsers } from "@/shared/components/icons";

export const DEV_NAV: ShellNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconHome size={17} /> },
  { id: "projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project"] },
  { id: "groups", label: "Groups", icon: <IconUsers size={17} /> },
  { id: "repositories", label: "Repositories", icon: <IconGitHub size={17} /> },
  { id: "messages", label: "Messages", icon: <IconMessageCircle size={17} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

export const DEV_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  project: "Projects",
  groups: "Groups",
  repositories: "Repositories",
  messages: "Messages",
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
        <ProjectContextStrip role="dev" />
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
