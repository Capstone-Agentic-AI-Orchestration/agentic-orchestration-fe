"use client";

import { useState } from "react";
import {
  buildBackendOrchestrationPanelModel,
  type BackendOrchestrationPanelModel,
} from "../model/orchestration-panel";
import {
  getDevFlowProjectArtifact,
  type DevFlowAgentProviderStatus,
  type DevFlowArtifact,
  type DevFlowEventLog,
  type DevFlowGithubDeliveryVerification,
  type DevFlowLlmProviderVerification,
  type DevFlowOrchestrationRun,
  type DevFlowOrchestrationStatus,
  type DevFlowProjectDetail,
  type DevFlowWorkOrder,
} from "@/shared/api/devflow-api";

export interface BackendOrchestrationPanelInput {
  detail: DevFlowProjectDetail;
  status: DevFlowOrchestrationStatus | null;
  statusLoading?: boolean;
  statusError?: string | null;
  providerStatus: DevFlowAgentProviderStatus | null;
  providerLoading?: boolean;
  providerError?: string | null;
  githubVerification?: DevFlowGithubDeliveryVerification | null;
  githubVerificationLoading?: boolean;
  githubVerificationError?: string | null;
  llmVerification?: DevFlowLlmProviderVerification | null;
  llmVerificationLoading?: boolean;
  llmVerificationError?: string | null;
  workOrders: DevFlowWorkOrder[];
  artifacts: DevFlowArtifact[];
  events: DevFlowEventLog[];
  runs: DevFlowOrchestrationRun[];
  runsLoading?: boolean;
  runsError?: string | null;
  blockers: string[];
  starting?: boolean;
  actionId?: string;
  creatingRepo?: boolean;
  onCreateRepo: () => void | Promise<void>;
  onStart: () => void | Promise<void>;
  onRerunReady: () => void | Promise<void>;
  onRetryFailedWorkOrder: (workOrderId: string) => void | Promise<void>;
  onVerifyGithubDelivery: () => void | Promise<void>;
  onVerifyLlmProvider: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}

export interface BackendOrchestrationPanelViewModel extends BackendOrchestrationPanelModel {
  detail: DevFlowProjectDetail;
  status: DevFlowOrchestrationStatus | null;
  providerStatus: DevFlowAgentProviderStatus | null;
  providerLoading: boolean;
  githubVerification: DevFlowGithubDeliveryVerification | null;
  githubVerificationLoading: boolean;
  llmVerification: DevFlowLlmProviderVerification | null;
  llmVerificationLoading: boolean;
  workOrders: DevFlowWorkOrder[];
  artifacts: DevFlowArtifact[];
  events: DevFlowEventLog[];
  runs: DevFlowOrchestrationRun[];
  visualizerLoading: boolean;
  runsLoading: boolean;
  creatingRepo: boolean;
  actionId: string;
  actions: {
    createRepo: () => void | Promise<void>;
    start: () => void | Promise<void>;
    rerunReady: () => void | Promise<void>;
    retryFailedWorkOrder: (workOrderId: string) => void | Promise<void>;
    verifyGithubDelivery: () => void | Promise<void>;
    verifyLlmProvider: () => void | Promise<void>;
    refresh: () => void | Promise<void>;
    selectArtifact: (artifact: DevFlowArtifact) => Promise<void>;
    closePreview: () => void;
  };
}

export function useBackendOrchestrationPanelViewModel(
  input: BackendOrchestrationPanelInput,
): BackendOrchestrationPanelViewModel {
  const [previewArtifact, setPreviewArtifact] = useState<DevFlowArtifact | null>(null);
  const statusLoading = Boolean(input.statusLoading);
  const providerLoading = Boolean(input.providerLoading);
  const runsLoading = Boolean(input.runsLoading);
  const starting = Boolean(input.starting);
  const actionId = input.actionId ?? "";
  const artifacts = input.artifacts ?? [];
  const workOrders = input.workOrders ?? [];
  const events = input.events ?? [];
  const runs = input.runs ?? [];
  const blockers = input.blockers ?? [];

  const selectArtifact = async (artifact: DevFlowArtifact) => {
    try {
      const full = await getDevFlowProjectArtifact(input.detail.id, artifact.id);
      setPreviewArtifact(full);
    } catch {
      setPreviewArtifact(artifact);
    }
  };

  const model = buildBackendOrchestrationPanelModel({
    detail: input.detail,
    status: input.status,
    statusLoading,
    statusError: input.statusError,
    providerStatus: input.providerStatus,
    providerLoading,
    providerError: input.providerError,
    githubVerificationError: input.githubVerificationError,
    llmVerificationError: input.llmVerificationError,
    workOrders,
    artifacts,
    events,
    runs,
    runsLoading,
    runsError: input.runsError,
    blockers,
    starting,
    actionId,
    previewArtifact,
  });

  return {
    ...model,
    detail: input.detail,
    status: input.status,
    providerStatus: input.providerStatus,
    providerLoading,
    githubVerification: input.githubVerification ?? null,
    githubVerificationLoading: Boolean(input.githubVerificationLoading),
    llmVerification: input.llmVerification ?? null,
    llmVerificationLoading: Boolean(input.llmVerificationLoading),
    workOrders,
    artifacts,
    events,
    runs,
    visualizerLoading: statusLoading || runsLoading,
    runsLoading,
    creatingRepo: Boolean(input.creatingRepo),
    actionId,
    actions: {
      createRepo: input.onCreateRepo,
      start: input.onStart,
      rerunReady: input.onRerunReady,
      retryFailedWorkOrder: input.onRetryFailedWorkOrder,
      verifyGithubDelivery: input.onVerifyGithubDelivery,
      verifyLlmProvider: input.onVerifyLlmProvider,
      refresh: input.onRefresh,
      selectArtifact,
      closePreview: () => setPreviewArtifact(null),
    },
  };
}
