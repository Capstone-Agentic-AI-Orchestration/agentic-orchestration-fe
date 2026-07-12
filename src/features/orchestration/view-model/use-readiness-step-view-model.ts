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
  verifyingAll: boolean;
  error: string;
  actions: {
    verifyLlm: () => Promise<void>;
    verifyGithub: () => Promise<void>;
    verifyAll: () => Promise<void>;
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

  const verifyAll = async () => {
    setVerifyingLlm(true);
    setVerifyingGithub(true);
    setError("");
    const [llm, github] = await Promise.allSettled([
      verifyDevFlowLlmProvider(projectId),
      verifyDevFlowGithubDelivery(projectId),
    ]);
    const failures: string[] = [];

    if (llm.status === "fulfilled") {
      setLlmResult(llm.value);
      if (!llm.value.ok && llm.value.reason) failures.push(llm.value.reason);
    } else {
      const reason = llm.reason instanceof Error ? llm.reason.message : String(llm.reason);
      setLlmResult({ ok: false, reason });
      failures.push(reason);
    }

    if (github.status === "fulfilled") {
      setGithubResult(github.value);
      if (!github.value.ok && github.value.reason) failures.push(github.value.reason);
    } else {
      const reason = github.reason instanceof Error ? github.reason.message : String(github.reason);
      setGithubResult({ ok: false, reason });
      failures.push(reason);
    }

    setError([...new Set(failures)].join(" "));
    setVerifyingLlm(false);
    setVerifyingGithub(false);
  };

  return {
    ...state,
    projectId,
    llmResult,
    githubResult,
    verifyingLlm,
    verifyingGithub,
    verifyingAll: verifyingLlm && verifyingGithub,
    error,
    actions: {
      verifyLlm,
      verifyGithub,
      verifyAll,
    },
  };
}
