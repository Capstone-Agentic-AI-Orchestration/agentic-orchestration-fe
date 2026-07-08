import type { DevFlowProjectSummary } from "@/shared/api/devflow-api";

export type PMProjectFilter = "all" | "attention" | "active" | "delivered" | "archived";
export type PMProjectSort = "updated" | "started";
export type PMProjectLifecycleStageId = "draft" | "kickoff" | "build" | "review" | "delivered";
export type PMProjectAttentionIcon = "shield" | "code" | "alert";
export type PMProjectListItem = DevFlowProjectSummary & { kickoffStatus?: string | null };

export interface PMProjectAttentionModel {
  label: string;
  cta: string;
  tone: "amber" | "purple" | "red";
  icon: PMProjectAttentionIcon;
  color: string;
}

export interface PMProjectStatsModel {
  total: number;
  waiting: number;
  active: number;
  activeBuilds: number;
  delivered: number;
}

const ATTENTION_STATUSES = new Set(["AWAITING_GATE_1", "AWAITING_GATE_2", "FAILED"]);
const ACTIVE_BUILD_STATUSES = new Set([
  "PARSING_REQUIREMENTS",
  "NEGOTIATING_CONTRACT",
  "GENERATING_CODE",
  "COMMITTING",
]);

const STAGE_NEXT_ACTION: Record<PMProjectLifecycleStageId, string> = {
  draft: "Complete project setup",
  kickoff: "Complete kickoff checklist",
  build: "Start orchestration",
  review: "Review and approve",
  delivered: "Project complete",
};

export function pmProjectLifecycleStage(
  status?: string | null,
  kickoffStatus?: string | null,
): PMProjectLifecycleStageId {
  if (!status) return "draft";
  if (status === "DELIVERED") return "delivered";
  if (status === "COMMITTING") return "review";
  if (
    status === "AWAITING_GATE_1" ||
    status === "AWAITING_GATE_2" ||
    status === "GENERATING_CODE" ||
    status === "PARSING_REQUIREMENTS" ||
    status === "NEGOTIATING_CONTRACT"
  ) {
    return "build";
  }
  if (status === "PENDING" || status === "FAILED") {
    return kickoffStatus === "READY" || kickoffStatus === "LOCKED" ? "kickoff" : "draft";
  }
  return "draft";
}

export function pmProjectNeedsAttention(project: Pick<DevFlowProjectSummary, "status">): boolean {
  return ATTENTION_STATUSES.has(project.status);
}

export function pmProjectOrchestrateRoute(project: Pick<DevFlowProjectSummary, "id" | "status">): string {
  const id = project.id;
  switch (project.status) {
    case "AWAITING_GATE_1":
      return `/pm/orchestrate/${id}/gate-1`;
    case "AWAITING_GATE_2":
      return `/pm/orchestrate/${id}/gate-2`;
    case "FAILED":
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
    case "GENERATING_CODE":
    case "COMMITTING":
      return `/pm/orchestrate/${id}/run`;
    case "DELIVERED":
      return `/pm/orchestrate/${id}/delivery`;
    default:
      return `/pm/orchestrate/${id}`;
  }
}

export function pmProjectAttentionMeta(
  project: Pick<DevFlowProjectSummary, "status">,
): PMProjectAttentionModel {
  if (project.status === "AWAITING_GATE_1") {
    return {
      label: "Plan review - architecture",
      cta: "Review plan",
      tone: "amber",
      icon: "shield",
      color: "#FBBF24",
    };
  }
  if (project.status === "AWAITING_GATE_2") {
    return {
      label: "Build review - code",
      cta: "Review build",
      tone: "purple",
      icon: "code",
      color: "#A78BFA",
    };
  }
  return {
    label: "Run blocked",
    cta: "Resume run",
    tone: "red",
    icon: "alert",
    color: "#FCA5A5",
  };
}

export function pmProjectNextAction(
  stageId: PMProjectLifecycleStageId,
  project: Pick<DevFlowProjectSummary, "status">,
): string {
  if (project.status === "AWAITING_GATE_1") return "Review the plan";
  if (project.status === "AWAITING_GATE_2") return "Review the build";
  if (project.status === "FAILED") return "Resume run";
  if (project.status === "GENERATING_CODE") return "Monitor build";
  if (project.status === "PARSING_REQUIREMENTS" || project.status === "NEGOTIATING_CONTRACT") {
    return "Monitor run";
  }
  return STAGE_NEXT_ACTION[stageId] ?? "Continue";
}

export function pmProjectMatchesFilter(
  project: PMProjectListItem,
  filter: PMProjectFilter,
): boolean {
  const stage = pmProjectLifecycleStage(project.status, project.kickoffStatus);
  if (filter === "all") return true;
  if (filter === "attention") return pmProjectNeedsAttention(project);
  if (filter === "active") return stage !== "delivered" && project.status !== "FAILED";
  if (filter === "delivered") return stage === "delivered";
  if (filter === "archived") return project.status === "FAILED";
  return true;
}

export function pmProjectMatchesSearch(project: PMProjectListItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return project.companyName.toLowerCase().includes(query) || project.id.toLowerCase().includes(query);
}

export function sortPmProjects(
  projects: PMProjectListItem[],
  sort: PMProjectSort,
): PMProjectListItem[] {
  return [...projects].sort((a, b) => {
    if (sort === "started") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
  });
}

export function filterPmProjects(input: {
  projects: DevFlowProjectSummary[];
  filter: PMProjectFilter;
  search: string;
  sort: PMProjectSort;
}): PMProjectListItem[] {
  return sortPmProjects(
    input.projects.filter((project) =>
      pmProjectMatchesFilter(project, input.filter) && pmProjectMatchesSearch(project, input.search),
    ),
    input.sort,
  );
}

export function pmAttentionProjects(projects: PMProjectListItem[]): PMProjectListItem[] {
  return sortPmProjects(projects.filter(pmProjectNeedsAttention), "updated");
}

export function pmProjectFilterCount(
  projects: PMProjectListItem[],
  filter: PMProjectFilter,
): number {
  return projects.filter((project) => pmProjectMatchesFilter(project, filter)).length;
}

export function buildPmProjectStats(projects: PMProjectListItem[]): PMProjectStatsModel {
  return {
    total: projects.length,
    waiting: projects.filter(pmProjectNeedsAttention).length,
    active: projects.filter((project) => pmProjectMatchesFilter(project, "active")).length,
    activeBuilds: projects.filter((project) => ACTIVE_BUILD_STATUSES.has(project.status)).length,
    delivered: projects.filter((project) => pmProjectLifecycleStage(project.status, project.kickoffStatus) === "delivered").length,
  };
}
