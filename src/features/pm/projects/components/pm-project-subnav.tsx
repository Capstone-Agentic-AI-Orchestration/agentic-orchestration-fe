"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconCheckCircle,
  IconClipboard,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconSettings,
  IconUsers,
} from "@/shared/components/icons";

/**
 * Sections of a project a PM can open.
 *
 * The build sections — Setup, Orchestration and Gate decisions — deliberately are NOT here.
 * Prompting, kickoff and gate approval belong to the developer console; the backend enforces
 * that with @Roles(DEV, ADMIN), so listing them would only render buttons that 403.
 *
 * Three sections were removed rather than reordered:
 *  - Overview held the lifecycle stepper and next-action banner. Those are project-level
 *    context, not one section's content, so they were promoted to a header shown above every
 *    section. Nothing was lost and one destination stopped existing.
 *  - Tasks and Work orders were the same board split by who does the work. Issues is that board
 *    with the split as a filter — Members reads tasks, Agents reads work orders.
 *  - Timeline was an audit log dominated by TASK_* and WORK_ORDER_* events, which is now each
 *    issue's own activity. The event stream and its component still exist for the dev console.
 *  - Client messages held the conversation with the company. That conversation belongs to the
 *    company, not to one of its builds, so it lives on the client: PM console > Clients > the
 *    client > Messages. Nothing replaced it here, not even a read-only view, because a second
 *    place to read a thread is a second place to think you have replied in.
 */
export type PMProjectSectionId =
  | "repository"
  | "issues"
  | "intake"
  | "artifacts"
  | "delivery-review"
  | "documents"
  | "members"
  | "settings";

type ProjectSectionItem = {
  value: PMProjectSectionId;
  label: string;
  icon: ReactNode;
};

const PROJECT_SECTIONS: Array<{ label: string; items: ProjectSectionItem[] }> = [
  {
    label: "Delivery",
    items: [
      // Issues leads, and is where a project opens.
      //
      // Repository used to hold both positions, on the reasoning that nothing can start until the
      // repository exists. True once, at the beginning — and then never again. After provisioning,
      // Repository is two cards a PM has no reason to revisit, so every later visit to the project
      // landed on a finished setup step and needed a second click to reach the actual work. Issues
      // is what changes daily and what a PM comes here to act on.
      { value: "issues", label: "Issues", icon: <IconCheckCircle size={15} /> },
      { value: "repository", label: "Repository", icon: <IconGitBranch size={15} /> },
      { value: "intake", label: "Intake brief", icon: <IconClipboard size={15} /> },
    ],
  },
  {
    label: "Review and delivery",
    items: [
      { value: "artifacts", label: "Artifacts", icon: <IconFileText size={15} /> },
      { value: "delivery-review", label: "Delivery review", icon: <IconCheck size={15} /> },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { value: "documents", label: "Client documents", icon: <IconFolder size={15} /> },
      { value: "members", label: "Members", icon: <IconUsers size={15} /> },
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

/**
 * Where a project opens when the URL carries no ?tab=.
 *
 * Must match the first item above. It is also the section whose URL stays clean — the detail view
 * omits ?tab= for this one — so changing it here changes what /pm/project/:id means.
 */
export const PM_PROJECT_DEFAULT_SECTION: PMProjectSectionId = "issues";

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

    // Repository is the landing section now that Overview is gone, so it owns the bare URL.
    const query = item === PM_PROJECT_DEFAULT_SECTION ? "" : `?tab=${encodeURIComponent(item)}`;
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
