/**
 * Agentic Orchestration streaming protocol — FRONTEND MIRROR.
 *
 * Verbatim mirror of the canonical backend contract at:
 *   agentic-orchestration-be/apps/api/src/orchestration/streaming/protocol.ts
 *
 * Keep this file in sync by hand (the packages are not a shared workspace).
 * The parity test (orchestration-events.test.ts) pins ORCHESTRATION_EVENT_TYPES
 * to a literal list so drift fails CI. When you change the backend protocol,
 * update this file AND both parity tests.
 */

/** Protocol version. Bump on any breaking change to an event shape. */
export const ORCHESTRATION_PROTOCOL_VERSION = 1;

/** Socket.IO event name carrying every typed orchestration event. */
export const ORCHESTRATION_EVENT_CHANNEL = "orchestration:event";

// ─── Agent stream chunks ───────────────────────────────────────────────────────

export type StreamChunkType = "token" | "tool-call" | "decision" | "error";

export interface StreamChunk {
  nodeId: string;
  runId: string;
  type: StreamChunkType;
  chunk: string;
  metadata?: Record<string, unknown>;
}

// ─── Error taxonomy ─────────────────────────────────────────────────────────────

export type NodePhase = "entering" | "running" | "exiting" | "error" | "skipped";

export type RunErrorSeverity = "transient" | "permanent";

export type OrchestrationErrorCode =
  | "NODE_FAILED"
  | "LLM_UNAVAILABLE"
  | "LLM_TIMEOUT"
  | "VALIDATION_FAILED"
  | "BUDGET_EXHAUSTED"
  | "GITHUB_DELIVERY_FAILED"
  | "CANCELLED"
  | "UNKNOWN";

export type RecoveryActionKind =
  | "retry_node"
  | "skip_node"
  | "modify_params"
  | "cancel";

export interface RecoveryAction {
  action: RecoveryActionKind;
  label: string;
  nodeId?: string;
}

// ─── Event union ───────────────────────────────────────────────────────────────

interface BaseEvent {
  v: number;
  projectId: string;
  runId: string;
  ts: number;
}

export interface RunStatusEvent extends BaseEvent {
  type: "run.status";
  status: string;
  currentNode: string;
  error?: string | null;
}

export interface NodeLifecycleEvent extends BaseEvent {
  type: "node.lifecycle";
  nodeId: string;
  phase: NodePhase;
}

export interface NodeProgressEvent extends BaseEvent {
  type: "node.progress";
  nodeId: string;
  pct?: number;
  label?: string;
}

export interface NodeTelemetryEvent extends Omit<BaseEvent, "runId"> {
  type: "node.telemetry";
  runId?: string;
  nodeId: string;
  wallMs?: number;
  llmMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  model?: string;
}

export interface AgentStreamEvent extends BaseEvent {
  type: "agent.stream";
  nodeId: string;
  chunks: StreamChunk[];
}

export interface RunErrorEvent extends BaseEvent {
  type: "run.error";
  nodeId?: string;
  code: OrchestrationErrorCode;
  severity: RunErrorSeverity;
  message: string;
  recovery?: RecoveryAction[];
}

export type OrchestrationEvent =
  | RunStatusEvent
  | NodeLifecycleEvent
  | NodeProgressEvent
  | NodeTelemetryEvent
  | AgentStreamEvent
  | RunErrorEvent;

export const ORCHESTRATION_EVENT_TYPES = [
  "run.status",
  "node.lifecycle",
  "node.progress",
  "node.telemetry",
  "agent.stream",
  "run.error",
] as const;

export type OrchestrationEventType = (typeof ORCHESTRATION_EVENT_TYPES)[number];
