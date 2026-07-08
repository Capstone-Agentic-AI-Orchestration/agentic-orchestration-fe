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
  PENDING: "Ready to launch",
  PARSING_REQUIREMENTS: "Parsing requirements",
  NEGOTIATING_CONTRACT: "Negotiating contract",
  AWAITING_GATE_1: "Awaiting Gate 1 review",
  GENERATING_CODE: "Generating code",
  AWAITING_GATE_2: "Awaiting Gate 2 review",
  COMMITTING: "Committing to GitHub",
  DELIVERED: "Delivered",
  FAILED: "Run blocked",
};

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
  const detail =
    input.orchestrationState?.error ||
    input.nodeStates[currentNode]?.progressLabel ||
    (isRunning ? "Agents are working - watch the live output below." : "Launch the pipeline to begin.");

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
  };
}
