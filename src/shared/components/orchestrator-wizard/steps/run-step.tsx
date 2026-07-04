// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  startDevFlowOrchestration,
  rerunReadyDevFlowWorkOrders,
} from "@/shared/api/devflow-api";
import { IconRocket } from "@/shared/components/icons";
import { OrchestrationRunCockpit } from "@/shared/components/orchestration/run-cockpit/orchestration-run-cockpit";
import { useSocketSubscription } from "@/shared/hooks/use-socket-subscription";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function RunStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useSocketSubscription({
    projectId,
    fallbackPollFn: async () => {
      await refresh();
      return status;
    },
  });

  const projectStatus = project?.status ?? status?.status ?? "PENDING";
  const isAwaitingGate1 = projectStatus === "AWAITING_GATE_1";
  const isAwaitingGate2 = projectStatus === "AWAITING_GATE_2";
  const isDelivered = projectStatus === "DELIVERED";

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      await startDevFlowOrchestration(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const handleRerun = async () => {
    setStarting(true);
    setError("");
    try {
      await rerunReadyDevFlowWorkOrders(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  // When the run reaches an approval boundary, route to the focused gate screen.
  useEffect(() => {
    if (isAwaitingGate1) {
      const timer = setTimeout(() => router.push(`/pm/orchestrate/${projectId}/gate-1`), 1800);
      return () => clearTimeout(timer);
    }
    if (isAwaitingGate2) {
      const timer = setTimeout(() => router.push(`/pm/orchestrate/${projectId}/gate-2`), 1800);
      return () => clearTimeout(timer);
    }
    if (isDelivered) {
      const timer = setTimeout(() => router.push(`/pm/orchestrate/${projectId}/delivery`), 1800);
      return () => clearTimeout(timer);
    }
  }, [isAwaitingGate1, isAwaitingGate2, isDelivered, projectId, router]);

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconRocket size={16} />
          Orchestration Run
        </h3>
        <p className="wizard-step-section-desc">
          Launch the agent pipeline and watch every agent stream its work — tokens, decisions, cost,
          and artifacts — in real time. The run pauses at Gate 1 and Gate 2 for your approval.
        </p>
      </div>

      <OrchestrationRunCockpit
        projectId={projectId}
        projectName={project?.companyName}
        status={projectStatus}
        onStart={handleStart}
        onRerun={handleRerun}
        starting={starting}
        error={error}
      />

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="run"
        nextLabel={isAwaitingGate1 ? "Go to Gate 1" : isAwaitingGate2 ? "Go to Gate 2" : isDelivered ? "Go to Delivery" : "Continue"}
        isLastStep={false}
        nextDisabled={!isAwaitingGate1 && !isAwaitingGate2 && !isDelivered}
        onComplete={() => {
          if (isAwaitingGate1) router.push(`/pm/orchestrate/${projectId}/gate-1`);
          else if (isAwaitingGate2) router.push(`/pm/orchestrate/${projectId}/gate-2`);
          else if (isDelivered) router.push(`/pm/orchestrate/${projectId}/delivery`);
        }}
      />
    </div>
  );
}
