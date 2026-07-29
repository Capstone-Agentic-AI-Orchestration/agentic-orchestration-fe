"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconClipboard,
  IconRocket,
  IconCode,
  IconGitBranch,
  IconArrowRight,
} from "@/shared/components/icons";

export type { OrchestratorStepId } from "@/features/orchestration/model/orchestrator-wizard";
import {
  ORCHESTRATOR_PHASES,
  orchestratorPhaseForStep,
  orchestratorPhaseTargetStep,
  type OrchestratorPhaseId,
  type OrchestratorStepId,
} from "@/features/orchestration/model/orchestrator-wizard";

export interface OrchestratorStep {
  id: OrchestratorStepId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const ORCHESTRATOR_STEPS: OrchestratorStep[] = [
  {
    id: "brief",
    label: "Describe the outcome",
    shortLabel: "Outcome",
    description: "Describe what should be delivered and how the client will judge success",
    icon: IconClipboard,
  },
  {
    id: "review",
    label: "Review and start",
    shortLabel: "Review",
    description: "Confirm the direction and let DevFlow verify the requirements for execution",
    icon: IconCheck,
  },
  {
    id: "run",
    label: "Build in progress",
    shortLabel: "Building",
    description: "DevFlow is building the project and will pause when your decision is required",
    icon: IconRocket,
  },
  {
    id: "gate-1",
    label: "Approve the build plan",
    shortLabel: "Approve plan",
    description: "Approve the proposed plan or request changes before work begins",
    icon: IconClipboard,
  },
  {
    id: "gate-2",
    label: "Approve the completed build",
    shortLabel: "Approve build",
    description: "Approve completed deliverables or request changes before delivery",
    icon: IconCode,
  },
  {
    id: "delivery",
    label: "Review and deliver",
    shortLabel: "Delivery",
    description: "Review the final handoff and record client acceptance",
    icon: IconGitBranch,
  },
];

interface OrchestratorStepperProps {
  currentStep: OrchestratorStepId;
  recommendedStep: OrchestratorStepId;
  maxReachedStep: OrchestratorStepId;
  completedSteps: Set<OrchestratorStepId>;
  onSelectStep: (step: OrchestratorStepId) => void;
}

const STEP_ORDER = ORCHESTRATOR_STEPS.map((s) => s.id);

interface OrchestratorNavigationValue {
  navigateToStep: (step: OrchestratorStepId) => void;
  resumeRecommended: () => void;
}

const OrchestratorNavigationContext = createContext<OrchestratorNavigationValue | null>(null);

export function OrchestratorNavigationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: OrchestratorNavigationValue;
}) {
  return (
    <OrchestratorNavigationContext.Provider value={value}>
      {children}
    </OrchestratorNavigationContext.Provider>
  );
}

function useOrchestratorNavigation() {
  return useContext(OrchestratorNavigationContext);
}

const PHASE_ICONS: Record<OrchestratorPhaseId, React.ComponentType<{ size?: number; className?: string }>> = {
  setup: IconClipboard,
  build: IconRocket,
  deliver: IconGitBranch,
};

export function OrchestratorStepper({
  currentStep,
  recommendedStep,
  maxReachedStep,
  completedSteps,
  onSelectStep,
}: OrchestratorStepperProps) {
  const maxReachedIndex = STEP_ORDER.indexOf(maxReachedStep);
  const activePhase = orchestratorPhaseForStep(currentStep);

  return (
    <nav className="orch-stepper2" aria-label="Project execution progress">
      {ORCHESTRATOR_PHASES.map((phase, phaseIndex) => {
        const phaseStepIdxs = phase.steps.map((id) => STEP_ORDER.indexOf(id));
        const phaseDone = phaseStepIdxs.every((i) => completedSteps.has(STEP_ORDER[i]));
        const phaseActive = phase.id === activePhase;
        const phaseState = phaseActive ? "active" : phaseDone ? "done" : phaseStepIdxs[0] <= maxReachedIndex ? "reachable" : "locked";
        const isReachable = phaseState !== "locked";
        const Icon = PHASE_ICONS[phase.id];

        return (
          <button
            key={phase.id}
            type="button"
            className={`orch-phase state-${phaseState}`}
            disabled={!isReachable}
            onClick={() => isReachable && onSelectStep(orchestratorPhaseTargetStep(phase.id, recommendedStep))}
            aria-current={phaseActive ? "step" : undefined}
          >
            <span className="orch-phase-marker" aria-hidden="true">
              {phaseDone ? <IconCheck size={13} /> : <Icon size={13} />}
            </span>
            <span className="orch-phase-copy">
              <strong>{phase.label}</strong>
              <small>{phase.description}</small>
            </span>
            <span className="orch-phase-state">
              {phaseActive ? "Current" : phaseDone ? "Done" : phaseState === "reachable" ? "Available" : `Step ${phaseIndex + 1}`}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function OrchestratorStepNav({
  projectId,
  currentStep,
  onComplete,
  nextLabel,
  backLabel = "Back",
  nextDisabled = false,
  isLastStep = false,
}: {
  projectId: string;
  currentStep: OrchestratorStepId;
  onComplete?: () => void | boolean | Promise<void | boolean>;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  isLastStep?: boolean;
}) {
  const router = useRouter();
  const adaptiveNavigation = useOrchestratorNavigation();
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const prevStep = currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
  const nextStep =
    currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : null;

  return (
    <div className="orchestrator-step-nav">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          if (!prevStep) {
            router.push(`/pm/project/${projectId}`);
          } else if (adaptiveNavigation) {
            adaptiveNavigation.navigateToStep(prevStep);
          } else {
            router.push(`/pm/orchestrate/${projectId}`);
          }
        }}
      >
        <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
        {backLabel}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={nextDisabled}
        onClick={async () => {
          let shouldContinue: void | boolean = true;
          if (onComplete) {
            shouldContinue = await onComplete();
          }
          if (shouldContinue !== false && adaptiveNavigation) {
            adaptiveNavigation.resumeRecommended();
          } else if (shouldContinue !== false && !isLastStep && nextStep) {
            router.push(`/pm/orchestrate/${projectId}`);
          }
        }}
      >
        {nextLabel ?? (isLastStep ? "Finish" : "Continue")}
        <IconArrowRight size={14} />
      </button>
    </div>
  );
}

export function getStepIndex(stepId: OrchestratorStepId): number {
  return STEP_ORDER.indexOf(stepId);
}

export function getStepById(stepId: string): OrchestratorStep | undefined {
  return ORCHESTRATOR_STEPS.find((s) => s.id === stepId);
}
