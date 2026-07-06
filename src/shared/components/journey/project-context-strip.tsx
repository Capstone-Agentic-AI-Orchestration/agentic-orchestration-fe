"use client";

import { useRouter } from "next/navigation";
import { makeProjectJourneyContext } from "@/shared/journey";
import type { JourneyRole } from "@/shared/journey";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";

export function ProjectContextStrip({ role }: { role: Exclude<JourneyRole, "visitor" | "admin"> }) {
  const router = useRouter();
  const { selectedProject, selectedProjectLoading, selectedProjectError } = useSelectedDevFlowProject();
  const context = makeProjectJourneyContext({
    role,
    project: selectedProject,
    loading: selectedProjectLoading,
    blockers: selectedProjectError ? [{ title: "Project context could not load", description: selectedProjectError, severity: "warning" }] : [],
  });

  const projectHref = selectedProject?.id
    ? role === "pm"
      ? `/pm/project/${selectedProject.id}`
      : role === "dev"
        ? `/dev/project/${selectedProject.id}`
        : "/client/product"
    : role === "pm"
      ? "/pm/projects"
      : role === "dev"
        ? "/dev/projects"
        : "/client/dashboard";

  return (
    <section className={`project-context-strip health-${context.health}`} aria-label="Current project context">
      <div className="project-context-meta">
        <span className="project-context-eyebrow">Current context</span>
        <strong>{context.projectName || context.title}</strong>
        <span>{context.statusLabel || context.description}</span>
      </div>
      <div className="project-context-next">
        <span>Next</span>
        <strong>{context.nextAction}</strong>
      </div>
      <div className="project-context-waiting">
        <span>Waiting on</span>
        <strong>{context.waitingOn}</strong>
      </div>
      <button type="button" className="project-context-link" onClick={() => router.push(projectHref)}>
        Open
      </button>
    </section>
  );
}
