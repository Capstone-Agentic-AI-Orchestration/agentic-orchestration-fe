"use client";

import { Card } from "@/shared/components/ui";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";

/**
 * Single authoritative "what's happening right now" banner for an orchestration
 * run. Driven entirely by the typed protocol channel via the store: it resolves
 * the active step from `run.status` + `node.lifecycle`, and the percentage from
 * the active node's `node.progress` telemetry. Mount it above the canvas / live
 * strip so the user always has one clear read instead of inferring state from
 * the stage map, lanes, and metric tiles at once.
 */

// Canonical, user-facing pipeline order. Keys are the canonical graph node IDs
// (see backend topology.ts NODE + the canvas PIPELINE_NODES). Keep in sync.
export const STEPS: Array<{ nodeId: string; label: string }> = [
  { nodeId: "parse_requirements", label: "Requirements" },
  { nodeId: "negotiate_contract", label: "Planner / Orchestrator" },
  { nodeId: "frontend_agent", label: "Frontend" },
  { nodeId: "backend_agent", label: "Backend" },
  { nodeId: "database_agent", label: "Database" },
  { nodeId: "architecture_agent", label: "Architecture" },
  { nodeId: "qa_review", label: "Test / QA review" },
  { nodeId: "self_critique", label: "Integration review" },
  { nodeId: "security_review", label: "Security review" },
  { nodeId: "validate_outputs", label: "Validation" },
  { nodeId: "commit_to_github", label: "GitHub delivery" },
];

const CONN_TONE: Record<string, string> = {
  connected: "#10B981",
  connecting: "#F59E0B",
  disconnected: "#EF4444",
};

function normalize(node: string | undefined | null): string {
  if (!node) return "";
  return node.replace(/^work_order_/, "").toLowerCase();
}

export function RunStatusBanner() {
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);
  const connectionStatus = useOrchestrationStore((s) => s.connectionStatus);

  if (!orchestrationState) {
    return (
      <Card glass style={{ padding: 16, borderRadius: 12 }}>
        <div className="row gap-2" style={{ alignItems: "center", color: "var(--text-2)", fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: CONN_TONE[connectionStatus] }} />
          No active run. Start an orchestration to see live progress here.
        </div>
      </Card>
    );
  }

  const { status, currentNode, error } = orchestrationState;
  const normalized = normalize(currentNode);
  const stepIndex = STEPS.findIndex((s) => s.nodeId === normalized);
  const step = stepIndex >= 0 ? STEPS[stepIndex] : null;
  const runtime = step ? nodeStates[step.nodeId] : undefined;

  const isFailed = status === "FAILED" || Boolean(error);
  const isDone = status === "DELIVERED" || status === "SUCCEEDED";

  // Prefer the active node's live progress; otherwise approximate from position.
  const nodePct = runtime?.progressPct;
  const pct = isDone
    ? 100
    : typeof nodePct === "number"
      ? Math.round(nodePct)
      : stepIndex >= 0
        ? Math.round(((stepIndex + 0.4) / STEPS.length) * 100)
        : 0;

  const accent = isFailed ? "#EF4444" : isDone ? "#10B981" : "#2F6BFF";
  const headline = isFailed
    ? "Run blocked"
    : isDone
      ? "Delivered"
      : step
        ? `Step ${stepIndex + 1} of ${STEPS.length} · ${step.label}`
        : status.replace(/_/g, " ");
  const detail = isFailed
    ? error || "An error occurred — check the activity log."
    : runtime?.progressLabel || (step ? `${step.label} agent is working…` : status.replace(/_/g, " "));

  return (
    <Card glass style={{ padding: 16, borderRadius: 12, borderLeft: `3px solid ${accent}` }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <span
              style={{ width: 9, height: 9, borderRadius: 999, background: accent, boxShadow: !isFailed && !isDone ? `0 0 10px ${accent}` : "none" }}
              className={!isFailed && !isDone ? "orchestration-pulse-dot" : undefined}
            />
            <span style={{ fontSize: 15, fontWeight: 800 }}>{headline}</span>
          </div>
          <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4, lineHeight: 1.45, overflowWrap: "anywhere" }}>{detail}</div>
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "white", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
          <div className="row gap-2" style={{ justifyContent: "flex-end", alignItems: "center", color: "var(--text-3)", fontSize: 11, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: CONN_TONE[connectionStatus] }} />
            {connectionStatus}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, height: 6, borderRadius: 999, background: "rgba(8,14,32,.8)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: accent, transition: "width .35s ease" }} />
      </div>
    </Card>
  );
}
