"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildRunStepState,
  runStepDestinationPath,
  type RunStepState,
} from "@/features/orchestration/model/run-step";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  rerunReadyDevFlowWorkOrders,
  startDevFlowOrchestration,
} from "@/shared/api/devflow-api";
import { loadDesignGuidance } from "@/shared/design-guidance";
import { useSocketSubscription } from "@/shared/hooks/use-socket-subscription";

export interface RunStepViewModel extends RunStepState {
  projectId: string;
  starting: boolean;
  error: string;
  actions: {
    start: () => Promise<void>;
    rerun: () => Promise<void>;
    resync: () => Promise<void>;
    complete: () => void;
  };
}

export function useRunStepViewModel(ctx: OrchestratorWizardContextValue): RunStepViewModel {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const state = buildRunStepState({ project, status });
  const destinationPath = runStepDestinationPath(projectId, state.destination);

  const { resync } = useSocketSubscription({
    projectId,
    fallbackPollFn: async () => {
      await refresh();
      return status;
    },
  });

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      await startDevFlowOrchestration(projectId, {
        designGuidance: loadDesignGuidance(projectId),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const rerun = async () => {
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

  const resyncRun = async () => {
    resync();
    await refresh();
  };

  const complete = () => {
    if (destinationPath) router.push(destinationPath);
  };

  useEffect(() => {
    if (!destinationPath) return;
    const timer = window.setTimeout(() => router.push(destinationPath), 1800);
    return () => window.clearTimeout(timer);
  }, [destinationPath, router]);

  return {
    ...state,
    projectId,
    starting,
    error,
    actions: {
      start,
      rerun,
      resync: resyncRun,
      complete,
    },
  };
}
