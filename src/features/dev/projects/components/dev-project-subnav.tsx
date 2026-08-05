"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
 */
export type DevProjectSectionId =
  | "overview"
  | "setup"
  | "tasks"
  | "work-orders"
  | "orchestration"
  | "gates"
  | "orchestrator"
  | "artifacts"
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
      { value: "tasks", label: "Tasks", icon: <IconCheckCircle size={15} /> },
      { value: "work-orders", label: "Work orders", icon: <IconWorkflow size={15} /> },
      { value: "orchestration", label: "Orchestration", icon: <IconCpu size={15} /> },
      { value: "orchestrator", label: "Orchestrator", icon: <IconCode size={15} /> },
    ],
  },
  {
    label: "Review and delivery",
    items: [
      { value: "gates", label: "Gate decisions", icon: <IconShield size={15} /> },
      { value: "artifacts", label: "Artifacts", icon: <IconFileText size={15} /> },
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
  activeItem: Exclude<DevProjectSectionId, "orchestrator">;
  onSelect: (item: Exclude<DevProjectSectionId, "orchestrator">) => void;
}) {
  const router = useRouter();

  const selectItem = (item: DevProjectSectionId) => {
    if (item === "orchestrator") {
      router.push("/dev/orchestrator");
      return;
    }
    onSelect(item);
  };

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
              const active = item.value !== "orchestrator" && activeItem === item.value;
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
