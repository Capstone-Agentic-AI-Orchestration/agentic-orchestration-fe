"use client";

import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconClipboard,
  IconUsers,
  IconShield,
  IconRocket,
  IconLock,
  IconCode,
  IconGitBranch,
  IconArrowRight,
} from "@/shared/components/icons";

export type OrchestratorStepId =
  | "brief"
  | "kickoff"
  | "team"
  | "readiness"
  | "run"
  | "gate-1"
  | "gate-2"
  | "delivery";

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
    label: "Project Brief",
    shortLabel: "Brief",
    description: "Define the project idea and let AI enhance it",
    icon: IconClipboard,
  },
  {
    id: "kickoff",
    label: "Kickoff Setup",
    shortLabel: "Kickoff",
    description: "Scope, milestones, and readiness checklist",
    icon: IconLock,
  },
  {
    id: "team",
    label: "Team & Roles",
    shortLabel: "Team",
    description: "Assign developers and client members",
    icon: IconUsers,
  },
  {
    id: "readiness",
    label: "Provider Readiness",
    shortLabel: "Readiness",
    description: "Verify LLM and GitHub delivery are configured",
    icon: IconShield,
  },
  {
    id: "run",
    label: "AI Run",
    shortLabel: "AI Run",
    description: "Start the AI workflow, monitor progress, and follow the next approval prompt",
    icon: IconRocket,
  },
  {
    id: "gate-1",
    label: "Plan Approval",
    shortLabel: "Plan Approval",
    description: "Approve the proposed plan or request changes before code generation",
    icon: IconClipboard,
  },
  {
    id: "gate-2",
    label: "Build Approval",
    shortLabel: "Build Approval",
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

/** Four readable phases so the eight steps don't read as one long list. */
const PHASES: Array<{ id: string; label: string; steps: OrchestratorStepId[] }> = [
  { id: "setup", label: "Setup", steps: ["brief", "kickoff", "team", "readiness"] },
  { id: "build", label: "AI Run", steps: ["run"] },
  { id: "review", label: "Approvals", steps: ["gate-1", "gate-2"] },
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
  onComplete?: () => void;
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
        onClick={() => {
          if (onComplete) {
            onComplete();
          }
          if (!isLastStep && nextStep) {
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
