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
import { IconArrowLeft, IconArrowRight, IconCompass, IconCheck, IconAlertTriangle } from "@/shared/components/icons";
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
            <h2>{vm.layout.projectName}</h2>
            <span className="orchestrator-wizard-subtitle">
              Step {vm.layout.currentStepNumber} of {ORCHESTRATOR_STEPS.length} · {currentMeta?.label ?? "Orchestration"}
            </span>
          </div>
        </div>
        {!vm.loading && (
          vm.layout.onTrack ? (
            <div className="orch-next-pill is-ontrack" title="This is the recommended step for the project's current state">
              <IconCheck size={13} />
              You&apos;re on the right step
            </div>
          ) : (
            <button
              type="button"
              className="orch-next-pill"
              onClick={() => router.push(`/pm/orchestrate/${projectId}/${vm.layout.recommendedStep}`)}
            >
              <IconCompass size={13} />
              <span className="orch-next-pill-label">Do this next</span>
              <strong>{recommendedMeta?.shortLabel ?? vm.layout.recommendedStep}</strong>
              <IconArrowRight size={13} />
            </button>
          )
        )}
      </header>

      <OrchestratorStepper
        projectId={projectId}
        currentStep={currentStep}
        maxReachedStep={vm.layout.maxReachedStep}
        completedSteps={vm.layout.completedSteps}
      />

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
