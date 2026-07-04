// @ts-nocheck
"use client";

import { IconFolder } from "@/shared/components/icons";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";

export function ProjectSwitcher({ compact = false }) {
  const {
    projects,
    projectsLoading,
    projectsError,
    selectedProjectId,
    setSelectedProjectId,
  } = useSelectedDevFlowProject();

  if (projectsError) {
    return <span style={{ color: "#FCA5A5", fontSize: 12 }}>Project load failed</span>;
  }

  if (projectsLoading) {
    return <span style={{ color: "var(--text-3)", fontSize: 12 }}>Loading projects...</span>;
  }

  if (projects.length === 0) {
    return <span style={{ color: "var(--text-3)", fontSize: 12 }}>No projects</span>;
  }

  return (
    <div className="row gap-2" style={{ alignItems: "center", minWidth: compact ? 180 : 240, maxWidth: compact ? 260 : 340 }}>
      <IconFolder size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
      <select
        className="input select"
        value={selectedProjectId || ""}
        onChange={(event) => setSelectedProjectId(event.target.value || null)}
        aria-label="Selected project"
        style={{ height: 36, fontSize: 13, minWidth: 0 }}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.companyName}</option>
        ))}
      </select>
    </div>
  );
}
