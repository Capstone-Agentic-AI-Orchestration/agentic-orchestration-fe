"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity,
  IconCheckCircle,
  IconCpu,
  IconFileText,
  IconUsers,
  IconWorkflow,
} from "@/shared/components/icons";

export type DevProjectSectionId =
  | "overview"
  | "tasks"
  | "handoffs"
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
      { value: "tasks", label: "Tasks", icon: <IconCheckCircle size={15} /> },
      { value: "handoffs", label: "Handoffs", icon: <IconWorkflow size={15} /> },
      { value: "orchestrator", label: "Orchestrator", icon: <IconCpu size={15} /> },
    ],
  },
  {
    label: "Review and delivery",
    items: [
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
