"use client";

import { type ReactNode } from "react";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import {
  IconFileText,
  IconShield,
  IconLock,
  IconCode,
  IconCheckCircle,
  IconGitBranch,
  IconRocket,
  IconCheck,
} from "@/shared/components/icons";

/**
 * Compact, legible pipeline tracker for the run cockpit — a custom CSS rail
 * (no React Flow) showing the eight user-facing stages, which one is live, and
 * which gates are waiting on the PM. Reads run status + per-node phases from
 * the store. The heavy interactive DAG canvas stays in the dev view.
 */

type StageState = "done" | "active" | "blocked" | "waiting";

interface StageDef {
  id: string;
  label: string;
  hint: string;
  nodes: string[];
  statuses: string[];
  kind: "stage" | "gate" | "agents" | "terminal";
  icon: ReactNode;
}

const STAGES: StageDef[] = [
  { id: "requirements", label: "Requirements", hint: "Brief → structured spec", nodes: ["parse_requirements"], statuses: ["PARSING_REQUIREMENTS"], kind: "stage", icon: <IconFileText size={14} /> },
  { id: "contract", label: "Contract", hint: "File manifest + criteria", nodes: ["negotiate_contract"], statuses: ["NEGOTIATING_CONTRACT"], kind: "stage", icon: <IconShield size={14} /> },
  { id: "gate1", label: "Gate 1 · Architecture", hint: "Your approval", nodes: ["gate_1_check"], statuses: ["AWAITING_GATE_1"], kind: "gate", icon: <IconLock size={14} /> },
  { id: "build", label: "Build", hint: "4 agents in parallel", nodes: ["frontend_agent", "backend_agent", "database_agent", "architecture_agent"], statuses: ["GENERATING_CODE"], kind: "agents", icon: <IconCode size={14} /> },
  { id: "validation", label: "Validation", hint: "Artifact checks", nodes: ["validate_outputs"], statuses: [], kind: "stage", icon: <IconCheckCircle size={14} /> },
  { id: "gate2", label: "Gate 2 · Code review", hint: "Your approval", nodes: ["gate_2_check"], statuses: ["AWAITING_GATE_2"], kind: "gate", icon: <IconLock size={14} /> },
  { id: "github", label: "GitHub delivery", hint: "Commit to repo", nodes: ["commit_to_github"], statuses: ["COMMITTING"], kind: "stage", icon: <IconGitBranch size={14} /> },
  { id: "delivered", label: "Delivered", hint: "Handed off", nodes: ["mark_delivered"], statuses: ["DELIVERED"], kind: "terminal", icon: <IconRocket size={14} /> },
];

function normalizeNode(node: string | undefined | null): string {
  if (!node || node === "none") return "";
  return node.replace(/^work_order_/, "").toLowerCase();
}

export function PipelineRail() {
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);

  const status = orchestrationState?.status ?? "PENDING";
  const currentNode = normalizeNode(orchestrationState?.currentNode);
  const isDelivered = status === "DELIVERED" || status === "SUCCEEDED";
  const isFailed = status === "FAILED" || Boolean(orchestrationState?.error);

  let activeIndex = STAGES.findIndex((s) => s.nodes.includes(currentNode));
  if (activeIndex < 0) activeIndex = STAGES.findIndex((s) => s.statuses.includes(status));
  if (activeIndex < 0) activeIndex = status === "PENDING" ? -1 : 0;
  if (isDelivered) activeIndex = STAGES.length - 1;

  return (
    <aside className="pipeline-rail reveal" aria-label="Pipeline">
      <div className="pipeline-rail-title">Pipeline</div>
      <ol className="pipeline-rail-list">
        {STAGES.map((stage, index) => {
          const state: StageState = isDelivered
            ? "done"
            : index < activeIndex
              ? "done"
              : index === activeIndex
                ? isFailed
                  ? "blocked"
                  : "active"
                : "waiting";

          const buildDone =
            stage.kind === "agents"
              ? stage.nodes.filter((n) => nodeStates[n]?.phase === "exiting").length
              : 0;

          return (
            <li key={stage.id} className={`pipeline-node is-${state} kind-${stage.kind}`}>
              <span className="pipeline-node-rail" aria-hidden="true">
                {index > 0 && <span className="pipeline-node-line" />}
                <span className="pipeline-node-marker">
                  {state === "done" ? <IconCheck size={12} /> : stage.icon}
                </span>
              </span>
              <span className="pipeline-node-body">
                <span className="pipeline-node-label">
                  {stage.label}
                  {stage.kind === "agents" && state !== "waiting" && (
                    <span className="pipeline-node-count">{buildDone}/4</span>
                  )}
                </span>
                <span className="pipeline-node-hint">
                  {state === "active" && stage.kind === "gate" ? "Waiting for your review" : stage.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
