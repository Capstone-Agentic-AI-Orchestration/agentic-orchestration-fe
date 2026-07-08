export type DeliveryReviewTone = "green" | "yellow" | "blue" | "gray";

interface DeliveryProjectLike {
  status?: string | null;
  repoUrl?: string | null;
  deliveryReview?: {
    status?: string | null;
    notes?: string | null;
  } | null;
}

interface DeliveryStatusLike {
  status?: string | null;
  repoUrl?: string | null;
}

interface DeliveryReadinessLike {
  blockers?: string[] | null;
}

export interface DeliveryStepState {
  projectStatus: string;
  projectStatusLabel: string;
  isDelivered: boolean;
  repoUrl: string;
  blockers: string[];
  hasBlockers: boolean;
  deliveryReview: DeliveryProjectLike["deliveryReview"];
  deliveryReviewTone: DeliveryReviewTone;
  deliveryReviewStatusLabel: string;
  canAct: boolean;
  nextLabel: string;
}

export function deliveryStatusLabel(status: string | null | undefined): string {
  return status ? status.replace(/_/g, " ") : "Unknown";
}

export function deliveryReviewTone(status: string | null | undefined): DeliveryReviewTone {
  if (status === "ACCEPTED") return "green";
  if (status === "REVISION_REQUESTED") return "yellow";
  if (status === "REVISION_RESOLVED") return "blue";
  return "gray";
}

export function buildDeliveryStepState(input: {
  project: DeliveryProjectLike | null;
  status: DeliveryStatusLike | null;
  readiness: DeliveryReadinessLike | null;
  loadingReadiness: boolean;
  acting?: boolean;
}): DeliveryStepState {
  const projectStatus = input.project?.status ?? input.status?.status ?? "PENDING";
  const blockers = input.readiness?.blockers ?? [];
  const deliveryReview = input.project?.deliveryReview ?? null;
  const isDelivered = projectStatus === "DELIVERED";

  return {
    projectStatus,
    projectStatusLabel: deliveryStatusLabel(projectStatus),
    isDelivered,
    repoUrl: input.project?.repoUrl ?? input.status?.repoUrl ?? "",
    blockers,
    hasBlockers: blockers.length > 0,
    deliveryReview,
    deliveryReviewTone: deliveryReviewTone(deliveryReview?.status),
    deliveryReviewStatusLabel: deliveryStatusLabel(deliveryReview?.status),
    canAct: !isDelivered && blockers.length === 0 && !input.loadingReadiness,
    nextLabel: isDelivered ? "Finish" : "Complete",
  };
}
