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

export interface OrchestrationGuidanceViewModel {
  eyebrow: string;
  title: string;
  description: string;
  waitingOn: string;
  tone: "blue" | "green" | "amber" | "red";
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
  guidance: OrchestrationGuidanceViewModel;
  visibleEvents: DevFlowEventLog[];
  visibleWorkOrders: DevFlowWorkOrder[];
  liveVisualizerLoading: boolean;
  actions: OrchestrationWorkbenchActions;
}

function humanizeNode(node?: string | null): string {
  if (!node) return "the next workflow step";
  return node.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildOrchestrationGuidance(input: {
  status?: string | null;
  currentNode?: string | null;
  error?: string | null;
}): OrchestrationGuidanceViewModel {
  const currentNode = humanizeNode(input.currentNode);

  switch (input.status) {
    case "AWAITING_GATE_1":
      return {
        eyebrow: "Action required",
        title: "The project manager is reviewing the AI plan",
        description: "The run will continue automatically after the plan is approved or sent back for changes.",
        waitingOn: "Waiting on: project manager",
        tone: "amber",
      };
    case "AWAITING_GATE_2":
      return {
        eyebrow: "Action required",
        title: "The project manager is reviewing the generated build",
        description: "GitHub delivery remains paused until the build is approved or changes are requested.",
        waitingOn: "Waiting on: project manager",
        tone: "amber",
      };
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
    case "GENERATING_CODE":
    case "COMMITTING":
      return {
        eyebrow: "AI working",
        title: currentNode,
        description: "No action is needed right now. Follow live progress in Pipeline or Agents.",
        waitingOn: "Waiting on: AI orchestrator",
        tone: "blue",
      };
    case "DELIVERED":
      return {
        eyebrow: "Complete",
        title: "The build has been delivered",
        description: "Review the generated artifacts and project output for the final handoff.",
        waitingOn: "Next: review project output",
        tone: "green",
      };
    case "FAILED":
      return {
        eyebrow: "Run blocked",
        title: "The orchestrator needs project-manager attention",
        description: input.error || "Open Diagnostics for the failure details while the project manager decides whether to retry.",
        waitingOn: "Waiting on: project manager",
        tone: "red",
      };
    default:
      return {
        eyebrow: "Not started",
        title: "The project is waiting for orchestration",
        description: "The project manager will complete readiness checks and start the AI workflow.",
        waitingOn: "Waiting on: project manager",
        tone: "blue",
      };
  }
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

