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
  const displayContext = selectedProject ? context : {
    ...context,
    title: selectedProjectLoading ? "Loading project workspace" : "Project workspace",
    description: selectedProjectLoading
      ? "Checking assignments, runs, and approvals before showing the workspace."
      : "No project is selected yet.",
    nextAction: selectedProjectLoading ? "Wait for project data to load." : "Start a new project brief.",
  };

  // Console roles only (pm/dev/admin). The client workspace lives in the
  // separate Alphaexplora client app, so the fallback stays inside admin.
  const projectHref = selectedProject?.id
    ? role === "pm"
      ? `/pm/project/${selectedProject.id}`
      : role === "dev"
        ? `/dev/project/${selectedProject.id}`
        : "/admin/projects"
    : role === "pm"
      ? "/pm/projects"
      : role === "dev"
        ? "/dev/projects"
        : "/admin/projects";

  return (
    <section className={`project-context-strip health-${displayContext.health}`} aria-label="Current project context">
      <div className="project-context-meta">
        <span className="project-context-eyebrow">Current context</span>
        <strong>{displayContext.projectName || displayContext.title}</strong>
        <span>{displayContext.statusLabel || displayContext.description}</span>
      </div>
      <div className="project-context-next">
        <span>Next</span>
        <strong>{displayContext.nextAction}</strong>
      </div>
      <div className="project-context-waiting">
        <span>Waiting on</span>
        <strong>{displayContext.waitingOn}</strong>
      </div>
      <button type="button" className="project-context-link" onClick={() => router.push(projectHref)}>
        {selectedProject ? "Open" : "Projects"}
      </button>
    </section>
  );
}
