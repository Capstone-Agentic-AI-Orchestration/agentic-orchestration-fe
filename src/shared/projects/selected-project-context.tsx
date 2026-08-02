"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDevFlowProject, useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import type { DevFlowProjectDetail, DevFlowProjectSummary } from "@/shared/api/devflow-api";

interface SelectedProjectContextValue {
  projects: DevFlowProjectSummary[];
  projectsLoading: boolean;
  projectsError: string;
  refreshProjects: () => Promise<void>;
  refreshSelectedProject: () => Promise<void>;
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
}

const SelectedProjectContext = createContext<SelectedProjectContextValue | null>(null);

export function SelectedProjectProvider({
  storageKey = "devflow.selectedProjectId",
  groupId,
  children,
}: {
  storageKey?: string;
  groupId?: string | null;
  children: ReactNode;
}) {
  const list = useDevFlowProjects();
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);
  const projects = useMemo(
    () => groupId === undefined
      ? list.projects
      : groupId
        ? list.projects.filter((project) => project.groupId === groupId)
        : [],
    [groupId, list.projects],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setSelectedProjectIdState(saved);
    } catch {
      // Local storage is optional; selection still works in memory.
    }
  }, [storageKey]);

  useEffect(() => {
    if (list.loading) return;
    if (projects.length === 0) {
      setSelectedProjectIdState(null);
      return;
    }

    const hasSelected = selectedProjectId && projects.some((project) => project.id === selectedProjectId);
    if (!hasSelected) {
      setSelectedProjectIdState(projects[0].id);
    }
  }, [list.loading, projects, selectedProjectId]);

  const detail = useDevFlowProject(selectedProjectId);

  const setSelectedProjectId = useCallback((projectId: string | null) => {
    setSelectedProjectIdState(projectId);
    try {
      if (projectId) window.localStorage.setItem(storageKey, projectId);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Local storage is optional; selection still works in memory.
    }
  }, [storageKey]);

  const value = useMemo<SelectedProjectContextValue>(
    () => ({
      projects,
      projectsLoading: list.loading,
      projectsError: list.error,
      refreshProjects: list.refresh,
      refreshSelectedProject: detail.refresh,
      selectedProjectId,
      setSelectedProjectId,
      selectedProject: detail.project,
      selectedProjectLoading: list.loading || detail.loading,
      selectedProjectError: list.error || detail.error,
    }),
    [detail.error, detail.loading, detail.project, detail.refresh, list.error, list.loading, list.refresh, projects, selectedProjectId, setSelectedProjectId],
  );

  return <SelectedProjectContext.Provider value={value}>{children}</SelectedProjectContext.Provider>;
}

export function useSelectedDevFlowProject() {
  const context = useContext(SelectedProjectContext);
  if (!context) {
    throw new Error("useSelectedDevFlowProject must be used inside SelectedProjectProvider");
  }
  return context;
}
