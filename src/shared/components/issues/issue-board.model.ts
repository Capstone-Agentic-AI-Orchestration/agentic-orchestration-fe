import type {
  DevFlowProjectTask,
  DevFlowProjectTaskStatus,
  DevFlowWorkOrder,
  DevFlowWorkOrderStatus,
} from "@/shared/api/devflow-api";

/**
 * One board over two tables.
 *
 * A project's work was split across ProjectTask and WorkOrder — the same question ("what is
 * being worked on and where is it stuck") answered in two places depending on whether a person
 * or an agent does the work. They are two lanes of one board here, and the split survives as a
 * filter rather than as two destinations.
 */

export type IssueLane = "member" | "agent";

export const ISSUE_COLUMNS = [
  { id: "BACKLOG", label: "Backlog", tone: "gray" },
  { id: "TODO", label: "Todo", tone: "gray" },
  { id: "IN_PROGRESS", label: "In Progress", tone: "amber" },
  { id: "IN_REVIEW", label: "In Review", tone: "green" },
  { id: "DONE", label: "Done", tone: "blue" },
  { id: "BLOCKED", label: "Blocked", tone: "red" },
  { id: "CANCELLED", label: "Cancelled", tone: "gray" },
] as const;

export type IssueColumnId = (typeof ISSUE_COLUMNS)[number]["id"];

export interface BoardIssue {
  /** Unique across both lanes — ids are only unique within their own table. */
  key: string;
  id: string;
  lane: IssueLane;
  /** Short human reference shown on the card, e.g. `TSK-4f2a91`. */
  ref: string;
  title: string;
  description: string | null;
  column: IssueColumnId;
  /** Person for a member issue, agent type for an agent issue. */
  owner: string | null;
  updatedAt: string;
  /** Raw backend status, kept so actions can be dispatched against the real value. */
  status: DevFlowProjectTaskStatus | DevFlowWorkOrderStatus;
  /** Agent issues are produced by execution, so their column is never a user's to choose. */
  movable: boolean;
}

/**
 * A work order has no equivalent of IN_REVIEW: nobody reviews an agent mid-run, the validator
 * either passes its output or sends it back as a retry. FAILED lands in Blocked rather than
 * Cancelled because a failed run is work that stopped and can be retried, not work abandoned.
 */
const WORK_ORDER_COLUMN: Record<DevFlowWorkOrderStatus, IssueColumnId> = {
  DRAFT: "BACKLOG",
  READY: "TODO",
  DISPATCHED: "IN_PROGRESS",
  COMPLETED: "DONE",
  FAILED: "BLOCKED",
  CANCELLED: "CANCELLED",
};

/** Rows written before the board columns existed carry statuses the enum no longer implies. */
function taskColumn(status: DevFlowProjectTaskStatus): IssueColumnId {
  const known = ISSUE_COLUMNS.some((column) => column.id === status);
  return known ? (status as IssueColumnId) : "TODO";
}

function shortRef(prefix: string, id: string): string {
  return `${prefix}-${id.slice(-6).toUpperCase()}`;
}

export function taskToIssue(task: DevFlowProjectTask): BoardIssue {
  return {
    key: `task:${task.id}`,
    id: task.id,
    lane: "member",
    ref: shortRef("TSK", task.id),
    title: task.title,
    description: task.description,
    column: taskColumn(task.status),
    owner: task.assignedTo?.fullName || task.assignedTo?.email || null,
    updatedAt: task.updatedAt,
    status: task.status,
    movable: true,
  };
}

export function workOrderToIssue(workOrder: DevFlowWorkOrder): BoardIssue {
  return {
    key: `work-order:${workOrder.id}`,
    id: workOrder.id,
    lane: "agent",
    ref: shortRef("AGT", workOrder.id),
    title: workOrder.title,
    description: workOrder.instructions,
    column: WORK_ORDER_COLUMN[workOrder.status] ?? "BACKLOG",
    owner: workOrder.agentType,
    updatedAt: workOrder.updatedAt,
    status: workOrder.status,
    movable: false,
  };
}

export type IssueFilter = "all" | "member" | "agent";

export function buildBoardIssues(
  tasks: DevFlowProjectTask[],
  workOrders: DevFlowWorkOrder[],
  filter: IssueFilter,
): BoardIssue[] {
  const issues: BoardIssue[] = [];
  if (filter !== "agent") issues.push(...tasks.map(taskToIssue));
  if (filter !== "member") issues.push(...workOrders.map(workOrderToIssue));
  // Most recently touched first, so a column's top card is the one that just moved.
  return issues.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function groupByColumn(issues: BoardIssue[]): Record<IssueColumnId, BoardIssue[]> {
  const grouped = {} as Record<IssueColumnId, BoardIssue[]>;
  for (const column of ISSUE_COLUMNS) grouped[column.id] = [];
  for (const issue of issues) grouped[issue.column].push(issue);
  return grouped;
}

/**
 * The count the board header reports as "N agents working".
 *
 * DISPATCHED only — a READY work order is queued, not running, and counting it would claim
 * token spend that is not happening.
 */
export function agentsWorkingCount(workOrders: DevFlowWorkOrder[]): number {
  return workOrders.filter((workOrder) => workOrder.status === "DISPATCHED").length;
}
