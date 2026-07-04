// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  OrchestratorStepper,
  ORCHESTRATOR_STEPS,
  type OrchestratorStepId,
  getStepIndex,
} from "./orchestrator-stepper";
import { getDevFlowProject, getDevFlowOrchestrationStatus } from "@/shared/api/devflow-api";
import { IconArrowLeft, IconArrowRight, IconCompass, IconCheck, IconAlertTriangle } from "@/shared/components/icons";
import { Button } from "@/shared/components/ui";

export interface OrchestratorWizardContextValue {
  projectId: string;
  project: any | null;
  status: any | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

interface OrchestratorWizardLayoutProps {
  projectId: string;
  currentStep: OrchestratorStepId;
  children: (ctx: OrchestratorWizardContextValue) => React.ReactNode;
}

export function determineStepFromStatus(
  project: any | null,
  status: any | null,
): OrchestratorStepId {
  if (!project) return "brief";

  const projectStatus = project.status ?? status?.status;
  const kickoffReady =
    project.kickoff?.status === "READY" || project.kickoff?.status === "LOCKED";

  switch (projectStatus) {
    case "PENDING":
      return kickoffReady ? "team" : "kickoff";
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
      return "run";
    case "AWAITING_GATE_1":
      return "gate-1";
    case "GENERATING_CODE":
      return "run";
    case "AWAITING_GATE_2":
      return "gate-2";
    case "COMMITTING":
      return "run";
    case "DELIVERED":
      return "delivery";
    case "FAILED":
      return "run";
    default:
      return kickoffReady ? "team" : "brief";
  }
}

export function computeCompletedSteps(
  project: any | null,
  status: any | null,
): Set<OrchestratorStepId> {
  const completed = new Set<OrchestratorStepId>();
  if (!project) return completed;

  const kickoffReady =
    project.kickoff?.status === "READY" || project.kickoff?.status === "LOCKED";
  const hasMembers = (project.members?.length ?? 0) > 0;
  const projectStatus = project.status ?? status?.status;

  if (project.brief && project.brief.length > 10) completed.add("brief");
  if (kickoffReady) completed.add("kickoff");
  if (hasMembers) completed.add("team");

  const hasRun = status?.runId || projectStatus === "AWAITING_GATE_1" ||
    projectStatus === "GENERATING_CODE" || projectStatus === "AWAITING_GATE_2" ||
    projectStatus === "COMMITTING" || projectStatus === "DELIVERED";
  if (hasRun) {
    completed.add("readiness");
    completed.add("run");
  }

  if (projectStatus === "GENERATING_CODE" || projectStatus === "AWAITING_GATE_2" ||
      projectStatus === "COMMITTING" || projectStatus === "DELIVERED") {
    completed.add("gate-1");
  }

  if (projectStatus === "COMMITTING" || projectStatus === "DELIVERED") {
    completed.add("gate-2");
  }

  if (projectStatus === "DELIVERED") {
    completed.add("delivery");
  }

  return completed;
}

export function OrchestratorWizardLayout({
  projectId,
  currentStep,
  children,
}: OrchestratorWizardLayoutProps) {
  const router = useRouter();
  const [project, setProject] = useState<any | null>(null);
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [projectDetail, statusDetail] = await Promise.all([
        getDevFlowProject(projectId),
        getDevFlowOrchestrationStatus(projectId).catch(() => null),
      ]);
      setProject(projectDetail);
      setStatus(statusDetail);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recommendedStep = determineStepFromStatus(project, status);
  const completedSteps = computeCompletedSteps(project, status);
  const maxReachedIndex = Math.max(
    getStepIndex(recommendedStep),
    ...Array.from(completedSteps).map((s) => getStepIndex(s)),
  );
  const maxReachedStep = ORCHESTRATOR_STEPS[Math.min(maxReachedIndex, ORCHESTRATOR_STEPS.length - 1)].id;

  const projectName = project?.companyName ?? "Loading…";
  const currentMeta = ORCHESTRATOR_STEPS.find((s) => s.id === currentStep);
  const currentNum = ORCHESTRATOR_STEPS.findIndex((s) => s.id === currentStep) + 1;
  const recommendedMeta = ORCHESTRATOR_STEPS.find((s) => s.id === recommendedStep);
  const onTrack = currentStep === recommendedStep;

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
            <h2>{projectName}</h2>
            <span className="orchestrator-wizard-subtitle">
              Step {currentNum} of {ORCHESTRATOR_STEPS.length} · {currentMeta?.label ?? "Orchestration"}
            </span>
          </div>
        </div>
        {!loading && (
          onTrack ? (
            <div className="orch-next-pill is-ontrack" title="This is the recommended step for the project's current state">
              <IconCheck size={13} />
              You&apos;re on the right step
            </div>
          ) : (
            <button
              type="button"
              className="orch-next-pill"
              onClick={() => router.push(`/pm/orchestrate/${projectId}/${recommendedStep}`)}
            >
              <IconCompass size={13} />
              <span className="orch-next-pill-label">Do this next</span>
              <strong>{recommendedMeta?.shortLabel ?? recommendedStep}</strong>
              <IconArrowRight size={13} />
            </button>
          )
        )}
      </header>

      <OrchestratorStepper
        projectId={projectId}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        completedSteps={completedSteps}
      />

      <main className="orchestrator-wizard-body">
        {loading ? (
          <div className="orchestrator-wizard-loading">
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          </div>
        ) : error ? (
          <div className="orchestrator-wizard-error">
            <IconAlertTriangle size={24} />
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        ) : (
          children({ projectId, project, status, loading, error, refresh })
        )}
      </main>
    </div>
  );
}
