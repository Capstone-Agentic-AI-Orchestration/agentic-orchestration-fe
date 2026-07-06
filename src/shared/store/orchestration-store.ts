import { create } from 'zustand';
import type {
  NodePhase,
  OrchestrationErrorCode,
  OrchestrationEvent,
  RecoveryAction,
  RunErrorSeverity,
} from '@/shared/api/orchestration-events';

export interface StreamChunk {
  nodeId: string;
  runId: string;
  type: 'token' | 'tool-call' | 'decision' | 'error';
  chunk: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface AgentStreamState {
  chunks: StreamChunk[];
  buffer: string;
}

export interface ActivityLogEntry {
  timestamp: number;
  source: string;
  description: string;
  type: 'agent' | 'system';
}

export interface OrchestrationState {
  status: string;
  currentNode: string;
  nodeStatus: 'entering' | 'exiting' | 'running' | null;
  runId: string;
  error: string | null;
  retryCount?: number;
}

// ─── Per-node runtime (reduced from the typed event union) ──────────────────────

export interface NodeTelemetry {
  wallMs?: number;
  llmMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  model?: string;
}

export interface NodeError {
  code: OrchestrationErrorCode;
  severity: RunErrorSeverity;
  message: string;
  recovery?: RecoveryAction[];
}

export interface NodeRuntime {
  nodeId: string;
  phase: NodePhase | null;
  progressPct?: number;
  progressLabel?: string;
  telemetry?: NodeTelemetry;
  error?: NodeError | null;
  updatedAt: number;
}

interface OrchestrationStore {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  orchestrationState: OrchestrationState | null;
  agentStreams: Record<string, AgentStreamState>;
  nodeStates: Record<string, NodeRuntime>;
  activityLog: ActivityLogEntry[];

  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setOrchestrationState: (state: OrchestrationState) => void;
  appendAgentChunk: (projectId: string, nodeId: string, chunks: StreamChunk[]) => void;
  clearAgentStream: (nodeId: string) => void;
  appendActivityLog: (entry: ActivityLogEntry) => void;
  clearActivityLog: () => void;
  /** Phase 4: reduce a single typed protocol event into store state. */
  applyEvent: (event: OrchestrationEvent) => void;
  reset: () => void;
}

const MAX_CHUNKS_PER_AGENT = 500;
const MAX_ACTIVITY_LOG = 200;

function trimChunks(existing: StreamChunk[], incoming: StreamChunk[]): AgentStreamState {
  const all = [...existing, ...incoming];
  const chunks = all.length > MAX_CHUNKS_PER_AGENT ? all.slice(-MAX_CHUNKS_PER_AGENT) : all;
  return {
    chunks,
    buffer: chunks
      .filter((c) => c.type === 'token')
      .map((c) => c.chunk)
      .join(''),
  };
}

function pushLog(log: ActivityLogEntry[], entry: ActivityLogEntry): ActivityLogEntry[] {
  const next = [...log, entry];
  return next.length > MAX_ACTIVITY_LOG ? next.slice(-MAX_ACTIVITY_LOG) : next;
}

function nodeLabel(nodeId: string): string {
  const labels: Record<string, string> = {
    parse_requirements: 'Requirements',
    negotiate_contract: 'Contract',
    frontend_agent: 'Frontend',
    backend_agent: 'Backend',
    database_agent: 'Database',
    architecture_agent: 'Architecture',
    validate_outputs: 'Validator',
    commit_to_github: 'GitHub',
  };
  return labels[nodeId] ?? nodeId.replace(/_/g, ' ');
}

export const useOrchestrationStore = create<OrchestrationStore>((set) => ({
  connectionStatus: 'disconnected',
  orchestrationState: null,
  agentStreams: {},
  nodeStates: {},
  activityLog: [],

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setOrchestrationState: (orchestrationState) => set({ orchestrationState }),

  appendAgentChunk: (projectId, nodeId, chunks) =>
    set((state) => {
      const current = state.agentStreams[nodeId] ?? { chunks: [], buffer: '' };
      const timestampedChunks = chunks.map((chunk) => ({ ...chunk, timestamp: Date.now() }));
      return {
        agentStreams: {
          ...state.agentStreams,
          [nodeId]: trimChunks(current.chunks, timestampedChunks),
        },
      };
    }),

  clearAgentStream: (nodeId) =>
    set((state) => {
      const { [nodeId]: _removed, ...rest } = state.agentStreams;
      return { agentStreams: rest };
    }),

  appendActivityLog: (entry) =>
    set((state) => ({ activityLog: pushLog(state.activityLog, entry) })),

  applyEvent: (event) =>
    set((state) => {
      const activeRunId = state.orchestrationState?.runId;
      if (event.type !== 'run.status' && activeRunId && event.runId && activeRunId !== event.runId) {
        return {};
      }

      switch (event.type) {
        case 'run.status': {
          const previousRunId = activeRunId;
          const isNewRun = Boolean(previousRunId && previousRunId !== event.runId);
          return {
            orchestrationState: {
              status: event.status,
              currentNode: event.currentNode,
              nodeStatus: 'running',
              runId: event.runId,
              error: event.error ?? null,
            },
            ...(isNewRun
              ? {
                  agentStreams: {},
                  nodeStates: {},
                  activityLog: [],
                }
              : {}),
          };
        }

        case 'node.lifecycle': {
          const prev = state.nodeStates[event.nodeId];
          return {
            nodeStates: {
              ...state.nodeStates,
              [event.nodeId]: {
                nodeId: event.nodeId,
                phase: event.phase,
                progressPct: prev?.progressPct,
                progressLabel: prev?.progressLabel,
                telemetry: prev?.telemetry,
                error: event.phase === 'error' ? prev?.error : null,
                updatedAt: event.ts,
              },
            },
            activityLog: pushLog(state.activityLog, {
              timestamp: event.ts,
              source: nodeLabel(event.nodeId),
              description: `${event.phase}`,
              type: 'system',
            }),
          };
        }

        case 'node.progress': {
          const prev = state.nodeStates[event.nodeId];
          return {
            nodeStates: {
              ...state.nodeStates,
              [event.nodeId]: {
                nodeId: event.nodeId,
                phase: prev?.phase ?? 'running',
                progressPct: event.pct ?? prev?.progressPct,
                progressLabel: event.label ?? prev?.progressLabel,
                telemetry: prev?.telemetry,
                error: prev?.error,
                updatedAt: event.ts,
              },
            },
          };
        }

        case 'node.telemetry': {
          const prev = state.nodeStates[event.nodeId];
          // Telemetry arrives from two sources (timing wrapper, token logger);
          // merge fields so neither clobbers the other.
          const telemetry: NodeTelemetry = {
            ...prev?.telemetry,
            ...(event.wallMs !== undefined ? { wallMs: event.wallMs } : {}),
            ...(event.llmMs !== undefined ? { llmMs: event.llmMs } : {}),
            ...(event.inputTokens !== undefined ? { inputTokens: event.inputTokens } : {}),
            ...(event.outputTokens !== undefined ? { outputTokens: event.outputTokens } : {}),
            ...(event.costUsd !== undefined ? { costUsd: event.costUsd } : {}),
            ...(event.model !== undefined ? { model: event.model } : {}),
          };
          return {
            nodeStates: {
              ...state.nodeStates,
              [event.nodeId]: {
                nodeId: event.nodeId,
                phase: prev?.phase ?? null,
                progressPct: prev?.progressPct,
                progressLabel: prev?.progressLabel,
                telemetry,
                error: prev?.error,
                updatedAt: event.ts,
              },
            },
          };
        }

        case 'agent.stream': {
          const current = state.agentStreams[event.nodeId] ?? { chunks: [], buffer: '' };
          const incoming: StreamChunk[] = event.chunks.map((c) => ({
            nodeId: c.nodeId,
            runId: c.runId,
            type: c.type,
            chunk: c.chunk,
            metadata: c.metadata,
            timestamp: event.ts,
          }));
          let activityLog = state.activityLog;
          for (const c of event.chunks) {
            if (c.type === 'tool-call' || c.type === 'decision') {
              activityLog = pushLog(activityLog, {
                timestamp: event.ts,
                source: nodeLabel(event.nodeId),
                description: c.chunk,
                type: 'agent',
              });
            }
          }
          return {
            agentStreams: {
              ...state.agentStreams,
              [event.nodeId]: trimChunks(current.chunks, incoming),
            },
            activityLog,
          };
        }

        case 'run.error': {
          const nodeId = event.nodeId;
          const nodeError: NodeError = {
            code: event.code,
            severity: event.severity,
            message: event.message,
            recovery: event.recovery,
          };
          const base = {
            activityLog: pushLog(state.activityLog, {
              timestamp: event.ts,
              source: nodeId ? nodeLabel(nodeId) : 'System',
              description: `${event.code}: ${event.message}`,
              type: 'system' as const,
            }),
          };
          if (!nodeId) return base;
          const prev = state.nodeStates[nodeId];
          return {
            ...base,
            nodeStates: {
              ...state.nodeStates,
              [nodeId]: {
                nodeId,
                phase: 'error',
                progressPct: prev?.progressPct,
                progressLabel: prev?.progressLabel,
                telemetry: prev?.telemetry,
                error: nodeError,
                updatedAt: event.ts,
              },
            },
          };
        }

        default:
          return {};
      }
    }),

  clearActivityLog: () => set({ activityLog: [] }),

  reset: () =>
    set({
      connectionStatus: 'disconnected',
      orchestrationState: null,
      agentStreams: {},
      nodeStates: {},
      activityLog: [],
    }),
}));
