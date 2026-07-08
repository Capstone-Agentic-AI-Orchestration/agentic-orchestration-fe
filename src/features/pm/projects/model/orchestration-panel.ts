import type {
  DevFlowAgentProviderMode,
  DevFlowAgentProviderStatus,
  DevFlowArtifact,
  DevFlowEventLog,
  DevFlowGithubDeliveryStatus,
  DevFlowOrchestrationRun,
  DevFlowOrchestrationStatus,
  DevFlowProjectDetail,
  DevFlowWorkOrder,
} from "@/shared/api/devflow-api";
import {
  backendStatusBits,
  formatBackendDate,
  githubAutopushStatus,
  orchestrationTriggerLabel,
} from "../utils/pm-project-detail.utils";

export type OrchestrationTone = "green" | "amber" | "red" | "blue" | "gray" | "purple";

export interface OrchestrationFactModel {
  label: string;
  value: string;
  tone: OrchestrationTone;
  mono?: boolean;
}

export interface ReadyWorkOrderRow {
  id: string;
  title: string;
  agentType: string;
  instructionLabel: string;
  instructionTone: "blue" | "amber";
  workOrder: DevFlowWorkOrder;
}

export interface FailedWorkOrderRow {
  id: string;
  title: string;
  executionError: string | null;
  canRetry: boolean;
  retrying: boolean;
  workOrder: DevFlowWorkOrder;
}

export interface RunEventRow {
  id: string;
  nodeName: string;
  meta: string;
  event: DevFlowEventLog;
}

export interface RunHistoryRow {
  id: string;
  runId: string;
  meta: string;
  status: DevFlowOrchestrationRun["status"];
  completedWorkOrdersLabel: string;
  failedWorkOrdersLabel: string | null;
  completedArtifactsLabel: string;
  executionLabel: string | null;
  run: DevFlowOrchestrationRun;
}

export interface LatestRunModel {
  runId: string;
  status: DevFlowOrchestrationRun["status"];
  triggerLabel: string;
  startedAtLabel: string;
  error: string | null;
  run: DevFlowOrchestrationRun;
}

export interface ArtifactInlinePreviewModel {
  fileName: string;
  agentType: string;
  content: string;
}

export interface BackendOrchestrationPanelModel {
  activeProviderLabel: string;
  title: string;
  statusErrorMessage: string;
  runsErrorMessage: string;
  providerErrorMessage: string;
  githubVerificationErrorMessage: string;
  llmVerificationErrorMessage: string;
  githubDelivery: DevFlowGithubDeliveryStatus | undefined;
  providerUnavailable: boolean;
  providerUnavailableMessage: string;
  githubDeliveryUnavailable: boolean;
  githubDeliveryUnavailableMessage: string;
  actionBlocked: boolean;
  startButtonLabel: string;
  rerunButtonLabel: string;
  canRerunReady: boolean;
  canStartRun: boolean;
  facts: OrchestrationFactModel[];
  readyWorkOrders: ReadyWorkOrderRow[];
  failedWorkOrders: FailedWorkOrderRow[];
  recentEvents: RunEventRow[];
  runHistory: RunHistoryRow[];
  latestRun: LatestRunModel | null;
  preview: ArtifactInlinePreviewModel | null;
  repoLinked: boolean;
  repoStatusMessage: string;
  positiveStatusMessage: string;
  blockerMessages: string[];
  showBlockers: boolean;
  hasReadyWorkOrders: boolean;
  hasRecentEvents: boolean;
  hasRunHistory: boolean;
}

export function activeProviderLabel(mode?: DevFlowAgentProviderMode | null): string {
  if (mode === "llm") return "LLM";
  if (mode === "mock") return "Mock";
  return "Agent";
}

export function hasExecutableInstructions(workOrder: DevFlowWorkOrder): boolean {
  return Boolean(workOrder.instructions?.trim());
}

export function buildReadyWorkOrderRows(workOrders: DevFlowWorkOrder[]): ReadyWorkOrderRow[] {
  return workOrders
    .filter((workOrder) => workOrder.status === "READY")
    .slice(0, 5)
    .map((workOrder) => {
      const hasInstructions = hasExecutableInstructions(workOrder);
      return {
        id: workOrder.id,
        title: workOrder.title,
        agentType: workOrder.agentType,
        instructionLabel: hasInstructions ? "Instructions ready" : "Missing instructions",
        instructionTone: hasInstructions ? "blue" : "amber",
        workOrder,
      };
    });
}

export function buildFailedWorkOrderRows(
  workOrders: DevFlowWorkOrder[],
  actionId: string,
): FailedWorkOrderRow[] {
  return workOrders
    .filter((workOrder) => workOrder.status === "FAILED")
    .map((workOrder) => ({
      id: workOrder.id,
      title: workOrder.title,
      executionError: workOrder.executionError,
      canRetry: hasExecutableInstructions(workOrder),
      retrying: actionId === workOrder.id,
      workOrder,
    }));
}

export function buildRunEventRows(events: DevFlowEventLog[]): RunEventRow[] {
  return events.slice(0, 5).map((event) => ({
    id: event.id,
    nodeName: event.nodeName,
    meta: `${event.eventType} - ${formatBackendDate(event.occurredAt)}`,
    event,
  }));
}

export function buildRunHistoryRows(runs: DevFlowOrchestrationRun[]): RunHistoryRow[] {
  return runs.slice(0, 5).map((run) => ({
    id: run.id,
    runId: run.runId,
    meta: `${orchestrationTriggerLabel(run.trigger)} - ${run.currentNode || "No node"}`,
    status: run.status,
    completedWorkOrdersLabel: `${run.completedWorkOrders} done`,
    failedWorkOrdersLabel: run.failedWorkOrders > 0 ? `${run.failedWorkOrders} failed` : null,
    completedArtifactsLabel: `${run.completedArtifacts} artifacts`,
    executionLabel: run.executions?.length
      ? `${run.executions.length} execution${run.executions.length === 1 ? "" : "s"} recorded`
      : null,
    run,
  }));
}

export function buildArtifactInlinePreviewModel(
  artifact: DevFlowArtifact | null,
): ArtifactInlinePreviewModel | null {
  if (!artifact?.content) return null;
  return {
    fileName: artifact.filePath?.split("/").pop() || artifact.filePath,
    agentType: artifact.agentType,
    content: artifact.content,
  };
}

export function buildBackendOrchestrationPanelModel(input: {
  detail: DevFlowProjectDetail;
  status: DevFlowOrchestrationStatus | null;
  statusLoading: boolean;
  statusError?: string | null;
  providerStatus: DevFlowAgentProviderStatus | null;
  providerLoading: boolean;
  providerError?: string | null;
  githubVerificationError?: string | null;
  llmVerificationError?: string | null;
  workOrders: DevFlowWorkOrder[];
  artifacts: DevFlowArtifact[];
  events: DevFlowEventLog[];
  runs: DevFlowOrchestrationRun[];
  runsLoading: boolean;
  runsError?: string | null;
  blockers: string[];
  starting: boolean;
  actionId: string;
  previewArtifact: DevFlowArtifact | null;
}): BackendOrchestrationPanelModel {
  const readyWorkOrders = input.workOrders.filter((workOrder) => workOrder.status === "READY");
  const executableWorkOrders = readyWorkOrders.filter(hasExecutableInstructions);
  const failedWorkOrders = input.workOrders.filter((workOrder) => workOrder.status === "FAILED");
  const completedWorkOrders = input.workOrders.filter((workOrder) => workOrder.status === "COMPLETED");
  const generatedWorkOrderArtifacts = input.artifacts.filter((artifact) => artifact.filePath?.startsWith("work-orders/"));
  const pendingPmReview = input.artifacts.filter((artifact) => (artifact.outputReviewStatus || "PENDING") === "PENDING");
  const providerLabel = activeProviderLabel(input.providerStatus?.activeMode);
  const statusView = backendStatusBits(input.status?.status || input.detail.status);
  const currentNode = input.status?.currentNode && input.status.currentNode !== "none"
    ? input.status.currentNode
    : input.detail.runId || "No active node";
  const githubDelivery = input.providerStatus?.githubDelivery;
  const providerUnavailable = !input.providerLoading && Boolean(input.providerError || (input.providerStatus && !input.providerStatus.available));
  const githubDeliveryUnavailable = input.providerStatus?.activeMode === "llm" && Boolean(githubDelivery && !githubDelivery.available);
  const actionBlocked = input.blockers.length > 0 || providerUnavailable || githubDeliveryUnavailable;
  const autopushView = githubAutopushStatus({
    ...input.detail,
    repoUrl: input.detail.repoUrl ?? undefined,
    runId: input.detail.runId ?? undefined,
  }, githubDelivery, input.providerStatus?.activeMode);
  const latestRun = input.runs[0] ?? null;
  const providerUnavailableMessage = input.providerError || input.providerStatus?.reason || "The selected agent provider is not available.";
  const githubDeliveryUnavailableMessage = githubDelivery?.reason || "GitHub delivery is not ready. Configure GitHub App credentials before starting the LLM delivery flow.";
  const runStarted = Boolean(input.detail.runId);

  return {
    activeProviderLabel: providerLabel,
    title: `${providerLabel}-provider orchestration`,
    statusErrorMessage: input.statusError ?? "",
    runsErrorMessage: input.runsError ?? "",
    providerErrorMessage: input.providerError ?? "",
    githubVerificationErrorMessage: input.githubVerificationError ?? "",
    llmVerificationErrorMessage: input.llmVerificationError ?? "",
    githubDelivery,
    providerUnavailable,
    providerUnavailableMessage,
    githubDeliveryUnavailable,
    githubDeliveryUnavailableMessage,
    actionBlocked,
    startButtonLabel: runStarted ? "Run started" : input.starting ? "Starting..." : `Start ${providerLabel.toLowerCase()} run`,
    rerunButtonLabel: input.actionId === "rerun-ready" ? "Queuing..." : "Rerun READY",
    canRerunReady: input.actionId !== "rerun-ready" && !actionBlocked && executableWorkOrders.length > 0,
    canStartRun: !input.starting && !runStarted && !actionBlocked,
    facts: [
      { label: "Agent provider", value: input.providerLoading ? "Checking..." : providerLabel, tone: input.providerStatus?.available ? "green" : "amber" },
      { label: "GitHub delivery", value: githubDelivery ? (githubDelivery.available ? githubDelivery.owner || "Ready" : "Setup needed") : "Checking...", tone: githubDelivery?.available ? "green" : "amber" },
      { label: "Repository", value: input.detail.repoUrl || "Not linked", tone: input.detail.repoUrl ? "green" : "gray", mono: true },
      { label: "Autopush", value: autopushView.label, tone: autopushView.tone as OrchestrationTone },
      { label: "Run status", value: input.statusLoading ? "Checking..." : statusView.label, tone: statusView.tone as OrchestrationTone },
      { label: "Current node", value: currentNode, tone: "purple", mono: true },
      { label: "Run history", value: input.runsLoading ? "Loading..." : String(input.runs.length), tone: input.runs.length ? "blue" : "gray" },
      { label: "Executable work orders", value: String(executableWorkOrders.length), tone: executableWorkOrders.length ? "green" : "gray" },
      { label: "Completed work orders", value: String(completedWorkOrders.length), tone: completedWorkOrders.length ? "green" : "gray" },
      { label: "Failed work orders", value: String(failedWorkOrders.length), tone: failedWorkOrders.length ? "red" : "green" },
      { label: "Generated artifacts", value: String(generatedWorkOrderArtifacts.length), tone: generatedWorkOrderArtifacts.length ? "blue" : "gray" },
      { label: "PM review queue", value: String(pendingPmReview.length), tone: pendingPmReview.length ? "amber" : "green" },
    ],
    readyWorkOrders: buildReadyWorkOrderRows(input.workOrders),
    failedWorkOrders: buildFailedWorkOrderRows(input.workOrders, input.actionId),
    recentEvents: buildRunEventRows(input.events),
    runHistory: buildRunHistoryRows(input.runs),
    latestRun: latestRun
      ? {
          runId: latestRun.runId,
          status: latestRun.status,
          triggerLabel: orchestrationTriggerLabel(latestRun.trigger),
          startedAtLabel: formatBackendDate(latestRun.startedAt),
          error: latestRun.error,
          run: latestRun,
        }
      : null,
    preview: buildArtifactInlinePreviewModel(input.previewArtifact),
    repoLinked: Boolean(input.detail.repoUrl),
    repoStatusMessage: input.detail.repoUrl ? "Generated repository is linked." : "No GitHub repository linked.",
    positiveStatusMessage: providerUnavailable
      ? providerUnavailableMessage
      : runStarted
        ? "This project already has an orchestration run. Review generated artifacts and publish approved outputs when ready."
        : `This project can start the ${providerLabel.toLowerCase()} provider orchestration run.`,
    blockerMessages: input.blockers,
    showBlockers: (input.blockers.length > 0 || providerUnavailable || githubDeliveryUnavailable) && !runStarted,
    hasReadyWorkOrders: readyWorkOrders.length > 0,
    hasRecentEvents: input.events.length > 0,
    hasRunHistory: input.runs.length > 0,
  };
}
