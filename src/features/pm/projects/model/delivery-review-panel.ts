import type {
  DevFlowDeliveryReadiness,
  DevFlowProjectDeliveryReview,
  DevFlowProjectDeliveryReviewStatus,
} from "@/shared/api/devflow-api";
import { formatBackendDate } from "../utils/pm-project-detail.utils";

export type DeliveryReviewTone = "green" | "amber" | "blue" | "gray";

export interface DeliveryReviewStatusView {
  tone: DeliveryReviewTone;
  label: string;
}

export interface DeliveryReadinessStat {
  label: string;
  value: string;
}

export interface DeliveryReviewPanelModel {
  reviewStatus: DeliveryReviewStatusView;
  readinessStatus: DeliveryReviewStatusView;
  readinessStats: DeliveryReadinessStat[];
  hasReadiness: boolean;
  hasBlockers: boolean;
  showEmptyReview: boolean;
  showResolveRevision: boolean;
  acceptedAtLabel: string | null;
  revisionRequestedAtLabel: string | null;
}

export function deliveryReviewStatusView(
  status?: DevFlowProjectDeliveryReviewStatus | null,
): DeliveryReviewStatusView {
  const map: Record<DevFlowProjectDeliveryReviewStatus, DeliveryReviewStatusView> = {
    ACCEPTED: { tone: "green", label: "Accepted" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    REVISION_RESOLVED: { tone: "blue", label: "Ready for acceptance" },
    PENDING: { tone: "gray", label: "Pending" },
  };
  return map[status || "PENDING"];
}

export function deliveryReadinessStatusView(input: {
  readiness?: DevFlowDeliveryReadiness | null;
  readinessLoading: boolean;
}): DeliveryReviewStatusView {
  return input.readiness?.ready
    ? { tone: "green", label: "Ready" }
    : { tone: "amber", label: input.readinessLoading ? "Checking" : "Blocked" };
}

export function deliveryReadinessStats(
  readiness?: DevFlowDeliveryReadiness | null,
): DeliveryReadinessStat[] {
  if (!readiness) return [];
  return [
    { label: "Published artifacts", value: String(readiness.counts.publishedArtifacts) },
    { label: "Open work orders", value: String(readiness.counts.activeWorkOrders) },
    { label: "Open documents", value: String(readiness.counts.openDocuments) },
    { label: "Missing coverage", value: String(readiness.counts.missingAgentTypes) },
  ];
}

export function buildDeliveryReviewPanelModel(input: {
  review?: DevFlowProjectDeliveryReview | null;
  readiness?: DevFlowDeliveryReadiness | null;
  readinessLoading: boolean;
}): DeliveryReviewPanelModel {
  const review = input.review ?? null;
  const readiness = input.readiness ?? null;
  return {
    reviewStatus: deliveryReviewStatusView(review?.status),
    readinessStatus: deliveryReadinessStatusView({
      readiness,
      readinessLoading: input.readinessLoading,
    }),
    readinessStats: deliveryReadinessStats(readiness),
    hasReadiness: Boolean(readiness),
    hasBlockers: Boolean(readiness?.blockers.length),
    showEmptyReview: !review,
    showResolveRevision: review?.status === "REVISION_REQUESTED",
    acceptedAtLabel: review?.acceptedAt ? formatBackendDate(review.acceptedAt) : null,
    revisionRequestedAtLabel: review?.revisionRequestedAt
      ? formatBackendDate(review.revisionRequestedAt)
      : null,
  };
}
