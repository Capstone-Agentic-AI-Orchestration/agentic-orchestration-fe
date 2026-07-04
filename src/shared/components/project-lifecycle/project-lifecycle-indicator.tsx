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
    label: "Draft",
    shortLabel: "Draft",
    description: "Set up project brief and team",
    icon: IconClipboard,
    nextAction: "Complete project setup",
  },
  {
    id: "kickoff",
    label: "Kickoff",
    shortLabel: "Kickoff",
    description: "Define scope, milestones, and readiness",
    icon: IconUsers,
    nextAction: "Complete kickoff checklist",
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
    label: "Review",
    shortLabel: "Review",
    description: "Approve gates and review artifacts",
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

export function mapProjectStatusToLifecycleStage(status: string, kickoffStatus?: string): LifecycleStageId {
  if (!status) return "draft";

  switch (status) {
    case "DELIVERED":
      return "delivered";
    case "COMMITTING":
      return "review";
    case "AWAITING_GATE_1":
    case "AWAITING_GATE_2":
    case "GENERATING_CODE":
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
      return "build";
    case "PENDING":
    case "FAILED":
      if (kickoffStatus === "READY" || kickoffStatus === "LOCKED") {
        return "kickoff";
      }
      return "draft";
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
    kickoff: "kickoff",
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
    draft: "Set up your project brief, choose a tech stack, and invite team members to get started.",
    kickoff: "Complete the kickoff checklist — define scope, milestones, required documents, and confirm readiness.",
    build: "Launch the orchestration pipeline. The AI agents will parse requirements, negotiate a contract, and generate code in parallel.",
    review: "Review generated code artifacts and approve or reject at each gate. Approve Gate 2 to commit to GitHub.",
    delivered: "The project has been delivered. Review the repository and delivery notes.",
  };

  const actions: Record<LifecycleStageId, { label: string; route: string }> = {
    draft: { label: "Open wizard", route: `/pm/orchestrate/${projectId}/brief` },
    kickoff: { label: "Open kickoff", route: `/pm/orchestrate/${projectId}/kickoff` },
    build: { label: "Open orchestration", route: `/pm/orchestrate/${projectId}/run` },
    review: { label: "Open review", route: `/pm/orchestrate/${projectId}/gate-2` },
    delivered: { label: "View delivery", route: `/pm/orchestrate/${projectId}/delivery` },
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
