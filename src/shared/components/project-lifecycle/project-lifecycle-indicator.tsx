// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconClipboard,
  IconUsers,
  IconRocket,
  IconCode,
  IconGitBranch,
  IconAlertTriangle,
  IconArrowRight,
} from "@/shared/components/icons";

export interface LifecycleStage {
  id: LifecycleStageId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  nextAction: string;
}

export type LifecycleStageId = "draft" | "kickoff" | "build" | "review" | "delivered";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "draft",
    label: "Describe",
    shortLabel: "Describe",
    description: "Define the outcome, stack, and design direction",
    icon: IconClipboard,
    nextAction: "Describe the project",
  },
  {
    id: "kickoff",
    label: "Review",
    shortLabel: "Review",
    description: "Confirm the direction and launch the run",
    icon: IconUsers,
    nextAction: "Review and launch",
  },
  {
    id: "build",
    label: "Build",
    shortLabel: "Build",
    description: "Run agent orchestration pipeline",
    icon: IconRocket,
    nextAction: "Start orchestration",
  },
  {
    id: "review",
    label: "Approve",
    shortLabel: "Approve",
    description: "Review the plan and generated deliverables",
    icon: IconCode,
    nextAction: "Review and approve",
  },
  {
    id: "delivered",
    label: "Delivered",
    shortLabel: "Done",
    description: "Project delivered and accepted",
    icon: IconGitBranch,
    nextAction: "Project complete",
  },
];

const STAGE_ORDER: LifecycleStageId[] = ["draft", "kickoff", "build", "review", "delivered"];

export function getStageIndex(id: LifecycleStageId): number {
  return STAGE_ORDER.indexOf(id);
}

export function getStageById(id: string): LifecycleStage | undefined {
  return LIFECYCLE_STAGES.find((s) => s.id === id);
}

export function mapProjectStatusToLifecycleStage(status: string, _kickoffStatus?: string): LifecycleStageId {
  if (!status) return "draft";

  switch (status) {
    case "DELIVERED":
      return "delivered";
    case "COMMITTING":
    case "AWAITING_GATE_1":
    case "AWAITING_GATE_2":
      return "review";
    case "GENERATING_CODE":
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
      return "build";
    case "DISCOVERY":
      // Accepted lead, still in conversation. Explicit rather than relying on the default so a
      // future stage rename cannot silently move it.
      return "draft";
    case "PENDING":
      return "kickoff";
    case "FAILED":
      return "build";
    default:
      return "draft";
  }
}

export function getStageProgress(stageId: LifecycleStageId): number {
  const index = getStageIndex(stageId);
  return Math.round(((index + 1) / STAGE_ORDER.length) * 100);
}

export function getOrchestratorRouteForStage(stageId: LifecycleStageId): string {
  const map: Record<LifecycleStageId, string> = {
    draft: "brief",
    kickoff: "review",
    build: "run",
    review: "gate-2",
    delivered: "delivery",
  };
  return map[stageId] ?? "brief";
}

export interface ProjectLifecycleIndicatorProps {
  currentStage: LifecycleStageId;
  maxReachedStage: LifecycleStageId;
  completedStages: Set<LifecycleStageId>;
  onClickStage?: (stage: LifecycleStageId) => void;
  compact?: boolean;
}

export function ProjectLifecycleIndicator({
  currentStage,
  maxReachedStage,
  completedStages,
  onClickStage,
  compact = false,
}: ProjectLifecycleIndicatorProps) {
  const currentIndex = getStageIndex(currentStage);
  const maxReachedIndex = getStageIndex(maxReachedStage);

  return (
    <div className={`project-lifecycle ${compact ? "project-lifecycle-compact" : ""}`}>
      <div className="project-lifecycle-track">
        {LIFECYCLE_STAGES.map((stage, index) => {
          const isCurrent = stage.id === currentStage;
          const isCompleted = completedStages.has(stage.id);
          const isReachable = index <= maxReachedIndex;
          const isPast = index < currentIndex;
          const Icon = stage.icon;

          const stateClass = isCurrent
            ? "pl-step-current"
            : isCompleted
              ? "pl-step-done"
              : isReachable
                ? "pl-step-reachable"
                : "pl-step-locked";

          return (
            <button
              key={stage.id}
              type="button"
              className={`pl-step ${stateClass}`}
              disabled={!isReachable || compact}
              onClick={() => isReachable && onClickStage?.(stage.id)}
              aria-current={isCurrent ? "step" : undefined}
              title={stage.description}
            >
              <span className="pl-step-connector" aria-hidden="true">
                {index > 0 && (
                  <span className={`pl-step-line ${isPast || isCompleted ? "pl-line-filled" : ""}`} />
                )}
              </span>
              <span className="pl-step-marker">
                {isCompleted ? (
                  <IconCheck size={compact ? 12 : 16} className="pl-step-check" />
                ) : (
                  <Icon size={compact ? 12 : 16} className="pl-step-icon" />
                )}
              </span>
              {!compact && (
                <span className="pl-step-label">
                  <span className="pl-step-label-text">{stage.shortLabel}</span>
                  {isCurrent && (
                    <span className="pl-step-label-sub">{stage.nextAction}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LifecycleStageCard({
  stage,
  projectId,
  isCurrent,
  progress,
  signals,
}: {
  stage: LifecycleStage;
  projectId: string;
  isCurrent: boolean;
  progress?: number;
  signals?: Record<string, any>;
}) {
  const router = useRouter();
  const Icon = stage.icon;

  return (
    <button
      type="button"
      className={`lifecycle-card ${isCurrent ? "lifecycle-card-current" : "lifecycle-card-past"}`}
      onClick={() => router.push(`/pm/project/${projectId}`)}
    >
      <div className="lifecycle-card-icon">
        <Icon size={18} />
      </div>
      <div className="lifecycle-card-body">
        <div className="lifecycle-card-title">{stage.label}</div>
        <div className="lifecycle-card-desc">{stage.description}</div>
        {progress !== undefined && (
          <div className="lifecycle-card-bar">
            <div className="lifecycle-card-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {signals?.nextAction && (
        <div className="lifecycle-card-action">
          <span>{signals.nextAction}</span>
          <IconArrowRight size={12} />
        </div>
      )}
    </button>
  );
}

export function LifecycleOverviewBanner({
  currentStage,
  projectId,
}: {
  currentStage: LifecycleStageId;
  projectId: string;
}) {
  const router = useRouter();
  const stage = getStageById(currentStage);
  if (!stage) return null;

  const stageIndex = getStageIndex(currentStage);
  const orchestratorRoute = getOrchestratorRouteForStage(currentStage);

  const tips: Record<LifecycleStageId, string> = {
    draft: "Describe the outcome, choose a tech stack, and set the design direction.",
    kickoff: "Review the project direction once. DevFlow will prepare the agent tasks automatically when you launch.",
    build: "Follow the live agent run as it plans and builds the project.",
    review: "Review the plan and generated deliverables at the two approval points.",
    delivered: "The project has been delivered. Review the repository and delivery notes.",
  };

  const actions: Record<LifecycleStageId, { label: string; route: string }> = {
    draft: { label: "Describe outcome", route: `/pm/orchestrate/${projectId}` },
    kickoff: { label: "Review and start", route: `/pm/orchestrate/${projectId}` },
    build: { label: "Open project build", route: `/pm/orchestrate/${projectId}` },
    review: { label: "Review decision", route: `/pm/orchestrate/${projectId}` },
    delivered: { label: "Review delivery", route: `/pm/orchestrate/${projectId}` },
  };

  return (
    <div className="lifecycle-banner">
      <div className="lifecycle-banner-icon">
        <stage.icon size={20} />
      </div>
      <div className="lifecycle-banner-content">
        <div className="lifecycle-banner-title">
          Stage {stageIndex + 1} of 5: <strong>{stage.label}</strong>
        </div>
        <div className="lifecycle-banner-desc">{tips[currentStage]}</div>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => router.push(actions[currentStage].route)}
      >
        {actions[currentStage].label}
        <IconArrowRight size={14} />
      </button>
    </div>
  );
}
