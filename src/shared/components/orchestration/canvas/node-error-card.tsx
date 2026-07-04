"use client";

import { useState } from "react";
import { CanvasButton } from "./canvas-button";
import {
  controlDevFlowOrchestration,
  type DevFlowOrchestrationControlAction,
} from "@/shared/api/devflow-api";
import type { NodeError } from "@/shared/store/orchestration-store";

interface NodeErrorCardProps {
  projectId: string;
  nodeId: string;
  error: NodeError;
}

const FALLBACK_ACTIONS: Array<{ action: DevFlowOrchestrationControlAction; label: string }> = [
  { action: "retry_node", label: "Retry" },
  { action: "skip_node", label: "Skip" },
];

/** Inline, actionable error display for a failing node (Phase 4). */
export function NodeErrorCard({ projectId, nodeId, error }: NodeErrorCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const actions =
    error.recovery && error.recovery.length > 0
      ? error.recovery.map((r) => ({ action: r.action, label: r.label, nodeId: r.nodeId }))
      : FALLBACK_ACTIONS.map((a) => ({ ...a, nodeId }));

  const trigger = async (action: DevFlowOrchestrationControlAction, targetNode?: string) => {
    setBusy(action);
    try {
      await controlDevFlowOrchestration(projectId, action, { nodeId: targetNode ?? nodeId });
      setDone(action);
    } catch {
      /* surfaced elsewhere; keep the card quiet */
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        border: "1px solid rgba(239,68,68,.4)",
        background: "rgba(239,68,68,.08)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#EF4444" }} />
        <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 800 }}>{error.code}</span>
        <span style={{ color: "var(--text-3)", fontSize: 10.5 }}>{error.severity}</span>
      </div>
      <div style={{ color: "white", fontSize: 12, lineHeight: 1.5, overflowWrap: "anywhere" }}>{error.message}</div>
      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {actions.map((a) => (
          <CanvasButton
            key={`${a.action}-${a.label}`}
            variant={a.action === "cancel" ? "danger" : "secondary"}
            disabled={busy !== null}
            onClick={() => trigger(a.action, a.nodeId)}
          >
            {busy === a.action ? "…" : a.label}
          </CanvasButton>
        ))}
      </div>
      {done && <div style={{ color: "#6EE7B7", fontSize: 11, marginTop: 8 }}>Requested: {done}</div>}
    </div>
  );
}
