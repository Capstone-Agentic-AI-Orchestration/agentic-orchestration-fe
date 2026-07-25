"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildLaunchReviewState,
  type LaunchReviewState,
} from "@/features/orchestration/model/launch-review";
import type { ProviderVerificationResult } from "@/features/orchestration/model/readiness-step";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  startDevFlowOrchestration,
  verifyDevFlowGithubDelivery,
  verifyDevFlowLlmProvider,
} from "@/shared/api/devflow-api";
import { loadDesignGuidance } from "@/shared/design-guidance";

export interface LaunchReviewStepViewModel extends LaunchReviewState {
  projectId: string;
  projectName: string;
  brief: string;
  stackKey: string;
  scopeSummary: string;
  milestoneSummary: string;
  llmResult: ProviderVerificationResult | null;
  githubResult: ProviderVerificationResult | null;
  checking: boolean;
  starting: boolean;
  error: string;
  actions: {
    check: () => Promise<void>;
    start: () => Promise<boolean>;
  };
}

export function useLaunchReviewStepViewModel(
  ctx: OrchestratorWizardContextValue,
): LaunchReviewStepViewModel {
  const { project, projectId, status, refresh } = ctx;
  const [llmResult, setLlmResult] = useState<ProviderVerificationResult | null>(null);
  const [githubResult, setGithubResult] = useState<ProviderVerificationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const state = buildLaunchReviewState({
    providerStatus: status?.provider,
    llmResult,
    githubResult,
  });

  const runChecks = useCallback(async () => {
    setChecking(true);
    setError("");
    const [llm, github] = await Promise.allSettled([
      verifyDevFlowLlmProvider(projectId),
      verifyDevFlowGithubDelivery(projectId),
    ]);
    const nextLlm = llm.status === "fulfilled"
      ? llm.value
      : { ok: false, reason: llm.reason instanceof Error ? llm.reason.message : String(llm.reason) };
    const nextGithub = github.status === "fulfilled"
      ? github.value
      : { ok: false, reason: github.reason instanceof Error ? github.reason.message : String(github.reason) };

    setLlmResult(nextLlm);
    setGithubResult(nextGithub);
    setChecking(false);
    return { llm: nextLlm, github: nextGithub };
  }, [projectId]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const checks = await runChecks();
      if (!checks.llm.ok) {
        throw new Error(checks.llm.reason || "The AI provider is unavailable. Check provider settings and try again.");
      }
      await startDevFlowOrchestration(projectId, {
        designGuidance: loadDesignGuidance(projectId),
      });
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setStarting(false);
    }
  };

  return {
    ...state,
    projectId,
    projectName: project?.companyName ?? "Untitled project",
    brief: project?.brief ?? "",
    stackKey: project?.stackKey ?? "Not selected",
    scopeSummary:
      project?.kickoff?.scopeSummary
      ?? "The saved project outcome defines the current scope. New requests can be reviewed before they change execution.",
    milestoneSummary:
      project?.kickoff?.milestones
      ?? "Plan review, build review, and final delivery are the required checkpoints.",
    llmResult,
    githubResult,
    checking,
    starting,
    error,
    actions: {
      check: async () => {
        await runChecks();
      },
      start,
    },
  };
}
