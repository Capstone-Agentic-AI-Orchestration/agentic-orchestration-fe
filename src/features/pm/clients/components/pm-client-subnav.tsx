"use client";

import type { ReactNode } from "react";
import {
  IconActivity,
  IconFileText,
  IconFolder,
  IconMessageCircle,
  IconUsers,
} from "@/shared/components/icons";

export type PMClientSectionId = "overview" | "messages" | "projects" | "documents" | "contacts";

export const PM_CLIENT_SECTION_IDS: readonly PMClientSectionId[] = [
  "overview",
  "messages",
  "projects",
  "documents",
  "contacts",
];

const SECTIONS: Array<{ value: PMClientSectionId; label: string; icon: ReactNode }> = [
  { value: "overview", label: "Overview", icon: <IconActivity size={15} /> },
  // Directly under Overview, above the delivery sections: talking to the client is what a PM does
  // with a client, and this is the only place the conversation lives now.
  { value: "messages", label: "Messages", icon: <IconMessageCircle size={15} /> },
  { value: "projects", label: "Projects", icon: <IconFolder size={15} /> },
  { value: "documents", label: "Documents", icon: <IconFileText size={15} /> },
  { value: "contacts", label: "Contacts", icon: <IconUsers size={15} /> },
];

export function PMClientSubnav({
  clientName,
  activeItem,
  counts,
  attention,
  onSelect,
}: Readonly<{
  clientName: string;
  activeItem: PMClientSectionId;
  counts: Partial<Record<PMClientSectionId, number>>;
  /**
   * Sections whose count is something waiting on the PM rather than a plain total. Unread messages
   * are the case this exists for: "3" next to Messages has to read differently from "3" next to
   * Documents, or it is just inventory.
   */
  attention?: Partial<Record<PMClientSectionId, boolean>>;
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
                {typeof count === "number" && (
                  <span
                    className="pm-client-subnav-count"
                    data-attention={attention?.[item.value] && count > 0 ? "true" : undefined}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
