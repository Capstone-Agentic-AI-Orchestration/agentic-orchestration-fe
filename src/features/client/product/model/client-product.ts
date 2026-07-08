import type {
  DevFlowArtifact,
  DevFlowArtifactReviewStatus,
  DevFlowCollaborationDocument,
  DevFlowDeliveryReadiness,
  DevFlowEventLog,
  DevFlowProjectDeliveryReview,
  DevFlowProjectDetail,
} from "@/shared/api/devflow-api";
import {
  compactDevFlowError,
  devflowLifecycleView,
  formatDevFlowDate,
} from "@/shared/utils/devflow-projects";

export type ClientProductTab = "web" | "mobile" | "backend";
export type ClientProductBadgeTone = "green" | "amber" | "neutral";

export interface ClientProductBadge {
  tone: ClientProductBadgeTone;
  label: string;
}

export interface ClientProductNoticeModel {
  loading: boolean;
  error: string;
  hasProject: boolean;
}

export interface ClientProductHeroModel {
  lifecycleTone: string;
  lifecycleLabel: string;
  productName: string;
  brief: string;
  progress: number;
  nextActionLabel: string;
  updatedAtLabel: string;
}

export interface ClientProductPreviewModel {
  title: string;
  body: string;
}

export interface ClientProductBackendItemModel {
  key: string;
  title: string;
  sub: string;
  cta: string;
}

export interface ClientProductArtifactReviewRow {
  id: string;
  title: string;
  agentType: string;
  reviewNote: string | null;
  published: boolean;
  review: ClientProductBadge;
  artifact: DevFlowArtifact;
}

export interface ClientProductBackendPreviewModel {
  items: ClientProductBackendItemModel[];
  artifactRows: ClientProductArtifactReviewRow[];
  hasArtifacts: boolean;
}

export interface ClientProductDeliveryMetric {
  label: string;
  value: number;
}

export interface ClientProductChecklistItem {
  label: string;
  done: boolean;
  inProgress: boolean;
}

export interface ClientProductBuildInfoRow {
  label: string;
  value: string;
}

export interface ClientProductModel {
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
  hasProject: boolean;
  notice: ClientProductNoticeModel;
  productName: string;
  progress: number;
  sharedArtifacts: DevFlowArtifact[];
  sharedDocuments: DevFlowCollaborationDocument[];
  pendingActions: number;
  journeyBlockers: { title: string; severity: "warning" }[];
  primaryActionLabel: string | null;
  hero: ClientProductHeroModel | null;
  webPreview: ClientProductPreviewModel;
  mobilePreview: ClientProductPreviewModel;
  backendPreview: ClientProductBackendPreviewModel | null;
  deliveryReview: DevFlowProjectDeliveryReview | null | undefined;
  deliveryReviewBadge: ClientProductBadge;
  deliveryReadinessBadge: ClientProductBadge;
  deliveryMetrics: ClientProductDeliveryMetric[];
  deliveryBlockers: string[];
  acceptButtonSubtitle: string;
  canAcceptDelivery: boolean;
  checklist: ClientProductChecklistItem[];
  buildInfo: ClientProductBuildInfoRow[];
}

export function artifactAgentIs(artifact: Pick<DevFlowArtifact, "agentType">, agentType: string): boolean {
  return String(artifact.agentType || "").toLowerCase() === agentType;
}

export function sharedVisibleArtifacts(artifacts: DevFlowArtifact[]): DevFlowArtifact[] {
  return artifacts.filter((artifact) => artifact.clientVisible);
}

export function sharedVisibleDocuments(documents: DevFlowCollaborationDocument[]): DevFlowCollaborationDocument[] {
  return documents.filter((document) => document.clientVisible);
}

export function clientDeliveryBlockers(
  project: DevFlowProjectDetail,
  artifacts: DevFlowArtifact[],
  documents: DevFlowCollaborationDocument[],
): string[] {
  const blockers: string[] = [];
  const acceptedInvite = project.clientInvites?.some((invite) => invite.status === "ACCEPTED");
  const openArtifacts = artifacts.filter((artifact) => artifact.reviewStatus !== "APPROVED");
  const openDocuments = documents.filter((document) => !["APPROVED", "ARCHIVED"].includes(document.status));
  if (!acceptedInvite) {
    blockers.push("Accept the project invite before accepting final delivery.");
  }
  if (openArtifacts.length > 0) {
    blockers.push(`${openArtifacts.length} shared artifact${openArtifacts.length === 1 ? "" : "s"} still need approval or revision handling.`);
  }
  if (openDocuments.length > 0) {
    blockers.push(`${openDocuments.length} client-visible document${openDocuments.length === 1 ? "" : "s"} still need approval or archival.`);
  }
  return blockers;
}

export function deliveryBlockersForState(input: {
  project: DevFlowProjectDetail | null;
  readiness: DevFlowDeliveryReadiness | null;
  readinessError: string;
  artifacts: DevFlowArtifact[];
  documents: DevFlowCollaborationDocument[];
}): string[] {
  if (!input.project) return [];
  if (input.readiness) {
    return input.readiness.blockers
      .filter((blocker) => blocker.severity === "BLOCKER")
      .map((blocker) => blocker.message);
  }
  if (input.readinessError) {
    return [`Delivery readiness could not be verified: ${compactDevFlowError(input.readinessError)}`];
  }
  return clientDeliveryBlockers(input.project, input.artifacts, input.documents);
}

export function reviewBadgeView(status?: DevFlowArtifactReviewStatus | null): ClientProductBadge {
  const map: Record<DevFlowArtifactReviewStatus, ClientProductBadge> = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: { tone: "neutral", label: "Pending review" },
  };
  return map[status || "PENDING"];
}

export function deliveryReviewBadgeView(review?: DevFlowProjectDeliveryReview | null): ClientProductBadge {
  const map: Record<string, ClientProductBadge> = {
    ACCEPTED: { tone: "green", label: "Delivery accepted" },
    REVISION_REQUESTED: { tone: "amber", label: "Delivery revision" },
    REVISION_RESOLVED: { tone: "neutral", label: "Ready for acceptance" },
    PENDING: { tone: "neutral", label: "Awaiting acceptance" },
  };
  return map[review?.status || "PENDING"] || map.PENDING;
}

export function deliveryReadinessBadgeView(input: {
  readiness: DevFlowDeliveryReadiness | null;
  loading: boolean;
}): ClientProductBadge {
  if (input.readiness?.ready) return { tone: "green", label: "Ready for acceptance" };
  if (input.loading) return { tone: "neutral", label: "Checking readiness" };
  return { tone: "amber", label: "Acceptance blocked" };
}

export function buildDeliverableChecklist(
  artifacts: DevFlowArtifact[],
  hasBackendProject: boolean,
): ClientProductChecklistItem[] {
  if (!hasBackendProject) {
    return [
      { label: "Frontend application", done: false, inProgress: false },
      { label: "Backend API", done: false, inProgress: false },
      { label: "Database schema", done: false, inProgress: false },
      { label: "Documentation", done: false, inProgress: false },
      { label: "Production deployment", done: false, inProgress: false },
    ];
  }
  const frontend = artifacts.some((artifact) => artifactAgentIs(artifact, "frontend"));
  const backend = artifacts.some((artifact) => artifactAgentIs(artifact, "backend"));
  const database = artifacts.some((artifact) => artifactAgentIs(artifact, "database"));
  const docs = artifacts.some(
    (artifact) => artifact.filePath.toLowerCase().includes("readme") || artifact.filePath.toLowerCase().includes("doc"),
  );
  return [
    { label: "Frontend application", done: frontend, inProgress: !frontend },
    { label: "Backend API", done: backend, inProgress: !backend },
    { label: "Database schema", done: database, inProgress: !database },
    { label: "Documentation", done: docs, inProgress: !docs },
    { label: "Production deployment", done: false, inProgress: false },
  ];
}

export function buildPreviewBody(input: {
  artifacts: DevFlowArtifact[];
  agentType: "frontend" | "mobile";
}): string {
  const matchingArtifacts = input.artifacts.filter((artifact) => {
    if (input.agentType === "mobile") {
      return artifactAgentIs(artifact, "mobile") || artifact.filePath.toLowerCase().includes("mobile");
    }
    return artifactAgentIs(artifact, "frontend");
  });
  if (matchingArtifacts.length) {
    const label = input.agentType === "mobile" ? "mobile" : "frontend";
    return `${matchingArtifacts.length} ${label} artifact${matchingArtifacts.length === 1 ? "" : "s"} available in the backend deliverable list.`;
  }
  return input.agentType === "mobile"
    ? "No client-visible mobile artifact has been shared yet."
    : "No client-visible frontend artifact has been shared yet.";
}

export function buildBackendPreviewModel(input: {
  artifacts: DevFlowArtifact[];
  events: DevFlowEventLog[];
  project: DevFlowProjectDetail | null;
}): ClientProductBackendPreviewModel | null {
  if (!input.project) return null;
  const latestEvent = input.events[0];
  return {
    items: [
      { key: "artifacts", title: "Generated artifacts", sub: `${input.artifacts.length} files recorded`, cta: "Read-only" },
      { key: "repo", title: "Source repository", sub: input.project.repoUrl || "Repository not linked yet", cta: "Status" },
      {
        key: "event",
        title: "Latest build event",
        sub: latestEvent ? `${latestEvent.nodeName} ${latestEvent.eventType}` : "No event logs yet",
        cta: "View",
      },
    ],
    artifactRows: input.artifacts.slice(0, 5).map((artifact) => ({
      id: artifact.id,
      title: artifact.displayName || artifact.filePath,
      agentType: artifact.agentType,
      reviewNote: artifact.reviewNote || null,
      published: Boolean(artifact.publishedAt),
      review: reviewBadgeView(artifact.reviewStatus),
      artifact,
    })),
    hasArtifacts: input.artifacts.length > 0,
  };
}

export function buildDeliveryMetrics(readiness: DevFlowDeliveryReadiness | null): ClientProductDeliveryMetric[] {
  if (!readiness) return [];
  return [
    { label: "Artifacts", value: readiness.counts.publishedArtifacts },
    { label: "Work orders", value: readiness.counts.activeWorkOrders },
    { label: "Documents", value: readiness.counts.openDocuments },
    { label: "Coverage gaps", value: readiness.counts.missingAgentTypes },
  ];
}

export function buildClientProductModel(input: {
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
  artifacts: DevFlowArtifact[];
  documents: DevFlowCollaborationDocument[];
  events: DevFlowEventLog[];
  deliveryReadiness: DevFlowDeliveryReadiness | null;
  deliveryReadinessLoading: boolean;
  deliveryReadinessError: string;
}): ClientProductModel {
  const lifecycle = devflowLifecycleView(input.selectedProject);
  const sharedArtifacts = sharedVisibleArtifacts(input.artifacts);
  const sharedDocuments = sharedVisibleDocuments(input.documents);
  const deliveryBlockers = deliveryBlockersForState({
    project: input.selectedProject,
    readiness: input.deliveryReadiness,
    readinessError: input.deliveryReadinessError,
    artifacts: sharedArtifacts,
    documents: sharedDocuments,
  });
  const progress = input.selectedProject ? lifecycle.progress : 0;

  return {
    selectedProject: input.selectedProject,
    selectedProjectLoading: input.selectedProjectLoading,
    selectedProjectError: input.selectedProjectError,
    hasProject: Boolean(input.selectedProject),
    notice: {
      loading: input.selectedProjectLoading,
      error: input.selectedProjectError ? compactDevFlowError(input.selectedProjectError) : "",
      hasProject: Boolean(input.selectedProject),
    },
    productName: input.selectedProject?.companyName || "No selected product",
    progress,
    sharedArtifacts,
    sharedDocuments,
    pendingActions: sharedArtifacts.filter((artifact) => artifact.reviewStatus === "PENDING").length,
    journeyBlockers: deliveryBlockers.map((blocker) => ({ title: blocker, severity: "warning" })),
    primaryActionLabel: input.selectedProject
      ? deliveryBlockers.length
        ? "Review blockers"
        : "Review deliverables"
      : null,
    hero: input.selectedProject
      ? {
          lifecycleTone: lifecycle.tone,
          lifecycleLabel: lifecycle.label,
          productName: input.selectedProject.companyName,
          brief: input.selectedProject.brief,
          progress,
          nextActionLabel: lifecycle.nextAction,
          updatedAtLabel: formatDevFlowDate(input.selectedProject.updatedAt),
        }
      : null,
    webPreview: {
      title: "Web preview artifact",
      body: buildPreviewBody({ artifacts: sharedArtifacts, agentType: "frontend" }),
    },
    mobilePreview: {
      title: "Mobile preview artifact",
      body: buildPreviewBody({ artifacts: sharedArtifacts, agentType: "mobile" }),
    },
    backendPreview: buildBackendPreviewModel({
      artifacts: sharedArtifacts,
      events: input.events,
      project: input.selectedProject,
    }),
    deliveryReview: input.selectedProject?.deliveryReview,
    deliveryReviewBadge: deliveryReviewBadgeView(input.selectedProject?.deliveryReview),
    deliveryReadinessBadge: deliveryReadinessBadgeView({
      readiness: input.deliveryReadiness,
      loading: input.deliveryReadinessLoading,
    }),
    deliveryMetrics: buildDeliveryMetrics(input.deliveryReadiness),
    deliveryBlockers,
    acceptButtonSubtitle: deliveryBlockers.length
      ? "Resolve open reviews first"
      : "Marks the engagement as delivered",
    canAcceptDelivery: deliveryBlockers.length === 0,
    checklist: buildDeliverableChecklist(sharedArtifacts, Boolean(input.selectedProject)),
    buildInfo: input.selectedProject
      ? [
          { label: "Build", value: input.selectedProject.runId || "Not started" },
          { label: "Branch", value: input.selectedProject.repoUrl ? "linked repo" : "Not linked" },
          { label: "Last update", value: formatDevFlowDate(input.selectedProject.updatedAt) },
          { label: "Environment", value: input.selectedProject.stackKey },
        ]
      : [],
  };
}
