"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCheck, IconChevronDown, IconFolder } from "@/shared/components/icons";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";

export function ProjectSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const {
    projects,
    projectsLoading,
    projectsError,
    selectedProjectId,
    selectedProject,
    setSelectedProjectId,
  } = useSelectedDevFlowProject();

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  if (projectsError) {
    return <span style={{ color: "#FCA5A5", fontSize: 12 }}>Project load failed</span>;
  }

  if (projectsLoading) {
    return <span style={{ color: "var(--text-3)", fontSize: 12 }}>Loading projects...</span>;
  }

  if (projects.length === 0) {
    return <span style={{ color: "var(--text-3)", fontSize: 12 }}>No projects</span>;
  }

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setOpen(false);
    if (pathname.startsWith("/dev/project/")) router.push(`/dev/project/${projectId}`);
  };

  return (
    <div ref={menuRef} className={`team-workspace-switcher project-workspace-switcher${compact ? " is-compact" : ""}`}>
      <button
        type="button"
        className="team-workspace-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <IconFolder size={14} className="team-workspace-icon" />
        <span className="team-workspace-name">{selectedProject?.companyName || "Select project"}</span>
        <IconChevronDown size={13} className={`team-workspace-arrow${open ? " is-open" : ""}`} />
      </button>

      {open && (
        <div className="team-workspace-menu" role="listbox" aria-label="Project workspace">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              role="option"
              aria-selected={project.id === selectedProjectId}
              className={`team-workspace-option${project.id === selectedProjectId ? " is-selected" : ""}`}
              onClick={() => selectProject(project.id)}
            >
              <span>{project.companyName}</span>
              {project.id === selectedProjectId && <IconCheck size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
