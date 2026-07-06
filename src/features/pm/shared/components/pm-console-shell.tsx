"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { ProjectSwitcher } from "@/shared/projects/project-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { ProjectContextStrip } from "@/shared/components/journey";
import { IconFolder, IconSettings } from "@/shared/components/icons";

const PM_NAV: ShellNavItem[] = [
  { id: "projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project", "orchestrate"] },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

const TITLES: Record<string, string> = {
  projects: "Projects",
  project: "Projects",
  orchestrate: "Projects",
  settings: "Settings",
};

export function PMConsoleShell({ children }: { children: ReactNode }) {
  return (
    <SelectedProjectProvider storageKey="devflow.pm.selectedProjectId">
      <AppShell
        rootLabel="PM"
        basePath="/pm"
        rolePill="PM"
        nav={PM_NAV}
        titles={TITLES}
        defaultRoute="projects"
        searchPlaceholder="Search projects, clients, inquiries, developers…"
        showSearchHint
        showOnlineDot
        personaName="Project Manager"
        personaMeta="Alphaexplora · Internal"
        rightSlot={
          <>
            <ProjectSwitcher compact />
            <DevFlowNotificationBell />
          </>
        }
      >
        <ProjectContextStrip role="pm" />
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
