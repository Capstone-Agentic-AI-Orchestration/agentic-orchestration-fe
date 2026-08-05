"use client";

import { useParams } from "next/navigation";
import { OrchestratorWizardLayout } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";
import type { OrchestratorStepId } from "@/features/orchestration";
import { BriefStep } from "@/shared/components/orchestrator-wizard/steps/brief-step";
import { DeliveryStep } from "@/shared/components/orchestrator-wizard/steps/delivery-step";
import { Gate1Step } from "@/shared/components/orchestrator-wizard/steps/gate-1-step";
import { Gate2Step } from "@/shared/components/orchestrator-wizard/steps/gate-2-step";
import { LaunchReviewStep } from "@/shared/components/orchestrator-wizard/steps/launch-review-step";
import { RunStep } from "@/shared/components/orchestrator-wizard/steps/run-step";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

function renderActiveStep(
  step: OrchestratorStepId,
  ctx: OrchestratorWizardContextValue,
) {
  switch (step) {
    case "brief":
      return <BriefStep ctx={ctx} stepId={step} />;
    case "review":
      return <LaunchReviewStep ctx={ctx} />;
    case "run":
      return <RunStep ctx={ctx} />;
    case "gate-1":
      return <Gate1Step ctx={ctx} />;
    case "gate-2":
      return <Gate2Step ctx={ctx} />;
    case "delivery":
      return <DeliveryStep ctx={ctx} />;
  }
}

export default function AdaptiveOrchestratorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <OrchestratorWizardLayout projectId={projectId}>
      {(ctx, activeStep) => renderActiveStep(activeStep, ctx)}
    </OrchestratorWizardLayout>
  );
}
