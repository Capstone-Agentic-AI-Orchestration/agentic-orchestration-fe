"use client";

import { useState } from "react";
import {
  buildReadinessStepState,
  type ProviderVerificationResult,
  type ReadinessStepState,
} from "@/features/orchestration/model/readiness-step";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  verifyDevFlowGithubDelivery,
  verifyDevFlowLlmProvider,
} from "@/shared/api/devflow-api";

export interface ReadinessStepViewModel extends ReadinessStepState {
  projectId: string;
  llmResult: ProviderVerificationResult | null;
  githubResult: ProviderVerificationResult | null;
  verifyingLlm: boolean;
  verifyingGithub: boolean;
  error: string;
  actions: {
    verifyLlm: () => Promise<void>;
    verifyGithub: () => Promise<void>;
  };
}

export function useReadinessStepViewModel(ctx: OrchestratorWizardContextValue): ReadinessStepViewModel {
  const { projectId, status } = ctx;
  const providerStatus = status?.provider;
  const [verifyingLlm, setVerifyingLlm] = useState(false);
  const [verifyingGithub, setVerifyingGithub] = useState(false);
  const [llmResult, setLlmResult] = useState<ProviderVerificationResult | null>(null);
  const [githubResult, setGithubResult] = useState<ProviderVerificationResult | null>(null);
  const [error, setError] = useState("");
  const state = buildReadinessStepState({ providerStatus, llmResult, githubResult });

  const verifyLlm = async () => {
    setVerifyingLlm(true);
    setError("");
    try {
      const result = await verifyDevFlowLlmProvider(projectId);
      setLlmResult(result);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(reason);
      setLlmResult({ ok: false, reason });
    } finally {
      setVerifyingLlm(false);
    }
  };

  const verifyGithub = async () => {
    setVerifyingGithub(true);
    setError("");
    try {
      const result = await verifyDevFlowGithubDelivery(projectId);
      setGithubResult(result);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(reason);
      setGithubResult({ ok: false, reason });
    } finally {
      setVerifyingGithub(false);
    }
  };

  return {
    ...state,
    projectId,
    llmResult,
    githubResult,
    verifyingLlm,
    verifyingGithub,
    error,
    actions: {
      verifyLlm,
      verifyGithub,
    },
  };
}
