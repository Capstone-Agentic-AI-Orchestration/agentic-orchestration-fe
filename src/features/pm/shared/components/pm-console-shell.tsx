"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider } from "@/shared/projects/selected-project-context";
import { SelectedTeamWorkspaceProvider, useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import { PMAccountMenu } from "@/features/pm/shared/components/pm-account-menu";
import { useDevFlowInquiries } from "@/shared/hooks/use-devflow-inquiries";
import { useDevFlowNotifications } from "@/shared/hooks/use-devflow-notifications";
import { IconBriefcase, IconCpu, IconFolder, IconInbox, IconSettings, IconUsers } from "@/shared/components/icons";

/**
 * PM-owned destinations are kept in the persistent left panel.
 *
 * Inquiries folded back into Clients as a section of it: an inquiry is a company you have not
 * said yes to yet, and approving one creates the client, so they were never two jobs. The
 * new-inquiry count rides on Clients now, since that is the door you go through to reach it.
 *
 * Agents is the orchestration itself — the specialists that actually build the work — so it
 * sits with Projects rather than under Settings.
 */
export function buildPMNav(newInquiryCount = 0, unreadCount = 0): ShellNavItem[] {
  return [
    // Inbox leads: it is the only destination that answers "did anything happen while I was away",
    // so it is what you check first and what everything else follows from.
    { id: "inbox", label: "Inbox", icon: <IconInbox size={17} />, badge: unreadCount || undefined },
    { id: "clients", label: "Clients", icon: <IconBriefcase size={17} />, aliases: ["client", "inquiries", "inquiry"], badge: newInquiryCount || undefined },
    { id: "projects", label: "Projects", icon: <IconFolder size={17} />, aliases: ["project", "workspace-projects", "repositories", "repository"] },
    { id: "agents", label: "Agents", icon: <IconCpu size={17} /> },
    { id: "groups", label: "Teams", icon: <IconUsers size={17} />, aliases: ["team"] },
    { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
  ];
}

const TITLES: Record<string, string> = {
  projects: "Projects",
  project: "Projects",
  orchestrate: "Projects",
  "workspace-projects": "Projects",
  repositories: "Projects",
  repository: "Projects",
  clients: "Clients",
  client: "Clients",
  inquiries: "Clients",
  inquiry: "Clients",
  inbox: "Inbox",
  agents: "Agents",
  groups: "Teams",
  team: "Team workspace",
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
  const { selectedTeamId } = useSelectedTeamWorkspace();
  const notifications = useDevFlowNotifications();
  const { inquiries: newInquiries } = useDevFlowInquiries("NEW");
  const nav = buildPMNav(newInquiries.length, notifications.unreadCount);

  return (
    <SelectedProjectProvider storageKey="devflow.pm.selectedProjectId" groupId={selectedTeamId}>
      <AppShell
        rootLabel="PM"
        basePath="/pm"
        rolePill="PM"
        nav={nav}
        titles={TITLES}
        defaultRoute="projects"
        searchPlaceholder="Search projects, clients, inquiries, developers…"
        showSearch={false}
        showOnlineDot
        shellVariant="pm"
        sidebarHeader={<></>}
        hoverExpandSidebar
        brandInTopbar
        workspaceTabs
        // A fresh tab lands on Inbox — the one destination you open to see what changed,
        // rather than dropping you back onto whatever you were already looking at.
        newTabTarget="inbox"
        accountMenuInSidebar
        accountMenuAtTop
        menuSlot={<PMAccountMenu />}
      >
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
