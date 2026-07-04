// @ts-nocheck
"use client";

import { useMemo, useRef, useEffect } from "react";
import { Badge, Card } from "@/shared/components/ui";
import { IconCpu, IconCode, IconCheckCircle, IconAlertTriangle, IconClock } from "@/shared/components/icons";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";

interface AgentLiveStripProps {
  scoped?: boolean;
}

export const AGENT_CONFIG: Array<{
  nodeId: string;
  label: string;
  color: string;
}> = [
  { nodeId: "parse_requirements", label: "Requirements", color: "#4F8BFF" },
  { nodeId: "negotiate_contract", label: "Contract", color: "#A78BFA" },
  { nodeId: "frontend_agent", label: "Frontend", color: "#F97316" },
  { nodeId: "backend_agent", label: "Backend", color: "#10B981" },
  { nodeId: "database_agent", label: "Database", color: "#14B8A6" },
  { nodeId: "architecture_agent", label: "Architecture", color: "#A78BFA" },
  { nodeId: "validate_outputs", label: "Validator", color: "#FBBF24" },
];

function agentStatus(nodeId: string, stream: { chunks: Array<{ type: string }>; buffer: string } | undefined, orchestrationState: { currentNode: string; status: string } | null): { label: string; tone: "green" | "blue" | "amber" | "red" | "gray" } {
  if (!stream) {
    return { label: "Waiting", tone: "gray" };
  }

  const lastChunk = stream.chunks[stream.chunks.length - 1];
  if (lastChunk?.type === "error") {
    return { label: "Failed", tone: "red" };
  }

  if (orchestrationState?.currentNode === nodeId) {
    if (orchestrationState.status === "FAILED") {
      return { label: "Failed", tone: "red" };
    }
    return { label: "Running", tone: "blue" };
  }

  if (stream.buffer.length > 0) {
    return { label: "Done", tone: "green" };
  }

  return { label: "Waiting", tone: "gray" };
}

export function AgentLiveStrip({ scoped = false }: AgentLiveStripProps) {
  const agentStreams = useOrchestrationStore((s) => s.agentStreams);
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);

  const hasAnyActivity = Object.keys(agentStreams).length > 0;

  if (!hasAnyActivity) {
    return (
      <Card glass style={{ padding: 18, borderRadius: 16 }}>
        <div className="row gap-3" style={{ alignItems: "flex-start" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(251,191,36,.12)", color: "#FBBF24", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <IconCpu size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <Badge tone="amber">Orchestration pending</Badge>
              <Badge tone="gray">{scoped ? "Project scoped" : "Global"}</Badge>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "10px 0 0" }}>Waiting for orchestration to start...</h3>
            <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }}>
              Agent activity will appear here in real time when orchestration begins.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {AGENT_CONFIG.map((agent) => {
        const stream = agentStreams[agent.nodeId];
        const status = agentStatus(agent.nodeId, stream, orchestrationState);
        const isRunning = status.label === "Running";
        const isDone = status.label === "Done";
        const isFailed = status.label === "Failed";

        return (
          <Card glass key={agent.nodeId} style={{ padding: 14, borderRadius: 12, borderLeft: `3px solid ${isFailed ? "#EF4444" : isRunning ? agent.color : isDone ? "#22C55E" : "var(--border)"}` }}>
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${agent.color}1A`, color: agent.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <IconCpu size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-2" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <div className="row gap-2" style={{ alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{agent.label}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                </div>
                {stream && stream.buffer && (
                  <AgentStreamRenderer
                    buffer={stream.buffer}
                    chunks={stream.chunks}
                    isActive={isRunning}
                    nodeId={agent.nodeId}
                  />
                )}
                {!stream && (
                  <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0 }}>Waiting for agent to start...</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AgentStreamRenderer({ buffer, chunks, isActive, nodeId }: { buffer: string; chunks: Array<{ type: string; chunk: string; metadata?: Record<string, unknown> }>; isActive: boolean; nodeId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [buffer]);

  const lastToolCall = useMemo(() => {
    return [...chunks].reverse().find((c) => c.type === "tool-call");
  }, [chunks]);

  const lastDecision = useMemo(() => {
    return [...chunks].reverse().find((c) => c.type === "decision");
  }, [chunks]);

  const isError = chunks.some((c) => c.type === "error");

  if (isError) {
    const errorChunk = chunks.find((c) => c.type === "error");
    return (
      <div style={{ background: "rgba(239,68,68,.08)", borderRadius: 8, padding: "8px 12px", marginTop: 6 }}>
        <div className="row gap-2" style={{ alignItems: "flex-start" }}>
          <IconAlertTriangle size={14} style={{ color: "#EF4444", marginTop: 2, flexShrink: 0 }} />
          <span style={{ color: "#EF4444", fontSize: 13, lineHeight: 1.5 }}>{errorChunk?.chunk ?? "An error occurred during execution."}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 6 }}>
      {lastDecision && (
        <div style={{ background: "rgba(79,139,255,.08)", borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
          <span style={{ color: "var(--text-2)", fontSize: 12, lineHeight: 1.5 }}>{lastDecision.chunk}</span>
        </div>
      )}
      {lastToolCall && (
        <div style={{ background: "rgba(168,85,247,.08)", borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
          <div className="row gap-2" style={{ alignItems: "flex-start" }}>
            <IconCode size={12} style={{ color: "#A78BFA", marginTop: 2, flexShrink: 0 }} />
            <span style={{ color: "#A78BFA", fontSize: 12, lineHeight: 1.5 }}>{lastToolCall.chunk}</span>
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        style={{
          background: "rgba(0,0,0,.03)",
          borderRadius: 8,
          padding: "8px 12px",
          maxHeight: 80,
          overflowY: "auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text-1)",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {buffer || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Generating...</span>}
        {isActive && <CursorBlink />}
      </div>
    </div>
  );
}

function CursorBlink() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 14,
        background: "var(--text-1)",
        marginLeft: 2,
        animation: "blink 1s step-end infinite",
        verticalAlign: "text-bottom",
      }}
    />
  );
}
