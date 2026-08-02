"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { SelectedTeamWorkspaceProvider, useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import { TeamWorkspaceSwitcher } from "@/shared/projects/team-workspace-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { ProjectContextStrip } from "@/shared/components/journey";
import { IconBriefcase, IconFolder, IconHome, IconMail, IconSettings, IconUsers } from "@/shared/components/icons";

const PM_NAV: ShellNavItem[] = [
  { id: "projects", label: "Home", icon: <IconHome size={17} /> },
  // Clients sits above Projects: work is reached through the company it belongs to.
  { id: "clients", label: "Clients", icon: <IconBriefcase size={17} />, aliases: ["client"] },
  { id: "workspace-projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project", "orchestrate"] },
  { id: "inquiries", label: "Inquiries", icon: <IconMail size={17} />, aliases: ["inquiry"] },
  { id: "groups", label: "Teams", icon: <IconUsers size={17} />, aliases: ["team"] },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

const TITLES: Record<string, string> = {
  projects: "Home",
  project: "Projects",
  orchestrate: "Projects",
  clients: "Clients",
  client: "Clients",
  inquiries: "Inquiries",
  inquiry: "Inquiries",
  groups: "Teams",
  team: "Team workspace",
  "workspace-projects": "Projects",
  settings: "Settings",
};

export function PMConsoleShell({ children }: { children: ReactNode }) {
  return (
    <SelectedTeamWorkspaceProvider storageKey="devflow.pm.selectedTeamWorkspaceId">
      <PMConsoleWorkspace>{children}</PMConsoleWorkspace>
    </SelectedTeamWorkspaceProvider>
  );
}

function PMConsoleWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { selectedTeamId } = useSelectedTeamWorkspace();
  const showProjectContext =
    !pathname.startsWith("/pm/groups") &&
    !pathname.startsWith("/pm/team/") &&
    !pathname.startsWith("/pm/project/") &&
    !pathname.startsWith("/pm/workspace-projects");

  return (
    <SelectedProjectProvider storageKey="devflow.pm.selectedProjectId" groupId={selectedTeamId}>
      <AppShell
        rootLabel="PM"
        basePath="/pm"
        rolePill="PM"
        nav={PM_NAV}
        titles={TITLES}
        defaultRoute="projects"
        searchPlaceholder="Search projects, clients, inquiries, developers…"
        showSearch={false}
        showOnlineDot
        hoverExpandSidebar
        brandInTopbar
        sidebarHeader={<></>}
        rightSlot={
          <>
            <TeamWorkspaceSwitcher compact />
            <DevFlowNotificationBell />
          </>
        }
      >
        {showProjectContext && <ProjectContextStrip role="pm" />}
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
