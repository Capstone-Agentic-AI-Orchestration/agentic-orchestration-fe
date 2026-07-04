"use client";

import { useState } from "react";
import { CanvasButton } from "./canvas-button";
import {
  controlDevFlowOrchestration,
  type DevFlowOrchestrationControlAction,
} from "@/shared/api/devflow-api";

interface RunControlsProps {
  projectId: string;
  /** Selected node id, required for node-scoped retry / skip. */
  selectedNodeId?: string | null;
  /** Disable everything (e.g. no live run). */
  disabled?: boolean;
  onActionDone?: (action: DevFlowOrchestrationControlAction) => void;
}

export function RunControls({ projectId, selectedNodeId, disabled, onActionDone }: RunControlsProps) {
  const [busy, setBusy] = useState<DevFlowOrchestrationControlAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    action: DevFlowOrchestrationControlAction,
    options?: { nodeId?: string },
  ) => {
    setBusy(action);
    setError(null);
    try {
      await controlDevFlowOrchestration(projectId, action, options);
      onActionDone?.(action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Control action failed");
    } finally {
      setBusy(null);
    }
  };

  const nodeScoped = Boolean(selectedNodeId);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <CanvasButton variant="secondary" disabled={disabled || busy !== null} onClick={() => run("pause")}>
          {busy === "pause" ? "Pausing…" : "Pause"}
        </CanvasButton>
        <CanvasButton variant="secondary" disabled={disabled || busy !== null} onClick={() => run("resume")}>
          {busy === "resume" ? "Resuming…" : "Resume"}
        </CanvasButton>
        <CanvasButton variant="danger" disabled={disabled || busy !== null} onClick={() => run("cancel")}>
          {busy === "cancel" ? "Cancelling…" : "Cancel"}
        </CanvasButton>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <CanvasButton
          variant="ghost"
          disabled={disabled || busy !== null || !nodeScoped}
          onClick={() => run("retry_node", { nodeId: selectedNodeId ?? undefined })}
        >
          {busy === "retry_node" ? "Retrying…" : nodeScoped ? `Retry ${selectedNodeId}` : "Retry node"}
        </CanvasButton>
        <CanvasButton
          variant="ghost"
          disabled={disabled || busy !== null || !nodeScoped}
          onClick={() => run("skip_node", { nodeId: selectedNodeId ?? undefined })}
        >
          {busy === "skip_node" ? "Skipping…" : nodeScoped ? `Skip ${selectedNodeId}` : "Skip node"}
        </CanvasButton>
      </div>
      {error && (
        <div style={{ color: "#FCA5A5", fontSize: 11.5, lineHeight: 1.4 }}>{error}</div>
      )}
    </div>
  );
}
