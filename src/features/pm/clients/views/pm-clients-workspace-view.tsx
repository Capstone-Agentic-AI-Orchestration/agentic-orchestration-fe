"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IconBriefcase, IconMail } from "@/shared/components/icons";
import { PMClientsView } from "@/features/pm/clients/views/pm-clients-view";
import { PMInquiriesView } from "@/features/pm/inquiries/views/pm-inquiries-view";
import { useDevFlowInquiries } from "@/shared/hooks/use-devflow-inquiries";

type PMClientsSectionId = "clients" | "inquiries";

/**
 * Clients and Inquiries under one destination.
 *
 * They read as two unrelated jobs when they were separate sidebar entries, and they are not:
 * an inquiry is a company that has asked to work with you, a client is one you said yes to,
 * and approving an inquiry literally creates the client. One list, two stages of one life.
 *
 * The section rail is the same component vocabulary the project workspace uses, so "a
 * destination with sections inside it" looks the same everywhere in the console.
 */
export function PMClientsWorkspaceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active: PMClientsSectionId = searchParams.get("tab") === "inquiries" ? "inquiries" : "clients";

  // Inquiries lost its sidebar slot, so the rail item has to carry the "something new arrived"
  // signal. Only NEW counts — anything further along is already someone's open thread.
  const { inquiries: newInquiries } = useDevFlowInquiries("NEW");

  const sections: Array<{ id: PMClientsSectionId; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "clients", label: "Clients", icon: <IconBriefcase size={15} /> },
    { id: "inquiries", label: "Inquiries", icon: <IconMail size={15} />, count: newInquiries.length },
  ];

  const selectSection = (section: PMClientsSectionId) => {
    if (section === active) return;
    router.replace(section === "clients" ? "/pm/clients" : `/pm/clients?tab=${section}`, { scroll: false });
  };

  return (
    <div className="pm-project-workspace" data-screen-label="PM - Clients">
      <aside className="pm-project-subnav" aria-label="Client sections">
        <div className="pm-project-subnav-title">
          <strong>Clients</strong>
          <span>Companies and leads</span>
        </div>

        <nav className="pm-project-subnav-groups">
          <div className="pm-project-subnav-group">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`pm-project-subnav-item${active === section.id ? " is-active" : ""}`}
                aria-current={active === section.id ? "page" : undefined}
                onClick={() => selectSection(section.id)}
              >
                {section.icon}
                <span>{section.label}</span>
                {Boolean(section.count) && <span className="pm-client-subnav-count">{section.count}</span>}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <section className="pm-project-workspace-content">
        {active === "clients" ? <PMClientsView /> : <PMInquiriesView />}
      </section>
    </div>
  );
}
