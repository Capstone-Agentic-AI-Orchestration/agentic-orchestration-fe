import type {
  DevFlowArtifact,
  DevFlowArtifactOutputReviewStatus,
  DevFlowArtifactReviewStatus,
  DevFlowArtifactValidationStatus,
} from "@/shared/api/devflow-api";
import { formatDevFlowDate } from "@/shared/utils/devflow-projects";

export type DevArtifactBadgeTone = "green" | "amber" | "gray" | "red" | "blue" | "purple";

export interface DevArtifactBadgeView {
  tone: DevArtifactBadgeTone;
  label: string;
}

export interface DevArtifactRow {
  id: string;
  filePath: string;
  subtitle: string;
  review: DevArtifactBadgeView;
  outputReview: DevArtifactBadgeView;
  validation: DevArtifactBadgeView;
  revisionHandled: boolean;
  artifact: DevFlowArtifact;
}

export interface DevArtifactPreviewModel {
  title: string;
  subtitle: string;
  review: DevArtifactBadgeView;
  validation: DevArtifactBadgeView;
  reviewedAtLabel: string | null;
  validationSummary: string | null;
  reviewNote: string | null;
  revisionHandledLabel: string | null;
  revisionResolutionNote: string | null;
  content: string;
}

export interface DevArtifactsPanelModel {
  loading: boolean;
  error: string | null;
  empty: boolean;
  rows: DevArtifactRow[];
  preview: DevArtifactPreviewModel | null;
}

export interface DevArtifactsPanelInput {
  artifacts: DevFlowArtifact[];
  loading?: boolean;
  error?: string | null;
}

const pendingReview: DevArtifactBadgeView = { tone: "gray", label: "Pending review" };
const pendingOutputReview: DevArtifactBadgeView = { tone: "gray", label: "PM pending" };
const pendingValidation: DevArtifactBadgeView = { tone: "gray", label: "Unvalidated" };

export function devReviewBadgeView(status?: DevFlowArtifactReviewStatus): DevArtifactBadgeView {
  const map: Record<DevFlowArtifactReviewStatus, DevArtifactBadgeView> = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: pendingReview,
  };

  return map[status || "PENDING"] || pendingReview;
}

export function devValidationBadgeView(status?: DevFlowArtifactValidationStatus): DevArtifactBadgeView {
  const map: Record<DevFlowArtifactValidationStatus, DevArtifactBadgeView> = {
    PASSED: { tone: "green", label: "Validated" },
    FAILED: { tone: "red", label: "Invalid" },
    PENDING: pendingValidation,
  };

  return map[status || "PENDING"] || pendingValidation;
}

export function devOutputReviewBadgeView(status?: DevFlowArtifactOutputReviewStatus): DevArtifactBadgeView {
  const map: Record<DevFlowArtifactOutputReviewStatus, DevArtifactBadgeView> = {
    APPROVED: { tone: "green", label: "PM approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework" },
    PUBLISHED: { tone: "blue", label: "Published" },
    PENDING: pendingOutputReview,
  };

  return map[status || "PENDING"] || pendingOutputReview;
}

export function buildDevArtifactRows(artifacts: DevFlowArtifact[]): DevArtifactRow[] {
  return artifacts.slice(0, 8).map((artifact) => ({
    id: artifact.id,
    filePath: artifact.filePath,
    subtitle: `${artifact.agentType} - ${formatDevFlowDate(artifact.createdAt)}`,
    review: devReviewBadgeView(artifact.reviewStatus),
    outputReview: devOutputReviewBadgeView(artifact.outputReviewStatus),
    validation: devValidationBadgeView(artifact.validationStatus),
    revisionHandled: Boolean(artifact.revisionHandledAt),
    artifact,
  }));
}

export function buildDevArtifactPreviewModel(artifact: DevFlowArtifact | null): DevArtifactPreviewModel | null {
  if (!artifact) return null;

  return {
    title: artifact.filePath,
    subtitle: `${artifact.agentType} - ${formatDevFlowDate(artifact.createdAt)}`,
    review: devReviewBadgeView(artifact.reviewStatus),
    validation: devValidationBadgeView(artifact.validationStatus),
    reviewedAtLabel: artifact.reviewedAt ? `Reviewed ${formatDevFlowDate(artifact.reviewedAt)}` : null,
    validationSummary: artifact.validationSummary || null,
    reviewNote: artifact.reviewNote || null,
    revisionHandledLabel: artifact.revisionHandledAt ? `PM handled ${formatDevFlowDate(artifact.revisionHandledAt)}` : null,
    revisionResolutionNote: artifact.revisionResolutionNote || null,
    content: artifact.content ?? "",
  };
}

export function buildDevArtifactsPanelModel(input: DevArtifactsPanelInput & {
  preview?: DevFlowArtifact | null;
}): DevArtifactsPanelModel {
  const rows = buildDevArtifactRows(input.artifacts);

  return {
    loading: Boolean(input.loading),
    error: input.error || null,
    empty: !input.loading && !input.error && rows.length === 0,
    rows,
    preview: buildDevArtifactPreviewModel(input.preview || null),
  };
}
