"use client";

import type { ReactNode } from "react";
import {
  IconActivity,
  IconFileText,
  IconFolder,
  IconUsers,
} from "@/shared/components/icons";

export type PMClientSectionId = "overview" | "projects" | "documents" | "contacts";

const SECTIONS: Array<{ value: PMClientSectionId; label: string; icon: ReactNode }> = [
  { value: "overview", label: "Overview", icon: <IconActivity size={15} /> },
  { value: "projects", label: "Projects", icon: <IconFolder size={15} /> },
  { value: "documents", label: "Documents", icon: <IconFileText size={15} /> },
  { value: "contacts", label: "Contacts", icon: <IconUsers size={15} /> },
];

export function PMClientSubnav({
  clientName,
  activeItem,
  counts,
  onSelect,
}: Readonly<{
  clientName: string;
  activeItem: PMClientSectionId;
  counts: Partial<Record<PMClientSectionId, number>>;
  onSelect: (item: PMClientSectionId) => void;
}>) {
  return (
    <aside className="pm-project-subnav" aria-label="Client sections">
      <div className="pm-project-subnav-title">
        <strong>{clientName}</strong>
        <span>Client</span>
      </div>

      <nav className="pm-project-subnav-groups">
        <div className="pm-project-subnav-group">
          {SECTIONS.map((item) => {
            const count = counts[item.value];
            return (
              <button
                key={item.value}
                type="button"
                className={`pm-project-subnav-item${activeItem === item.value ? " is-active" : ""}`}
                aria-current={activeItem === item.value ? "page" : undefined}
                onClick={() => onSelect(item.value)}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof count === "number" && <span className="pm-client-subnav-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
