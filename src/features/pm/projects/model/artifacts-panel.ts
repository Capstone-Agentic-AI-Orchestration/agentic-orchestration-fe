import type {
  DevFlowArtifact,
  DevFlowArtifactOutputReviewStatus,
  DevFlowArtifactReviewStatus,
  DevFlowArtifactValidationStatus,
  DevFlowProjectMember,
  DevFlowProjectTask,
  DevFlowWorkOrderAgentType,
} from "@/shared/api/devflow-api";
import { formatBackendDate } from "../utils/pm-project-detail.utils";

export type ArtifactBadgeTone = "green" | "amber" | "red" | "gray" | "blue";

export interface ArtifactBadgeView {
  tone: ArtifactBadgeTone;
  label: string;
}

export interface ArtifactRow {
  id: string;
  title: string;
  subtitle: string;
  agentType: string;
  review: ArtifactBadgeView;
  outputReview: ArtifactBadgeView;
  validation: ArtifactBadgeView;
  visibilityTone: "green" | "blue";
  visibilityLabel: string;
  hasLinkedTask: boolean;
  artifact: DevFlowArtifact;
}

export interface RevisionRequestRow {
  id: string;
  title: string;
  requestedLabel: string;
  hasLinkedTask: boolean;
  artifact: DevFlowArtifact;
}

export interface ValidationPanelModel {
  visible: boolean;
  failed: boolean;
  badge: ArtifactBadgeView;
  summary: string | null;
  errors: string[];
}

export interface LinkedArtifactTaskRow {
  id: string;
  title: string;
  assigneeLabel: string;
  status: string;
  task: DevFlowProjectTask;
}

export interface ArtifactDeveloperOption {
  userId: string;
  label: string;
}

export interface ArtifactPreviewModel {
  title: string;
  subtitle: string;
  visibilityTone: "green" | "gray";
  visibilityLabel: string;
  review: ArtifactBadgeView;
  outputReview: ArtifactBadgeView;
  validation: ArtifactBadgeView;
  reviewedAtLabel: string | null;
  publishedAtLabel: string | null;
  fileName: string;
  contentKbLabel: string;
  validationPanel: ValidationPanelModel;
  outputReviewBlocked: boolean;
  revisionOpen: boolean;
  revisionHandled: boolean;
  revisionStatusLabel: string;
  linkedTasks: LinkedArtifactTaskRow[];
  linkedTasksLabel: string;
  hasLinkedTasks: boolean;
  revisionTitle: string;
  revisionBody: string;
}

export interface BackendArtifactsPanelModel {
  unresolvedRevisions: RevisionRequestRow[];
  hasUnresolvedRevisions: boolean;
  unresolvedSubtitle: string;
  artifactRows: ArtifactRow[];
  artifactSubtitle: string;
  hasArtifacts: boolean;
  developerOptions: ArtifactDeveloperOption[];
  previewModel: ArtifactPreviewModel | null;
}

export function backendReviewBadgeView(
  status?: DevFlowArtifactReviewStatus | null,
): ArtifactBadgeView {
  const map: Record<DevFlowArtifactReviewStatus, ArtifactBadgeView> = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: { tone: "gray", label: "Pending review" },
  };
  return map[status || "PENDING"];
}

export function artifactValidationBadgeView(
  status?: DevFlowArtifactValidationStatus | null,
): ArtifactBadgeView {
  const map: Record<DevFlowArtifactValidationStatus, ArtifactBadgeView> = {
    PASSED: { tone: "green", label: "Validated" },
    FAILED: { tone: "red", label: "Invalid" },
    PENDING: { tone: "gray", label: "Unvalidated" },
  };
  return map[status || "PENDING"];
}

export function outputReviewBadgeView(
  status?: DevFlowArtifactOutputReviewStatus | null,
): ArtifactBadgeView {
  const map: Record<DevFlowArtifactOutputReviewStatus, ArtifactBadgeView> = {
    APPROVED: { tone: "green", label: "PM approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework requested" },
    PUBLISHED: { tone: "blue", label: "Published" },
    PENDING: { tone: "gray", label: "PM review pending" },
  };
  return map[status || "PENDING"];
}

export function workOrderAgentTypeFromArtifact(agentType: string): DevFlowWorkOrderAgentType {
  const normalized = String(agentType || "").toUpperCase();
  return ["FRONTEND", "BACKEND", "DATABASE", "ARCHITECTURE", "CONTRACT"].includes(normalized)
    ? normalized as DevFlowWorkOrderAgentType
    : "FRONTEND";
}

export function artifactTitle(artifact: DevFlowArtifact): string {
  return artifact.displayName || artifact.filePath;
}

export function artifactHasLinkedTask(artifact: DevFlowArtifact, tasks: DevFlowProjectTask[]): boolean {
  return tasks.some((task) => task.artifactId === artifact.id);
}

export function buildArtifactRows(input: {
  artifacts: DevFlowArtifact[];
  tasks: DevFlowProjectTask[];
}): ArtifactRow[] {
  return input.artifacts.map((artifact) => ({
    id: artifact.id,
    title: artifact.filePath,
    subtitle: `${artifact.agentType} - ${formatBackendDate(artifact.createdAt)}`,
    agentType: artifact.agentType,
    review: backendReviewBadgeView(artifact.reviewStatus),
    outputReview: outputReviewBadgeView(artifact.outputReviewStatus),
    validation: artifactValidationBadgeView(artifact.validationStatus),
    visibilityTone: artifact.clientVisible ? "green" : "blue",
    visibilityLabel: artifact.clientVisible ? "Client-visible" : "Internal",
    hasLinkedTask: artifactHasLinkedTask(artifact, input.tasks),
    artifact,
  }));
}

export function buildRevisionRequestRows(input: {
  artifacts: DevFlowArtifact[];
  tasks: DevFlowProjectTask[];
}): RevisionRequestRow[] {
  return input.artifacts
    .filter((artifact) => artifact.reviewStatus === "REVISION_REQUESTED" && !artifact.revisionHandledAt)
    .map((artifact) => ({
      id: artifact.id,
      title: artifactTitle(artifact),
      requestedLabel: artifact.reviewedAt ? `Requested ${formatBackendDate(artifact.reviewedAt)}` : "Revision requested",
      hasLinkedTask: artifactHasLinkedTask(artifact, input.tasks),
      artifact,
    }));
}

export function buildValidationPanelModel(artifact: DevFlowArtifact): ValidationPanelModel {
  const errors = Array.isArray(artifact.validationErrors)
    ? artifact.validationErrors.filter(Boolean).map((error) => String(error))
    : [];
  return {
    visible: Boolean(artifact.validationSummary || errors.length || artifact.validationStatus),
    failed: artifact.validationStatus === "FAILED",
    badge: artifactValidationBadgeView(artifact.validationStatus),
    summary: artifact.validationSummary ?? null,
    errors,
  };
}

export function buildLinkedArtifactTaskRows(
  tasks: DevFlowProjectTask[],
  artifactId: string,
): LinkedArtifactTaskRow[] {
  return tasks
    .filter((task) => task.artifactId === artifactId)
    .map((task) => ({
      id: task.id,
      title: task.title,
      assigneeLabel: task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned",
      status: task.status,
      task,
    }));
}

export function buildArtifactDeveloperOptions(
  members: DevFlowProjectMember[],
): ArtifactDeveloperOption[] {
  return members
    .filter((member) => member.role === "DEV")
    .map((member) => ({
      userId: member.userId,
      label: member.user.fullName || member.user.email || member.user.id,
    }));
}

export function buildRevisionNotes(input: {
  artifact: DevFlowArtifact;
  revisionResolutionNote: string;
}): string {
  return [
    input.artifact.reviewNote
      ? `Client revision request:\n${input.artifact.reviewNote}`
      : "Client requested a revision for this artifact.",
    input.artifact.revisionResolutionNote || input.revisionResolutionNote.trim()
      ? `PM resolution note:\n${input.artifact.revisionResolutionNote || input.revisionResolutionNote.trim()}`
      : "",
  ].filter(Boolean).join("\n\n");
}

export function buildArtifactPreviewModel(input: {
  artifact: DevFlowArtifact | null;
  tasks: DevFlowProjectTask[];
}): ArtifactPreviewModel | null {
  if (!input.artifact) return null;
  const artifact = input.artifact;
  const linkedTasks = buildLinkedArtifactTaskRows(input.tasks, artifact.id);
  return {
    title: artifact.filePath,
    subtitle: `${artifact.agentType} - ${formatBackendDate(artifact.createdAt)}`,
    visibilityTone: artifact.clientVisible ? "green" : "gray",
    visibilityLabel: artifact.clientVisible ? "Client-visible" : "Internal only",
    review: backendReviewBadgeView(artifact.reviewStatus),
    outputReview: outputReviewBadgeView(artifact.outputReviewStatus),
    validation: artifactValidationBadgeView(artifact.validationStatus),
    reviewedAtLabel: artifact.reviewedAt ? `Reviewed ${formatBackendDate(artifact.reviewedAt)}` : null,
    publishedAtLabel: artifact.publishedAt ? `Published ${formatBackendDate(artifact.publishedAt)}` : null,
    fileName: artifact.filePath?.split("/").pop() || artifact.filePath,
    contentKbLabel: `${(((artifact.content || "").length) / 1024).toFixed(1)} KB`,
    validationPanel: buildValidationPanelModel(artifact),
    outputReviewBlocked: artifact.outputReviewStatus === "REWORK_REQUESTED",
    revisionOpen: artifact.reviewStatus === "REVISION_REQUESTED",
    revisionHandled: Boolean(artifact.revisionHandledAt),
    revisionStatusLabel: artifact.revisionHandledAt
      ? `Handled ${formatBackendDate(artifact.revisionHandledAt)}`
      : "Awaiting PM acknowledgement",
    linkedTasks,
    linkedTasksLabel: linkedTasks.length
      ? `${linkedTasks.length} task${linkedTasks.length === 1 ? "" : "s"} linked to this revision`
      : "Create a developer task from this revision request",
    hasLinkedTasks: linkedTasks.length > 0,
    revisionTitle: `Revision: ${artifactTitle(artifact)}`,
    revisionBody: artifact.reviewNote || "Client requested a revision for this artifact.",
  };
}

export function buildBackendArtifactsPanelModel(input: {
  artifacts: DevFlowArtifact[];
  tasks: DevFlowProjectTask[];
  members: DevFlowProjectMember[];
  preview: DevFlowArtifact | null;
}): BackendArtifactsPanelModel {
  const unresolvedRevisions = buildRevisionRequestRows({
    artifacts: input.artifacts,
    tasks: input.tasks,
  });
  return {
    unresolvedRevisions,
    hasUnresolvedRevisions: unresolvedRevisions.length > 0,
    unresolvedSubtitle: `${unresolvedRevisions.length} client revision request${unresolvedRevisions.length === 1 ? "" : "s"} waiting for acknowledgement`,
    artifactRows: buildArtifactRows({
      artifacts: input.artifacts,
      tasks: input.tasks,
    }),
    artifactSubtitle: `${input.artifacts.length} backend artifact records`,
    hasArtifacts: input.artifacts.length > 0,
    developerOptions: buildArtifactDeveloperOptions(input.members),
    previewModel: buildArtifactPreviewModel({
      artifact: input.preview,
      tasks: input.tasks,
    }),
  };
}
