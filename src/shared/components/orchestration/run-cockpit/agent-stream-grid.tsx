"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useOrchestrationStore, type NodeRuntime, type AgentStreamState, type StreamChunk } from "@/shared/store/orchestration-store";
import {
  IconFileText,
  IconShield,
  IconWorkflow,
  IconCode,
  IconCpu,
  IconDatabase,
  IconCheckCircle,
  IconGitBranch,
  IconAlertTriangle,
  IconActivity,
} from "@/shared/components/icons";

/**
 * The live agent floor: one panel per pipeline agent, each streaming its own
 * token output in real time (from the store's `agentStreams[nodeId].buffer`)
 * with a blinking cursor while active, the last decision / tool-call it made,
 * and a telemetry footer (in/out tokens, spend, model, wall time).
 *
 * Node IDs are the canonical backend graph ids — the same join key the parity
 * test pins — so the store data maps straight onto each panel.
 */

interface AgentDef {
  nodeId: string;
  label: string;
  role: string;
  color: string;
  icon: ReactNode;
}

interface AgentPanelProps {
  agent: AgentDef;
  runtime: NodeRuntime | undefined;
  stream: AgentStreamState | undefined;
  currentNode: string;
  index: number;
  retryCount?: number;
  selected: boolean;
  onSelect: (nodeId: string) => void;
  streamOnline: boolean;
}

interface AgentStreamGridProps {
  selectedNodeId?: string | null;
  onSelectAgent?: (nodeId: string) => void;
  streamOnline?: boolean;
}

interface AgentOutputInspectorProps {
  selectedNodeId?: string | null;
  onSelectedNodeIdChange?: (nodeId: string | null) => void;
  streamOnline?: boolean;
}

interface AgentRunTranscriptProps {
  selectedNodeId?: string | null;
  onSelectAgent?: (nodeId: string) => void;
  streamOnline?: boolean;
}

const AGENTS: AgentDef[] = [
  { nodeId: "parse_requirements", label: "Requirements", role: "Parser", color: "#4F8BFF", icon: <IconFileText size={15} /> },
  { nodeId: "negotiate_contract", label: "Contract", role: "Architect", color: "#A78BFA", icon: <IconShield size={15} /> },
  { nodeId: "architecture_agent", label: "Architecture", role: "System design", color: "#6366F1", icon: <IconWorkflow size={15} /> },
  { nodeId: "frontend_agent", label: "Frontend", role: "UI engineer", color: "#F97316", icon: <IconCode size={15} /> },
  { nodeId: "backend_agent", label: "Backend", role: "API engineer", color: "#10B981", icon: <IconCpu size={15} /> },
  { nodeId: "database_agent", label: "Database", role: "Schema engineer", color: "#14B8A6", icon: <IconDatabase size={15} /> },
  { nodeId: "self_critique", label: "Self-Review", role: "Quality check", color: "#E879F9", icon: <IconCheckCircle size={15} /> },
  { nodeId: "validate_outputs", label: "Validation", role: "Reviewer", color: "#FBBF24", icon: <IconCheckCircle size={15} /> },
  { nodeId: "commit_to_github", label: "GitHub", role: "Delivery", color: "#34D399", icon: <IconGitBranch size={15} /> },
];

type AgentState = "idle" | "running" | "done" | "error";
type StreamViewMode = "all" | "tokens" | "events";
type TranscriptScope = "all" | "selected";

const EMPTY_STREAM_CHUNKS: StreamChunk[] = [];

interface AgentSnapshot {
  agent: AgentDef;
  index: number;
  runtime: NodeRuntime | undefined;
  stream: AgentStreamState | undefined;
  state: AgentState;
  tokenChunks: number;
  streamedChars: number;
  lastToken: StreamChunk | undefined;
  lastChunk: StreamChunk | undefined;
}

interface TranscriptEntry {
  id: string;
  agent: AgentDef;
  type: StreamChunk["type"];
  text: string;
  timestamp: number;
}

function resolveState(runtime: NodeRuntime | undefined, stream: AgentStreamState | undefined, currentNode: string): AgentState {
  const phase = runtime?.phase;
  if (phase === "error" || stream?.chunks.at(-1)?.type === "error") return "error";
  if (phase === "running" || phase === "entering" || currentNode === runtime?.nodeId) return "running";
  if (phase === "exiting" || (stream?.buffer.length ?? 0) > 0) return "done";
  return "idle";
}

const STATE_META: Record<AgentState, { label: string; tone: string }> = {
  idle: { label: "Waiting", tone: "#64748B" },
  running: { label: "Streaming", tone: "#4F8BFF" },
  done: { label: "Done", tone: "#34D399" },
  error: { label: "Failed", tone: "#EF4444" },
};

export function AgentStreamGrid({ selectedNodeId = null, onSelectAgent, streamOnline = true }: AgentStreamGridProps) {
  const agentStreams = useOrchestrationStore((s) => s.agentStreams);
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const currentNode = orchestrationState?.currentNode ?? "";
  const retryCount = orchestrationState?.retryCount ?? 0;

  return (
    <div className="cockpit-grid">
      {AGENTS.map((agent, i) => (
        <AgentPanel
          key={agent.nodeId}
          agent={agent}
          runtime={nodeStates[agent.nodeId]}
          stream={agentStreams[agent.nodeId]}
          currentNode={currentNode}
          index={i}
          retryCount={retryCount}
          selected={selectedNodeId === agent.nodeId}
          onSelect={(nodeId) => onSelectAgent?.(nodeId)}
          streamOnline={streamOnline}
        />
      ))}
    </div>
  );
}

function AgentPanel({
  agent,
  runtime,
  stream,
  currentNode,
  index,
  retryCount = 0,
  selected,
  onSelect,
  streamOnline,
}: AgentPanelProps) {
  const state = resolveState(runtime, stream, currentNode);
  const meta = STATE_META[state];
  const t = runtime?.telemetry;
  const tokenChunks = useMemo(
    () => (stream?.chunks ?? []).filter((c) => c.type === "token"),
    [stream?.chunks],
  );
  const streamedChars = stream?.buffer.length ?? 0;

  const lastDecision = useMemo(
    () => [...(stream?.chunks ?? [])].reverse().find((c) => c.type === "decision" || c.type === "tool-call"),
    [stream?.chunks],
  );
  const errorChunk = useMemo(
    () => (stream?.chunks ?? []).find((c) => c.type === "error"),
    [stream?.chunks],
  );
  const selectAgent = () => onSelect(agent.nodeId);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectAgent();
    }
  };

  return (
    <article
      className={`agent-panel reveal is-${state}${selected ? " is-selected" : ""}`}
      style={{ "--accent": agent.color, "--i": index } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Inspect ${agent.label} agent output`}
      onClick={selectAgent}
      onKeyDown={handleKeyDown}
    >
      <header className="agent-panel-head">
        <span className="agent-panel-icon" style={{ background: `${agent.color}1f`, color: agent.color }}>
          {agent.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="agent-panel-name">
            {agent.label}
            {retryCount > 0 && state === "running" && (
              <span className="agent-retry-badge" title={`Retry attempt ${retryCount}`}>
                {retryCount}
              </span>
            )}
          </div>
          <div className="agent-panel-role">{agent.role}</div>
        </div>
        <span className="agent-panel-status" style={{ color: meta.tone }}>
          <span
            className={state === "running" ? "agent-status-dot is-live" : "agent-status-dot"}
            style={{ background: meta.tone }}
          />
          {meta.label}
        </span>
      </header>

      {state === "error" ? (
        <div className="agent-panel-error">
          <IconAlertTriangle size={13} />
          <span>{errorChunk?.chunk ?? runtime?.error?.message ?? "Agent run failed."}</span>
        </div>
      ) : (
        <StreamConsole
          chunks={stream?.chunks ?? []}
          active={state === "running" && streamOnline}
          state={state}
          streamOnline={streamOnline}
        />
      )}

      {lastDecision && state !== "error" && (
        <div className="agent-panel-decision" title={lastDecision.chunk}>
          <span className="agent-panel-decision-kind">{lastDecision.type === "tool-call" ? "tool" : "decision"}</span>
          <span className="agent-panel-decision-text">{lastDecision.chunk}</span>
        </div>
      )}

      <footer className="agent-panel-meta">
        <Chip label="live" value={tokenChunks.length > 0 ? `${tokenChunks.length}` : "—"} />
        <Chip label="chars" value={streamedChars > 0 ? fmtTok(streamedChars) : "—"} />
        <Chip label="in" value={fmtTok(t?.inputTokens)} />
        <Chip label="out" value={fmtTok(t?.outputTokens)} />
        <Chip label="$" value={t?.costUsd != null ? `${t.costUsd.toFixed(t.costUsd < 1 ? 4 : 2)}` : "—"} />
        <Chip label="t" value={t?.wallMs != null ? `${(t.wallMs / 1000).toFixed(1)}s` : "—"} />
      </footer>
    </article>
  );
}

function StreamConsole({
  chunks,
  active,
  state,
  className = "",
  follow = true,
  mode = "all",
  streamOnline = true,
}: {
  chunks: StreamChunk[];
  active: boolean;
  state: AgentState;
  className?: string;
  follow?: boolean;
  mode?: StreamViewMode;
  streamOnline?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visibleChunks = useMemo(() => filterChunksByMode(chunks, mode), [chunks, mode]);

  useEffect(() => {
    if (follow && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [visibleChunks, follow]);

  const empty = visibleChunks.length === 0;
  const lastTokenIndex = visibleChunks.reduce((last, chunk, index) => (chunk.type === "token" ? index : last), -1);
  const emptyLabel =
    mode === "events"
      ? "No lifecycle events for this agent yet."
      : mode === "tokens"
        ? active
          ? "Waiting for token output..."
          : "No token output yet."
        : state === "idle"
          ? "Waiting for this agent's turn."
          : streamOnline
            ? "Connecting to the token stream..."
            : "Token stream reconnecting...";

  return (
    <div className={`agent-panel-stream ${className}`} ref={ref} data-empty={empty} data-active={active}>
      {empty ? (
        <span className="agent-panel-placeholder">{emptyLabel}</span>
      ) : (
        <span className="agent-stream-lines">
          {visibleChunks.map((chunk, index) => (
            <StreamChunkView
              key={`${chunk.timestamp}-${chunk.type}-${index}`}
              chunk={chunk}
              latest={active && index === lastTokenIndex}
            />
          ))}
        </span>
      )}
      {active && mode !== "events" && <span className="cockpit-cursor" aria-hidden="true" />}
    </div>
  );
}

function filterChunksByMode(chunks: StreamChunk[], mode: StreamViewMode): StreamChunk[] {
  if (mode === "tokens") return chunks.filter((chunk) => chunk.type === "token");
  if (mode === "events") return chunks.filter((chunk) => chunk.type !== "token");
  return chunks;
}

function formatChunksForClipboard(chunks: StreamChunk[], mode: StreamViewMode): string {
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

function formatEventLine(chunk: StreamChunk): string {
  const label = chunk.type === "tool-call" ? "tool" : chunk.type;
  return `[${label}] ${chunk.chunk}`;
}

function buildTranscriptEntries(snapshots: AgentSnapshot[]): TranscriptEntry[] {
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

function formatTranscriptForClipboard(entries: TranscriptEntry[]): string {
  return entries
    .map((entry) => {
      const label = entry.type === "tool-call" ? "tool" : entry.type;
      return `[${entry.agent.label} · ${label}] ${entry.text}`;
    })
    .join("\n");
}

function filterTranscriptEntriesByMode(entries: TranscriptEntry[], mode: StreamViewMode): TranscriptEntry[] {
  if (mode === "tokens") return entries.filter((entry) => entry.type === "token");
  if (mode === "events") return entries.filter((entry) => entry.type !== "token");
  return entries;
}

function filterTranscriptEntriesByScope(
  entries: TranscriptEntry[],
  selectedNodeId: string | null,
  scope: TranscriptScope,
): TranscriptEntry[] {
  if (scope !== "selected" || !selectedNodeId) return entries;
  return entries.filter((entry) => entry.agent.nodeId === selectedNodeId);
}

function useAgentSnapshots() {
  const agentStreams = useOrchestrationStore((s) => s.agentStreams);
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const currentNode = orchestrationState?.currentNode ?? "";

  return useMemo<AgentSnapshot[]>(
    () =>
      AGENTS.map((agent, index) => {
        const runtime = nodeStates[agent.nodeId];
        const stream = agentStreams[agent.nodeId];
        const chunks = stream?.chunks ?? [];
        const tokenChunkList = chunks.filter((chunk) => chunk.type === "token");
        return {
          agent,
          index,
          runtime,
          stream,
          state: resolveState(runtime, stream, currentNode),
          tokenChunks: tokenChunkList.length,
          streamedChars: stream?.buffer.length ?? 0,
          lastToken: tokenChunkList.at(-1),
          lastChunk: chunks.at(-1),
        };
      }),
    [agentStreams, currentNode, nodeStates],
  );
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

export function AgentStreamPulse() {
  const snapshots = useAgentSnapshots();
  const now = useNow();
  const latestToken = snapshots
    .flatMap((item) => (item.lastToken ? [{ agent: item.agent, chunk: item.lastToken }] : []))
    .sort((a, b) => a.chunk.timestamp - b.chunk.timestamp)
    .at(-1);
  const latestChunk = snapshots
    .flatMap((item) => (item.lastChunk ? [{ agent: item.agent, chunk: item.lastChunk }] : []))
    .sort((a, b) => a.chunk.timestamp - b.chunk.timestamp)
    .at(-1);
  const latest = latestToken ?? latestChunk ?? null;
  const isToken = latest?.chunk.type === "token";
  const ageMs = latest ? Math.max(now - latest.chunk.timestamp, 0) : null;
  const isFresh = ageMs != null && ageMs < 5000;
  const label = latest
    ? `${isToken ? "Latest token" : "Latest event"} · ${latest.agent.label}`
    : "Waiting for stream";
  const age = ageMs == null ? "No chunks yet" : formatAge(ageMs);

  return (
    <span
      className={isFresh ? "stream-freshness is-fresh" : "stream-freshness"}
      title={latest ? `${latest.agent.label}: ${latest.chunk.chunk}` : "No live stream chunks received yet"}
      aria-live="polite"
    >
      <span className="stream-freshness-dot" aria-hidden="true" />
      <span className="stream-freshness-copy">
        <span className="stream-freshness-label">{label}</span>
        <span className="stream-freshness-age mono">{age}</span>
      </span>
    </span>
  );
}

export function AgentLiveHandoff() {
  const snapshots = useAgentSnapshots();
  const active = snapshots.find((item) => item.state === "running") ?? null;
  const next = active
    ? snapshots.slice(active.index + 1).find((item) => item.state === "idle")
    : snapshots.find((item) => item.state === "idle");
  const completed = snapshots.filter((item) => item.state === "done").length;
  const totalTokenChunks = snapshots.reduce((sum, item) => sum + item.tokenChunks, 0);
  const totalStreamedChars = snapshots.reduce((sum, item) => sum + item.streamedChars, 0);

  const lastEvent = snapshots
    .flatMap((item) =>
      (item.stream?.chunks ?? [])
        .filter((chunk) => chunk.type !== "token")
        .map((chunk, order) => ({ chunk, order, agent: item.agent })),
    )
    .sort((a, b) => a.chunk.timestamp - b.chunk.timestamp || a.order - b.order)
    .at(-1);

  const focusTitle = active?.agent.label ?? lastEvent?.agent.label ?? "Waiting for agents";
  const focusBody = active
    ? active.runtime?.progressLabel ?? "Streaming model output into the run."
    : lastEvent?.chunk.chunk ?? "Start or resume the run to watch each specialist hand work forward.";
  const nextLabel = next?.agent.label ?? (completed === AGENTS.length ? "Delivery complete" : "Gate or review");

  return (
    <section className="agent-handoff-strip reveal" aria-label="Live orchestration handoff">
      <div className="agent-handoff-focus">
        <span className={active ? "agent-handoff-pulse is-live" : "agent-handoff-pulse"} aria-hidden="true">
          <IconActivity size={15} />
        </span>
        <div className="agent-handoff-copy">
          <span className="agent-handoff-eyebrow">Current handoff</span>
          <strong className="agent-handoff-title">{focusTitle}</strong>
          <span className="agent-handoff-body">{focusBody}</span>
        </div>
      </div>
      <div className="agent-handoff-metrics" aria-label="Live stream metrics">
        <HandoffMetric label="done" value={`${completed}/${AGENTS.length}`} />
        <HandoffMetric label="chunks" value={totalTokenChunks > 0 ? fmtTok(totalTokenChunks) : "—"} />
        <HandoffMetric label="chars" value={totalStreamedChars > 0 ? fmtTok(totalStreamedChars) : "—"} />
        <HandoffMetric label="next" value={nextLabel} wide />
      </div>
    </section>
  );
}

export function AgentRunTranscript({
  selectedNodeId = null,
  onSelectAgent,
  streamOnline = true,
}: AgentRunTranscriptProps) {
  const snapshots = useAgentSnapshots();
  const [copied, setCopied] = useState(false);
  const [followTranscript, setFollowTranscript] = useState(true);
  const [transcriptViewMode, setTranscriptViewMode] = useState<StreamViewMode>("all");
  const [transcriptScope, setTranscriptScope] = useState<TranscriptScope>("all");
  const [pausedEntryCount, setPausedEntryCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const entries = useMemo(() => buildTranscriptEntries(snapshots).slice(-80), [snapshots]);
  const selectedAgent = selectedNodeId ? snapshots.find((snapshot) => snapshot.agent.nodeId === selectedNodeId)?.agent ?? null : null;
  const scopedEntries = useMemo(
    () => filterTranscriptEntriesByScope(entries, selectedNodeId, transcriptScope),
    [entries, selectedNodeId, transcriptScope],
  );
  const visibleEntries = useMemo(
    () => filterTranscriptEntriesByMode(scopedEntries, transcriptViewMode),
    [scopedEntries, transcriptViewMode],
  );
  const tokenEntryCount = visibleEntries.filter((entry) => entry.type === "token").length;
  const eventEntryCount = visibleEntries.length - tokenEntryCount;
  const transcriptText = useMemo(() => formatTranscriptForClipboard(visibleEntries), [visibleEntries]);
  const newEntryCount = followTranscript ? 0 : Math.max(visibleEntries.length - pausedEntryCount, 0);
  const emptyLabel =
    transcriptScope === "selected" && selectedAgent
      ? `No ${selectedAgent.label} output in this view yet.`
      : transcriptViewMode === "tokens"
      ? "Waiting for token output in the run transcript."
      : transcriptViewMode === "events"
        ? "No lifecycle events in the run transcript yet."
        : "Waiting for agent stream output.";

  useEffect(() => {
    if (transcriptScope === "selected" && !selectedAgent) {
      setTranscriptScope("all");
    }
  }, [selectedAgent, transcriptScope]);

  useEffect(() => {
    if (followTranscript && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [followTranscript, visibleEntries]);

  useEffect(() => {
    if (followTranscript) setPausedEntryCount(visibleEntries.length);
  }, [followTranscript, visibleEntries.length]);

  const copyTranscript = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const selectEntryAgent = (nodeId: string) => onSelectAgent?.(nodeId);
  const handleEntryKeyDown = (event: KeyboardEvent<HTMLElement>, nodeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectEntryAgent(nodeId);
    }
  };
  const toggleFollowTranscript = () => {
    setPausedEntryCount(visibleEntries.length);
    setFollowTranscript((value) => !value);
  };
  const jumpToLatestEntry = () => {
    setPausedEntryCount(visibleEntries.length);
    setFollowTranscript(true);
  };
  const changeTranscriptViewMode = (mode: StreamViewMode) => {
    setTranscriptViewMode(mode);
    setPausedEntryCount(filterTranscriptEntriesByMode(scopedEntries, mode).length);
    setCopied(false);
  };
  const changeTranscriptScope = (scope: TranscriptScope) => {
    if (scope === "selected" && !selectedAgent) return;
    const nextScopedEntries = filterTranscriptEntriesByScope(entries, selectedNodeId, scope);
    setTranscriptScope(scope);
    setPausedEntryCount(filterTranscriptEntriesByMode(nextScopedEntries, transcriptViewMode).length);
    setCopied(false);
  };

  return (
    <section className="agent-transcript reveal" aria-label="Run stream transcript">
      <header className="agent-transcript-head">
        <div>
          <span className="agent-transcript-kicker">Run transcript</span>
          <h3 className="agent-transcript-title">Chronological agent stream</h3>
        </div>
        <div className="agent-transcript-actions">
          <div className="agent-transcript-segments" role="group" aria-label="Transcript scope">
            {(["all", "selected"] as const).map((scope) => {
              const disabled = scope === "selected" && !selectedAgent;
              return (
                <button
                  key={scope}
                  type="button"
                  className={transcriptScope === scope ? "agent-transcript-segment is-active" : "agent-transcript-segment"}
                  onClick={() => changeTranscriptScope(scope)}
                  aria-pressed={transcriptScope === scope}
                  disabled={disabled}
                  title={scope === "selected" && selectedAgent ? `Only show ${selectedAgent.label}` : undefined}
                >
                  {scope === "all" ? "All agents" : selectedAgent?.label ?? "Selected"}
                </button>
              );
            })}
          </div>
          <div className="agent-transcript-segments" role="group" aria-label="Transcript view">
            {(["all", "tokens", "events"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={transcriptViewMode === mode ? "agent-transcript-segment is-active" : "agent-transcript-segment"}
                onClick={() => changeTranscriptViewMode(mode)}
                aria-pressed={transcriptViewMode === mode}
              >
                {mode === "all" ? "All" : mode === "tokens" ? "Tokens" : "Events"}
              </button>
            ))}
          </div>
          <span className={streamOnline ? "agent-transcript-state is-live" : "agent-transcript-state"}>
            <span className="stream-health-dot" aria-hidden="true" />
            {streamOnline ? "Live feed" : "Buffered feed"}
          </span>
          <HandoffMetric label="tokens" value={tokenEntryCount > 0 ? fmtTok(tokenEntryCount) : "—"} />
          <HandoffMetric label="events" value={eventEntryCount > 0 ? fmtTok(eventEntryCount) : "—"} />
          <button
            type="button"
            className={followTranscript ? "agent-transcript-copy is-active" : "agent-transcript-copy"}
            onClick={toggleFollowTranscript}
            aria-pressed={followTranscript}
          >
            {followTranscript ? "Following" : "Paused"}
          </button>
          {newEntryCount > 0 && (
            <button
              type="button"
              className="agent-transcript-copy is-new"
              onClick={jumpToLatestEntry}
            >
              {fmtTok(newEntryCount)} new
            </button>
          )}
          <button
            type="button"
            className="agent-transcript-copy"
            onClick={copyTranscript}
            disabled={!transcriptText}
          >
            {copied ? "Copied" : "Copy transcript"}
          </button>
        </div>
      </header>

      <div className="agent-transcript-list" data-empty={visibleEntries.length === 0} ref={listRef}>
        {visibleEntries.length === 0 ? (
          <span className="agent-transcript-empty">{emptyLabel}</span>
        ) : (
          visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className={`agent-transcript-entry is-${entry.type}${selectedNodeId === entry.agent.nodeId ? " is-selected" : ""}`}
              style={{ "--accent": entry.agent.color } as CSSProperties}
              role={onSelectAgent ? "button" : undefined}
              tabIndex={onSelectAgent ? 0 : undefined}
              aria-pressed={onSelectAgent ? selectedNodeId === entry.agent.nodeId : undefined}
              aria-label={`Inspect ${entry.agent.label} stream from transcript`}
              onClick={() => selectEntryAgent(entry.agent.nodeId)}
              onKeyDown={(event) => handleEntryKeyDown(event, entry.agent.nodeId)}
            >
              <span className="agent-transcript-marker" aria-hidden="true" />
              <div className="agent-transcript-row">
                <div className="agent-transcript-meta">
                  <span className="agent-transcript-agent">{entry.agent.label}</span>
                  <span className="agent-transcript-type">{entry.type === "tool-call" ? "tool" : entry.type}</span>
                </div>
                <p className="agent-transcript-text">{entry.text}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function AgentOutputInspector({
  selectedNodeId: controlledSelectedNodeId,
  onSelectedNodeIdChange,
  streamOnline = true,
}: AgentOutputInspectorProps = {}) {
  const snapshots = useAgentSnapshots();
  const [localSelectedNodeId, setLocalSelectedNodeId] = useState<string | null>(null);
  const [followLive, setFollowLive] = useState(true);
  const [streamViewMode, setStreamViewMode] = useState<StreamViewMode>("all");
  const [pausedChunkCount, setPausedChunkCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const selectedNodeRef = useRef<string | null>(null);
  const selectedNodeId = controlledSelectedNodeId !== undefined ? controlledSelectedNodeId : localSelectedNodeId;
  const setSelectedNodeId = onSelectedNodeIdChange ?? setLocalSelectedNodeId;
  const active = snapshots.find((item) => item.state === "running") ?? null;
  const firstWithOutput = snapshots.find((item) => (item.stream?.chunks.length ?? 0) > 0);
  const trackingActive = selectedNodeId === null;
  const selected =
    snapshots.find((item) => item.agent.nodeId === selectedNodeId) ??
    active ??
    firstWithOutput ??
    snapshots[0];
  const meta = STATE_META[selected.state];
  const chunks = selected.stream?.chunks ?? EMPTY_STREAM_CHUNKS;
  const visibleChunks = useMemo(() => filterChunksByMode(chunks, streamViewMode), [chunks, streamViewMode]);
  const visibleOutput = useMemo(
    () => formatChunksForClipboard(visibleChunks, streamViewMode),
    [streamViewMode, visibleChunks],
  );
  const lastEvent = [...chunks].reverse().find((chunk) => chunk.type !== "token");
  const progress = selected.runtime?.progressLabel ?? lastEvent?.chunk ?? "Waiting for this specialist to produce output.";
  const model = selected.runtime?.telemetry?.model ?? "model pending";
  const newChunkCount = followLive ? 0 : Math.max(visibleChunks.length - pausedChunkCount, 0);

  useEffect(() => {
    if (selectedNodeRef.current !== selected.agent.nodeId) {
      selectedNodeRef.current = selected.agent.nodeId;
      setPausedChunkCount(visibleChunks.length);
      setCopied(false);
    }
  }, [selected.agent.nodeId, visibleChunks.length]);

  useEffect(() => {
    if (followLive) setPausedChunkCount(visibleChunks.length);
  }, [followLive, visibleChunks.length]);

  const toggleFollowLive = () => {
    setPausedChunkCount(visibleChunks.length);
    setFollowLive((value) => !value);
  };

  const jumpToLatest = () => {
    setPausedChunkCount(visibleChunks.length);
    setFollowLive(true);
  };

  const trackActiveAgent = () => {
    setSelectedNodeId(null);
    setPausedChunkCount(visibleChunks.length);
    setFollowLive(true);
  };

  const pinAgent = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setPausedChunkCount(visibleChunks.length);
  };

  const changeStreamViewMode = (mode: StreamViewMode) => {
    setStreamViewMode(mode);
    setPausedChunkCount(filterChunksByMode(chunks, mode).length);
    setCopied(false);
  };

  const copyOutput = async () => {
    if (!visibleOutput) return;
    await navigator.clipboard.writeText(visibleOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="agent-inspector reveal" aria-label="Focused agent output inspector">
      <header className="agent-inspector-head">
        <div className="agent-inspector-titleblock">
          <span className="agent-inspector-kicker">Focused stream</span>
          <div className="agent-inspector-title-row">
            <span className="agent-inspector-icon" style={{ background: `${selected.agent.color}1f`, color: selected.agent.color }}>
              {selected.agent.icon}
            </span>
            <div>
              <h3 className="agent-inspector-title">{selected.agent.label}</h3>
              <p className="agent-inspector-subtitle">{selected.agent.role} · {progress}</p>
            </div>
          </div>
        </div>
        <div className="agent-inspector-stats">
          <HandoffMetric label="state" value={meta.label} />
          <HandoffMetric label="visible" value={visibleChunks.length > 0 ? fmtTok(visibleChunks.length) : "—"} />
          <HandoffMetric label="chars" value={selected.streamedChars > 0 ? fmtTok(selected.streamedChars) : "—"} />
          <HandoffMetric label="model" value={model} wide />
        </div>
      </header>

      <div className="agent-inspector-controls">
        <div className="agent-inspector-segments" role="group" aria-label="Stream view">
          {(["all", "tokens", "events"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={streamViewMode === mode ? "agent-inspector-segment is-active" : "agent-inspector-segment"}
              onClick={() => changeStreamViewMode(mode)}
              aria-pressed={streamViewMode === mode}
            >
              {mode === "all" ? "All" : mode === "tokens" ? "Tokens" : "Events"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={trackingActive ? "agent-inspector-action is-active" : "agent-inspector-action"}
          onClick={trackActiveAgent}
          aria-pressed={trackingActive}
        >
          {trackingActive ? "Tracking active" : "Track active"}
        </button>
        <button
          type="button"
          className={followLive ? "agent-inspector-action is-active" : "agent-inspector-action"}
          onClick={toggleFollowLive}
          aria-pressed={followLive}
        >
          {followLive ? "Following live" : "Follow paused"}
        </button>
        {newChunkCount > 0 && (
          <button
            type="button"
            className="agent-inspector-action is-new"
            onClick={jumpToLatest}
          >
            {fmtTok(newChunkCount)} new chunks
          </button>
        )}
        <button
          type="button"
          className="agent-inspector-action"
          onClick={copyOutput}
          disabled={!visibleOutput}
        >
          {copied ? "Copied" : "Copy visible"}
        </button>
      </div>

      <div className="agent-inspector-tabs" role="tablist" aria-label="Choose agent output stream">
        {snapshots.map((item) => {
          const isSelected = item.agent.nodeId === selected.agent.nodeId;
          const itemMeta = STATE_META[item.state];
          return (
            <button
              key={item.agent.nodeId}
              type="button"
              className={isSelected ? "agent-inspector-tab is-selected" : "agent-inspector-tab"}
              onClick={() => pinAgent(item.agent.nodeId)}
              role="tab"
              aria-selected={isSelected}
              style={{ "--accent": item.agent.color } as CSSProperties}
            >
              <span className={item.state === "running" ? "agent-status-dot is-live" : "agent-status-dot"} style={{ background: itemMeta.tone }} />
              <span className="agent-inspector-tab-label">{item.agent.label}</span>
              {isSelected && !trackingActive && <span className="agent-inspector-tab-pin">Pinned</span>}
              {item.tokenChunks > 0 && <span className="agent-inspector-tab-count mono">{fmtTok(item.tokenChunks)}</span>}
            </button>
          );
        })}
      </div>

      <StreamConsole
        chunks={chunks}
        active={selected.state === "running" && streamOnline}
        state={selected.state}
        className="agent-inspector-stream"
        follow={followLive}
        mode={streamViewMode}
        streamOnline={streamOnline}
      />
    </section>
  );
}

function StreamChunkView({ chunk, latest }: { chunk: StreamChunk; latest: boolean }) {
  if (chunk.type === "token") {
    return <span className={latest ? "agent-stream-token is-latest" : "agent-stream-token"}>{chunk.chunk}</span>;
  }

  const label = chunk.type === "tool-call" ? "tool" : chunk.type;
  return (
    <span className={`agent-stream-event is-${chunk.type}`}>
      <span className="agent-stream-event-label">{label}</span>
      <span className="agent-stream-event-text">{chunk.chunk}</span>
    </span>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="agent-chip">
      <span className="agent-chip-label">{label}</span>
      <span className="agent-chip-value mono">{value}</span>
    </span>
  );
}

function HandoffMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <span className={wide ? "handoff-metric is-wide" : "handoff-metric"}>
      <span className="handoff-metric-label">{label}</span>
      <span className="handoff-metric-value mono">{value}</span>
    </span>
  );
}

function fmtTok(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatAge(ageMs: number): string {
  if (ageMs < 1500) return "just now";
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s ago`;
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  return `${Math.floor(ageMs / 3_600_000)}h ago`;
}
