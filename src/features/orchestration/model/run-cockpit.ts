import type {
  NodeRuntime,
  OrchestrationState,
} from "@/shared/store/orchestration-store";
import type { OrchestrationConnectionStatus } from "./orchestration-workbench";

export const RUN_TOKEN_BUDGET = 200_000;

export const PIPELINE_ORDER = [
  "parse_requirements",
  "negotiate_contract",
  "gate_1_check",
  "frontend_agent",
  "backend_agent",
  "database_agent",
  "architecture_agent",
  "validate_outputs",
  "gate_2_check",
  "commit_to_github",
  "mark_delivered",
] as const;

export const RUN_STATUS_LABEL: Record<string, string> = {
  PENDING: "Ready to start",
  PARSING_REQUIREMENTS: "Preparing the plan",
  NEGOTIATING_CONTRACT: "Finalizing the plan",
  AWAITING_GATE_1: "Plan ready for review",
  GENERATING_CODE: "Building deliverables",
  AWAITING_GATE_2: "Build ready for review",
  COMMITTING: "Preparing delivery",
  DELIVERED: "Delivery ready",
  FAILED: "Execution blocked",
};

export type ExecutionPhaseId = "prepare" | "plan" | "build" | "deliver";
export type ExecutionPhaseState = "done" | "active" | "upcoming" | "blocked";

export interface ExecutionPhase {
  id: ExecutionPhaseId;
  label: string;
  state: ExecutionPhaseState;
}

export interface ExecutionSummary {
  headline: string;
  description: string;
  phaseLabel: string;
  nextCheckpoint: string;
  actionStep?: "gate-1" | "gate-2" | "delivery";
  actionLabel?: string;
  phases: ExecutionPhase[];
}

export interface RunMeterViewModel {
  projectName?: string;
  status: string;
  statusLabel: string;
  currentNode: string;
  runId: string;
  connectionStatus: OrchestrationConnectionStatus;
  isFailed: boolean;
  isDelivered: boolean;
  isRunning: boolean;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  activeModel: string;
  budgetPct: number;
  progress: number;
  accent: string;
  detail: string;
  execution: ExecutionSummary;
}

export function normalizeRunNode(node: string | undefined | null): string {
  if (!node || node === "none") return "";
  return node.replace(/^work_order_/, "").toLowerCase();
}

export function humanizeRunStatus(value: string | undefined | null): string {
  if (!value) return "Standby";
  return RUN_STATUS_LABEL[value] ?? value.replace(/_/g, " ");
}

export function formatElapsedDuration(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const EXECUTION_PHASES: Array<{ id: ExecutionPhaseId; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "plan", label: "Plan" },
  { id: "build", label: "Build" },
  { id: "deliver", label: "Deliver" },
];

function phasesFor(
  activePhase: ExecutionPhaseId,
  options: { complete?: boolean; blocked?: boolean } = {},
): ExecutionPhase[] {
  const activeIndex = EXECUTION_PHASES.findIndex((phase) => phase.id === activePhase);
  return EXECUTION_PHASES.map((phase, index) => ({
    ...phase,
    state: options.complete
      ? "done"
      : index < activeIndex
        ? "done"
        : index === activeIndex
          ? options.blocked
            ? "blocked"
            : "active"
          : "upcoming",
  }));
}

export function buildExecutionSummary(
  status: string | undefined | null,
  currentNode?: string,
): ExecutionSummary {
  const normalizedStatus = status ?? "PENDING";

  switch (normalizedStatus) {
    case "PARSING_REQUIREMENTS":
      return {
        headline: "DevFlow is preparing the implementation plan",
        description: "The approved brief is being translated into concrete work and deliverables.",
        phaseLabel: "Planning",
        nextCheckpoint: "Plan review",
        phases: phasesFor("plan"),
      };
    case "NEGOTIATING_CONTRACT":
      return {
        headline: "The implementation plan is being finalized",
        description: "Dependencies and responsibilities are being aligned before your review.",
        phaseLabel: "Planning",
        nextCheckpoint: "Plan review",
        phases: phasesFor("plan"),
      };
    case "AWAITING_GATE_1":
      return {
        headline: "The plan needs your decision",
        description: "Execution is paused. Review the proposed plan before any deliverables are built.",
        phaseLabel: "Plan review",
        nextCheckpoint: "Approve or request changes",
        actionStep: "gate-1",
        actionLabel: "Review plan",
        phases: phasesFor("plan"),
      };
    case "GENERATING_CODE":
      return {
        headline: "DevFlow is building the approved deliverables",
        description: "Work is progressing against the plan. You will be asked to review the result next.",
        phaseLabel: "Building",
        nextCheckpoint: "Build review",
        phases: phasesFor("build"),
      };
    case "AWAITING_GATE_2":
      return {
        headline: "The build needs your decision",
        description: "Execution is paused. Review the completed work before it moves to delivery.",
        phaseLabel: "Build review",
        nextCheckpoint: "Approve or request changes",
        actionStep: "gate-2",
        actionLabel: "Review build",
        phases: phasesFor("build"),
      };
    case "COMMITTING":
      return {
        headline: "DevFlow is preparing the final delivery",
        description: "Approved work is being packaged and connected to the project repository.",
        phaseLabel: "Delivery",
        nextCheckpoint: "Final handoff",
        phases: phasesFor("deliver"),
      };
    case "DELIVERED":
    case "SUCCEEDED":
      return {
        headline: "The delivery is ready",
        description: "Review the final handoff, delivery links, and client-facing outputs.",
        phaseLabel: "Complete",
        nextCheckpoint: "Client acceptance",
        actionStep: "delivery",
        actionLabel: "Review delivery",
        phases: phasesFor("deliver", { complete: true }),
      };
    case "FAILED": {
      const failedPhase: ExecutionPhaseId = currentNode?.includes("commit")
        ? "deliver"
        : currentNode?.includes("agent") || currentNode?.includes("validate")
          ? "build"
          : "plan";
      return {
        headline: "Execution needs attention",
        description: "DevFlow stopped safely. Review the blocker, correct it, and retry when ready.",
        phaseLabel: "Blocked",
        nextCheckpoint: "Resolve blocker",
        phases: phasesFor(failedPhase, { blocked: true }),
      };
    }
    default:
      return {
        headline: "The project is ready to start",
        description: "Confirm the outcome and launch checks before DevFlow begins planning.",
        phaseLabel: "Preparation",
        nextCheckpoint: "Start planning",
        phases: phasesFor("prepare"),
      };
  }
}

export function buildRunMeterViewModel(input: {
  projectName?: string;
  status?: string;
  orchestrationState: OrchestrationState | null;
  nodeStates: Record<string, NodeRuntime>;
  connectionStatus: OrchestrationConnectionStatus;
  tokenBudget?: number;
}): RunMeterViewModel {
  const status = input.orchestrationState?.status ?? input.status ?? "PENDING";
  const currentNode = normalizeRunNode(input.orchestrationState?.currentNode);
  const runId = input.orchestrationState?.runId ?? "";
  const isFailed = status === "FAILED" || Boolean(input.orchestrationState?.error);
  const isDelivered = status === "DELIVERED" || status === "SUCCEEDED";
  const isRunning = !isFailed && !isDelivered && status !== "PENDING";

  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;
  let activeModel = "";

  for (const node of Object.values(input.nodeStates)) {
    const telemetry = node.telemetry;
    if (!telemetry) continue;
    inputTokens += telemetry.inputTokens ?? 0;
    outputTokens += telemetry.outputTokens ?? 0;
    cost += telemetry.costUsd ?? 0;
    if (node.phase === "running" && telemetry.model) {
      activeModel = telemetry.model;
    }
  }

  const totalTokens = inputTokens + outputTokens;
  const budget = input.tokenBudget ?? RUN_TOKEN_BUDGET;
  const budgetPct = Math.min(100, (totalTokens / budget) * 100);
  const nodeIndex = PIPELINE_ORDER.indexOf(currentNode as (typeof PIPELINE_ORDER)[number]);
  const nodePct = currentNode ? input.nodeStates[currentNode]?.progressPct : undefined;
  const progress = isDelivered
    ? 100
    : nodeIndex >= 0
      ? Math.round(
          ((nodeIndex + (typeof nodePct === "number" ? nodePct / 100 : 0.5)) /
            (PIPELINE_ORDER.length - 1)) *
            100,
        )
      : isRunning
        ? 6
        : 0;

  const accent = isFailed
    ? "#EF4444"
    : isDelivered
      ? "#10B981"
      : isRunning
        ? "#FAFAFA"
        : "#A1A1A1";
  const execution = buildExecutionSummary(isFailed ? "FAILED" : status, currentNode);
  const detail =
    input.orchestrationState?.error ||
    input.nodeStates[currentNode]?.progressLabel ||
    execution.description;

  return {
    projectName: input.projectName,
    status,
    statusLabel: humanizeRunStatus(status),
    currentNode,
    runId,
    connectionStatus: input.connectionStatus,
    isFailed,
    isDelivered,
    isRunning,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    activeModel,
    budgetPct,
    progress,
    accent,
    detail,
    execution,
  };
}
