"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  computeWizardCompletedSteps,
  determineWizardStepFromStatus,
  useOrchestratorWizardViewModel,
  type OrchestratorStepId,
  type OrchestratorWizardContextValue,
} from "@/features/orchestration";
import {
  OrchestratorNavigationProvider,
  OrchestratorStepper,
  ORCHESTRATOR_STEPS,
} from "./orchestrator-stepper";
import { orchestratorPhaseForStep } from "@/features/orchestration/model/orchestrator-wizard";
import { IconArrowLeft, IconArrowRight, IconCompass, IconAlertTriangle } from "@/shared/components/icons";
import { Button } from "@/shared/components/ui";

export type { OrchestratorWizardContextValue };

interface OrchestratorWizardLayoutProps {
  projectId: string;
  currentStep?: OrchestratorStepId;
  children: (ctx: OrchestratorWizardContextValue, activeStep: OrchestratorStepId) => ReactNode;
}

export const determineStepFromStatus = determineWizardStepFromStatus;
export const computeCompletedSteps = computeWizardCompletedSteps;

export function OrchestratorWizardLayout({
  projectId,
  currentStep,
  children,
}: OrchestratorWizardLayoutProps) {
  const router = useRouter();
  const vm = useOrchestratorWizardViewModel({ projectId, currentStep: currentStep ?? "brief" });
  const [selectedStep, setSelectedStep] = useState<OrchestratorStepId | null>(currentStep ?? null);
  const activeStep = currentStep ?? selectedStep ?? vm.layout.recommendedStep;
  const currentMeta = ORCHESTRATOR_STEPS.find((s) => s.id === activeStep);
  const recommendedMeta = ORCHESTRATOR_STEPS.find((s) => s.id === vm.layout.recommendedStep);
  const activePhase = orchestratorPhaseForStep(activeStep);
  const onTrack = activeStep === vm.layout.recommendedStep;

  return (
    <OrchestratorNavigationProvider
      value={{
        navigateToStep: setSelectedStep,
        resumeRecommended: () => setSelectedStep(null),
      }}
    >
    <div className="orchestrator-wizard" data-active-phase={activePhase}>
      <header className="orchestrator-wizard-header">
        <div className="orchestrator-wizard-header-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/pm/project/${projectId}`)}
          >
            <IconArrowLeft size={14} />
            Project
          </Button>
          <div className="orchestrator-wizard-title">
            <span className="orchestrator-wizard-kicker">
              {activePhase === "setup" ? "Set up" : activePhase === "build" ? "Build" : "Deliver"}
            </span>
            <h2>{vm.layout.projectName}</h2>
            <span className="orchestrator-wizard-subtitle">
              {currentMeta?.label ?? "Project execution"}
            </span>
          </div>
        </div>
      </header>

      <OrchestratorStepper
        currentStep={activeStep}
        recommendedStep={vm.layout.recommendedStep}
        maxReachedStep={vm.layout.maxReachedStep}
        completedSteps={vm.layout.completedSteps}
        onSelectStep={setSelectedStep}
      />

      {!vm.loading && !vm.error && (
        <section className={`orch-guidance-card ${onTrack ? "is-current" : "needs-action"}`}>
          <span className="orch-guidance-icon"><IconCompass size={18} /></span>
          <div className="orch-guidance-copy">
            <span className="orch-guidance-eyebrow">
              {onTrack
                ? activeStep === "gate-1" || activeStep === "gate-2"
                  ? "Your decision"
                  : activeStep === "run"
                    ? "DevFlow is working"
                    : "Current task"
                : "Recommended next"}
            </span>
            <strong>{onTrack ? currentMeta?.label : recommendedMeta?.label}</strong>
            <p>{onTrack ? currentMeta?.description : recommendedMeta?.description}</p>
          </div>
          {!onTrack && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedStep(null)}
            >
              Return to {recommendedMeta?.shortLabel ?? "next step"}
              <IconArrowRight size={13} />
            </Button>
          )}
        </section>
      )}

      <main className="orchestrator-wizard-body">
        {vm.loading ? (
          <div className="orchestrator-wizard-loading">
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          </div>
        ) : vm.error ? (
          <div className="orchestrator-wizard-error">
            <IconAlertTriangle size={24} />
            <p>{vm.error}</p>
            <Button variant="secondary" size="sm" onClick={() => vm.refresh()}>
              Retry
            </Button>
          </div>
        ) : (
          children({
            projectId: vm.projectId,
            project: vm.project,
            status: vm.status,
            loading: vm.loading,
            error: vm.error,
            refresh: vm.refresh,
          }, activeStep)
        )}
      </main>
    </div>
    </OrchestratorNavigationProvider>
  );
}
