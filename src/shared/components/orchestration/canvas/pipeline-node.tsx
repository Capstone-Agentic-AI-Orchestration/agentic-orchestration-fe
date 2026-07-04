"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodePhase } from "@/shared/api/orchestration-events";
import type { NodeRuntime } from "@/shared/store/orchestration-store";
import type { PipelineNodeKind } from "./pipeline-layout";

export interface PipelineNodeData {
  label: string;
  kind: PipelineNodeKind;
  color: string;
  runtime?: NodeRuntime;
  [key: string]: unknown;
}

function phaseVisual(phase: NodePhase | null | undefined, accent: string): {
  border: string;
  background: string;
  glow: string;
  badge: string;
  badgeText: string;
  pulse: boolean;
} {
  switch (phase) {
    case "entering":
    case "running":
      return {
        border: accent,
        background: "rgba(59,130,246,.10)",
        glow: `0 0 0 1px ${accent}66, 0 0 18px ${accent}55`,
        badge: "#93C5FD",
        badgeText: "Active",
        pulse: true,
      };
    case "exiting":
      return {
        border: "rgba(16,185,129,.45)",
        background: "rgba(16,185,129,.08)",
        glow: "none",
        badge: "#6EE7B7",
        badgeText: "Done",
        pulse: false,
      };
    case "error":
      return {
        border: "rgba(239,68,68,.55)",
        background: "rgba(239,68,68,.09)",
        glow: "0 0 16px rgba(239,68,68,.4)",
        badge: "#FCA5A5",
        badgeText: "Error",
        pulse: false,
      };
    case "skipped":
      return {
        border: "rgba(148,163,184,.3)",
        background: "rgba(15,23,42,.55)",
        glow: "none",
        badge: "#94A3B8",
        badgeText: "Skipped",
        pulse: false,
      };
    default:
      return {
        border: "rgba(148,163,184,.18)",
        background: "rgba(15,23,42,.6)",
        glow: "none",
        badge: "#64748B",
        badgeText: "Idle",
        pulse: false,
      };
  }
}

export function PipelineNode({ data, selected }: NodeProps) {
  const nodeData = data as PipelineNodeData;
  const { runtime, color, label } = nodeData;
  const visual = phaseVisual(runtime?.phase, color);
  const pct = runtime?.progressPct;
  const tokens =
    (runtime?.telemetry?.inputTokens ?? 0) + (runtime?.telemetry?.outputTokens ?? 0);
  const wallMs = runtime?.telemetry?.wallMs;

  return (
    <div
      style={{
        width: 176,
        borderRadius: 10,
        border: `1px solid ${selected ? "#93C5FD" : visual.border}`,
        background: visual.background,
        boxShadow: selected ? "0 0 0 2px rgba(147,197,253,.5)" : visual.glow,
        padding: 10,
        color: "white",
        fontFamily: "var(--font-geist, system-ui)",
        transition: "box-shadow .2s ease, border-color .2s ease",
        willChange: "box-shadow",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: visual.border, border: "none", width: 6, height: 6 }} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: color,
              boxShadow: visual.pulse ? `0 0 10px ${color}` : "none",
              flexShrink: 0,
            }}
            className={visual.pulse ? "orchestration-pulse-dot" : undefined}
          />
          <span style={{ fontSize: 12.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: visual.badge,
            border: `1px solid ${visual.border}`,
            borderRadius: 999,
            padding: "1px 7px",
            flexShrink: 0,
          }}
        >
          {visual.badgeText}
        </span>
      </div>

      {runtime?.progressLabel && (visual.badgeText === "Active") && (
        <div style={{ color: "#93C5FD", fontSize: 10.5, marginTop: 6, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {runtime.progressLabel}
        </div>
      )}

      {typeof pct === "number" && (
        <div style={{ marginTop: 7, height: 4, borderRadius: 999, background: "rgba(8,14,32,.8)", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, pct))}%`,
              height: "100%",
              background: visual.badgeText === "Error" ? "#EF4444" : color,
              transition: "width .3s ease",
            }}
          />
        </div>
      )}

      {(tokens > 0 || typeof wallMs === "number") && (
        <div className="mono row" style={{ justifyContent: "space-between", color: "var(--text-3)", fontSize: 9.5, marginTop: 7, fontVariantNumeric: "tabular-nums" }}>
          <span>{typeof wallMs === "number" ? `${(wallMs / 1000).toFixed(1)}s` : ""}</span>
          <span>{tokens > 0 ? `${tokens} tok` : ""}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: visual.border, border: "none", width: 6, height: 6 }} />
    </div>
  );
}
