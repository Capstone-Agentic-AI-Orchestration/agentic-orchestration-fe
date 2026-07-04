"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useOrchestrationStore, type NodeRuntime, type AgentStreamState } from "@/shared/store/orchestration-store";
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

export function AgentStreamGrid() {
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
}: AgentPanelProps) {
  const state = resolveState(runtime, stream, currentNode);
  const meta = STATE_META[state];
  const t = runtime?.telemetry;

  const lastDecision = useMemo(
    () => [...(stream?.chunks ?? [])].reverse().find((c) => c.type === "decision" || c.type === "tool-call"),
    [stream?.chunks],
  );
  const errorChunk = useMemo(
    () => (stream?.chunks ?? []).find((c) => c.type === "error"),
    [stream?.chunks],
  );

  return (
    <article
      className={`agent-panel reveal is-${state}`}
      style={{ "--accent": agent.color, "--i": index } as CSSProperties}
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
        <StreamConsole buffer={stream?.buffer ?? ""} active={state === "running"} state={state} />
      )}

      {lastDecision && state !== "error" && (
        <div className="agent-panel-decision" title={lastDecision.chunk}>
          <span className="agent-panel-decision-kind">{lastDecision.type === "tool-call" ? "tool" : "decision"}</span>
          <span className="agent-panel-decision-text">{lastDecision.chunk}</span>
        </div>
      )}

      <footer className="agent-panel-meta">
        <Chip label="in" value={fmtTok(t?.inputTokens)} />
        <Chip label="out" value={fmtTok(t?.outputTokens)} />
        <Chip label="$" value={t?.costUsd != null ? `${t.costUsd.toFixed(t.costUsd < 1 ? 4 : 2)}` : "—"} />
        <Chip label="t" value={t?.wallMs != null ? `${(t.wallMs / 1000).toFixed(1)}s` : "—"} />
      </footer>
    </article>
  );
}

function StreamConsole({ buffer, active, state }: { buffer: string; active: boolean; state: AgentState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [buffer]);

  const empty = buffer.length === 0;

  return (
    <div className="agent-panel-stream" ref={ref} data-empty={empty}>
      {empty ? (
        <span className="agent-panel-placeholder">
          {state === "idle" ? "Idle — waiting for its turn in the pipeline." : "Generating…"}
        </span>
      ) : (
        <span className="agent-panel-tokens">{buffer}</span>
      )}
      {active && <span className="cockpit-cursor" aria-hidden="true" />}
    </div>
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

function fmtTok(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
