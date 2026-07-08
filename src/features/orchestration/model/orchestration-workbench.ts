import type {
  DevFlowAgentProviderStatus,
  DevFlowArtifact,
  DevFlowEventLog,
  DevFlowOrchestrationStatus,
  DevFlowProjectDetail,
  DevFlowProjectSummary,
  DevFlowWorkOrder,
} from "@/shared/api/devflow-api";

export type OrchestrationConnectionStatus = "disconnected" | "connecting" | "connected";
export type OrchestrationMetricIcon = "provider" | "run" | "work-orders" | "artifacts";

export interface OrchestrationMetricViewModel {
  icon: OrchestrationMetricIcon;
  label: string;
  value: string;
  sub: string;
}

export interface OrchestrationWorkbenchActions {
  refresh: () => void;
  openProjects: () => void;
  openOutput: () => void;
}

export interface OrchestrationWorkbenchViewModel {
  projects: DevFlowProjectSummary[];
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectId: string | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
  outputs: {
    artifacts: DevFlowArtifact[];
    events: DevFlowEventLog[];
    workOrders: DevFlowWorkOrder[];
    loading: boolean;
    error: string;
  };
  orchestration: {
    status: DevFlowOrchestrationStatus | null;
    loading: boolean;
    error: string;
  };
  provider: {
    status: DevFlowAgentProviderStatus | null;
    loading: boolean;
    error: string;
  };
  lifecycle: {
    label: string;
    tone: "gray" | "blue" | "green" | "amber" | "red" | "purple" | string;
    progress: number;
  };
  connectionStatus: OrchestrationConnectionStatus;
  isLiveRun: boolean;
  errorMessage: string;
  providerErrorMessage: string;
  metrics: OrchestrationMetricViewModel[];
  visibleEvents: DevFlowEventLog[];
  visibleWorkOrders: DevFlowWorkOrder[];
  liveVisualizerLoading: boolean;
  actions: OrchestrationWorkbenchActions;
}

export function isTerminalProjectStatus(status?: string | null): boolean {
  return status === "DELIVERED" || status === "FAILED";
}

export function isLiveOrchestrationRun(
  project?: Pick<DevFlowProjectDetail, "runId" | "status"> | null,
): boolean {
  return Boolean(project?.runId) && !isTerminalProjectStatus(project?.status);
}

export function hasActiveWorkOrder(workOrders: Array<Pick<DevFlowWorkOrder, "status">>): boolean {
  return workOrders.some((workOrder) => workOrder.status === "DISPATCHED");
}

export function orchestrationRefreshIntervalMs(
  connectionStatus: OrchestrationConnectionStatus,
): number {
  return connectionStatus === "connected" ? 10000 : 4000;
}

export function shouldPollLiveSnapshot(input: {
  selectedProjectId?: string | null;
  liveRun: boolean;
  workOrders: Array<Pick<DevFlowWorkOrder, "status">>;
}): boolean {
  return Boolean(input.selectedProjectId) && (input.liveRun || hasActiveWorkOrder(input.workOrders));
}

export function buildOrchestrationMetrics(input: {
  providerLoading: boolean;
  providerStatus: DevFlowAgentProviderStatus | null;
  providerError: string;
  orchestrationLoading: boolean;
  orchestrationStatus: DevFlowOrchestrationStatus | null;
  selectedRunId?: string | null;
  outputsLoading: boolean;
  workOrders: DevFlowWorkOrder[];
  artifacts: DevFlowArtifact[];
}): OrchestrationMetricViewModel[] {
  const dispatchedWorkOrders = input.workOrders.filter((item) => item.status === "DISPATCHED").length;
  const clientVisibleArtifacts = input.artifacts.filter((item) => item.clientVisible).length;

  return [
    {
      icon: "provider",
      label: "Provider",
      value: input.providerLoading ? "..." : input.providerStatus?.activeMode?.toUpperCase() || "Unknown",
      sub: input.providerError || input.providerStatus?.reason || (input.providerStatus?.available ? "Ready" : "Not ready"),
    },
    {
      icon: "run",
      label: "Run status",
      value: input.orchestrationLoading ? "..." : input.orchestrationStatus?.status || "Not started",
      sub: input.orchestrationStatus?.currentNode || input.selectedRunId || "No run id",
    },
    {
      icon: "work-orders",
      label: "Work orders",
      value: input.outputsLoading ? "..." : String(input.workOrders.length),
      sub: `${dispatchedWorkOrders} dispatched`,
    },
    {
      icon: "artifacts",
      label: "Artifacts",
      value: input.outputsLoading ? "..." : String(input.artifacts.length),
      sub: `${clientVisibleArtifacts} client-visible`,
    },
  ];
}

export function visibleOrchestrationEvents(
  events: DevFlowEventLog[],
  limit = 8,
): DevFlowEventLog[] {
  return events.slice(0, limit);
}

export function visibleWorkOrders(
  workOrders: DevFlowWorkOrder[],
  limit = 5,
): DevFlowWorkOrder[] {
  return workOrders.slice(0, limit);
}

