import {
  agentsWorkingCount,
  buildBoardIssues,
  groupByColumn,
  ISSUE_COLUMNS,
  taskToIssue,
  workOrderToIssue,
} from "./issue-board.model";
import type { DevFlowProjectTask, DevFlowWorkOrder } from "@/shared/api/devflow-api";

function task(overrides: Partial<DevFlowProjectTask> = {}): DevFlowProjectTask {
  return {
    id: "ckabc123def456",
    projectId: "p1",
    artifactId: null,
    title: "Wire the signup form",
    description: null,
    status: "TODO",
    assignedToId: null,
    createdById: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    assignedTo: null,
    createdBy: null,
    artifact: null,
    ...overrides,
  } as DevFlowProjectTask;
}

function workOrder(overrides: Partial<DevFlowWorkOrder> = {}): DevFlowWorkOrder {
  return {
    id: "wo987xyz654",
    projectId: "p1",
    taskId: null,
    artifactId: null,
    title: "Generate the API layer",
    instructions: null,
    agentType: "BACKEND",
    status: "DRAFT",
    priority: "NORMAL",
    createdById: null,
    executionRunId: null,
    executionAttempt: 0,
    executionStartedAt: null,
    executionCompletedAt: null,
    executionError: null,
    lastEventAt: null,
    dispatchedAt: null,
    completedAt: null,
    failedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    task: null,
    ...overrides,
  } as DevFlowWorkOrder;
}

describe("issue board model", () => {
  it("keys the two lanes apart so colliding ids cannot collapse a card", () => {
    const shared = "sameid";
    const a = taskToIssue(task({ id: shared }));
    const b = workOrderToIssue(workOrder({ id: shared }));
    expect(a.key).not.toEqual(b.key);
  });

  it("maps every work order status onto a real column", () => {
    const statuses = ["DRAFT", "READY", "DISPATCHED", "COMPLETED", "FAILED", "CANCELLED"] as const;
    const columnIds = ISSUE_COLUMNS.map((column) => column.id);
    for (const status of statuses) {
      expect(columnIds).toContain(workOrderToIssue(workOrder({ status })).column);
    }
  });

  it("puts a failed run in Blocked, not Cancelled — it stopped, it was not abandoned", () => {
    expect(workOrderToIssue(workOrder({ status: "FAILED" })).column).toBe("BLOCKED");
    expect(workOrderToIssue(workOrder({ status: "CANCELLED" })).column).toBe("CANCELLED");
  });

  it("never lets an agent issue be dragged", () => {
    expect(workOrderToIssue(workOrder()).movable).toBe(false);
    expect(taskToIssue(task()).movable).toBe(true);
  });

  it("falls back to Todo for a task status the board does not know", () => {
    const legacy = taskToIssue(task({ status: "SOMETHING_OLD" as never }));
    expect(legacy.column).toBe("TODO");
  });

  it("filters lanes", () => {
    const tasks = [task()];
    const orders = [workOrder()];
    expect(buildBoardIssues(tasks, orders, "all")).toHaveLength(2);
    expect(buildBoardIssues(tasks, orders, "member").every((i) => i.lane === "member")).toBe(true);
    expect(buildBoardIssues(tasks, orders, "agent").every((i) => i.lane === "agent")).toBe(true);
  });

  it("sorts most recently updated first", () => {
    const older = task({ id: "old", updatedAt: "2026-08-01T00:00:00.000Z" });
    const newer = task({ id: "new", updatedAt: "2026-08-05T00:00:00.000Z" });
    expect(buildBoardIssues([older, newer], [], "all")[0].id).toBe("new");
  });

  it("groups into every column, including the empty ones", () => {
    const grouped = groupByColumn(buildBoardIssues([task()], [], "all"));
    expect(Object.keys(grouped)).toHaveLength(ISSUE_COLUMNS.length);
    expect(grouped.TODO).toHaveLength(1);
    expect(grouped.DONE).toEqual([]);
  });

  it("counts only dispatched work orders as agents working", () => {
    const orders = [
      workOrder({ id: "a", status: "DISPATCHED" }),
      workOrder({ id: "b", status: "READY" }),
      workOrder({ id: "c", status: "DISPATCHED" }),
      workOrder({ id: "d", status: "COMPLETED" }),
    ];
    expect(agentsWorkingCount(orders)).toBe(2);
  });
});
