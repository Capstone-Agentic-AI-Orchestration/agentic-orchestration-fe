// @ts-nocheck
"use client";

import type { ReactNode } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconPlay,
  IconRocket,
  IconShield,
  IconUpload,
} from "@/shared/components/icons";

/**
 * Single hero card that replaces the old 4-badge stack + "Backend facts" card + MiniStats grid.
 * Shows ONE thing: what the PM needs to do next (or what's currently happening).
 *
 * The hero is a state machine:
 * - blocked   → "Fix this to continue" with CTA
 * - waiting   → "Review and approve" with CTA
 * - running   → "Building... ETA N min" with live activity
 * - idle      → "Ready to start" with Start button
 * - done      → "Delivered to GitHub" with repo link
 */

type ProjectStatus =
  | "PENDING"
  | "PARSING_REQUIREMENTS"
  | "NEGOTIATING_CONTRACT"
  | "AWAITING_GATE_1"
  | "GENERATING_CODE"
  | "AWAITING_GATE_2"
  | "COMMITTING"
  | "DELIVERED"
  | "FAILED"
  | string;

interface NextActionHeroProps {
  projectName: string;
  stackKey?: string;
  status: ProjectStatus;
  runId?: string | null;
  repoUrl?: string | null;
  kickoffReady: boolean;
  readyWorkOrderCount: number;
  totalWorkOrderCount: number;
  artifactCount: number;
  hasRunBudget?: boolean;
  tokensConsumed?: number;
  tokenBudget?: number;
  retryCount?: number;
  maxRetries?: number;
  orchestrationBlockers: string[];
  providerAvailable?: boolean;
  providerReason?: string;
  lastActivity?: string;
  isStarting?: boolean;
  isRefreshing?: boolean;
  onStart: () => void;
  onApproveGate1: () => void;
  onRejectGate1?: () => void;
  onApproveGate2: () => void;
  onRejectGate2?: () => void;
  onCreateRepo: () => void;
  onRefresh?: () => void;
}

function resolveHeroState(props: NextActionHeroProps) {
  const {
    status, runId, repoUrl, kickoffReady, readyWorkOrderCount,
    orchestrationBlockers, providerAvailable, providerReason,
  } = props;

  if (status === "DELIVERED" && repoUrl) {
    return {
      kind: "done" as const,
      badge: { tone: "green", label: "Delivered" },
      headline: "This project is live on GitHub.",
      detail: "Share the repo link with your client and close out the engagement.",
      cta: { label: "Open repository", icon: <IconUpload size={14} />, onClick: () => window.open(repoUrl, "_blank"), variant: "secondary" },
    };
  }

  if (status === "AWAITING_GATE_1") {
    return {
      kind: "waiting" as const,
      badge: { tone: "amber", label: "Architecture review" },
      headline: "The contract is ready for your review.",
      detail: "Approving starts parallel code generation across all 4 agents. Rejecting aborts the run — you can provide notes to improve the contract.",
      cta: { label: "Review contract", icon: <IconShield size={14} />, onClick: props.onApproveGate1, variant: "primary" },
      secondary: props.onRejectGate1 ? { label: "Reject", icon: <IconAlertTriangle size={14} />, onClick: props.onRejectGate1, variant: "secondary" } : null,
    };
  }

  if (status === "AWAITING_GATE_2") {
    return {
      kind: "waiting" as const,
      badge: { tone: "amber", label: "Code review" },
      headline: `All ${props.artifactCount} artifacts are ready for review.`,
      detail: "Approving commits everything to GitHub. Rejecting lets the agents retry with your feedback.",
      cta: { label: "Review artifacts", icon: <IconCheck size={14} />, onClick: props.onApproveGate2, variant: "primary" },
      secondary: props.onRejectGate2 ? { label: "Request changes", icon: <IconAlertTriangle size={14} />, onClick: props.onRejectGate2, variant: "secondary" } : null,
    };
  }

  if (status === "FAILED") {
    return {
      kind: "blocked" as const,
      badge: { tone: "red", label: "Failed" },
      headline: "The orchestration run failed.",
      detail: props.providerReason || "Check the activity log and retry the run. Agents will pick up where they left off.",
      cta: { label: "Retry", icon: <IconRocket size={14} />, onClick: props.onStart, variant: "primary" },
    };
  }

  if (["PARSING_REQUIREMENTS", "NEGOTIATING_CONTRACT", "GENERATING_CODE", "COMMITTING"].includes(status) || runId) {
    const stepMap: Record<string, string> = {
      PARSING_REQUIREMENTS: "Parsing your brief",
      NEGOTIATING_CONTRACT: "Generating the project contract",
      GENERATING_CODE: "Building your application",
      COMMITTING: "Pushing to GitHub",
    };
    const step = stepMap[status] || "Working";
    return {
      kind: "running" as const,
      badge: { tone: "blue", label: "In progress" },
      headline: `${step}...`,
      detail: props.lastActivity || "AI agents are working on your project.",
      cta: null,
    };
  }

  if (!kickoffReady) {
    return {
      kind: "blocked" as const,
      badge: { tone: "yellow", label: "Kickoff needed" },
      headline: "Complete the kickoff checklist to unlock orchestration.",
      detail: "The kickoff tab has 8 checks — scope, milestones, documents, stack, roles, client access, tasks, and work orders.",
      cta: { label: "Go to kickoff", icon: <IconShield size={14} />, onClick: () => { window.location.hash = "#kickoff"; }, variant: "primary" },
    };
  }

  if (providerAvailable === false) {
    return {
      kind: "blocked" as const,
      badge: { tone: "red", label: "Provider unavailable" },
      headline: "The AI provider is not configured.",
      detail: props.providerReason || "Check your LLM API keys in the admin settings.",
      cta: null,
    };
  }

  if (orchestrationBlockers.length > 0) {
    return {
      kind: "blocked" as const,
      badge: { tone: "yellow", label: "Not ready" },
      headline: orchestrationBlockers[0],
      detail: orchestrationBlockers.length > 1 ? `+ ${orchestrationBlockers.length - 1} more issue${orchestrationBlockers.length > 2 ? "s" : ""} to resolve` : null,
      cta: readyWorkOrderCount > 0 ? { label: "Start anyway", icon: <IconPlay size={14} />, onClick: props.onStart, variant: "secondary" } : null,
    };
  }

  if (readyWorkOrderCount === 0) {
    return {
      kind: "blocked" as const,
      badge: { tone: "yellow", label: "No work to do" },
      headline: "Create at least one work order to start the run.",
      detail: `${props.totalWorkOrderCount} work order${props.totalWorkOrderCount === 1 ? "" : "s"} exist, but none are marked READY with instructions.`,
      cta: { label: "Go to work orders", icon: <IconPlay size={14} />, onClick: () => { window.location.hash = "#work-orders"; }, variant: "primary" },
    };
  }

  return {
    kind: "idle" as const,
    badge: { tone: "green", label: "Ready" },
    headline: `Ready to start — ${readyWorkOrderCount} work order${readyWorkOrderCount === 1 ? "" : "s"} queued.`,
    detail: "Starting the run will dispatch all READY work orders to the AI agents in parallel.",
    cta: { label: props.isStarting ? "Starting..." : "Start orchestration", icon: <IconPlay size={14} />, onClick: props.onStart, variant: "primary" },
  };
}

const KIND_TO_HERO_BG: Record<string, string> = {
  done: "rgba(16,185,129,.06)",
  waiting: "rgba(245,158,11,.06)",
  running: "rgba(59,130,246,.06)",
  blocked: "rgba(239,68,68,.06)",
  idle: "rgba(79,139,255,.04)",
};

const KIND_TO_BORDER: Record<string, string> = {
  done: "rgba(16,185,129,.24)",
  waiting: "rgba(245,158,11,.28)",
  running: "rgba(59,130,246,.24)",
  blocked: "rgba(239,68,68,.24)",
  idle: "rgba(79,139,255,.18)",
};

export function ProjectNextActionHero(props: NextActionHeroProps) {
  const state = resolveHeroState(props);
  const bg = KIND_TO_HERO_BG[state.kind] || KIND_TO_HERO_BG.idle;
  const border = KIND_TO_BORDER[state.kind] || KIND_TO_BORDER.idle;

  return (
    <Card
      style={{
        padding: 20,
        background: bg,
        borderColor: border,
        marginBottom: 16,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-2" style={{ marginBottom: 8, alignItems: "center" }}>
            <Badge tone={state.badge.tone} dot>{state.badge.label}</Badge>
            {props.stackKey && (
              <span style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}>{props.stackKey}</span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {state.headline}
          </h2>
          {state.detail && (
            <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 14, lineHeight: 1.55, maxWidth: 680 }}>
              {state.detail}
            </p>
          )}
        </div>
        <div className="row gap-2" style={{ alignItems: "center", flexShrink: 0 }}>
          {state.cta && (
            <Button
              variant={state.cta.variant}
              size="md"
              icon={state.cta.icon}
              onClick={state.cta.onClick}
              disabled={props.isStarting}
            >
              {state.cta.label}
            </Button>
          )}
          {state.secondary && (
            <Button variant="secondary" size="md" icon={state.secondary.icon} onClick={state.secondary.onClick}>
              {state.secondary.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
