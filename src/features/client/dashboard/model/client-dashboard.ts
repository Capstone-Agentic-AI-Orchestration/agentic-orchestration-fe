import type {
  DevFlowArtifact,
  DevFlowProjectDetail,
  DevFlowProjectSummary,
  DevFlowProjectTimelineEvent,
} from "@/shared/api/devflow-api";
import {
  compactDevFlowError,
  devflowLifecycleView,
  formatDevFlowDate,
  projectInitials,
} from "@/shared/utils/devflow-projects";

export type ClientDashboardRoute = "chat" | "documents" | "product";

export interface ClientDashboardMetric {
  key: "stage" | "days" | "artifacts" | "pending";
  label: string;
  value: string;
  tint: string;
  sub: string;
  footer: string;
  actionLabel?: string;
  actionRoute?: ClientDashboardRoute;
}

export interface ClientDashboardBlocker {
  title: string;
  description: string;
  severity: "warning";
}

export interface ClientBackendEngagementModel {
  loading: boolean;
  error: string;
  hasProject: boolean;
  emptyTitle: string;
  emptyDescription: string;
  initials: string;
  companyName: string;
  meta: string;
  lifecycleTone: string;
  lifecycleLabel: string;
  projectCountLabel: string;
}

export interface ClientTeamMemberModel {
  id: string;
  initials: string;
  color: string;
  name: string;
  role: string;
}

export interface ClientDashboardModel {
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
  projectCount: number;
  engagementName: string;
  engagementStatus: string;
  engagementStage: string;
  engagementProgress: number;
  pendingReviews: number;
  showEmptyState: boolean;
  journeyBlockers: ClientDashboardBlocker[];
  primaryActionLabel: string | null;
  metrics: ClientDashboardMetric[];
  timelineBadge: string;
  timelineBrief: string;
  timelineEvents: DevFlowProjectTimelineEvent[];
  timelineLoading: boolean;
  timelineError: string;
  timelineEmptyText: string;
  quickActionsSubtitle: string;
  nextMilestoneText: string;
  backendEngagement: ClientBackendEngagementModel;
  teamMembers: ClientTeamMemberModel[];
  teamEmptyText: string;
}

export function daysSince(value?: string | null, now = Date.now()): string {
  if (!value) return "0";
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return "0";
  return String(Math.max(0, Math.ceil((now - started) / 86400000)));
}

export function countPendingReviews(artifacts: DevFlowArtifact[]): number {
  return artifacts.filter((artifact) => artifact.reviewStatus === "PENDING").length;
}

export function buildClientTeamMembers(project: DevFlowProjectDetail | null): ClientTeamMemberModel[] {
  if (!project) return [];
  return project.members.slice(0, 4).map((member) => ({
    id: member.id,
    initials: projectInitials(member.user.fullName || member.user.email),
    color: member.role === "PM"
      ? "linear-gradient(135deg,#10B981,#14B8A6)"
      : "linear-gradient(135deg,#4F8BFF,#8B5CF6)",
    name: member.user.fullName || member.user.email || member.user.id,
    role: member.role,
  }));
}

export function buildClientBackendEngagementModel(input: {
  loading: boolean;
  error: string;
  project: DevFlowProjectDetail | null;
  projectCount: number;
}): ClientBackendEngagementModel {
  if (input.loading) {
    return {
      loading: true,
      error: "",
      hasProject: false,
      emptyTitle: "",
      emptyDescription: "",
      initials: "",
      companyName: "",
      meta: "",
      lifecycleTone: "gray",
      lifecycleLabel: "",
      projectCountLabel: "",
    };
  }

  if (input.error) {
    return {
      loading: false,
      error: compactDevFlowError(input.error),
      hasProject: false,
      emptyTitle: "",
      emptyDescription: "",
      initials: "",
      companyName: "",
      meta: "",
      lifecycleTone: "gray",
      lifecycleLabel: "",
      projectCountLabel: "",
    };
  }

  if (!input.project) {
    return {
      loading: false,
      error: "",
      hasProject: false,
      emptyTitle: "No backend engagement assigned",
      emptyDescription: "Ask a PM to add this client profile to a project member list.",
      initials: "",
      companyName: "",
      meta: "",
      lifecycleTone: "gray",
      lifecycleLabel: "",
      projectCountLabel: "",
    };
  }

  const lifecycle = devflowLifecycleView(input.project);
  return {
    loading: false,
    error: "",
    hasProject: true,
    emptyTitle: "",
    emptyDescription: "",
    initials: projectInitials(input.project.companyName),
    companyName: input.project.companyName,
    meta: `${input.project.stackKey} - created ${formatDevFlowDate(input.project.createdAt)}`,
    lifecycleTone: lifecycle.tone,
    lifecycleLabel: lifecycle.label,
    projectCountLabel: `${input.projectCount} assigned`,
  };
}

export function buildClientDashboardModel(input: {
  projects: DevFlowProjectSummary[];
  selectedProject: DevFlowProjectDetail | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string;
  artifacts: DevFlowArtifact[];
  timeline: DevFlowProjectTimelineEvent[];
  outputsLoading: boolean;
  outputsError: string;
  now?: number;
}): ClientDashboardModel {
  const project = input.selectedProject;
  const lifecycle = devflowLifecycleView(project);
  const pendingReviews = countPendingReviews(input.artifacts);
  const engagementName = project?.companyName || "No selected project";
  const engagementStatus = project ? lifecycle.label : "Unassigned";
  const engagementStage = project ? lifecycle.stage : "No active stage";
  const engagementProgress = project ? lifecycle.progress : 0;
  const projectCount = input.projects.length;

  return {
    selectedProject: project,
    selectedProjectLoading: input.selectedProjectLoading,
    selectedProjectError: input.selectedProjectError,
    projectCount,
    engagementName,
    engagementStatus,
    engagementStage,
    engagementProgress,
    pendingReviews,
    showEmptyState: !project && !input.selectedProjectLoading,
    journeyBlockers: input.selectedProjectError
      ? [{ title: "Project could not load", description: compactDevFlowError(input.selectedProjectError), severity: "warning" }]
      : [],
    primaryActionLabel: project ? (pendingReviews ? "Review deliverables" : "View deliverables") : null,
    metrics: [
      {
        key: "stage",
        label: "Current Stage",
        value: engagementStage,
        tint: "#8B5CF6",
        sub: project ? "Backend status" : "Awaiting project selection",
        footer: project ? `${engagementProgress}% complete` : "No backend project yet",
      },
      {
        key: "days",
        label: "Days in Engagement",
        value: project ? daysSince(project.createdAt, input.now) : "0",
        tint: "#4F8BFF",
        sub: project ? "since project creation" : "not started",
        footer: project ? "Tracked from backend" : "Waiting for project selection",
      },
      {
        key: "artifacts",
        label: "Visible Artifacts",
        value: String(input.artifacts.length),
        tint: "#10B981",
        sub: "from backend",
        footer: "Client-visible deliverables",
      },
      {
        key: "pending",
        label: "Pending Actions",
        value: String(pendingReviews),
        tint: "#F59E0B",
        sub: "deliverable reviews",
        footer: "",
        actionLabel: "Review product",
        actionRoute: "product",
      },
    ],
    timelineBadge: project ? "Backend timeline" : "No project",
    timelineBrief: project ? project.brief : "No project is selected yet.",
    timelineEvents: project ? input.timeline : [],
    timelineLoading: project ? input.outputsLoading : false,
    timelineError: project ? input.outputsError : "",
    timelineEmptyText: project ? "No project timeline events yet." : "No backend project is selected yet.",
    quickActionsSubtitle: project ? lifecycle.nextAction : "Common tasks at your fingertips",
    nextMilestoneText: project
      ? `${lifecycle.nextAction} - ${engagementProgress}% complete.`
      : "No milestone is available until a backend project is selected.",
    backendEngagement: buildClientBackendEngagementModel({
      loading: input.selectedProjectLoading,
      error: input.selectedProjectError,
      project,
      projectCount,
    }),
    teamMembers: buildClientTeamMembers(project),
    teamEmptyText: project
      ? "Team assignments will appear here once the PM adds members."
      : "Team assignments will appear after a PM adds this client to a backend project.",
  };
}
