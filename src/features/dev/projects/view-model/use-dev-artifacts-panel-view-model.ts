"use client";

import { useMemo, useState } from "react";
import {
  getDevFlowProjectArtifact,
  type DevFlowArtifact,
} from "@/shared/api/devflow-api";
import {
  buildDevArtifactsPanelModel,
  type DevArtifactsPanelInput,
  type DevArtifactsPanelModel,
} from "../model/dev-artifacts-panel";

export interface DevArtifactsPanelViewModel extends DevArtifactsPanelModel {
  previewOpen: boolean;
  previewLoading: boolean;
  previewError: string;
  actions: {
    openPreview: (artifact: DevFlowArtifact) => Promise<void>;
    closePreview: () => void;
  };
}

export function useDevArtifactsPanelViewModel(input: DevArtifactsPanelInput): DevArtifactsPanelViewModel {
  const [preview, setPreview] = useState<DevFlowArtifact | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const model = useMemo(
    () => buildDevArtifactsPanelModel({ ...input, preview }),
    [input.artifacts, input.loading, input.error, preview],
  );

  const openPreview = async (artifact: DevFlowArtifact) => {
    setPreviewOpen(true);
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(true);
    try {
      setPreview(await getDevFlowProjectArtifact(artifact.projectId, artifact.id));
    } catch (nextError) {
      setPreviewError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    ...model,
    previewOpen,
    previewLoading,
    previewError,
    actions: {
      openPreview,
      closePreview: () => setPreviewOpen(false),
    },
  };
}
