"use client";

import { useRunStepViewModel } from "@/features/orchestration";
import { IconRocket } from "@/shared/components/icons";
import { OrchestrationRunCockpit } from "@/shared/components/orchestration/run-cockpit/orchestration-run-cockpit";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function RunStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useRunStepViewModel(ctx);

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconRocket size={16} />
          AI Run
        </h3>
        <p className="wizard-step-section-desc">
          Launch the agent pipeline and watch every agent stream its work — tokens, decisions, cost,
          and deliverables in real time. The run pauses at plan review and build review for your approval.
        </p>
      </div>

      <OrchestrationRunCockpit
        projectId={vm.projectId}
        projectName={vm.projectName}
        status={vm.projectStatus}
        onStart={vm.actions.start}
        onRerun={vm.actions.rerun}
        onResync={vm.actions.resync}
        starting={vm.starting}
        error={vm.error}
      />

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="run"
        nextLabel={vm.nextLabel}
        isLastStep={false}
        nextDisabled={vm.nextDisabled}
        onComplete={vm.actions.complete}
      />
    </div>
  );
}
