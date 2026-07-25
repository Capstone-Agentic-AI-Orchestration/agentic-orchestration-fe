"use client";

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
import type { OrchestratorStepId } from "@/features/orchestration/model/orchestrator-wizard";

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
    label: "Describe the project",
    shortLabel: "Describe",
    description: "Explain the outcome, choose a stack, and set the design direction",
    icon: IconClipboard,
  },
  {
    id: "review",
    label: "Review and launch",
    shortLabel: "Review",
    description: "Confirm the direction while DevFlow checks and prepares the run",
    icon: IconCheck,
  },
  {
    id: "run",
    label: "Build",
    shortLabel: "Build",
    description: "Watch agents plan and build, then follow the next approval prompt",
    icon: IconRocket,
  },
  {
    id: "gate-1",
    label: "Plan review",
    shortLabel: "Plan",
    description: "Approve the proposed plan or request changes before code generation",
    icon: IconClipboard,
  },
  {
    id: "gate-2",
    label: "Build review",
    shortLabel: "Build",
    description: "Approve generated deliverables or request changes before GitHub delivery",
    icon: IconCode,
  },
  {
    id: "delivery",
    label: "Delivery",
    shortLabel: "Delivery",
    description: "Client acceptance and project handoff",
    icon: IconGitBranch,
  },
];

interface OrchestratorStepperProps {
  projectId: string;
  currentStep: OrchestratorStepId;
  maxReachedStep: OrchestratorStepId;
  completedSteps: Set<OrchestratorStepId>;
}

const STEP_ORDER = ORCHESTRATOR_STEPS.map((s) => s.id);

/** Five customer-facing phases; the approval phase contains the two intentional gates. */
const PHASES: Array<{ id: string; label: string; steps: OrchestratorStepId[] }> = [
  { id: "describe", label: "Describe", steps: ["brief"] },
  { id: "review", label: "Review", steps: ["review"] },
  { id: "build", label: "Build", steps: ["run"] },
  { id: "approve", label: "Approve", steps: ["gate-1", "gate-2"] },
  { id: "deliver", label: "Deliver", steps: ["delivery"] },
];

export function OrchestratorStepper({
  projectId,
  currentStep,
  maxReachedStep,
  completedSteps,
}: OrchestratorStepperProps) {
  const router = useRouter();
  const maxReachedIndex = STEP_ORDER.indexOf(maxReachedStep);

  return (
    <nav className="orch-stepper2" aria-label="Orchestration progress">
      {PHASES.map((phase, phaseIndex) => {
        const phaseSteps = phase.steps.map((id) => ORCHESTRATOR_STEPS.find((s) => s.id === id)!);
        const phaseStepIdxs = phase.steps.map((id) => STEP_ORDER.indexOf(id));
        const phaseDone = phaseStepIdxs.every((i) => completedSteps.has(STEP_ORDER[i]));
        const phaseActive = phase.steps.includes(currentStep);
        const phaseState = phaseActive ? "active" : phaseDone ? "done" : phaseStepIdxs[0] <= maxReachedIndex ? "reachable" : "locked";

        return (
          <div key={phase.id} className={`orch-phase state-${phaseState}`}>
            <div className="orch-phase-head">
              <span className="orch-phase-name">{phase.label}</span>
              <span className="orch-phase-marker" aria-hidden="true">{phaseIndex + 1}</span>
            </div>
            <div className="orch-phase-steps">
              {phaseSteps.map((step) => {
                const index = STEP_ORDER.indexOf(step.id);
                const isCurrent = step.id === currentStep;
                const isCompleted = completedSteps.has(step.id);
                const isReachable = index <= maxReachedIndex;
                const Icon = step.icon;
                const stateClass = isCurrent ? "is-current" : isCompleted ? "is-done" : isReachable ? "is-reachable" : "is-locked";

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`orch-step2 ${stateClass}`}
                    disabled={!isReachable}
                    onClick={() => isReachable && router.push(`/pm/orchestrate/${projectId}/${step.id}`)}
                    aria-current={isCurrent ? "step" : undefined}
                    title={step.description}
                  >
                    <span className="orch-step2-dot">
                      {isCompleted ? <IconCheck size={13} /> : <Icon size={13} />}
                    </span>
                    <span className="orch-step2-label">{step.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const prevStep = currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
  const nextStep =
    currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : null;

  return (
    <div className="orchestrator-step-nav">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() =>
          prevStep
            ? router.push(`/pm/orchestrate/${projectId}/${prevStep}`)
            : router.push(`/pm/project/${projectId}`)
        }
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
          if (shouldContinue !== false && !isLastStep && nextStep) {
            router.push(`/pm/orchestrate/${projectId}/${nextStep}`);
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
