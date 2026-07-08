"use client";

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
import {
  buildProjectNextActionHeroModel,
  type ProjectNextActionHeroActionId,
  type ProjectNextActionHeroActionModel,
  type ProjectNextActionStatus,
} from "../model/next-action-hero";

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

interface NextActionHeroProps {
  projectName: string;
  stackKey?: string;
  status: ProjectNextActionStatus;
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

const ACTION_ICONS: Record<ProjectNextActionHeroActionId, React.ReactNode> = {
  openRepository: <IconUpload size={14} />,
  reviewContract: <IconShield size={14} />,
  rejectContract: <IconAlertTriangle size={14} />,
  reviewArtifacts: <IconCheck size={14} />,
  requestChanges: <IconAlertTriangle size={14} />,
  retry: <IconRocket size={14} />,
  goToKickoff: <IconShield size={14} />,
  start: <IconPlay size={14} />,
  goToWorkOrders: <IconPlay size={14} />,
};

export function ProjectNextActionHero(props: NextActionHeroProps) {
  const state = buildProjectNextActionHeroModel({
    status: props.status,
    runId: props.runId,
    repoUrl: props.repoUrl,
    kickoffReady: props.kickoffReady,
    readyWorkOrderCount: props.readyWorkOrderCount,
    totalWorkOrderCount: props.totalWorkOrderCount,
    artifactCount: props.artifactCount,
    orchestrationBlockers: props.orchestrationBlockers,
    providerAvailable: props.providerAvailable,
    providerReason: props.providerReason,
    lastActivity: props.lastActivity,
    isStarting: props.isStarting,
    canRejectGate1: Boolean(props.onRejectGate1),
    canRejectGate2: Boolean(props.onRejectGate2),
  });
  const bg = KIND_TO_HERO_BG[state.kind] || KIND_TO_HERO_BG.idle;
  const border = KIND_TO_BORDER[state.kind] || KIND_TO_BORDER.idle;
  const handleAction = (actionId: ProjectNextActionHeroActionId) => {
    if (actionId === "openRepository" && props.repoUrl) window.open(props.repoUrl, "_blank");
    if (actionId === "reviewContract") props.onApproveGate1();
    if (actionId === "rejectContract") props.onRejectGate1?.();
    if (actionId === "reviewArtifacts") props.onApproveGate2();
    if (actionId === "requestChanges") props.onRejectGate2?.();
    if (actionId === "retry" || actionId === "start") props.onStart();
    if (actionId === "goToKickoff") window.location.hash = "#kickoff";
    if (actionId === "goToWorkOrders") window.location.hash = "#work-orders";
  };
  const renderAction = (action: ProjectNextActionHeroActionModel) => (
    <Button
      key={action.id}
      variant={action.variant}
      size="md"
      icon={ACTION_ICONS[action.id]}
      onClick={() => handleAction(action.id)}
      disabled={props.isStarting}
    >
      {action.label}
    </Button>
  );

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
          {state.cta && renderAction(state.cta)}
          {state.secondary && renderAction(state.secondary)}
        </div>
      </div>
    </Card>
  );
}
