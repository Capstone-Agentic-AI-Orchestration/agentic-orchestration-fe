import type { DevFlowAgentProviderStatus, DevFlowProjectLifecycle, DevFlowProjectStatus } from "@/shared/api/devflow-api";
import { compactDevFlowError, devflowLifecycleView } from "@/shared/utils/devflow-projects";
import { JOURNEY_STAGE_COPY, ROLE_COPY, humanizeJourneyTerm } from "./copy";
import type { BlockingIssue, JourneyContext, JourneyHealth, JourneyRole, JourneyStage } from "./types";

type ProjectLike = {
  id?: string;
  companyName?: string | null;
  status?: DevFlowProjectStatus | string | null;
  lifecycle?: DevFlowProjectLifecycle | null;
  kickoff?: { status?: string | null } | null;
  kickoffStatus?: string | null;
  runId?: string | null;
  repoUrl?: string | null;
  deliveryReview?: { status?: string | null } | null;
};

export interface ProjectJourneyInput {
  role: JourneyRole;
  project?: ProjectLike | null;
  providerStatus?: DevFlowAgentProviderStatus | null;
  providerError?: string | null;
  loading?: boolean;
  totalProjects?: number;
  activeCount?: number;
  pendingActions?: number;
  blockers?: Array<string | BlockingIssue>;
  primaryAction?: JourneyContext["primaryAction"];
  secondaryAction?: JourneyContext["secondaryAction"];
}

export function journeyStageForProject(project?: ProjectLike | null): JourneyStage {
  if (!project) return "role-workspace";

  const lifecycleStage = project.lifecycle?.stage;
  const deliveryStatus = project.deliveryReview?.status;
  const kickoffStatus = project.kickoff?.status ?? project.kickoffStatus;

  if (deliveryStatus === "ACCEPTED" || lifecycleStage === "DELIVERED" || project.status === "DELIVERED") return "accepted";
  if (deliveryStatus === "REVISION_REQUESTED" || lifecycleStage === "CLIENT_REVIEW" || lifecycleStage === "REVISION") return "delivery-review";
  if (project.status === "AWAITING_GATE_2" || project.status === "COMMITTING") return "build-review";
  if (project.status === "AWAITING_GATE_1" || project.status === "NEGOTIATING_CONTRACT") return "plan-review";
  if (project.status === "GENERATING_CODE" || lifecycleStage === "IN_ORCHESTRATION" || project.runId) return "build-run";
  if (kickoffStatus === "READY" || kickoffStatus === "LOCKED" || lifecycleStage === "READY_FOR_ORCHESTRATION") return "readiness";
  if (lifecycleStage === "KICKOFF" || project.status === "PARSING_REQUIREMENTS") return "kickoff";
  return "project-setup";
}

export function healthForJourney(stage: JourneyStage, blockers: BlockingIssue[], status?: string | null): JourneyHealth {
  if (status === "FAILED" || blockers.some((issue) => issue.severity === "critical")) return "blocked";
  if (blockers.length) return "attention";
  if (stage === "accepted") return "complete";
  if (stage === "readiness" || stage === "kickoff" || stage === "build-run") return "ready";
  return "neutral";
}

export function makeProjectJourneyContext(input: ProjectJourneyInput): JourneyContext {
  const roleCopy = ROLE_COPY[input.role];
  const project = input.project;
  const blockers = normalizeBlockers(input.blockers);
  const providerIssue = providerBlockingIssue(input.providerStatus, input.providerError);
  if (providerIssue) blockers.push(providerIssue);

  if (!project) {
    const stage: JourneyStage = "role-workspace";
    return {
      role: input.role,
      stage,
      title: roleCopy.emptyTitle,
      description: roleCopy.emptyDescription,
      nextAction: input.loading ? "Wait for project data to load." : roleCopy.emptyTitle,
      waitingOn: input.role === "admin" ? "Platform configuration" : "A project assignment or new project",
      changed: input.totalProjects ? `${input.totalProjects} project${input.totalProjects === 1 ? "" : "s"} available.` : "No project is selected.",
      progress: 0,
      health: blockers.length ? "attention" : "neutral",
      blockers,
      primaryAction: input.primaryAction,
      secondaryAction: input.secondaryAction,
    };
  }

  const lifecycle = devflowLifecycleView(project);
  const stage = journeyStageForProject(project);
  const stageCopy = JOURNEY_STAGE_COPY[stage];
  const nextAction = humanizeJourneyTerm(lifecycle.nextAction || stageCopy.description);
  const waitingOn = waitingOnForRole(input.role, stage, input.pendingActions, blockers);

  return {
    role: input.role,
    stage,
    title: `${stageCopy.label}: ${project.companyName || "selected project"}`,
    description: stageCopy.description,
    projectName: project.companyName || undefined,
    projectId: project.id,
    statusLabel: humanizeJourneyTerm(lifecycle.label),
    nextAction,
    waitingOn,
    changed: changedForRole(input.role, input),
    progress: lifecycle.progress,
    health: healthForJourney(stage, blockers, project.status),
    blockers,
    primaryAction: input.primaryAction,
    secondaryAction: input.secondaryAction,
  };
}

function normalizeBlockers(blockers?: Array<string | BlockingIssue>) {
  return (blockers || []).filter(Boolean).map((issue) => {
    if (typeof issue !== "string") return issue;
    return { title: humanizeJourneyTerm(issue), severity: "warning" as const };
  });
}

function providerBlockingIssue(status?: DevFlowAgentProviderStatus | null, error?: string | null): BlockingIssue | null {
  if (error) {
    return {
      title: "Provider status could not be checked",
      description: compactDevFlowError(error),
      severity: "critical",
    };
  }
  if (!status) return null;

  const engine = status.llmEngine ?? {
    requestedEngine: status.requestedEngine,
    activeEngine: status.activeEngine,
    fallbackReason: status.fallbackReason,
    eveServiceConfigured: status.eveServiceConfigured,
    model: status.engineModel,
  };

  if (status.activeMode === "llm" && engine?.requestedEngine === "eve" && !engine.eveServiceConfigured) {
    return {
      title: "Eve service is not configured",
      description: "The app can show a fallback, but real Eve execution needs EVE_SERVICE_URL on the backend.",
      severity: "critical",
    };
  }
  if (engine?.fallbackReason) {
    return {
      title: "Eve fallback is active",
      description: humanizeJourneyTerm(engine.fallbackReason),
      severity: "warning",
    };
  }
  if (!status.available) {
    return {
      title: "Agent execution is blocked",
      description: status.reason || "Provider configuration is incomplete.",
      severity: "critical",
    };
  }
  return null;
}

function waitingOnForRole(role: JourneyRole, stage: JourneyStage, pendingActions = 0, blockers: BlockingIssue[]) {
  if (blockers.length) return "A setup or review blocker";
  if (pendingActions > 0) return `${pendingActions} pending action${pendingActions === 1 ? "" : "s"}`;
  if (role === "client") return stage === "delivery-review" ? "Client delivery decision" : "Project team updates";
  if (role === "dev") return "Assigned agent tasks";
  if (role === "admin") return "Platform health and setup checks";
  if (stage === "plan-review" || stage === "build-review") return "PM approval";
  if (stage === "delivery-review") return "Client acceptance";
  return "Project manager";
}

function changedForRole(role: JourneyRole, input: ProjectJourneyInput) {
  const total = input.totalProjects ?? 0;
  const active = input.activeCount ?? 0;
  if (role === "pm") return total ? `${active} active project${active === 1 ? "" : "s"} need PM attention.` : "No projects have been created yet.";
  if (role === "client") return input.pendingActions ? "There are deliverables waiting for review." : "Project status is current.";
  if (role === "dev") return input.pendingActions ? "Your assigned queue has open work." : "No urgent developer action is visible.";
  if (role === "admin") return input.pendingActions ? "Platform setup has open items." : "Platform control data is current.";
  return "Workspace loaded.";
}
