"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrchestratorWizardLayout, determineStepFromStatus } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";
import { getStepById, ORCHESTRATOR_STEPS, type OrchestratorStepId } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import { BriefStep } from "@/shared/components/orchestrator-wizard/steps/brief-step";
import { KickoffStep } from "@/shared/components/orchestrator-wizard/steps/kickoff-step";
import { TeamStep } from "@/shared/components/orchestrator-wizard/steps/team-step";
import { ReadinessStep } from "@/shared/components/orchestrator-wizard/steps/readiness-step";
import { RunStep } from "@/shared/components/orchestrator-wizard/steps/run-step";
import { Gate1Step } from "@/shared/components/orchestrator-wizard/steps/gate-1-step";
import { Gate2Step } from "@/shared/components/orchestrator-wizard/steps/gate-2-step";
import { DeliveryStep } from "@/shared/components/orchestrator-wizard/steps/delivery-step";
import { getDevFlowProject, getDevFlowOrchestrationStatus } from "@/shared/api/devflow-api";

export default function OrchestratorStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const stepParam = (params.step as string) ?? "brief";

  const step = getStepById(stepParam);

  useEffect(() => {
    if (!step) {
      router.replace(`/pm/orchestrate/${projectId}/brief`);
    }
  }, [step, projectId, router]);

  if (!step) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
        Redirecting…
      </div>
    );
  }

  const stepId = step.id as OrchestratorStepId;

  const renderStep = (ctx: any) => {
    switch (stepId) {
      case "brief":
        return <BriefStep ctx={ctx} stepId={stepId} />;
      case "kickoff":
        return <KickoffStep ctx={ctx} />;
      case "team":
        return <TeamStep ctx={ctx} />;
      case "readiness":
        return <ReadinessStep ctx={ctx} />;
      case "run":
        return <RunStep ctx={ctx} />;
      case "gate-1":
        return <Gate1Step ctx={ctx} />;
      case "gate-2":
        return <Gate2Step ctx={ctx} />;
      case "delivery":
        return <DeliveryStep ctx={ctx} />;
      default:
        return <BriefStep ctx={ctx} stepId={stepId} />;
    }
  };

  return (
    <OrchestratorWizardLayout projectId={projectId} currentStep={stepId}>
      {(ctx) => renderStep(ctx)}
    </OrchestratorWizardLayout>
  );
}
