"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDevFlowOrchestrationProviderStatus, useDevFlowOrchestrationStatus, useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useSocketSubscription } from "@/shared/hooks/use-socket-subscription";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import { compactDevFlowError, devflowLifecycleView } from "@/shared/utils/devflow-projects";
import {
  buildOrchestrationMetrics,
  buildOrchestrationGuidance,
  isLiveOrchestrationRun,
  orchestrationRefreshIntervalMs,
  shouldPollLiveSnapshot,
  visibleOrchestrationEvents,
  visibleWorkOrders,
  type OrchestrationWorkbenchViewModel,
} from "../model/orchestration-workbench";

export function useDevOrchestratorViewModel(): OrchestrationWorkbenchViewModel {
  const router = useRouter();
  const {
    projects,
    selectedProject,
    selectedProjectId,
    selectedProjectLoading,
    selectedProjectError,
    refreshProjects,
  } = useSelectedDevFlowProject();
  const outputs = useDevFlowProjectOutputs(selectedProjectId, {
    includeEvents: true,
    includeTasks: true,
    includeTimeline: true,
    includeWorkOrders: true,
  });
  const orchestration = useDevFlowOrchestrationStatus(selectedProjectId);
  const provider = useDevFlowOrchestrationProviderStatus(selectedProjectId);
  const lifecycle = devflowLifecycleView(selectedProject);
  const connectionStatus = useOrchestrationStore((state) => state.connectionStatus);
  const isLiveRun = isLiveOrchestrationRun(selectedProject);

  useSocketSubscription({
    projectId: selectedProjectId,
    initialStatus: orchestration.status?.status,
    initialCurrentNode: orchestration.status?.currentNode,
    initialRunId: selectedProject?.runId ?? undefined,
  });

  const refresh = useCallback(() => {
    refreshProjects();
    outputs.refresh();
    orchestration.refresh();
    provider.refresh();
  }, [orchestration, outputs, provider, refreshProjects]);

  const openProjects = useCallback(() => {
    router.push("/dev/projects");
  }, [router]);

  const openOutput = useCallback(() => {
    if (selectedProject?.id) {
      router.push(`/dev/orchestrator/output/${selectedProject.id}`);
    }
  }, [router, selectedProject?.id]);

  useEffect(() => {
    if (!shouldPollLiveSnapshot({
      selectedProjectId,
      liveRun: isLiveRun,
      workOrders: outputs.workOrders,
    })) {
      return;
    }

    let mounted = true;
    let pending = false;
    const refreshLiveSnapshot = async () => {
      if (pending) return;
      pending = true;
      try {
        await Promise.all([
          refreshProjects?.(),
          outputs.refresh?.(),
          orchestration.refresh?.(),
          provider.refresh?.(),
        ]);
      } catch {
        // Existing panels expose request failures; keep the live loop quiet.
      } finally {
        if (mounted) pending = false;
      }
    };

    const timer = window.setInterval(
      refreshLiveSnapshot,
      orchestrationRefreshIntervalMs(connectionStatus),
    );
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [
    connectionStatus,
    isLiveRun,
    orchestration,
    outputs,
    provider,
    refreshProjects,
    selectedProjectId,
  ]);

  const hasRun = Boolean(selectedProject?.runId);
  const errorMessage = compactDevFlowError(
    selectedProjectError || (hasRun ? outputs.error || orchestration.error : ""),
  );
  const providerErrorMessage = provider.error ? compactDevFlowError(provider.error) : "";

  return {
    projects,
    selectedProject,
    selectedProjectId,
    selectedProjectLoading,
    selectedProjectError,
    outputs: {
      artifacts: outputs.artifacts,
      events: outputs.events,
      workOrders: outputs.workOrders,
      loading: outputs.loading,
      error: outputs.error,
    },
    orchestration: {
      status: orchestration.status,
      loading: orchestration.loading,
      error: orchestration.error,
    },
    provider: {
      status: provider.status,
      loading: provider.loading,
      error: provider.error,
    },
    lifecycle,
    connectionStatus,
    isLiveRun,
    errorMessage,
    providerErrorMessage,
    metrics: buildOrchestrationMetrics({
      providerLoading: provider.loading,
      providerStatus: provider.status,
      providerError: provider.error,
      orchestrationLoading: orchestration.loading,
      orchestrationStatus: orchestration.status,
      selectedRunId: selectedProject?.runId,
      outputsLoading: outputs.loading,
      workOrders: outputs.workOrders,
      artifacts: outputs.artifacts,
    }),
    guidance: buildOrchestrationGuidance({
      status: orchestration.status?.status ?? selectedProject?.status,
      currentNode: orchestration.status?.currentNode,
      error: orchestration.error,
    }),
    visibleEvents: visibleOrchestrationEvents(outputs.events),
    visibleWorkOrders: visibleWorkOrders(outputs.workOrders),
    liveVisualizerLoading: outputs.loading || orchestration.loading || provider.loading,
    actions: {
      refresh,
      openProjects,
      openOutput,
    },
  };
}
