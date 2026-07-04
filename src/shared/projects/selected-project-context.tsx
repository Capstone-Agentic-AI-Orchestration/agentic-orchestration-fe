"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  children,
}: {
  storageKey?: string;
  children: ReactNode;
}) {
  const list = useDevFlowProjects();
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);

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
    if (list.projects.length === 0) {
      setSelectedProjectIdState(null);
      return;
    }

    const hasSelected = selectedProjectId && list.projects.some((project) => project.id === selectedProjectId);
    if (!hasSelected) {
      setSelectedProjectIdState(list.projects[0].id);
    }
  }, [list.loading, list.projects, selectedProjectId]);

  const detail = useDevFlowProject(selectedProjectId);

  const setSelectedProjectId = (projectId: string | null) => {
    setSelectedProjectIdState(projectId);
    try {
      if (projectId) window.localStorage.setItem(storageKey, projectId);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Local storage is optional; selection still works in memory.
    }
  };

  const value = useMemo<SelectedProjectContextValue>(
    () => ({
      projects: list.projects,
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
    [detail.error, detail.loading, detail.project, detail.refresh, list.error, list.loading, list.projects, list.refresh, selectedProjectId],
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
