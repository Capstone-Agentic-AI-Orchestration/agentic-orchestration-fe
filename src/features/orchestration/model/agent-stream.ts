import type {
  AgentStreamState,
  NodeRuntime,
  StreamChunk,
} from "@/shared/store/orchestration-store";

export type AgentState = "idle" | "running" | "done" | "error";
export type StreamViewMode = "all" | "tokens" | "events";
export type TranscriptScope = "all" | "selected";

export interface AgentStreamDefinition {
  nodeId: string;
  label: string;
  role: string;
  color: string;
}

export interface AgentSnapshot {
  agent: AgentStreamDefinition;
  index: number;
  runtime: NodeRuntime | undefined;
  stream: AgentStreamState | undefined;
  state: AgentState;
  tokenChunks: number;
  streamedChars: number;
  lastToken: StreamChunk | undefined;
  lastChunk: StreamChunk | undefined;
}

export interface TranscriptEntry {
  id: string;
  agent: AgentStreamDefinition;
  type: StreamChunk["type"];
  text: string;
  timestamp: number;
}

export const ORCHESTRATION_AGENT_DEFINITIONS: AgentStreamDefinition[] = [
  { nodeId: "parse_requirements", label: "Requirements", role: "Parser", color: "#4F8BFF" },
  { nodeId: "negotiate_contract", label: "Contract", role: "Architect", color: "#A78BFA" },
  { nodeId: "architecture_agent", label: "Architecture", role: "System design", color: "#6366F1" },
  { nodeId: "frontend_agent", label: "Frontend", role: "UI engineer", color: "#F97316" },
  { nodeId: "backend_agent", label: "Backend", role: "API engineer", color: "#10B981" },
  { nodeId: "database_agent", label: "Database", role: "Schema engineer", color: "#14B8A6" },
  { nodeId: "self_critique", label: "Self-Review", role: "Quality check", color: "#E879F9" },
  { nodeId: "validate_outputs", label: "Validation", role: "Reviewer", color: "#FBBF24" },
  { nodeId: "commit_to_github", label: "GitHub", role: "Delivery", color: "#34D399" },
];

export const AGENT_STATE_META: Record<AgentState, { label: string; tone: string }> = {
  idle: { label: "Waiting", tone: "#64748B" },
  running: { label: "Streaming", tone: "#4F8BFF" },
  done: { label: "Done", tone: "#34D399" },
  error: { label: "Failed", tone: "#EF4444" },
};

export function resolveAgentState(
  runtime: NodeRuntime | undefined,
  stream: AgentStreamState | undefined,
  currentNode: string,
): AgentState {
  const phase = runtime?.phase;
  if (phase === "error" || stream?.chunks.at(-1)?.type === "error") return "error";
  if (phase === "running" || phase === "entering" || currentNode === runtime?.nodeId) return "running";
  if (phase === "exiting" || (stream?.buffer.length ?? 0) > 0) return "done";
  return "idle";
}

export function filterChunksByMode(
  chunks: StreamChunk[],
  mode: StreamViewMode,
): StreamChunk[] {
  if (mode === "tokens") return chunks.filter((chunk) => chunk.type === "token");
  if (mode === "events") return chunks.filter((chunk) => chunk.type !== "token");
  return chunks;
}

export function formatChunksForClipboard(
  chunks: StreamChunk[],
  mode: StreamViewMode,
): string {
  if (chunks.length === 0) return "";
  if (mode === "tokens") {
    return chunks.map((chunk) => chunk.chunk).join("");
  }
  if (mode === "events") {
    return chunks.map(formatEventLine).join("\n");
  }

  return chunks
    .map((chunk) => (chunk.type === "token" ? chunk.chunk : `\n${formatEventLine(chunk)}\n`))
    .join("")
    .trim();
}

export function formatEventLine(chunk: StreamChunk): string {
  const label = chunk.type === "tool-call" ? "tool" : chunk.type;
  return `[${label}] ${chunk.chunk}`;
}

export function buildAgentSnapshots(input: {
  agentStreams: Record<string, AgentStreamState>;
  nodeStates: Record<string, NodeRuntime>;
  currentNode: string;
  agents?: AgentStreamDefinition[];
}): AgentSnapshot[] {
  const agents = input.agents ?? ORCHESTRATION_AGENT_DEFINITIONS;

  return agents.map((agent, index) => {
    const runtime = input.nodeStates[agent.nodeId];
    const stream = input.agentStreams[agent.nodeId];
    const chunks = stream?.chunks ?? [];
    const tokenChunkList = chunks.filter((chunk) => chunk.type === "token");

    return {
      agent,
      index,
      runtime,
      stream,
      state: resolveAgentState(runtime, stream, input.currentNode),
      tokenChunks: tokenChunkList.length,
      streamedChars: stream?.buffer.length ?? 0,
      lastToken: tokenChunkList.at(-1),
      lastChunk: chunks.at(-1),
    };
  });
}

export function buildTranscriptEntries(snapshots: AgentSnapshot[]): TranscriptEntry[] {
  const ordered = snapshots
    .flatMap((snapshot) =>
      (snapshot.stream?.chunks ?? []).map((chunk, index) => ({
        agent: snapshot.agent,
        agentIndex: snapshot.index,
        chunk,
        index,
      })),
    )
    .sort((a, b) => a.chunk.timestamp - b.chunk.timestamp || a.agentIndex - b.agentIndex || a.index - b.index);

  const entries: TranscriptEntry[] = [];
  for (const item of ordered) {
    const previous = entries.at(-1);
    if (item.chunk.type === "token" && previous?.type === "token" && previous.agent.nodeId === item.agent.nodeId) {
      previous.text += item.chunk.chunk;
      previous.timestamp = item.chunk.timestamp;
      continue;
    }

    entries.push({
      id: `${item.agent.nodeId}-${item.chunk.timestamp}-${item.index}-${entries.length}`,
      agent: item.agent,
      type: item.chunk.type,
      text: item.chunk.chunk,
      timestamp: item.chunk.timestamp,
    });
  }

  return entries;
}

export function formatTranscriptForClipboard(entries: TranscriptEntry[]): string {
  return entries
    .map((entry) => {
      const label = entry.type === "tool-call" ? "tool" : entry.type;
      return `[${entry.agent.label} - ${label}] ${entry.text}`;
    })
    .join("\n");
}

export function filterTranscriptEntriesByMode(
  entries: TranscriptEntry[],
  mode: StreamViewMode,
): TranscriptEntry[] {
  if (mode === "tokens") return entries.filter((entry) => entry.type === "token");
  if (mode === "events") return entries.filter((entry) => entry.type !== "token");
  return entries;
}

export function filterTranscriptEntriesByScope(
  entries: TranscriptEntry[],
  selectedNodeId: string | null,
  scope: TranscriptScope,
): TranscriptEntry[] {
  if (scope !== "selected" || !selectedNodeId) return entries;
  return entries.filter((entry) => entry.agent.nodeId === selectedNodeId);
}

export function formatStreamAge(ageMs: number): string {
  if (ageMs < 1500) return "just now";
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s ago`;
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  return `${Math.floor(ageMs / 3_600_000)}h ago`;
}

export function formatCompactCount(value: number | undefined): string {
  if (value == null) return "-";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}
