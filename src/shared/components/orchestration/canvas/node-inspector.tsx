"use client";

import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import { NodeErrorCard } from "./node-error-card";
import { PIPELINE_NODES } from "./pipeline-layout";

interface NodeInspectorProps {
  projectId: string;
  nodeId: string | null;
}

function labelFor(nodeId: string): string {
  return PIPELINE_NODES.find((n) => n.id === nodeId)?.label ?? nodeId;
}

const PHASE_TONE: Record<string, string> = {
  entering: "#93C5FD",
  running: "#93C5FD",
  exiting: "#6EE7B7",
  error: "#FCA5A5",
  skipped: "#94A3B8",
};

/**
 * Drill-down panel for the selected node: status, telemetry, inline error with
 * recovery actions, and the live agent "thinking" stream. Reads straight from
 * the store (populated by the typed protocol channel).
 */
export function NodeInspector({ projectId, nodeId }: NodeInspectorProps) {
  const runtime = useOrchestrationStore((s) => (nodeId ? s.nodeStates[nodeId] : undefined));
  const stream = useOrchestrationStore((s) => (nodeId ? s.agentStreams[nodeId] : undefined));

  if (!nodeId) {
    return (
      <div style={{ color: "var(--text-3)", fontSize: 12.5, padding: 4 }}>
        Select a node to inspect its telemetry, errors, and live reasoning.
      </div>
    );
  }

  const phase = runtime?.phase ?? null;
  const telemetry = runtime?.telemetry;
  const recentChunks = stream?.chunks.slice(-40) ?? [];

  return (
    <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{labelFor(nodeId)}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: phase ? PHASE_TONE[phase] ?? "#64748B" : "#64748B" }}>
          {phase ?? "idle"}
        </span>
      </div>

      {typeof runtime?.progressPct === "number" && (
        <div>
          <div className="row" style={{ justifyContent: "space-between", color: "var(--text-3)", fontSize: 11, marginBottom: 4 }}>
            <span>{runtime.progressLabel ?? "Progress"}</span>
            <span className="mono" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(runtime.progressPct)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(8,14,32,.8)", overflow: "hidden" }}>
            <div style={{ width: `${runtime.progressPct}%`, height: "100%", background: "#2F6BFF", transition: "width .3s ease" }} />
          </div>
        </div>
      )}

      {telemetry && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 8 }}>
          <Metric label="Wall" value={typeof telemetry.wallMs === "number" ? `${(telemetry.wallMs / 1000).toFixed(1)}s` : "—"} />
          <Metric label="In tok" value={telemetry.inputTokens?.toLocaleString() ?? "—"} />
          <Metric label="Out tok" value={telemetry.outputTokens?.toLocaleString() ?? "—"} />
          <Metric label="Model" value={telemetry.model ?? "—"} />
        </div>
      )}

      {runtime?.error && <NodeErrorCard projectId={projectId} nodeId={nodeId} error={runtime.error} />}

      <div>
        <div style={{ color: "#C4B5FD", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Agent thinking</div>
        {recentChunks.length === 0 ? (
          <div style={{ color: "var(--text-3)", fontSize: 12 }}>No reasoning streamed yet.</div>
        ) : (
          <div
            style={{
              maxHeight: 240,
              overflowY: "auto",
              display: "grid",
              gap: 6,
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,.14)",
              background: "rgba(8,14,32,.55)",
            }}
          >
            {recentChunks.map((c, i) => (
              <div key={`${c.timestamp}-${i}`} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 8, alignItems: "start" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: c.type === "error" ? "#FCA5A5" : c.type === "tool-call" ? "#C4B5FD" : "#93C5FD",
                  }}
                >
                  {c.type}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.45, overflowWrap: "anywhere" }}>{c.chunk}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 6, border: "1px solid rgba(148,163,184,.14)", background: "rgba(8,14,32,.5)", padding: "6px 8px" }}>
      <div style={{ color: "var(--text-3)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div className="mono" style={{ color: "white", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
