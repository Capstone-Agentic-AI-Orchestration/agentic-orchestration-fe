import { supabase } from "@/shared/auth/supabase-client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export type DevFlowApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server"
  | "network"
  | "unknown";

export class DevFlowApiError extends Error {
  status: number;
  kind: DevFlowApiErrorKind;
  details: string | null;
  rawBody: string;
  /** Machine-readable error code from the API body (e.g. "NOT_A_TEAM_MEMBER"), when present. */
  code: string | null;

  constructor(input: {
    status: number;
    kind: DevFlowApiErrorKind;
    message: string;
    details?: string | null;
    rawBody?: string;
    code?: string | null;
  }) {
    super(input.message);
    this.name = "DevFlowApiError";
    this.status = input.status;
    this.kind = input.kind;
    this.details = input.details ?? null;
    this.rawBody = input.rawBody ?? "";
    this.code = input.code ?? null;
  }
}

/**
 * Code the API returns when a GitHub account authenticated fine but is in none of the
 * mapped org teams. This console is staff-only, so it is the single refusal reason —
 * it replaced ACCOUNT_PENDING_APPROVAL, which implied a client-approval flow that does
 * not exist here (clients belong to the separate Alphaexplora client app).
 */
export const NOT_A_TEAM_MEMBER = "NOT_A_TEAM_MEMBER";

export type DevFlowProjectStatus =
  /** Accepted lead in conversation with the client. No delivery work, no orchestration. */
  | "DISCOVERY"
  | "PENDING"
  | "PARSING_REQUIREMENTS"
  | "NEGOTIATING_CONTRACT"
  | "AWAITING_GATE_1"
  | "GENERATING_CODE"
  | "AWAITING_GATE_2"
  | "COMMITTING"
  | "DELIVERED"
  | "FAILED";

export type DevFlowUserRole = "CLIENT" | "PM" | "DEV" | "ADMIN";
export type DevFlowProfileStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type DevFlowInquiryStatus = "NEW" | "IN_DISCOVERY" | "APPROVED" | "REJECTED";

export type DevFlowScheduleEventType = "MILESTONE" | "MEETING" | "DUE_DATE" | "REMINDER" | "OTHER";
export type DevFlowScheduleVisibility = "PRIVATE" | "TEAM" | "CLIENT";
export type DevFlowDeveloperAvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

export type DevFlowClientInviteStatus = "PENDING" | "ACCEPTED" | "REVOKED";

export type DevFlowProjectKickoffStatus = "DRAFT" | "READY" | "LOCKED";

export interface DevFlowDesignSystem {
  presetId: string;
  palette: string;
  typography: string;
  spacing: string;
  layout: string;
  components: string;
  motion: string;
  voice: string;
  brand: string;
  antiPatterns: string[];
}

export interface DevFlowDesignGuidance {
  theme: "black" | "light" | "system";
  productFeel: "enterprise" | "playful" | "editorial" | "luxury" | "operational";
  layoutDensity: "compact" | "balanced" | "spacious";
  accessibilityLevel: "standard" | "strict";
  forbiddenPatterns: string[];
  notes?: string;
  designSystem?: DevFlowDesignSystem;
}

export type DevFlowProjectLifecycleStage =
  | "APPROVED"
  | "CLIENT_ONBOARDING"
  | "KICKOFF"
  | "READY_FOR_ORCHESTRATION"
  | "IN_ORCHESTRATION"
  | "CLIENT_REVIEW"
  | "REVISION"
  | "DELIVERED"
  | "FAILED";

export type DevFlowArtifactReviewStatus = "PENDING" | "APPROVED" | "REVISION_REQUESTED";

export type DevFlowArtifactOutputReviewStatus = "PENDING" | "APPROVED" | "REWORK_REQUESTED" | "PUBLISHED";
export type DevFlowArtifactValidationStatus = "PENDING" | "PASSED" | "FAILED";

export type DevFlowProjectDeliveryReviewStatus = "PENDING" | "ACCEPTED" | "REVISION_REQUESTED" | "REVISION_RESOLVED";

export type DevFlowProjectTaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED";

export type DevFlowWorkOrderAgentType = "FRONTEND" | "BACKEND" | "MOBILE" | "DATABASE" | "ARCHITECTURE" | "CONTRACT";

export type DevFlowWorkOrderStatus = "DRAFT" | "READY" | "DISPATCHED" | "COMPLETED" | "FAILED" | "CANCELLED";

export type DevFlowWorkOrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type DevFlowAgentProviderMode = "mock" | "llm" | "simulation";
export type DevFlowLlmEngine = "eve" | "graph";

export type DevFlowProjectTaskActivityType =
  | "TASK_CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "ARTIFACT_CHANGED"
  | "COMMENT";

export type DevFlowNotificationType =
  | "INQUIRY_SUBMITTED"
  | "INQUIRY_APPROVED"
  | "INQUIRY_REJECTED"
  | "CLIENT_INVITE_ACCEPTED"
  | "ARTIFACT_REVIEWED"
  | "REVISION_HANDLED"
  | "ARTIFACT_PUBLISHED"
  | "ARTIFACT_REWORK_REQUESTED"
  | "DELIVERY_ACCEPTED"
  | "DELIVERY_REVISION_REQUESTED"
  | "DELIVERY_REVISION_RESOLVED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_DISPATCHED"
  | "WORK_ORDER_STATUS_CHANGED"
  | "COLLAB_MESSAGE_SENT"
  | "COLLAB_DOCUMENT_UPLOADED"
  | "COLLAB_DOCUMENT_REVIEWED"
  | "GROUP_INVITATION_SENT";

export type DevFlowProjectTimelineEventType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "CLIENT_INVITE_ACCEPTED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "ARTIFACT_SHARED"
  | "ARTIFACT_UNSHARED"
  | "ARTIFACT_REVIEWED"
  | "REVISION_HANDLED"
  | "ARTIFACT_OUTPUT_REVIEWED"
  | "ARTIFACT_PUBLISHED"
  | "ARTIFACT_REWORK_REQUESTED"
  | "DELIVERY_ACCEPTED"
  | "DELIVERY_REVISION_REQUESTED"
  | "DELIVERY_REVISION_RESOLVED"
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_DISPATCHED"
  | "WORK_ORDER_STATUS_CHANGED"
  | "NOTIFICATION_SENT"
  | "COLLAB_CONVERSATION_CREATED"
  | "COLLAB_MESSAGE_SENT"
  | "COLLAB_DOCUMENT_UPLOADED"
  | "COLLAB_DOCUMENT_REVIEWED"
  | "GROUP_INVITATION_SENT";

export type DevFlowProjectTimelineVisibility = "INTERNAL" | "TEAM" | "CLIENT";

export type DevFlowCollaborationVisibility = "TEAM" | "CLIENT";

export type DevFlowConversationCategory = "GENERAL" | "DELIVERY" | "CONTRACT" | "SUPPORT";

export type DevFlowCollaborationDocumentKind = "REQUIREMENT" | "CONTRACT" | "DELIVERABLE" | "GENERAL";

export type DevFlowCollaborationDocumentStatus =
  | "DRAFT"
  | "UPLOADED"
  | "APPROVAL_REQUESTED"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "ARCHIVED";

export interface DevFlowAuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  githubLogin?: string | null;
  avatarUrl?: string | null;
  role: DevFlowUserRole;
  status?: DevFlowProfileStatus;
}

export interface DevFlowProfileSelf extends DevFlowAuthUser {
  status: DevFlowProfileStatus;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDevFlowProfileInput {
  fullName?: string;
  preferences?: Record<string, unknown>;
}

export interface DevFlowProfileSearchResult {
  id: string;
  email: string | null;
  fullName: string | null;
  role: DevFlowUserRole;
  createdAt: string;
}

export interface DevFlowInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  role: string | null;
  brief: string;
  stackKey: string;
  budgetRange: string | null;
  timeline: string | null;
  status: DevFlowInquiryStatus;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  approvedProjectId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy: DevFlowProfile | null;
  clientInvite: Pick<DevFlowClientInvite, "id" | "status" | "projectId" | "email" | "acceptedAt"> | null;
  accountInvitation?: DevFlowAccountInvitationDelivery;
}

export interface DevFlowAccountInvitationDelivery {
  status: "SENT" | "EXISTING_ACCOUNT" | "FAILED";
  email: string;
  message: string;
}

export interface DevFlowClientInvite {
  id: string;
  inquiryId: string;
  projectId: string;
  email: string;
  contactName: string;
  companyName: string;
  status: DevFlowClientInviteStatus;
  createdById: string | null;
  acceptedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    companyName: string;
    status: DevFlowProjectStatus;
    createdAt: string;
  };
}

export interface DevFlowClientInviteStatusSummary {
  email: string;
  pending: number;
  accepted: number;
  latestCompanyName: string | null;
}

export interface DevFlowProjectClientInvite {
  id: string;
  email: string;
  contactName: string;
  companyName: string;
  status: DevFlowClientInviteStatus;
  acceptedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowProjectKickoff {
  id: string;
  projectId: string;
  scopeSummary: string | null;
  milestones: string | null;
  requiredDocuments: string | null;
  techStackNotes: string | null;
  deliveryRoles: string | null;
  readinessNotes: string | null;
  scopeConfirmed: boolean;
  milestonesConfirmed: boolean;
  documentsConfirmed: boolean;
  techStackConfirmed: boolean;
  rolesConfirmed: boolean;
  clientAccessConfirmed: boolean;
  initialTasksCreated: boolean;
  initialWorkOrdersCreated: boolean;
  status: DevFlowProjectKickoffStatus;
  completedById: string | null;
  completedAt: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DevFlowClientStatus = "PROSPECT" | "ACTIVE" | "ARCHIVED";

/** The client a project belongs to. Null means the project is unassigned. */
export interface DevFlowProjectClientRef {
  id: string;
  name: string;
  status: DevFlowClientStatus;
}

export interface DevFlowProjectSummary {
  id: string;
  companyName: string;
  status: DevFlowProjectStatus;
  createdAt: string;
  updatedAt: string;
  groupId: string | null;
  /**
   * Always present: a project belongs to a client for its whole life.
   *
   * Kept nullable in the type on purpose — the API guarantees it, but this shape is also what
   * older cached responses deserialize into, and a hard non-null here would turn a stale payload
   * into a crash rather than a missing name.
   */
  client: DevFlowProjectClientRef | null;
  lifecycle: DevFlowProjectLifecycle;
}

export interface DevFlowProjectLifecycle {
  stage: DevFlowProjectLifecycleStage;
  label: string;
  nextAction: string;
  tone: "gray" | "blue" | "purple" | "yellow" | "green" | "red";
  progress: number;
  signals: {
    clientAccepted: boolean;
    kickoffReady: boolean;
    orchestrationStarted: boolean;
    clientReviewOpen: boolean;
    revisionOpen: boolean;
    deliveryAccepted: boolean;
    deliveryRevisionOpen: boolean;
    totalTasks: number;
    openTasks: number;
    totalWorkOrders: number;
    activeWorkOrders: number;
    clientVisibleArtifacts: number;
  };
}

export interface DevFlowProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: DevFlowUserRole;
}

export type DevFlowAdminDomainStatus = "PLANNED" | "PENDING_VERIFICATION" | "VERIFIED" | "FAILED" | "DISABLED";

export interface DevFlowAdminUser extends DevFlowProfile {
  status: DevFlowProfileStatus;
  createdAt: string;
  updatedAt: string;
  memberships?: Array<{ projectId: string; role: DevFlowUserRole }>;
  createdProjects?: Array<{ id: string }>;
  projectCount: number;
}

export interface DevFlowAdminDomain {
  id: string;
  name: string;
  type: string;
  owner: string | null;
  target: string | null;
  environment: string;
  status: DevFlowAdminDomainStatus;
  verifiedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowAdminRepository {
  projectId: string;
  companyName: string;
  status: DevFlowProjectStatus;
  repoUrl: string | null;
  runId: string | null;
  linked: boolean;
  updatedAt: string;
}

export interface DevFlowAdminHandoff {
  projectId: string;
  companyName: string;
  projectStatus: DevFlowProjectStatus;
  repoUrl: string | null;
  deliveryReviewStatus: DevFlowProjectDeliveryReviewStatus;
  clientVisibleArtifacts: number;
  publishedArtifacts: number;
  activeWorkOrders: number;
  updatedAt: string;
}

export interface DevFlowAdminUsage {
  totals: {
    tokensConsumed: number;
    tokenBudget: number;
    budgetUtilization: number;
    runCount: number;
    eventCount: number;
  };
  projects: Array<{
    projectId: string;
    companyName: string;
    status: DevFlowProjectStatus;
    tokensConsumed: number;
    tokenBudget: number;
    retryCount: number;
    maxRetries: number;
  }>;
  recentRuns: DevFlowOrchestrationRun[];
}

export interface DevFlowScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  type: DevFlowScheduleEventType;
  projectId: string | null;
  ownerId: string;
  visibility: DevFlowScheduleVisibility;
  createdAt: string;
  updatedAt: string;
  project: Pick<DevFlowProjectSummary, "id" | "companyName" | "status"> | null;
  owner: Pick<DevFlowProfile, "id" | "email" | "fullName" | "role">;
}

export interface CreateDevFlowScheduleEventInput {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  type?: DevFlowScheduleEventType;
  projectId?: string | null;
  visibility?: DevFlowScheduleVisibility;
}

export interface UpdateDevFlowScheduleEventInput extends Partial<CreateDevFlowScheduleEventInput> {}

export interface DevFlowDeveloper {
  userId: string;
  role: "DEV";
  displayName: string;
  email: string | null;
  skills: string[];
  weeklyCapacityHours: number | null;
  availabilityStatus: DevFlowDeveloperAvailabilityStatus;
  notes: string | null;
  assignedProjectCount: number;
  openTaskCount: number;
  activeWorkOrderCount: number;
  projects: Array<Pick<DevFlowProjectSummary, "id" | "companyName" | "status" | "updatedAt" | "lifecycle">>;
  updatedAt: string | null;
}

export interface UpdateDevFlowDeveloperCapacityInput {
  skills?: string[];
  weeklyCapacityHours?: number | null;
  availabilityStatus?: DevFlowDeveloperAvailabilityStatus;
  notes?: string | null;
}

export interface DevFlowPmSummary {
  totals: {
    projects: number;
    pendingInvites: number;
    openTasks: number;
    activeWorkOrders: number;
    recentInquiries: number;
  };
  projectStatusCounts: Record<string, number>;
  recentProjects: Array<Pick<DevFlowProjectSummary, "id" | "companyName" | "status" | "updatedAt" | "lifecycle">>;
  recentInquiries: Pick<DevFlowInquiry, "id" | "companyName" | "contactName" | "email" | "status" | "createdAt">[];
}

export interface DevFlowAdminHealth {
  ok: boolean;
  checkedAt: string;
  services: {
    database: string;
    projects: number;
    profiles: number;
    runningRuns: number;
    failedRuns: number;
  };
  domains: Array<{ status: DevFlowAdminDomainStatus; _count: number }>;
}

export interface DevFlowAdminAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  metadata: unknown;
  createdAt: string;
  actor: DevFlowProfile | null;
}

export interface DevFlowPlatformSetting {
  key: string;
  value: unknown;
  updatedById: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface DevFlowProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: DevFlowUserRole;
  createdAt: string;
  user: DevFlowProfile;
}

export interface DevFlowGateEvent {
  id: string;
  projectId: string;
  gateType: "ARCHITECTURE_REVIEW" | "CODE_REVIEW";
  decision: "APPROVED" | "REJECTED";
  notes: string | null;
  decidedAt: string;
}

export interface DevFlowRunBudget {
  id: string;
  tokenBudget: number;
  tokensConsumed: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowArtifact {
  id: string;
  projectId: string;
  agentType: string;
  filePath: string;
  content?: string;
  clientVisible?: boolean;
  displayName?: string | null;
  sharedAt?: string | null;
  reviewStatus?: DevFlowArtifactReviewStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  outputReviewStatus?: DevFlowArtifactOutputReviewStatus;
  outputReviewNote?: string | null;
  outputReviewedAt?: string | null;
  outputReviewedById?: string | null;
  validationStatus?: DevFlowArtifactValidationStatus;
  validationSummary?: string | null;
  validationErrors?: string[] | Record<string, unknown>[] | null;
  publishedAt?: string | null;
  publishedById?: string | null;
  revisionHandledAt?: string | null;
  revisionHandledById?: string | null;
  revisionResolutionNote?: string | null;
  createdAt: string;
}

export interface DevFlowProjectTask {
  id: string;
  projectId: string;
  artifactId: string | null;
  title: string;
  description: string | null;
  status: DevFlowProjectTaskStatus;
  assignedToId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: DevFlowProfile | null;
  createdBy: DevFlowProfile | null;
  artifact: {
    id: string;
    filePath: string;
    displayName: string | null;
    reviewStatus: DevFlowArtifactReviewStatus;
    reviewNote: string | null;
    reviewedAt: string | null;
    revisionHandledAt: string | null;
  } | null;
}

export interface DevFlowProjectTaskActivity {
  id: string;
  projectId: string;
  taskId: string;
  actorId: string | null;
  type: DevFlowProjectTaskActivityType;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: DevFlowProfile | null;
}

export interface DevFlowWorkOrder {
  id: string;
  projectId: string;
  taskId: string | null;
  artifactId: string | null;
  title: string;
  instructions: string | null;
  agentType: DevFlowWorkOrderAgentType;
  status: DevFlowWorkOrderStatus;
  priority: DevFlowWorkOrderPriority;
  createdById: string | null;
  executionRunId: string | null;
  executionAttempt: number;
  executionStartedAt: string | null;
  executionCompletedAt: string | null;
  executionError: string | null;
  lastEventAt: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  task: {
    id: string;
    title: string;
    assignedToId: string | null;
    status: DevFlowProjectTaskStatus;
  } | null;
  artifact: {
    id: string;
    filePath: string;
    displayName: string | null;
    reviewStatus: DevFlowArtifactReviewStatus;
    outputReviewStatus: DevFlowArtifactOutputReviewStatus;
    validationStatus?: DevFlowArtifactValidationStatus;
  } | null;
  createdBy: DevFlowProfile | null;
}

export interface DevFlowWorkOrderExecution {
  id: string;
  projectId: string;
  orchestrationRunId: string | null;
  workOrderId: string;
  artifactId: string | null;
  executionRunId: string;
  attempt: number;
  agentType: DevFlowWorkOrderAgentType;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  workOrder?: {
    id: string;
    title: string;
    status: DevFlowWorkOrderStatus;
    agentType: DevFlowWorkOrderAgentType;
    priority?: DevFlowWorkOrderPriority;
  };
  artifact?: {
    id: string;
    filePath: string;
    displayName: string | null;
    outputReviewStatus: DevFlowArtifactOutputReviewStatus;
    reviewStatus: DevFlowArtifactReviewStatus;
    validationStatus?: DevFlowArtifactValidationStatus;
    createdAt?: string;
  } | null;
}

export interface DevFlowOrchestrationRun {
  id: string;
  projectId: string;
  runId: string;
  providerMode: string;
  trigger: "START" | "RERUN_READY_WORK_ORDERS" | "WORK_ORDER_DISPATCH" | "RETRY_FAILED_WORK_ORDER";
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  currentNode: string | null;
  error: string | null;
  actorId: string | null;
  readyWorkOrders: number;
  completedWorkOrders: number;
  failedWorkOrders: number;
  completedArtifacts: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  executions: DevFlowWorkOrderExecution[];
  events?: DevFlowEventLog[];
}

export interface DevFlowAgentProviderCapability {
  mode: DevFlowAgentProviderMode;
  displayName: string;
  active: boolean;
  available: boolean;
  implemented: boolean;
  missingRequirements: string[];
  reason: string | null;
  provider?: string;
  model?: string;
  fallbackModel?: string | null;
}

export interface DevFlowGithubDeliveryStatus {
  configured: boolean;
  available: boolean;
  owner: string | null;
  ownerSource: "env" | "installation" | null;
  missingRequirements: string[];
  reason: string | null;
}

export interface DevFlowGithubDeliveryVerification {
  ok: boolean;
  status: DevFlowGithubDeliveryStatus;
  owner: string | null;
  installationOwner: string | null;
  repositoriesVisible: number | null;
  permissions: Record<string, string> | null;
  reason: string | null;
}

export interface DevFlowLlmProviderVerification {
  ok: boolean;
  provider: string;
  model: string;
  fallbackModel: string | null;
  baseUrl: string;
  reason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  } | null;
  engineStatus?: DevFlowLlmEngineStatus;
}

export interface DevFlowLlmEngineStatus {
  requestedEngine: DevFlowLlmEngine;
  activeEngine: DevFlowLlmEngine;
  fallbackReason: string | null;
  eveServiceConfigured: boolean;
  model: string;
}

export interface DevFlowAgentProviderStatus {
  requestedMode: DevFlowAgentProviderMode;
  activeMode: DevFlowAgentProviderMode;
  available: boolean;
  fallbackMode: DevFlowAgentProviderMode | null;
  missingRequirements: string[];
  reason: string | null;
  provider?: string;
  model?: string;
  fallbackModel?: string | null;
  providers: DevFlowAgentProviderCapability[];
  llmEngine?: DevFlowLlmEngineStatus;
  requestedEngine?: DevFlowLlmEngine;
  activeEngine?: DevFlowLlmEngine;
  fallbackReason?: string | null;
  eveServiceConfigured?: boolean;
  engineModel?: string;
  githubDelivery?: DevFlowGithubDeliveryStatus;
}

export interface DevFlowNotification {
  id: string;
  recipientId: string;
  actorId: string | null;
  projectId: string | null;
  taskId: string | null;
  artifactId: string | null;
  type: DevFlowNotificationType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  actor: DevFlowProfile | null;
}

export interface DevFlowProjectTimelineEvent {
  id: string;
  projectId: string;
  actorId: string | null;
  taskId: string | null;
  artifactId: string | null;
  type: DevFlowProjectTimelineEventType;
  visibility: DevFlowProjectTimelineVisibility;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: DevFlowProfile | null;
}

export interface DevFlowConversation {
  id: string;
  projectId: string;
  title: string;
  category: DevFlowConversationCategory;
  visibility: DevFlowCollaborationVisibility;
  createdById: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: DevFlowProfile | null;
  messages: DevFlowMessage[];
  reads?: { lastReadAt: string }[];
  _count: { messages: number };
  unreadCount?: number;
}

export interface DevFlowMessage {
  id: string;
  projectId: string;
  conversationId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
  author: DevFlowProfile | null;
}

export interface DevFlowDocumentExtraction {
  status: "PENDING" | "EXTRACTING" | "READY" | "FAILED";
  error: string | null;
  attempts: number;
  updatedAt: string;
}

export interface DevFlowCollaborationDocument {
  id: string;
  projectId: string;
  artifactId: string | null;
  title: string;
  description: string | null;
  fileName: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  kind: DevFlowCollaborationDocumentKind;
  status: DevFlowCollaborationDocumentStatus;
  clientVisible: boolean;
  uploadedById: string | null;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy: DevFlowProfile | null;
  reviewedBy: DevFlowProfile | null;
  /** Null for link-only records, which have no stored file to extract text from. */
  extraction: DevFlowDocumentExtraction | null;
}

export type DevFlowProjectIntakeStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "READY" | "LOCKED" | "SUPERSEDED";
export type DevFlowFeaturePriority = "MUST_HAVE" | "SHOULD_HAVE" | "NICE_TO_HAVE";

export interface DevFlowClientIntakePayload {
  overview: {
    projectName: string;
    businessGoal: string;
    successMeasures: string[];
    primaryContact: string;
    approver: string;
    targetLaunch: string;
  };
  roles: Array<{ name: string; responsibilities: string[]; permissions: string[] }>;
  features: Array<{
    title: string;
    purpose: string;
    primaryRole: string;
    priority: DevFlowFeaturePriority;
    workflow: string;
    businessRules: string[];
    acceptanceCriteria: string[];
  }>;
  workflows: Array<{
    title: string;
    startCondition: string;
    actor: string;
    steps: string[];
    decisionPoints: string[];
    errorCases: string[];
    outcome: string;
  }>;
  dataAndIntegrations: {
    entities: Array<{ name: string; fields: string[]; accessRules: string[] }>;
    integrations: Array<{ name: string; purpose: string; owner: string }>;
    dataNotApplicable?: boolean;
    integrationsNotApplicable?: boolean;
  };
  experienceAndDelivery: {
    designNotes?: string;
    securityRequirements: string[];
    constraints: string[];
    milestones: string[];
    outOfScope: string[];
    futurePhase: string[];
    documentsNotApplicable?: boolean;
  };
}

export interface DevFlowIntakeComment {
  id: string;
  section: string;
  message: string;
  resolvedAt: string | null;
  createdAt: string;
  createdBy: Pick<DevFlowProfile, "id" | "fullName" | "email" | "role"> | null;
}

/**
 * The intake route returns the same rows as the collaboration route but without the uploader and
 * reviewer relations, so treat those as possibly absent when reading a document from intake.
 */
export type DevFlowIntakeDocument = Omit<DevFlowCollaborationDocument, "uploadedBy" | "reviewedBy"> &
  Partial<Pick<DevFlowCollaborationDocument, "uploadedBy" | "reviewedBy">>;

export interface DevFlowProjectIntake {
  id: string;
  projectId: string;
  status: DevFlowProjectIntakeStatus;
  version: number;
  payload: DevFlowClientIntakePayload;
  reviewNote: string | null;
  submittedAt: string | null;
  comments: DevFlowIntakeComment[];
}

/** The eight worksheet steps, in the order a client works through them. */
export type DevFlowIntakeSectionId =
  | "overview"
  | "roles"
  | "features"
  | "workflows"
  | "data"
  | "delivery"
  | "documents"
  | "review";

/** Per-step completion, computed by the API so every surface agrees on what is done. */
export interface DevFlowIntakeSectionStatus {
  section: DevFlowIntakeSectionId;
  complete: boolean;
  missing: string[];
}

export interface DevFlowIntakeReadiness {
  blockers: string[];
  /** Absent on older responses; treat as "no per-step detail available". */
  sections?: DevFlowIntakeSectionStatus[];
  readyForSubmission: boolean;
  readyForLock: boolean;
  counts: { uploaded: number; extracting: number; failed: number; ready: number };
}

/**
 * The question wording, served by the API from the requirements worksheet.
 *
 * This is the single source of the intake copy. Labels and helper text must be read from here
 * rather than hardcoded in a form: the worksheet a client downloads and the form they fill are
 * the same questions, and when each surface owned its own strings they drifted into different
 * registers — plain English in the download, analyst jargon in the portal.
 */
export interface DevFlowIntakeTemplateField {
  /** The payload property this question fills; absent on the review checklist. */
  key?: string;
  label: string;
  helper: string;
  example?: string;
  list?: boolean;
}

export interface DevFlowIntakeTemplateSection {
  id: DevFlowIntakeSectionId;
  title: string;
  purpose: string;
  repeatFor?: string;
  fields: DevFlowIntakeTemplateField[];
}

export interface DevFlowIntakeTemplate {
  intro: string[];
  sections: DevFlowIntakeTemplateSection[];
}

export interface DevFlowProjectIntakeResponse {
  intake: DevFlowProjectIntake;
  documents?: DevFlowIntakeDocument[];
  readiness: DevFlowIntakeReadiness;
  templateMarkdown?: string;
  /** Absent on older responses; fall back to built-in copy when missing. */
  template?: DevFlowIntakeTemplate;
}

export interface DevFlowEventLog {
  id: string;
  projectId: string;
  nodeName: string;
  eventType: string;
  costMeta: Record<string, unknown>;
  runTokens: number;
  occurredAt: string;
}

export interface DevFlowProjectDeliveryReview {
  id: string;
  projectId: string;
  status: DevFlowProjectDeliveryReviewStatus;
  acceptanceNote: string | null;
  acceptedById: string | null;
  acceptedAt: string | null;
  revisionNote: string | null;
  revisionRequestedById: string | null;
  revisionRequestedAt: string | null;
  revisionResolvedById: string | null;
  revisionResolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowProjectDeliveryReviewInput {
  note?: string;
}

export interface DevFlowDeliveryReadinessBlocker {
  code: string;
  message: string;
  severity: "BLOCKER" | "WARNING";
  count?: number;
}

export interface DevFlowDeliveryReadiness {
  ready: boolean;
  projectId: string;
  blockers: DevFlowDeliveryReadinessBlocker[];
  checks: {
    acceptedInvite: boolean;
    hasPublishedArtifacts: boolean;
    publishedArtifactsValidated: boolean;
    publishedArtifactsApproved: boolean;
    requiredAgentCoverage: boolean;
    documentsCleared: boolean;
    workOrdersCleared: boolean;
    revisionsCleared: boolean;
    deliveryRevisionCleared: boolean;
  };
  counts: {
    publishedArtifacts: number;
    invalidPublishedArtifacts: number;
    unapprovedPublishedArtifacts: number;
    activeWorkOrders: number;
    openDocuments: number;
    openArtifactRevisions: number;
    missingAgentTypes: number;
  };
}

export interface DevFlowProjectDetail extends DevFlowProjectSummary {
  brief: string;
  stackKey: string;
  runId: string | null;
  repoUrl: string | null;
  createdById: string | null;
  updatedAt: string;
  createdBy: DevFlowProfile | null;
  members: DevFlowProjectMember[];
  gates: DevFlowGateEvent[];
  runBudget: DevFlowRunBudget | null;
  kickoff: DevFlowProjectKickoff | null;
  deliveryReview: DevFlowProjectDeliveryReview | null;
  clientInvites: DevFlowProjectClientInvite[];
  _count: {
    artifacts: number;
    eventLogs: number;
  };
}

export interface CreateDevFlowProjectInput {
  companyName: string;
  brief: string;
  stackKey: string;
  /**
   * Client company this project is for. Required — a project only exists for a client.
   *
   * Was optional "so creation is never blocked", which allowed projects with nobody to deliver
   * them to. Required here as well as on the API so the compiler catches a caller that forgot,
   * rather than a PM discovering it as a 400 after filling in a wizard.
   */
  clientId: string;
  designGuidance?: DevFlowDesignGuidance;
  groupId?: string;
  repositoryName?: string;
  repositoryDescription?: string;
  /** When true, also provision a mobile (Expo/React Native) repository. */
  includeMobile?: boolean;
  /** Per-repo tech stack. backend: nest|node; frontend: next|react; mobile: expo|react-native. */
  backendStack?: string;
  frontendStack?: string;
  mobileStack?: string;
}

export type DevFlowGroupRole = "LEAD" | "DELEGATED_LEAD" | "MEMBER" | "VIEWER";
export type DevFlowGroupStatus = "ACTIVE" | "ARCHIVED";
export type DevFlowGroupInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
export type DevFlowRepositoryStatus = "PENDING" | "ACTIVE" | "FAILED" | "ARCHIVED";
export type DevFlowRepositoryAssignmentState = "PENDING" | "ACTIVE" | "REVOKING" | "REVOKED" | "FAILED";

export interface DevFlowGroupPerson {
  /** DevFlow profile id — null when the person has not signed into DevFlow yet. */
  id: string | null;
  email: string | null;
  fullName: string | null;
  githubLogin?: string | null;
  avatarUrl?: string | null;
  role?: DevFlowUserRole;
  /** True when they have a DevFlow profile and can be invited directly. */
  onSystem?: boolean;
}

export interface DevFlowGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: DevFlowGroupRole;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
  updatedAt: string;
  user: DevFlowGroupPerson;
}

export interface DevFlowGroup {
  id: string;
  name: string;
  description: string | null;
  businessUnit: string | null;
  status: DevFlowGroupStatus;
  ownerId: string;
  githubInstallationId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: DevFlowGroupPerson;
  members: DevFlowGroupMember[];
  _count: { projects: number; repositories: number; invitations: number };
}

export interface DevFlowGroupInvitation {
  id: string;
  groupId: string;
  invitedUserId: string;
  role: DevFlowGroupRole;
  status: DevFlowGroupInvitationStatus;
  createdAt: string;
  group?: Pick<DevFlowGroup, "id" | "name" | "description" | "businessUnit">;
  invitedUser?: DevFlowGroupPerson;
  invitedBy: DevFlowGroupPerson;
}

export interface DevFlowRepositoryAssignment {
  id: string;
  repositoryId: string;
  userId: string;
  desiredState: "ASSIGNED" | "UNASSIGNED";
  effectiveState: DevFlowRepositoryAssignmentState;
  lastError: string | null;
  lastSyncedAt: string | null;
  user: DevFlowGroupPerson;
  assignedBy: DevFlowGroupPerson;
}

export interface DevFlowRepository {
  id: string;
  groupId: string;
  projectId: string;
  name: string;
  fullName: string | null;
  htmlUrl: string | null;
  cloneUrl: string | null;
  defaultBranch: string;
  visibility: string;
  status: DevFlowRepositoryStatus;
  lastError: string | null;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
  group: Pick<DevFlowGroup, "id" | "name" | "status">;
  project: Pick<DevFlowProjectDetail, "id" | "companyName" | "stackKey" | "status" | "repoUrl">;
  assignments: DevFlowRepositoryAssignment[];
}

export interface CreateDevFlowInquiryInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  role?: string;
  brief: string;
  stackKey?: string;
  budgetRange?: string;
  timeline?: string;
}

export interface ReviewDevFlowInquiryInput {
  reviewNote?: string;
  /**
   * Existing client to file an approved lead under. Omitted means resolve-or-create by company
   * name — the console suggests a match and the PM confirms it, rather than merging silently.
   */
  clientId?: string;
  /** Name to create the client under when no existing client is chosen. */
  clientName?: string;
}

export interface UpdateDevFlowProjectInput {
  companyName?: string;
  brief?: string;
  stackKey?: string;
  status?: DevFlowProjectStatus;
  repoUrl?: string;
}

export interface UpdateDevFlowProjectKickoffInput {
  scopeSummary?: string;
  milestones?: string;
  requiredDocuments?: string;
  techStackNotes?: string;
  deliveryRoles?: string;
  readinessNotes?: string;
  scopeConfirmed?: boolean;
  milestonesConfirmed?: boolean;
  documentsConfirmed?: boolean;
  techStackConfirmed?: boolean;
  rolesConfirmed?: boolean;
  clientAccessConfirmed?: boolean;
  initialTasksCreated?: boolean;
  initialWorkOrdersCreated?: boolean;
}

export interface AddDevFlowProjectMemberInput {
  email?: string;
  userId?: string;
  role: DevFlowUserRole;
}

export interface StartDevFlowOrchestrationResult {
  accepted: boolean;
  runId: string;
}

export interface StartDevFlowOrchestrationInput {
  designGuidance?: DevFlowDesignGuidance;
  modelSelection?: DevFlowOrchestrationModelSelection;
  runControls?: DevFlowOrchestrationRunControls;
}

export interface DevFlowOrchestrationRunControls {
  tokenBudget?: number;
  maxRetries?: number;
}

export type DevFlowOrchestrationModelTarget =
  | "requirements"
  | "contract"
  | "frontend"
  | "backend"
  | "database"
  | "architecture"
  | "mobile"
  | "qa"
  | "security"
  | "critique";

export type DevFlowPlannedAgent =
  | "frontend"
  | "backend"
  | "database"
  | "mobile"
  | "architecture"
  | "qa"
  | "integration"
  | "security";

export interface DevFlowAgentPlanEntry {
  agent: DevFlowPlannedAgent;
  role: "implementer" | "reviewer" | "documentation";
  reason: string;
  ownedPaths: string[];
  dependsOn: DevFlowPlannedAgent[];
}

export interface DevFlowAgentPlan {
  version: "agent-plan-v1";
  createdBy: "planner-orchestrator";
  activeAgents: DevFlowPlannedAgent[];
  skippedAgents: Array<{ agent: DevFlowPlannedAgent; reason: string }>;
  entries: DevFlowAgentPlanEntry[];
  securityReview: boolean;
}

export interface DevFlowOrchestrationModelSelection {
  defaultModel: string;
  overrides?: Partial<Record<DevFlowOrchestrationModelTarget, string>>;
}

export interface DevFlowGatewayModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number | null;
  maxTokens: number | null;
  pricing: {
    input: string | null;
    output: string | null;
  };
  free: boolean;
}

export interface DevFlowGatewayModelCatalog {
  models: DevFlowGatewayModel[];
  defaultModel: string;
  source: "live" | "cache" | "fallback";
  fetchedAt: string;
  warning: string | null;
}

export interface DevFlowOrchestrationModelDefaults {
  selection: DevFlowOrchestrationModelSelection;
  source: "saved" | "catalog";
  warning: string | null;
  updatedAt: string | null;
}

export interface DevFlowOrchestrationStatus {
  status: string;
  currentNode: string;
  retryCount: number;
  error: string | null;
  contract?: {
    projectName?: string;
    description?: string;
    requirements?: unknown;
    fileManifest?: string[];
    acceptanceCriteria?: string[];
    agentPlan?: DevFlowAgentPlan;
  } | null;
  companyName: string;
  brief: string;
  stackKey: string;
  createdAt: string;
}

export interface CreateDevFlowProjectTaskInput {
  title: string;
  description?: string;
  status?: DevFlowProjectTaskStatus;
  assignedToId?: string;
  artifactId?: string;
}

export interface UpdateDevFlowProjectTaskInput {
  title?: string;
  description?: string;
  status?: DevFlowProjectTaskStatus;
  assignedToId?: string;
  artifactId?: string;
}

export interface AddDevFlowProjectTaskCommentInput {
  message: string;
}

export interface CreateDevFlowWorkOrderInput {
  title: string;
  instructions?: string;
  /** The OUTPUT contract: which extensions, language and signals the validator requires. */
  agentType: DevFlowWorkOrderAgentType;
  /**
   * The configured agent that should do the work.
   *
   * Omitted, the role is derived from agentType as before. Supplied, the agent's instructions
   * and attached skills shape the prompt.
   */
  workspaceAgentId?: string;
  priority?: DevFlowWorkOrderPriority;
  taskId?: string;
  artifactId?: string;
}

export interface UpdateDevFlowWorkOrderInput {
  title?: string;
  /** Empty string clears the assignment. */
  workspaceAgentId?: string;
  instructions?: string;
  agentType?: DevFlowWorkOrderAgentType;
  priority?: DevFlowWorkOrderPriority;
  status?: DevFlowWorkOrderStatus;
  taskId?: string;
  artifactId?: string;
}

export interface CreateDevFlowConversationInput {
  title: string;
  category?: DevFlowConversationCategory;
  visibility?: DevFlowCollaborationVisibility;
  message?: string;
}

export interface CreateDevFlowMessageInput {
  body: string;
}

export interface CreateDevFlowCollaborationDocumentInput {
  title: string;
  description?: string;
  fileName?: string;
  externalUrl?: string;
  artifactId?: string;
  kind?: DevFlowCollaborationDocumentKind;
  status?: DevFlowCollaborationDocumentStatus;
  clientVisible?: boolean;
}

export interface UpdateDevFlowCollaborationDocumentInput extends Partial<CreateDevFlowCollaborationDocumentInput> {}

export interface ReviewDevFlowCollaborationDocumentInput {
  status: Extract<DevFlowCollaborationDocumentStatus, "APPROVED" | "REVISION_REQUESTED">;
  reviewNote?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const controller = new AbortController();
  const method = (init?.method ?? "GET").toUpperCase();
  const provisionsRepository = method === "POST" && (path === "/projects" || path === "/repositories");
  const timeoutMs = provisionsRepository ? 60_000 : 15_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const idempotencyKey = method === "GET"
    ? null
    : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DevFlowApiError({
        status: 0,
        kind: "network",
        message: `The DevFlow API did not respond within ${timeoutMs / 1000} seconds. Check that the backend is running and try again.`,
        details: "Request timed out",
      });
    }
    throw new DevFlowApiError({
      status: 0,
      kind: "network",
      message: "Cannot reach the DevFlow API. Check that the backend is running and try again.",
      details: error instanceof Error ? error.message : String(error),
    });
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    const parsed = parseApiErrorBody(rawBody);
    throw new DevFlowApiError({
      status: response.status,
      kind: kindForStatus(response.status),
      message: messageForStatus(response.status, parsed.message),
      details: parsed.message,
      rawBody,
      code: parsed.code,
    });
  }

  return response.json() as Promise<T>;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      body: formData,
    });
  } catch (error) {
    throw new DevFlowApiError({
      status: 0,
      kind: "network",
      message: "Cannot reach the DevFlow API. Check that the backend is running and try again.",
      details: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    const parsed = parseApiErrorBody(rawBody);
    throw new DevFlowApiError({
      status: response.status,
      kind: kindForStatus(response.status),
      message: messageForStatus(response.status, parsed.message),
      details: parsed.message,
      rawBody,
      code: parsed.code,
    });
  }

  return response.json() as Promise<T>;
}

function kindForStatus(status: number): DevFlowApiErrorKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

function messageForStatus(status: number, fallback: string): string {
  if (status === 401) return "Your session is missing or expired. Sign in again to continue.";
  if (status === 403) return "You do not have access to this workspace or action.";
  if (status === 404) return "This record is unavailable, deleted, or not assigned to your account.";
  if (status >= 500) return "The DevFlow API hit a server error. Try again after checking the backend logs.";
  return fallback || `DevFlow API request failed with ${status}`;
}

function parseApiErrorBody(rawBody: string): { message: string; code: string | null } {
  if (!rawBody) return { message: "", code: null };

  try {
    const parsed = JSON.parse(rawBody) as { message?: unknown; error?: unknown; code?: unknown };
    const code = typeof parsed.code === "string" ? parsed.code : null;
    if (Array.isArray(parsed.message)) return { message: parsed.message.join(" "), code };
    if (typeof parsed.message === "string") return { message: parsed.message, code };
    if (typeof parsed.error === "string") return { message: parsed.error, code };
    return { message: rawBody, code };
  } catch {
    return { message: rawBody, code: null };
  }
}

function fileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || null;
}

/** Developer-initiated orchestration start: the prompt is the build requirement. */
export function startDevFlowOrchestrationFromPrompt(
  projectId: string,
  prompt: string,
  modelSelection?: DevFlowOrchestrationModelSelection,
  runControls?: DevFlowOrchestrationRunControls,
): Promise<{ accepted: boolean; runId: string }> {
  return request(`/projects/${projectId}/orchestration/start-from-prompt`, {
    method: "POST",
    body: JSON.stringify({ prompt, modelSelection, runControls }),
  });
}

export function getDevFlowOrchestrationModels(): Promise<DevFlowGatewayModelCatalog> {
  return request<DevFlowGatewayModelCatalog>("/projects/orchestration/models");
}

export function getDevFlowOrchestrationModelDefaults(): Promise<DevFlowOrchestrationModelDefaults> {
  return request<DevFlowOrchestrationModelDefaults>("/projects/orchestration/model-defaults");
}

export function updateDevFlowOrchestrationModelDefaults(
  selection: DevFlowOrchestrationModelSelection,
): Promise<DevFlowOrchestrationModelDefaults> {
  return request<DevFlowOrchestrationModelDefaults>("/projects/orchestration/model-defaults", {
    method: "PATCH",
    body: JSON.stringify(selection),
  });
}

export function listDevFlowProjects(): Promise<DevFlowProjectSummary[]> {
  return request<DevFlowProjectSummary[]>("/projects");
}

export function createDevFlowInquiry(input: CreateDevFlowInquiryInput): Promise<DevFlowInquiry> {
  return request<DevFlowInquiry>("/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listDevFlowInquiries(status?: DevFlowInquiryStatus): Promise<DevFlowInquiry[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<DevFlowInquiry[]>(`/inquiries${query}`);
}

export function getDevFlowInquiry(id: string): Promise<DevFlowInquiry> {
  return request<DevFlowInquiry>(`/inquiries/${id}`);
}

// The client's own invite calls (/client-invites/status, /me, /accept) used to live here.
// They are gone: this console admits GitHub team members only, so no client can authenticate
// to call them. A client's invites are handled by the Alphaexplora client app. The
// PM-facing invite endpoints below (create, list per project, revoke) remain.

export function approveDevFlowInquiry(
  id: string,
  input: ReviewDevFlowInquiryInput = {},
): Promise<DevFlowInquiry> {
  return request<DevFlowInquiry>(`/inquiries/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function rejectDevFlowInquiry(
  id: string,
  input: ReviewDevFlowInquiryInput = {},
): Promise<DevFlowInquiry> {
  return request<DevFlowInquiry>(`/inquiries/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function sendDevFlowInquiryAccountInvite(
  id: string,
): Promise<DevFlowAccountInvitationDelivery> {
  return request<DevFlowAccountInvitationDelivery>(`/inquiries/${id}/send-account-invite`, {
    method: "POST",
  });
}

export function listDevFlowProjectDetails(): Promise<DevFlowProjectDetail[]> {
  return request<DevFlowProjectDetail[]>("/projects/details");
}

export function getDevFlowProject(projectId: string): Promise<DevFlowProjectDetail> {
  return request<DevFlowProjectDetail>(`/projects/${projectId}`);
}

export function getDevFlowProjectKickoff(projectId: string): Promise<DevFlowProjectKickoff> {
  return request<DevFlowProjectKickoff>(`/projects/${projectId}/kickoff`);
}

export function updateDevFlowProjectKickoff(
  projectId: string,
  input: UpdateDevFlowProjectKickoffInput,
): Promise<DevFlowProjectKickoff> {
  return request<DevFlowProjectKickoff>(`/projects/${projectId}/kickoff`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createDevFlowKickoffTasks(
  projectId: string,
): Promise<{ tasks: DevFlowProjectTask[]; kickoff: DevFlowProjectKickoff }> {
  return request<{ tasks: DevFlowProjectTask[]; kickoff: DevFlowProjectKickoff }>(`/projects/${projectId}/kickoff/tasks`, {
    method: "POST",
  });
}

export function createDevFlowKickoffWorkOrders(
  projectId: string,
): Promise<{ workOrders: DevFlowWorkOrder[]; kickoff: DevFlowProjectKickoff }> {
  return request<{ workOrders: DevFlowWorkOrder[]; kickoff: DevFlowProjectKickoff }>(`/projects/${projectId}/kickoff/work-orders`, {
    method: "POST",
  });
}

export function getDevFlowProjectArtifacts(projectId: string): Promise<DevFlowArtifact[]> {
  return request<DevFlowArtifact[]>(`/projects/${projectId}/artifacts`);
}

export function getDevFlowProjectArtifact(
  projectId: string,
  artifactId: string,
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}`);
}

export function updateDevFlowArtifactSharing(
  projectId: string,
  artifactId: string,
  input: { clientVisible: boolean; displayName?: string },
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}/share`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function reviewDevFlowArtifact(
  projectId: string,
  artifactId: string,
  input: { reviewStatus: Exclude<DevFlowArtifactReviewStatus, "PENDING">; reviewNote?: string },
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function handleDevFlowArtifactRevision(
  projectId: string,
  artifactId: string,
  input: { resolutionNote?: string },
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}/revision`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function reviewDevFlowArtifactOutput(
  projectId: string,
  artifactId: string,
  input: { status: Exclude<DevFlowArtifactOutputReviewStatus, "PENDING" | "PUBLISHED">; note?: string; assignedToId?: string },
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}/output-review`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function publishDevFlowArtifactOutput(
  projectId: string,
  artifactId: string,
  input: { displayName?: string } = {},
): Promise<DevFlowArtifact> {
  return request<DevFlowArtifact>(`/projects/${projectId}/artifacts/${artifactId}/publish`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDevFlowProjectDeliveryReview(projectId: string): Promise<DevFlowProjectDeliveryReview | null> {
  return request<DevFlowProjectDeliveryReview | null>(`/projects/${projectId}/delivery-review`);
}

export function getDevFlowDeliveryReadiness(projectId: string): Promise<DevFlowDeliveryReadiness> {
  return request<DevFlowDeliveryReadiness>(`/projects/${projectId}/delivery-readiness`);
}

export function acceptDevFlowProjectDelivery(
  projectId: string,
  input: DevFlowProjectDeliveryReviewInput = {},
): Promise<DevFlowProjectDeliveryReview> {
  return request<DevFlowProjectDeliveryReview>(`/projects/${projectId}/delivery-review/accept`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestDevFlowProjectDeliveryRevision(
  projectId: string,
  input: DevFlowProjectDeliveryReviewInput,
): Promise<DevFlowProjectDeliveryReview> {
  return request<DevFlowProjectDeliveryReview>(`/projects/${projectId}/delivery-review/revision`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resolveDevFlowProjectDeliveryRevision(
  projectId: string,
  input: DevFlowProjectDeliveryReviewInput = {},
): Promise<DevFlowProjectDeliveryReview> {
  return request<DevFlowProjectDeliveryReview>(`/projects/${projectId}/delivery-review/resolve`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getDevFlowProjectTasks(projectId: string): Promise<DevFlowProjectTask[]> {
  return request<DevFlowProjectTask[]>(`/projects/${projectId}/tasks`);
}

export function createDevFlowProjectTask(
  projectId: string,
  input: CreateDevFlowProjectTaskInput,
): Promise<DevFlowProjectTask> {
  return request<DevFlowProjectTask>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowProjectTask(
  projectId: string,
  taskId: string,
  input: UpdateDevFlowProjectTaskInput,
): Promise<DevFlowProjectTask> {
  return request<DevFlowProjectTask>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getDevFlowProjectTaskActivity(
  projectId: string,
  taskId: string,
): Promise<DevFlowProjectTaskActivity[]> {
  return request<DevFlowProjectTaskActivity[]>(`/projects/${projectId}/tasks/${taskId}/activity`);
}

export function addDevFlowProjectTaskComment(
  projectId: string,
  taskId: string,
  input: AddDevFlowProjectTaskCommentInput,
): Promise<DevFlowProjectTaskActivity> {
  return request<DevFlowProjectTaskActivity>(`/projects/${projectId}/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDevFlowProjectWorkOrders(projectId: string): Promise<DevFlowWorkOrder[]> {
  return request<DevFlowWorkOrder[]>(`/projects/${projectId}/work-orders`);
}

export function createDevFlowWorkOrder(
  projectId: string,
  input: CreateDevFlowWorkOrderInput,
): Promise<DevFlowWorkOrder> {
  return request<DevFlowWorkOrder>(`/projects/${projectId}/work-orders`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowWorkOrder(
  projectId: string,
  workOrderId: string,
  input: UpdateDevFlowWorkOrderInput,
): Promise<DevFlowWorkOrder> {
  return request<DevFlowWorkOrder>(`/projects/${projectId}/work-orders/${workOrderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function dispatchDevFlowWorkOrder(
  projectId: string,
  workOrderId: string,
): Promise<DevFlowWorkOrder> {
  return request<DevFlowWorkOrder>(`/projects/${projectId}/work-orders/${workOrderId}/dispatch`, {
    method: "POST",
  });
}

export function retryDevFlowWorkOrder(
  projectId: string,
  workOrderId: string,
): Promise<DevFlowWorkOrder> {
  return request<DevFlowWorkOrder>(`/projects/${projectId}/work-orders/${workOrderId}/retry`, {
    method: "POST",
  });
}

export function getDevFlowNotifications(): Promise<DevFlowNotification[]> {
  return request<DevFlowNotification[]>("/notifications");
}

export function markDevFlowNotificationRead(id: string): Promise<DevFlowNotification> {
  return request<DevFlowNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllDevFlowNotificationsRead(): Promise<{ updated: number }> {
  return request<{ updated: number }>("/notifications/read-all", {
    method: "PATCH",
  });
}

export function getDevFlowProjectEvents(projectId: string): Promise<DevFlowEventLog[]> {
  return request<DevFlowEventLog[]>(`/projects/${projectId}/events`);
}

export function getDevFlowProjectTimeline(projectId: string): Promise<DevFlowProjectTimelineEvent[]> {
  return request<DevFlowProjectTimelineEvent[]>(`/projects/${projectId}/timeline`);
}

export function getDevFlowOrchestrationStatus(projectId: string): Promise<DevFlowOrchestrationStatus> {
  return request<DevFlowOrchestrationStatus>(`/projects/${projectId}/orchestration/status`);
}

export function getDevFlowOrchestrationRuns(projectId: string): Promise<DevFlowOrchestrationRun[]> {
  return request<DevFlowOrchestrationRun[]>(`/projects/${projectId}/orchestration/runs`);
}

export function getDevFlowOrchestrationRun(projectId: string, runId: string): Promise<DevFlowOrchestrationRun> {
  return request<DevFlowOrchestrationRun>(`/projects/${projectId}/orchestration/runs/${runId}`);
}

export function getDevFlowOrchestrationProviderStatus(projectId: string): Promise<DevFlowAgentProviderStatus> {
  return request<DevFlowAgentProviderStatus>(`/projects/${projectId}/orchestration/provider`);
}

export function verifyDevFlowGithubDelivery(projectId: string): Promise<DevFlowGithubDeliveryVerification> {
  return request<DevFlowGithubDeliveryVerification>(`/projects/${projectId}/orchestration/github-delivery/verify`, {
    method: "POST",
  });
}

export function verifyDevFlowLlmProvider(projectId: string): Promise<DevFlowLlmProviderVerification> {
  return request<DevFlowLlmProviderVerification>(`/projects/${projectId}/orchestration/llm-provider/verify`, {
    method: "POST",
  });
}

export function getDevFlowConversations(projectId: string): Promise<DevFlowConversation[]> {
  return request<DevFlowConversation[]>(`/projects/${projectId}/conversations`);
}

export function createDevFlowConversation(
  projectId: string,
  input: CreateDevFlowConversationInput,
): Promise<DevFlowConversation> {
  return request<DevFlowConversation>(`/projects/${projectId}/conversations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDevFlowConversationMessages(
  projectId: string,
  conversationId: string,
): Promise<DevFlowMessage[]> {
  return request<DevFlowMessage[]>(`/projects/${projectId}/conversations/${conversationId}/messages`);
}

export function createDevFlowMessage(
  projectId: string,
  conversationId: string,
  input: CreateDevFlowMessageInput,
): Promise<DevFlowMessage> {
  return request<DevFlowMessage>(`/projects/${projectId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markDevFlowConversationRead(
  projectId: string,
  conversationId: string,
): Promise<{ read: true; lastReadAt: string }> {
  return request<{ read: true; lastReadAt: string }>(`/projects/${projectId}/conversations/${conversationId}/read`, {
    method: "PATCH",
  });
}

export function getDevFlowCollaborationDocuments(projectId: string): Promise<DevFlowCollaborationDocument[]> {
  return request<DevFlowCollaborationDocument[]>(`/projects/${projectId}/documents`);
}

export function createDevFlowCollaborationDocument(
  projectId: string,
  input: CreateDevFlowCollaborationDocumentInput,
): Promise<DevFlowCollaborationDocument> {
  return request<DevFlowCollaborationDocument>(`/projects/${projectId}/documents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowCollaborationDocument(
  projectId: string,
  documentId: string,
  input: UpdateDevFlowCollaborationDocumentInput,
): Promise<DevFlowCollaborationDocument> {
  return request<DevFlowCollaborationDocument>(`/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function reviewDevFlowCollaborationDocument(
  projectId: string,
  documentId: string,
  input: ReviewDevFlowCollaborationDocumentInput,
): Promise<DevFlowCollaborationDocument> {
  return request<DevFlowCollaborationDocument>(`/projects/${projectId}/documents/${documentId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentDevFlowUser(): Promise<DevFlowAuthUser> {
  return request<DevFlowAuthUser>("/auth/me");
}

export function getCurrentDevFlowProfile(): Promise<DevFlowProfileSelf> {
  return request<DevFlowProfileSelf>("/profiles/me");
}

export function updateCurrentDevFlowProfile(input: UpdateDevFlowProfileInput): Promise<DevFlowProfileSelf> {
  return request<DevFlowProfileSelf>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function searchDevFlowProfiles(input: {
  q?: string;
  roles?: DevFlowUserRole[];
  limit?: number;
}): Promise<DevFlowProfileSearchResult[]> {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.roles?.length) params.set("roles", input.roles.join(","));
  if (input.limit) params.set("limit", String(input.limit));

  const query = params.toString();
  return request<DevFlowProfileSearchResult[]>(`/profiles${query ? `?${query}` : ""}`);
}

export function listDevFlowScheduleEvents(): Promise<DevFlowScheduleEvent[]> {
  return request<DevFlowScheduleEvent[]>("/schedule/events");
}

export function createDevFlowScheduleEvent(input: CreateDevFlowScheduleEventInput): Promise<DevFlowScheduleEvent> {
  return request<DevFlowScheduleEvent>("/schedule/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowScheduleEvent(
  id: string,
  input: UpdateDevFlowScheduleEventInput,
): Promise<DevFlowScheduleEvent> {
  return request<DevFlowScheduleEvent>(`/schedule/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDevFlowScheduleEvent(id: string): Promise<{ deleted: true }> {
  return request<{ deleted: true }>(`/schedule/events/${id}`, { method: "DELETE" });
}

export function getDevFlowPmSummary(): Promise<DevFlowPmSummary> {
  return request<DevFlowPmSummary>("/reports/pm-summary");
}

export function listDevFlowDevelopers(): Promise<DevFlowDeveloper[]> {
  return request<DevFlowDeveloper[]>("/developers");
}

export function getDevFlowDeveloper(id: string): Promise<DevFlowDeveloper> {
  return request<DevFlowDeveloper>(`/developers/${id}`);
}

export function updateDevFlowDeveloperCapacity(input: UpdateDevFlowDeveloperCapacityInput): Promise<DevFlowDeveloper> {
  return request<DevFlowDeveloper>("/developers/me/capacity", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function downloadDevFlowProjectArtifact(
  projectId: string,
  artifactId: string,
  fallbackFileName = "artifact",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let response: Response;
  try {
    response = await fetch(`${API_URL}/projects/${projectId}/artifacts/${artifactId}/download`, {
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });
  } catch (error) {
    throw new DevFlowApiError({
      status: 0,
      kind: "network",
      message: "Cannot reach the DevFlow API. Check that the backend is running and try again.",
      details: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    const parsed = parseApiErrorBody(rawBody);
    throw new DevFlowApiError({
      status: response.status,
      kind: kindForStatus(response.status),
      message: messageForStatus(response.status, parsed.message),
      details: parsed.message,
      rawBody,
      code: parsed.code,
    });
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameFromDisposition(response.headers.get("content-disposition")) || fallbackFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function listDevFlowAdminUsers(input: {
  q?: string;
  role?: DevFlowUserRole | "ALL";
} = {}): Promise<DevFlowAdminUser[]> {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.role && input.role !== "ALL") params.set("role", input.role);
  const query = params.toString();
  return request<DevFlowAdminUser[]>(`/admin/users${query ? `?${query}` : ""}`);
}

export function updateDevFlowAdminUserRole(id: string, role: DevFlowUserRole): Promise<DevFlowAdminUser> {
  return request<DevFlowAdminUser>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateDevFlowAdminUserStatus(id: string, status: DevFlowProfileStatus): Promise<DevFlowAdminUser> {
  return request<DevFlowAdminUser>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listDevFlowAdminDomains(): Promise<DevFlowAdminDomain[]> {
  return request<DevFlowAdminDomain[]>("/admin/domains");
}

export function createDevFlowAdminDomain(input: {
  name: string;
  type: string;
  owner?: string;
  target?: string;
  environment?: string;
}): Promise<DevFlowAdminDomain> {
  return request<DevFlowAdminDomain>("/admin/domains", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowAdminDomain(
  id: string,
  input: Partial<Pick<DevFlowAdminDomain, "type" | "owner" | "target" | "environment" | "status">>,
): Promise<DevFlowAdminDomain> {
  return request<DevFlowAdminDomain>(`/admin/domains/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function verifyDevFlowAdminDomain(id: string): Promise<DevFlowAdminDomain> {
  return request<DevFlowAdminDomain>(`/admin/domains/${id}/verify`, { method: "POST" });
}

export function deleteDevFlowAdminDomain(id: string): Promise<{ deleted: true }> {
  return request<{ deleted: true }>(`/admin/domains/${id}`, { method: "DELETE" });
}

export function listDevFlowAdminRepositories(): Promise<DevFlowAdminRepository[]> {
  return request<DevFlowAdminRepository[]>("/admin/repositories");
}

export function linkDevFlowAdminRepository(projectId: string, repoUrl: string): Promise<DevFlowAdminRepository> {
  return request<DevFlowAdminRepository>(`/admin/projects/${projectId}/repository`, {
    method: "PATCH",
    body: JSON.stringify({ repoUrl }),
  });
}

export function createDevFlowAdminRepository(projectId: string): Promise<{ repoUrl: string }> {
  return request<{ repoUrl: string }>(`/admin/projects/${projectId}/repository/create`, {
    method: "POST",
  });
}

export function listDevFlowAdminHandoffs(): Promise<DevFlowAdminHandoff[]> {
  return request<DevFlowAdminHandoff[]>("/admin/handoffs");
}

export function overrideDevFlowAdminHandoff(
  projectId: string,
  input: { note: string; markReady?: boolean },
): Promise<DevFlowProjectSummary> {
  return request<DevFlowProjectSummary>(`/admin/projects/${projectId}/handoff/override`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDevFlowAdminUsage(): Promise<DevFlowAdminUsage> {
  return request<DevFlowAdminUsage>("/admin/usage");
}

export function getDevFlowAdminHealth(): Promise<DevFlowAdminHealth> {
  return request<DevFlowAdminHealth>("/admin/health");
}

export function getDevFlowAdminAuditLogs(limit = 100): Promise<DevFlowAdminAuditLog[]> {
  return request<DevFlowAdminAuditLog[]>(`/admin/audit-logs?limit=${limit}`);
}

export function getDevFlowPlatformSettings(): Promise<DevFlowPlatformSetting[]> {
  return request<DevFlowPlatformSetting[]>("/admin/settings");
}

export function updateDevFlowPlatformSetting(key: string, value: Record<string, unknown>): Promise<DevFlowPlatformSetting> {
  return request<DevFlowPlatformSetting>(`/admin/settings/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

export function createDevFlowProject(input: CreateDevFlowProjectInput): Promise<DevFlowProjectSummary> {
  return request<DevFlowProjectSummary>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listDevFlowGroups(): Promise<DevFlowGroup[]> {
  return request<DevFlowGroup[]>("/groups");
}

export function createDevFlowGroup(input: {
  name: string;
  description?: string;
  businessUnit?: string;
}): Promise<DevFlowGroup> {
  return request<DevFlowGroup>("/groups", { method: "POST", body: JSON.stringify(input) });
}

export function updateDevFlowGroup(
  groupId: string,
  input: { name?: string; description?: string; businessUnit?: string },
): Promise<DevFlowGroup> {
  return request<DevFlowGroup>(`/groups/${groupId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function archiveDevFlowGroup(groupId: string): Promise<DevFlowGroup> {
  return request<DevFlowGroup>(`/groups/${groupId}/archive`, { method: "POST" });
}

export function reopenDevFlowGroup(groupId: string): Promise<DevFlowGroup> {
  return request<DevFlowGroup>(`/groups/${groupId}/reopen`, { method: "POST" });
}

export function listDevFlowGroupEligibleUsers(groupId: string): Promise<DevFlowGroupPerson[]> {
  return request<DevFlowGroupPerson[]>(`/groups/${groupId}/eligible-users`);
}

export function inviteDevFlowGroupMember(
  groupId: string,
  input: { userId: string; role: Exclude<DevFlowGroupRole, "LEAD"> },
): Promise<DevFlowGroupInvitation> {
  return request<DevFlowGroupInvitation>(`/groups/${groupId}/invitations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMyDevFlowGroupInvitations(): Promise<DevFlowGroupInvitation[]> {
  return request<DevFlowGroupInvitation[]>("/groups/invitations/mine");
}

export function respondToDevFlowGroupInvitation(
  invitationId: string,
  response: "accept" | "decline",
): Promise<{ accepted: boolean; groupId: string }> {
  return request(`/groups/invitations/${invitationId}/${response}`, { method: "POST" });
}

export function updateDevFlowGroupMemberRole(
  groupId: string,
  userId: string,
  role: Exclude<DevFlowGroupRole, "LEAD">,
): Promise<DevFlowGroupMember> {
  return request<DevFlowGroupMember>(`/groups/${groupId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeDevFlowGroupMember(groupId: string, userId: string): Promise<{ removed: true }> {
  return request<{ removed: true }>(`/groups/${groupId}/members/${userId}`, { method: "DELETE" });
}

export function listDevFlowRepositories(): Promise<DevFlowRepository[]> {
  return request<DevFlowRepository[]>("/repositories");
}

export function createDevFlowRepository(input: {
  groupId: string;
  projectId: string;
  name: string;
  description?: string;
}): Promise<DevFlowRepository> {
  return request<DevFlowRepository>("/repositories", { method: "POST", body: JSON.stringify(input) });
}

export function assignDevFlowRepository(repositoryId: string, userId: string): Promise<DevFlowRepositoryAssignment> {
  return request<DevFlowRepositoryAssignment>(`/repositories/${repositoryId}/assignments`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function revokeDevFlowRepositoryAssignment(repositoryId: string, userId: string): Promise<DevFlowRepositoryAssignment> {
  return request<DevFlowRepositoryAssignment>(`/repositories/${repositoryId}/assignments/${userId}`, { method: "DELETE" });
}

export function reconcileDevFlowRepositoryAssignment(repositoryId: string, userId: string): Promise<DevFlowRepositoryAssignment> {
  return request<DevFlowRepositoryAssignment>(`/repositories/${repositoryId}/assignments/${userId}/reconcile`, { method: "POST" });
}

export function getDevFlowGithubStatus(): Promise<{
  configured: boolean;
  available: boolean;
  owner: string | null;
  installUrl: string | null;
  provisioningMode: "plain-repository";
  ciCdConfigured: false;
  missingRequirements: string[];
  reason: string | null;
}> {
  return request("/github/status");
}

export type DevFlowAutoAnalyzeResult = {
  enhancedBrief: string;
  suggestedFeatures: string[];
  suggestedTechStack: {
    frontend: string;
    backend: string;
    database: string;
    styling: string;
  };
  complexity: "simple" | "medium" | "complex";
  estimatedFiles: number;
};

export function autoAnalyzeDevFlowBrief(input: {
  companyName: string;
  brief: string;
  stackKey: string;
  designGuidance?: DevFlowDesignGuidance;
  mode?: "fast" | "thorough";
}): Promise<DevFlowAutoAnalyzeResult> {
  return request<DevFlowAutoAnalyzeResult>("/projects/auto-analyze", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevFlowProject(
  projectId: string,
  input: UpdateDevFlowProjectInput,
): Promise<DevFlowProjectDetail> {
  return request<DevFlowProjectDetail>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function addDevFlowProjectMember(
  projectId: string,
  input: AddDevFlowProjectMemberInput,
): Promise<DevFlowProjectDetail> {
  return request<DevFlowProjectDetail>(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeDevFlowProjectMember(
  projectId: string,
  userId: string,
): Promise<DevFlowProjectDetail> {
  return request<DevFlowProjectDetail>(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function startDevFlowOrchestration(
  projectId: string,
  input: StartDevFlowOrchestrationInput = {},
): Promise<StartDevFlowOrchestrationResult> {
  return request<StartDevFlowOrchestrationResult>(`/projects/${projectId}/orchestration/start`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function rerunReadyDevFlowWorkOrders(projectId: string): Promise<StartDevFlowOrchestrationResult> {
  return request<StartDevFlowOrchestrationResult>(`/projects/${projectId}/orchestration/rerun-ready`, {
    method: "POST",
  });
}

export type DevFlowOrchestrationControlAction =
  | "pause"
  | "resume"
  | "cancel"
  | "retry_node"
  | "skip_node"
  | "modify_params";

export interface DevFlowOrchestrationControlResult {
  accepted: boolean;
  action: DevFlowOrchestrationControlAction;
  status: string;
}

/** Mid-run control (Phase 2): pause/resume/cancel/retry_node/skip_node/modify_params. */
export function controlDevFlowOrchestration(
  projectId: string,
  action: DevFlowOrchestrationControlAction,
  options?: { nodeId?: string; params?: Record<string, unknown> },
): Promise<DevFlowOrchestrationControlResult> {
  return request<DevFlowOrchestrationControlResult>(`/projects/${projectId}/orchestration/control`, {
    method: "POST",
    body: JSON.stringify({ action, ...options }),
  });
}

export function approveDevFlowGate1(projectId: string, approved: boolean, notes?: string): Promise<unknown> {
  return request(`/projects/${projectId}/gates/architecture`, {
    method: "POST",
    body: JSON.stringify({ approved, notes }),
  });
}

export function approveDevFlowGate2(projectId: string, approved: boolean, notes?: string): Promise<unknown> {
  return request(`/projects/${projectId}/gates/code`, {
    method: "POST",
    body: JSON.stringify({ approved, notes }),
  });
}

export function getDevFlowProjectIntake(projectId: string): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake`);
}

export function saveDevFlowProjectIntakeDraft(
  projectId: string,
  payload: DevFlowClientIntakePayload,
): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake/draft`, {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}

export function submitDevFlowProjectIntake(projectId: string): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake/submit`, { method: "POST" });
}

export function requestDevFlowProjectIntakeChanges(
  projectId: string,
  input: { section: string; message: string },
): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake/request-changes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markDevFlowProjectIntakeReady(
  projectId: string,
  pmNotes?: string,
): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake/ready`, {
    method: "POST",
    body: JSON.stringify({ note: pmNotes }),
  });
}

export function lockDevFlowProjectIntake(
  projectId: string,
  pmNotes?: string,
): Promise<DevFlowProjectIntakeResponse> {
  return request<DevFlowProjectIntakeResponse>(`/projects/${projectId}/intake/lock`, {
    method: "POST",
    body: JSON.stringify({ pmNotes }),
  });
}

export function uploadDevFlowProjectIntakeDocument(
  projectId: string,
  file: File,
  options: {
    title?: string;
    description?: string;
    kind?: DevFlowCollaborationDocumentKind;
    /**
     * Whether the client can see this document back in their own document list.
     * The API defaults it to false for staff uploads, so a PM uploading a file the
     * client sent must opt in explicitly or the client cannot confirm we received it.
     */
    clientVisible?: boolean;
  } = {},
): Promise<{ document: DevFlowIntakeDocument; duplicate?: boolean }> {
  const formData = new FormData();
  formData.set("file", file);
  if (options.title) formData.set("title", options.title);
  if (options.description) formData.set("description", options.description);
  if (options.kind) formData.set("kind", options.kind);
  // The API reads this as the string "true"; a boolean would serialise to "false" and read as opt-out.
  if (options.clientVisible) formData.set("clientVisible", "true");
  return requestFormData<{ document: DevFlowIntakeDocument; duplicate?: boolean }>(
    `/projects/${projectId}/documents/upload`,
    formData,
  );
}

export function retryDevFlowProjectIntakeDocumentExtraction(
  projectId: string,
  documentId: string,
): Promise<{ document: DevFlowIntakeDocument }> {
  return request<{ document: DevFlowIntakeDocument }>(`/projects/${projectId}/documents/${documentId}/retry-extraction`, { method: "POST" });
}

/**
 * Downloads the requirements worksheet. Both formats are rendered server-side from one
 * definition, so neither can drift from the intake form.
 *
 * "printable" is HTML rather than DOCX on purpose: Word and Google Docs open it directly and any
 * browser prints it to PDF, with no document-generation dependency to keep in step.
 */
export async function downloadDevFlowProjectIntakeTemplate(
  projectId = "template",
  format: "markdown" | "printable" = "markdown",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const query = format === "printable" ? "?format=html" : "";
  const response = await fetch(`${API_URL}/projects/${projectId}/intake/template${query}`, {
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (!response.ok) throw new Error("Unable to download the requirements worksheet.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `project-requirements-worksheet.${format === "printable" ? "html" : "md"}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Clients ──────────────────────────────────────────────────────────────────
// A client is an external company. Distinct from a Group, which is an internal delivery team.

export interface DevFlowClient {
  id: string;
  name: string;
  status: DevFlowClientStatus;
  /** The team workspace that delivers for this client. Always set — the column is NOT NULL. */
  groupId: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: DevFlowProfile | null;
  _count?: { projects: number; contacts: number };
}

export interface DevFlowClientListItem {
  id: string;
  name: string;
  status: DevFlowClientStatus;
  /** Owning team workspace. Always set: the column is NOT NULL, so a client always has one. */
  groupId: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  /** Delivery work only. A discovery space is deliberately not counted here. */
  projectCount: number;
  /**
   * Discovery spaces: approved leads waiting on documents and scope.
   *
   * Approval creates one so the client has somewhere to be invited and to upload into. It is not
   * a project until a human starts delivery, and the console must not present it as one.
   */
  discoveryCount: number;
  contactCount: number;
  lastProjectActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowClientListResponse {
  clients: DevFlowClientListItem[];
}

export interface DevFlowClientProject {
  id: string;
  companyName: string;
  status: DevFlowProjectStatus;
  stackKey: string;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevFlowClientDocumentGroup {
  projectId: string;
  projectName: string;
  documents: DevFlowCollaborationDocument[];
}

export interface DevFlowClientDocuments {
  groups: DevFlowClientDocumentGroup[];
  totals: { documents: number; readable: number; files: number };
}

export interface DevFlowClientContact {
  id: string;
  clientId: string;
  profileId: string;
  isPrimary: boolean;
  createdAt: string;
  profile: DevFlowProfile;
  /**
   * Projects this contact can actually open. Being listed as a contact is a directory fact and
   * grants nothing on its own — access still comes from project membership.
   */
  accessibleProjects: Array<{ id: string; name: string }>;
  hasProjectAccess: boolean;
}

export interface CreateDevFlowClientInput {
  name: string;
  /** Required. A client with no workspace is invisible to the switcher and cannot own projects. */
  groupId: string;
  status?: DevFlowClientStatus;
  primaryContactName?: string;
  primaryContactEmail?: string;
  notes?: string;
}

export interface UpdateDevFlowClientInput extends Partial<CreateDevFlowClientInput> {}

export function getDevFlowClients(search?: string, groupId?: string): Promise<DevFlowClientListResponse> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  // Omitted rather than sent empty: no workspace selected means "do not scope", which is what
  // the admin views want. An empty string would filter to clients belonging to no team.
  if (groupId) params.set("groupId", groupId);
  const query = params.toString();
  return request<DevFlowClientListResponse>(`/clients${query ? `?${query}` : ""}`);
}

export function getDevFlowClient(clientId: string): Promise<DevFlowClient> {
  return request<DevFlowClient>(`/clients/${clientId}`);
}

export function createDevFlowClient(input: CreateDevFlowClientInput): Promise<DevFlowClient> {
  return request<DevFlowClient>("/clients", { method: "POST", body: JSON.stringify(input) });
}

export function updateDevFlowClient(
  clientId: string,
  input: UpdateDevFlowClientInput,
): Promise<DevFlowClient> {
  return request<DevFlowClient>(`/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getDevFlowClientProjects(clientId: string): Promise<DevFlowClientProject[]> {
  return request<DevFlowClientProject[]>(`/clients/${clientId}/projects`);
}

export function getDevFlowClientDocuments(clientId: string): Promise<DevFlowClientDocuments> {
  return request<DevFlowClientDocuments>(`/clients/${clientId}/documents`);
}

export function getDevFlowClientContacts(clientId: string): Promise<DevFlowClientContact[]> {
  return request<DevFlowClientContact[]>(`/clients/${clientId}/contacts`);
}

export function addDevFlowClientContact(
  clientId: string,
  input: { profileId: string; isPrimary?: boolean },
): Promise<DevFlowClientContact> {
  return request<DevFlowClientContact>(`/clients/${clientId}/contacts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeDevFlowClientContact(
  clientId: string,
  contactId: string,
): Promise<{ removed: boolean }> {
  return request<{ removed: boolean }>(`/clients/${clientId}/contacts/${contactId}`, {
    method: "DELETE",
  });
}

/**
 * Promotes a discovery workspace into a delivery project.
 *
 * Accepting an inquiry opens discovery so the PM can talk to the client and gather documents;
 * this is the separate, deliberate act of committing to build.
 */
export function startDevFlowProjectDelivery(
  projectId: string,
): Promise<{ id: string; status: DevFlowProjectStatus; companyName: string }> {
  return request<{ id: string; status: DevFlowProjectStatus; companyName: string }>(
    `/projects/${projectId}/start-delivery`,
    { method: "POST" },
  );
}

// getDevFlowUnassignedProjects was here, alongside GET /clients/unassigned-projects. A project
// cannot exist without a client any more, so the endpoint and its screen are both gone.

export function getDevFlowClientContactCandidates(search?: string): Promise<DevFlowProfile[]> {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<DevFlowProfile[]>(`/clients/contact-candidates${query}`);
}

/** Links a project to a client, or clears the link when `clientId` is null. */
export function setDevFlowProjectClient(
  projectId: string,
  clientId: string | null,
): Promise<{ id: string; clientId: string | null; companyName: string }> {
  return request<{ id: string; clientId: string | null; companyName: string }>(
    `/clients/projects/${projectId}/client`,
    { method: "PATCH", body: JSON.stringify({ clientId }) },
  );
}

export interface DevFlowClientSuggestion {
  id: string;
  name: string;
  status: DevFlowClientStatus;
  reason: string;
}

export interface DevFlowInquiryClientSuggestions {
  suggestions: DevFlowClientSuggestion[];
  /**
   * Best client name available without asking a human, or null when one must be typed.
   *
   * The marketing call-to-action collects only an email and a brief, so it sends a placeholder
   * company. This is derived from the contact's email domain in that case.
   */
  suggestedName: string | null;
  /** True when the company on the inquiry is a stand-in like "TBD" rather than a real name. */
  companyNameIsPlaceholder: boolean;
}

export function getDevFlowInquiryClientSuggestions(
  inquiryId: string,
): Promise<DevFlowInquiryClientSuggestions> {
  return request<DevFlowInquiryClientSuggestions>(`/inquiries/${inquiryId}/client-suggestions`);
}

/* ---------------------------------------------------------------------------
   Workspace agents

   The roster used to be a hand-maintained constant in the console. These are the
   real records behind it: an agent's instructions override the compiled-in system
   prompt at dispatch, and every activity number is read from the invocations the
   runs themselves wrote.
   --------------------------------------------------------------------------- */

export type DevFlowAgentAccessScope = "WORKSPACE" | "PERSONAL";
export type DevFlowAgentStatus = "ACTIVE" | "ARCHIVED";
export type DevFlowAgentListScope = "mine" | "all" | "archived";

export interface DevFlowAgentOwner {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface DevFlowAgentListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  avatarEmoji: string | null;
  status: DevFlowAgentStatus;
  accessScope: DevFlowAgentAccessScope;
  isBuiltIn: boolean;
  /**
   * The deployed Eve subagent that executes this agent.
   *
   * Identity (`key`) and capability (`runtimeKey`) are separate: built-ins coincide, custom
   * agents borrow a role-neutral runtime because tools are code and cannot be authored here.
   */
  runtimeKey: string;
  model: string | null;
  concurrency: number;
  skillCount: number;
  owner: DevFlowAgentOwner | null;
  /** Total dispatches recorded for this agent in the workspace. */
  runs: number;
  /** Invocations started and not yet finished — the agent is working right now. */
  running: number;
  /**
   * True when this built-in has no subagent deployed on the Eve service.
   *
   * Dispatching it fails with an opaque empty-response error, so the console says so rather than
   * showing the agent as healthy. False also covers "Eve was unreachable and we do not know",
   * which is deliberately not rendered as a warning.
   */
  runtimeMissing?: boolean;
  lastActiveAt: string | null;
  updatedAt: string;
}

export interface DevFlowAgentListResponse {
  agents: DevFlowAgentListItem[];
  counts: { mine: number; all: number; archived: number };
}

export interface DevFlowAgentSkill {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Markdown, appended to the system prompt of every agent it is attached to. */
  body: string;
  agentCount?: number;
  updatedAt?: string;
}

export interface DevFlowAgentInvocation {
  id: string;
  nodeId: string | null;
  model: string | null;
  engine: string;
  status?: string;
  startedAt: string;
  completedAt?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  project: { id: string; companyName: string } | null;
}

export interface DevFlowAgentDetail extends DevFlowAgentListItem {
  groupId: string;
  instructions: string | null;
  /** The compiled-in prompt used when `instructions` is null. Read-only. */
  builtInPrompt: string | null;
  usesBuiltInPrompt: boolean;
  builtIn: {
    stage: "plan" | "build" | "review";
    node: string | null;
    dispatchedBy: string | null;
    plannedAs: string | null;
    tools: string[];
    condition: string | null;
  } | null;
  skills: DevFlowAgentSkill[];
  activity: {
    completedInWindow: number;
    windowDays: number;
    active: DevFlowAgentInvocation[];
    recent: DevFlowAgentInvocation[];
  };
  createdAt: string;
}

/** A capability profile a custom agent can borrow. `deployed` is null when Eve is unreachable. */
export interface DevFlowAgentRuntime {
  key: string;
  label: string;
  summary: string;
  tools: string[];
  deployed: boolean | null;
}

export interface CreateDevFlowAgentInput {
  name: string;
  groupId: string;
  runtimeKey?: string;
  description?: string;
  avatarEmoji?: string;
  instructions?: string;
  model?: string;
  concurrency?: number;
  accessScope?: DevFlowAgentAccessScope;
}

export interface UpdateDevFlowAgentInput {
  name?: string;
  /** Ignored for built-ins: the pipeline dispatches those by key. */
  runtimeKey?: string;
  description?: string;
  avatarEmoji?: string;
  /** Empty string clears the override and returns the agent to its built-in prompt. */
  instructions?: string;
  model?: string;
  concurrency?: number;
  accessScope?: DevFlowAgentAccessScope;
  status?: DevFlowAgentStatus;
}

export function listDevFlowAgents(
  groupId: string,
  scope: DevFlowAgentListScope = "all",
  search?: string,
): Promise<DevFlowAgentListResponse> {
  const params = new URLSearchParams({ groupId, scope });
  if (search?.trim()) params.set("search", search.trim());
  return request<DevFlowAgentListResponse>(`/agents?${params.toString()}`);
}

export function listDevFlowAgentRuntimes(): Promise<{ runtimes: DevFlowAgentRuntime[] }> {
  return request("/agents/runtimes");
}

export function getDevFlowAgent(agentId: string): Promise<DevFlowAgentDetail> {
  return request<DevFlowAgentDetail>(`/agents/${agentId}`);
}

export function createDevFlowAgent(input: CreateDevFlowAgentInput): Promise<DevFlowAgentDetail> {
  return request<DevFlowAgentDetail>("/agents", { method: "POST", body: JSON.stringify(input) });
}

export function updateDevFlowAgent(
  agentId: string,
  input: UpdateDevFlowAgentInput,
): Promise<DevFlowAgentDetail> {
  return request<DevFlowAgentDetail>(`/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Custom agents are deleted; built-ins archive instead, because runs dispatch them by key. */
export function deleteDevFlowAgent(
  agentId: string,
): Promise<{ id: string; archived: boolean; deleted: boolean }> {
  return request(`/agents/${agentId}`, { method: "DELETE" });
}

export function listDevFlowAgentSkills(
  groupId: string,
  search?: string,
): Promise<{ skills: DevFlowAgentSkill[] }> {
  const params = new URLSearchParams({ groupId });
  if (search?.trim()) params.set("search", search.trim());
  return request(`/agents/skills?${params.toString()}`);
}

export function createDevFlowAgentSkill(input: {
  groupId: string;
  name: string;
  description?: string;
  body: string;
}): Promise<DevFlowAgentSkill> {
  return request("/agents/skills", { method: "POST", body: JSON.stringify(input) });
}

export function updateDevFlowAgentSkill(
  skillId: string,
  input: { name?: string; description?: string; body?: string },
): Promise<DevFlowAgentSkill> {
  return request(`/agents/skills/${skillId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteDevFlowAgentSkill(skillId: string): Promise<{ id: string; deleted: boolean }> {
  return request(`/agents/skills/${skillId}`, { method: "DELETE" });
}

export function attachDevFlowAgentSkill(agentId: string, skillId: string): Promise<DevFlowAgentDetail> {
  return request(`/agents/${agentId}/skills/${skillId}`, { method: "POST" });
}

export function detachDevFlowAgentSkill(agentId: string, skillId: string): Promise<DevFlowAgentDetail> {
  return request(`/agents/${agentId}/skills/${skillId}`, { method: "DELETE" });
}
