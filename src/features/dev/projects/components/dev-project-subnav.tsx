"use client";

import type { ReactNode } from "react";
import {
  IconActivity,
  IconCheckCircle,
  IconCode,
  IconCpu,
  IconFileText,
  IconRocket,
  IconShield,
  IconUsers,
  IconWorkflow,
} from "@/shared/components/icons";

/**
 * Sections of a project a developer can open.
 *
 * Setup, Work orders, Orchestration and Gates arrived here from the PM console: prompting,
 * kickoff, run control and both approval gates are the developer's, and the backend enforces
 * it with @Roles(DEV, ADMIN). "handoffs" was the old read-only view of work orders and is
 * replaced by the writable "work-orders" section.
 *
 * There is no "orchestrator" entry any more. It used to jump out to a console-level workbench
 * that asked which project to run against — from inside a project, which had already answered
 * that. Agents only ever run against one project, so the run stays here under "Orchestration".
 */
export type DevProjectSectionId =
  | "overview"
  | "setup"
  | "issues"
  | "work-orders"
  | "orchestration"
  | "gates"
  | "artifacts"
  | "output"
  | "members"
  | "activity";

type DevProjectSectionItem = {
  value: DevProjectSectionId;
  label: string;
  icon: ReactNode;
};

const DEV_PROJECT_SECTIONS: Array<{ label: string; items: DevProjectSectionItem[] }> = [
  {
    label: "Project",
    items: [
      { value: "overview", label: "Overview", icon: <IconActivity size={15} /> },
    ],
  },
  {
    label: "Delivery workflow",
    items: [
      { value: "setup", label: "Setup", icon: <IconRocket size={15} /> },
      // The same board the PM console shows, writable in both. Work orders keeps its own
      // section below because dispatch and retry are the developer's and the board has no
      // affordance for them.
      { value: "issues", label: "Issues", icon: <IconCheckCircle size={15} /> },
      { value: "work-orders", label: "Work orders", icon: <IconWorkflow size={15} /> },
      { value: "orchestration", label: "Orchestration", icon: <IconCpu size={15} /> },
    ],
  },
  {
    label: "Review and delivery",
    items: [
      { value: "gates", label: "Gate decisions", icon: <IconShield size={15} /> },
      { value: "artifacts", label: "Artifacts", icon: <IconFileText size={15} /> },
      // Was the standalone /dev/orchestrator/output/[projectId] route, orphaned when the
      // console-level orchestrator that linked to it was removed.
      { value: "output", label: "Run output", icon: <IconCode size={15} /> },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { value: "members", label: "Members", icon: <IconUsers size={15} /> },
      { value: "activity", label: "Timeline", icon: <IconActivity size={15} /> },
    ],
  },
];

export function DevProjectSubnav({
  projectName,
  activeItem,
  onSelect,
}: {
  projectName: string;
  activeItem: DevProjectSectionId;
  onSelect: (item: DevProjectSectionId) => void;
}) {
  // Every section is now in-project, so selecting one is plain state — no entry needs to
  // navigate out of the project any more.
  const selectItem = onSelect;

  return (
    <aside className="pm-project-subnav" aria-label="Project contents">
      <div className="pm-project-subnav-title">
        <strong>{projectName}</strong>
        <span>Project contents</span>
      </div>

      <nav className="pm-project-subnav-groups">
        {DEV_PROJECT_SECTIONS.map((group) => (
          <div key={group.label} className="pm-project-subnav-group">
            <span className="pm-project-subnav-label">{group.label}</span>
            {group.items.map((item) => {
              const active = activeItem === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`pm-project-subnav-item${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => selectItem(item.value)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
