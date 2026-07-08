"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildOrchestratorWizardLayoutModel,
  type OrchestratorStepId,
  type OrchestratorWizardLayoutModel,
} from "@/features/orchestration/model/orchestrator-wizard";
import {
  getDevFlowOrchestrationStatus,
  getDevFlowProject,
} from "@/shared/api/devflow-api";

export interface OrchestratorWizardContextValue {
  projectId: string;
  project: any | null;
  status: any | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export interface OrchestratorWizardViewModel extends OrchestratorWizardContextValue {
  layout: OrchestratorWizardLayoutModel;
}

export function useOrchestratorWizardViewModel(input: {
  projectId: string;
  currentStep: OrchestratorStepId;
}): OrchestratorWizardViewModel {
  const [project, setProject] = useState<any | null>(null);
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [projectDetail, statusDetail] = await Promise.all([
        getDevFlowProject(input.projectId),
        getDevFlowOrchestrationStatus(input.projectId).catch(() => null),
      ]);
      setProject(projectDetail);
      setStatus(statusDetail);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [input.projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projectId: input.projectId,
    project,
    status,
    loading,
    error,
    refresh,
    layout: buildOrchestratorWizardLayoutModel({
      project,
      status,
      currentStep: input.currentStep,
    }),
  };
}
