"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  computeWizardCompletedSteps,
  determineWizardStepFromStatus,
  useOrchestratorWizardViewModel,
  type OrchestratorStepId,
  type OrchestratorWizardContextValue,
} from "@/features/orchestration";
import {
  OrchestratorStepper,
  ORCHESTRATOR_STEPS,
} from "./orchestrator-stepper";
import { IconArrowLeft, IconArrowRight, IconCompass, IconAlertTriangle } from "@/shared/components/icons";
import { Button } from "@/shared/components/ui";

export type { OrchestratorWizardContextValue };

interface OrchestratorWizardLayoutProps {
  projectId: string;
  currentStep: OrchestratorStepId;
  children: (ctx: OrchestratorWizardContextValue) => ReactNode;
}

export const determineStepFromStatus = determineWizardStepFromStatus;
export const computeCompletedSteps = computeWizardCompletedSteps;

export function OrchestratorWizardLayout({
  projectId,
  currentStep,
  children,
}: OrchestratorWizardLayoutProps) {
  const router = useRouter();
  const vm = useOrchestratorWizardViewModel({ projectId, currentStep });
  const currentMeta = ORCHESTRATOR_STEPS.find((s) => s.id === currentStep);
  const recommendedMeta = ORCHESTRATOR_STEPS.find((s) => s.id === vm.layout.recommendedStep);
  const isSetup = currentStep === "brief" || currentStep === "review";

  return (
    <div className="orchestrator-wizard">
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
              {isSetup ? "Execution setup" : "Execution room"}
            </span>
            <h2>{vm.layout.projectName}</h2>
            <span className="orchestrator-wizard-subtitle">
              {currentMeta?.label ?? "Project execution"}
            </span>
          </div>
        </div>
      </header>

      <OrchestratorStepper
        projectId={projectId}
        currentStep={currentStep}
        maxReachedStep={vm.layout.maxReachedStep}
        completedSteps={vm.layout.completedSteps}
      />

      {!vm.loading && !vm.error && (
        <section className={`orch-guidance-card ${vm.layout.onTrack ? "is-current" : "needs-action"}`}>
          <span className="orch-guidance-icon"><IconCompass size={18} /></span>
          <div className="orch-guidance-copy">
            <span className="orch-guidance-eyebrow">
              {vm.layout.onTrack ? "Current step" : "Go here next"}
            </span>
            <strong>{vm.layout.onTrack ? currentMeta?.label : recommendedMeta?.label}</strong>
            <p>{vm.layout.onTrack ? currentMeta?.description : recommendedMeta?.description}</p>
          </div>
          {!vm.layout.onTrack && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/pm/orchestrate/${projectId}/${vm.layout.recommendedStep}`)}
            >
              Go to {recommendedMeta?.shortLabel ?? "next step"}
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
          })
        )}
      </main>
    </div>
  );
}
