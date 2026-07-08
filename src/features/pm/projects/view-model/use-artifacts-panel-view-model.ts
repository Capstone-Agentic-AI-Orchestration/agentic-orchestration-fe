"use client";

import { useState, type ChangeEvent } from "react";
import {
  artifactTitle,
  buildBackendArtifactsPanelModel,
  buildRevisionNotes,
  workOrderAgentTypeFromArtifact,
  type BackendArtifactsPanelModel,
} from "../model/artifacts-panel";
import {
  createDevFlowProjectTask,
  createDevFlowWorkOrder,
  getDevFlowProjectArtifact,
  handleDevFlowArtifactRevision,
  publishDevFlowArtifactOutput,
  reviewDevFlowArtifactOutput,
  updateDevFlowArtifactSharing,
  updateDevFlowWorkOrder,
  type DevFlowArtifact,
  type DevFlowProjectMember,
  type DevFlowProjectTask,
} from "@/shared/api/devflow-api";

export interface BackendArtifactsPanelInput {
  projectId: string;
  artifacts: DevFlowArtifact[];
  tasks: DevFlowProjectTask[];
  members: DevFlowProjectMember[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  onChanged?: () => void | Promise<void>;
}

export interface BackendArtifactsPanelViewModel extends BackendArtifactsPanelModel {
  projectId: string;
  loading: boolean;
  error: string;
  emptyText: string;
  preview: DevFlowArtifact | null;
  previewOpen: boolean;
  previewLoading: boolean;
  previewError: string;
  sharing: boolean;
  displayName: string;
  revisionHandling: boolean;
  revisionResolutionNote: string;
  revisionTaskAssigneeId: string;
  revisionTaskCreating: boolean;
  outputReviewing: boolean;
  outputReviewNote: string;
  outputReviewAssigneeId: string;
  actions: {
    openPreview: (artifactId: string) => Promise<void>;
    closePreview: () => void;
    setDisplayName: (value: string) => void;
    onDisplayNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    setRevisionResolutionNote: (value: string) => void;
    onRevisionResolutionNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    setRevisionTaskAssigneeId: (value: string) => void;
    onRevisionTaskAssigneeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    setOutputReviewNote: (value: string) => void;
    onOutputReviewNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    setOutputReviewAssigneeId: (value: string) => void;
    onOutputReviewAssigneeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    createRevisionTask: () => Promise<void>;
    handleRevision: () => Promise<void>;
    updateSharing: (clientVisible: boolean) => Promise<void>;
    approveOutput: () => Promise<void>;
    requestOutputRework: () => Promise<void>;
    publishOutput: () => Promise<void>;
  };
}

export function useBackendArtifactsPanelViewModel(
  input: BackendArtifactsPanelInput,
): BackendArtifactsPanelViewModel {
  const [preview, setPreview] = useState<DevFlowArtifact | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [revisionHandling, setRevisionHandling] = useState(false);
  const [revisionResolutionNote, setRevisionResolutionNote] = useState("");
  const [revisionTaskAssigneeId, setRevisionTaskAssigneeId] = useState("");
  const [revisionTaskCreating, setRevisionTaskCreating] = useState(false);
  const [outputReviewing, setOutputReviewing] = useState(false);
  const [outputReviewNote, setOutputReviewNote] = useState("");
  const [outputReviewAssigneeId, setOutputReviewAssigneeId] = useState("");
  const model = buildBackendArtifactsPanelModel({
    artifacts: input.artifacts,
    tasks: input.tasks,
    members: input.members,
    preview,
  });

  const openPreview = async (artifactId: string) => {
    setPreviewOpen(true);
    setPreview(null);
    setPreviewError("");
    setRevisionResolutionNote("");
    setRevisionTaskAssigneeId("");
    setPreviewLoading(true);
    try {
      const artifact = await getDevFlowProjectArtifact(input.projectId, artifactId);
      setPreview(artifact);
      setDisplayName(artifact.displayName || artifact.filePath);
      setRevisionResolutionNote(artifact.revisionResolutionNote || "");
      setOutputReviewNote(artifact.outputReviewNote || "");
      setOutputReviewAssigneeId("");
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const createRevisionTask = async () => {
    if (!preview || !revisionTaskAssigneeId) return;
    setRevisionTaskCreating(true);
    setPreviewError("");
    try {
      const label = artifactTitle(preview);
      const notes = buildRevisionNotes({
        artifact: preview,
        revisionResolutionNote,
      });
      const task = await createDevFlowProjectTask(input.projectId, {
        title: `Revision: ${label}`,
        description: notes,
        assignedToId: revisionTaskAssigneeId,
        artifactId: preview.id,
      });
      const workOrder = await createDevFlowWorkOrder(input.projectId, {
        title: `Revision handoff: ${label}`,
        instructions: notes,
        agentType: workOrderAgentTypeFromArtifact(preview.agentType),
        priority: "HIGH",
        taskId: task.id,
        artifactId: preview.id,
      });
      await updateDevFlowWorkOrder(input.projectId, workOrder.id, { status: "READY" });
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevisionTaskCreating(false);
    }
  };

  const handleRevision = async () => {
    if (!preview) return;
    setRevisionHandling(true);
    setPreviewError("");
    try {
      const updated = await handleDevFlowArtifactRevision(input.projectId, preview.id, {
        resolutionNote: revisionResolutionNote.trim() || undefined,
      });
      setPreview(updated);
      setRevisionResolutionNote(updated.revisionResolutionNote || "");
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevisionHandling(false);
    }
  };

  const updateSharing = async (clientVisible: boolean) => {
    if (!preview) return;
    setSharing(true);
    setPreviewError("");
    try {
      const updated = await updateDevFlowArtifactSharing(input.projectId, preview.id, {
        clientVisible,
        displayName: clientVisible ? displayName.trim() || preview.filePath : undefined,
      });
      setPreview(updated);
      setDisplayName(updated.displayName || updated.filePath);
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setSharing(false);
    }
  };

  const approveOutput = async () => {
    if (!preview) return;
    setOutputReviewing(true);
    setPreviewError("");
    try {
      const updated = await reviewDevFlowArtifactOutput(input.projectId, preview.id, {
        status: "APPROVED",
        note: outputReviewNote.trim() || undefined,
      });
      setPreview(updated);
      setOutputReviewNote(updated.outputReviewNote || "");
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setOutputReviewing(false);
    }
  };

  const requestOutputRework = async () => {
    if (!preview) return;
    setOutputReviewing(true);
    setPreviewError("");
    try {
      const updated = await reviewDevFlowArtifactOutput(input.projectId, preview.id, {
        status: "REWORK_REQUESTED",
        note: outputReviewNote.trim() || undefined,
        assignedToId: outputReviewAssigneeId || undefined,
      });
      setPreview(updated);
      setOutputReviewNote(updated.outputReviewNote || "");
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setOutputReviewing(false);
    }
  };

  const publishOutput = async () => {
    if (!preview) return;
    setOutputReviewing(true);
    setPreviewError("");
    try {
      const updated = await publishDevFlowArtifactOutput(input.projectId, preview.id, {
        displayName: displayName.trim() || preview.displayName || preview.filePath,
      });
      setPreview(updated);
      setDisplayName(updated.displayName || updated.filePath);
      await input.onChanged?.();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setOutputReviewing(false);
    }
  };

  return {
    ...model,
    projectId: input.projectId,
    loading: Boolean(input.loading),
    error: input.error ?? "",
    emptyText: input.emptyText ?? "No artifacts generated yet.",
    preview,
    previewOpen,
    previewLoading,
    previewError,
    sharing,
    displayName,
    revisionHandling,
    revisionResolutionNote,
    revisionTaskAssigneeId,
    revisionTaskCreating,
    outputReviewing,
    outputReviewNote,
    outputReviewAssigneeId,
    actions: {
      openPreview,
      closePreview: () => setPreviewOpen(false),
      setDisplayName,
      onDisplayNameChange: (event) => setDisplayName(event.target.value),
      setRevisionResolutionNote,
      onRevisionResolutionNoteChange: (event) => setRevisionResolutionNote(event.target.value),
      setRevisionTaskAssigneeId,
      onRevisionTaskAssigneeChange: (event) => setRevisionTaskAssigneeId(event.target.value),
      setOutputReviewNote,
      onOutputReviewNoteChange: (event) => setOutputReviewNote(event.target.value),
      setOutputReviewAssigneeId,
      onOutputReviewAssigneeChange: (event) => setOutputReviewAssigneeId(event.target.value),
      createRevisionTask,
      handleRevision,
      updateSharing,
      approveOutput,
      requestOutputRework,
      publishOutput,
    },
  };
}
