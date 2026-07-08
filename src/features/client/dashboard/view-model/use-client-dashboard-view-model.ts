"use client";

import { useRouter } from "next/navigation";
import { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import {
  buildClientDashboardModel,
  type ClientDashboardModel,
  type ClientDashboardRoute,
} from "../model/client-dashboard";

export interface ClientDashboardViewModel extends ClientDashboardModel {
  actions: {
    navigate: (route: ClientDashboardRoute) => void;
    refresh: () => Promise<void>;
  };
}

export function useClientDashboardViewModel(): ClientDashboardViewModel {
  const router = useRouter();
  const {
    projects,
    selectedProject,
    selectedProjectLoading,
    selectedProjectError,
    refreshProjects,
  } = useSelectedDevFlowProject();
  const outputs = useDevFlowProjectOutputs(selectedProject?.id, {
    includeEvents: false,
    includeTimeline: true,
  });

  const refresh = async () => {
    await Promise.all([refreshProjects(), outputs.refresh()]);
  };

  const model = buildClientDashboardModel({
    projects,
    selectedProject,
    selectedProjectLoading,
    selectedProjectError,
    artifacts: outputs.artifacts,
    timeline: outputs.timeline,
    outputsLoading: outputs.loading,
    outputsError: outputs.error,
  });

  return {
    ...model,
    actions: {
      navigate: (route) => router.push(`/client/${route}`),
      refresh,
    },
  };
}
