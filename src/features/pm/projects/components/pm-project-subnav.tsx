"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconClipboard,
  IconCpu,
  IconFileText,
  IconFolder,
  IconMessageCircle,
  IconRocket,
  IconSettings,
  IconShield,
  IconUsers,
  IconWorkflow,
} from "@/shared/components/icons";

export type PMProjectSectionId =
  | "overview"
  | "intake"
  | "setup"
  | "tasks"
  | "work-orders"
  | "orchestration"
  | "gates"
  | "artifacts"
  | "delivery-review"
  | "messages"
  | "documents"
  | "members"
  | "timeline"
  | "settings";

type ProjectSectionItem = {
  value: PMProjectSectionId;
  label: string;
  icon: ReactNode;
};

const PROJECT_SECTIONS: Array<{ label: string; items: ProjectSectionItem[] }> = [
  {
    label: "Project",
    items: [
      { value: "overview", label: "Overview", icon: <IconActivity size={15} /> },
      { value: "intake", label: "Intake brief", icon: <IconClipboard size={15} /> },
    ],
  },
  {
    label: "Delivery workflow",
    items: [
      { value: "setup", label: "Setup", icon: <IconRocket size={15} /> },
      { value: "tasks", label: "Tasks", icon: <IconCheckCircle size={15} /> },
      { value: "work-orders", label: "Work orders", icon: <IconWorkflow size={15} /> },
      { value: "orchestration", label: "Orchestration", icon: <IconCpu size={15} /> },
    ],
  },
  {
    label: "Review and delivery",
    items: [
      { value: "gates", label: "Gate decisions", icon: <IconShield size={15} /> },
      { value: "artifacts", label: "Artifacts", icon: <IconFileText size={15} /> },
      { value: "delivery-review", label: "Delivery review", icon: <IconCheck size={15} /> },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { value: "messages", label: "Client messages", icon: <IconMessageCircle size={15} /> },
      { value: "documents", label: "Client documents", icon: <IconFolder size={15} /> },
      { value: "members", label: "Members", icon: <IconUsers size={15} /> },
      { value: "timeline", label: "Timeline", icon: <IconCalendar size={15} /> },
    ],
  },
  {
    label: "Configuration",
    items: [
      { value: "settings", label: "Settings", icon: <IconSettings size={15} /> },
    ],
  },
];

export const PM_PROJECT_SECTION_IDS = new Set<PMProjectSectionId>(
  PROJECT_SECTIONS.flatMap((section) => section.items.map((item) => item.value)),
);

export function PMProjectSubnav({
  projectId,
  projectName,
  activeItem,
  onSelect,
}: {
  projectId: string;
  projectName: string;
  activeItem: PMProjectSectionId;
  onSelect?: (item: PMProjectSectionId) => void;
}) {
  const router = useRouter();

  const selectItem = (item: PMProjectSectionId) => {
    if (item === "intake") {
      if (activeItem !== "intake") router.push(`/pm/project/${projectId}/intake`);
      return;
    }

    if (onSelect) {
      onSelect(item);
      return;
    }

    const query = item === "overview" ? "" : `?tab=${encodeURIComponent(item)}`;
    router.push(`/pm/project/${projectId}${query}`);
  };

  return (
    <aside className="pm-project-subnav" aria-label="Project contents">
      <div className="pm-project-subnav-title">
        <strong>{projectName}</strong>
        <span>Project contents</span>
      </div>

      <nav className="pm-project-subnav-groups">
        {PROJECT_SECTIONS.map((group) => (
          <div key={group.label} className="pm-project-subnav-group">
            <span className="pm-project-subnav-label">{group.label}</span>
            {group.items.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`pm-project-subnav-item${activeItem === item.value ? " is-active" : ""}`}
                aria-current={activeItem === item.value ? "page" : undefined}
                onClick={() => selectItem(item.value)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
