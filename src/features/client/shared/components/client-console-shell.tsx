"use client";

import { type ReactNode } from "react";
import { AppShell, type ShellNavItem } from "@/shared/components/layout/app-shell";
import { SelectedProjectProvider, useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { ProjectSwitcher } from "@/shared/projects/project-switcher";
import { DevFlowNotificationBell } from "@/shared/components/notifications/devflow-notification-bell";
import { ProjectContextStrip } from "@/shared/components/journey";
import { devflowLifecycleView } from "@/shared/utils/devflow-projects";
import { IconHome, IconLayout } from "@/shared/components/icons";

const CLIENT_NAV: ShellNavItem[] = [
  { id: "dashboard", label: "Project", icon: <IconHome size={18} /> },
  { id: "product", label: "Deliverables", icon: <IconLayout size={18} /> },
];

const TITLES: Record<string, string> = {
  dashboard: "Project",
  product: "Deliverables",
};

function ClientEngagement() {
  const { selectedProject } = useSelectedDevFlowProject();
  const lifecycle = devflowLifecycleView(selectedProject);
  const engagement = selectedProject
    ? { name: selectedProject.companyName, code: selectedProject.id, status: lifecycle.label }
    : { name: "No assigned project", code: "Awaiting PM assignment", status: "Unassigned" };

  return (
    <div className="cs-engagement">
      <div className="cs-engagement-label">Current engagement</div>
      <div className="cs-engagement-name">{engagement.name}</div>
      <div className="cs-engagement-meta mono">{engagement.code}</div>
      <div className="cs-engagement-status">
        <span className="dot" /> {engagement.status}
      </div>
    </div>
  );
}

export function ClientConsoleShell({ children }: { children: ReactNode }) {
  return (
    <SelectedProjectProvider storageKey="devflow.client.selectedProjectId">
      <AppShell
        rootLabel="Client"
        basePath="/client"
        rolePill="Client"
        nav={CLIENT_NAV}
        titles={TITLES}
        defaultRoute="dashboard"
        searchPlaceholder="Search deliverables, updates…"
        showOnlineDot
        sidebarHeader={<ClientEngagement />}
        rightSlot={
          <>
            <ProjectSwitcher compact />
            <DevFlowNotificationBell />
          </>
        }
      >
        <ProjectContextStrip role="client" />
        {children}
      </AppShell>
    </SelectedProjectProvider>
  );
}
