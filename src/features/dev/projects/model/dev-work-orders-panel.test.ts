import {
  buildDevWorkOrderChips,
  buildDevWorkOrderExecutionLabel,
  buildDevWorkOrderRows,
  buildDevWorkOrdersPanelModel,
  devWorkOrderPriorityBadgeView,
  devWorkOrderStatusBadgeView,
} from "./dev-work-orders-panel";

describe("dev work orders panel model", () => {
  const workOrder = {
    id: "work-order-1",
    projectId: "project-1",
    taskId: "task-1",
    artifactId: "artifact-1",
    title: "Generate backend module",
    instructions: "Create the controller, service, and DTOs.",
    agentType: "BACKEND",
    status: "DISPATCHED",
    priority: "HIGH",
    createdById: "pm-1",
    executionRunId: "run-1",
    executionAttempt: 2,
    executionStartedAt: "2026-07-10T00:00:00.000Z",
    executionCompletedAt: null,
    executionError: null,
    lastEventAt: null,
    dispatchedAt: "2026-07-09T00:00:00.000Z",
    completedAt: null,
    failedAt: null,
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
    task: {
      id: "task-1",
      title: "Implement orders API",
      assignedToId: "dev-1",
      status: "IN_PROGRESS",
    },
    artifact: {
      id: "artifact-1",
      filePath: "src/modules/orders/orders.controller.ts",
      displayName: "Orders controller",
      reviewStatus: "PENDING",
      outputReviewStatus: "PENDING",
      validationStatus: "PENDING",
    },
    createdBy: null,
  };

  it("maps status and priority badges", () => {
    expect(devWorkOrderStatusBadgeView("DRAFT")).toEqual({ tone: "gray", label: "Draft" });
    expect(devWorkOrderStatusBadgeView("READY")).toEqual({ tone: "blue", label: "Ready" });
    expect(devWorkOrderStatusBadgeView("DISPATCHED")).toEqual({ tone: "purple", label: "Dispatched" });
    expect(devWorkOrderStatusBadgeView("COMPLETED")).toEqual({ tone: "green", label: "Completed" });
    expect(devWorkOrderStatusBadgeView("FAILED")).toEqual({ tone: "red", label: "Failed" });
    expect(devWorkOrderStatusBadgeView("CANCELLED")).toEqual({ tone: "gray", label: "Cancelled" });

    expect(devWorkOrderPriorityBadgeView("LOW")).toEqual({ tone: "gray", label: "Low" });
    expect(devWorkOrderPriorityBadgeView("NORMAL")).toEqual({ tone: "blue", label: "Normal" });
    expect(devWorkOrderPriorityBadgeView("HIGH")).toEqual({ tone: "amber", label: "High" });
    expect(devWorkOrderPriorityBadgeView("URGENT")).toEqual({ tone: "red", label: "Urgent" });
  });

  it("builds chips and execution labels by precedence", () => {
    expect(buildDevWorkOrderChips(workOrder as never)).toEqual([
      { tone: "blue", label: "Implement orders API" },
      { tone: "gray", label: "Orders controller" },
      { tone: "purple", label: "Run 2" },
    ]);

    expect(buildDevWorkOrderExecutionLabel({ ...workOrder, executionCompletedAt: "2026-07-12T00:00:00.000Z" } as never)).toEqual(
      expect.stringContaining("Completed "),
    );
    expect(buildDevWorkOrderExecutionLabel(workOrder as never)).toEqual(expect.stringContaining("Started "));
    expect(buildDevWorkOrderExecutionLabel({ ...workOrder, executionStartedAt: null } as never)).toEqual(expect.stringContaining("Dispatched "));
    expect(buildDevWorkOrderExecutionLabel({ ...workOrder, executionStartedAt: null, dispatchedAt: null } as never)).toEqual(expect.stringContaining("Updated "));
  });

  it("builds work-order rows", () => {
    const rows = buildDevWorkOrderRows([workOrder] as never);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "work-order-1",
      status: { tone: "purple", label: "Dispatched" },
      priority: { tone: "amber", label: "High" },
      agentType: "BACKEND",
      title: "Generate backend module",
      instructions: "Create the controller, service, and DTOs.",
      executionLabel: expect.stringContaining("Started "),
      executionError: null,
    });
  });

  it("builds aggregate loading, error, and empty state", () => {
    expect(buildDevWorkOrdersPanelModel({ workOrders: [], loading: true })).toMatchObject({
      loading: true,
      error: null,
      empty: false,
      rows: [],
    });

    expect(buildDevWorkOrdersPanelModel({ workOrders: [], error: "Network error" })).toMatchObject({
      loading: false,
      error: "Network error",
      empty: false,
    });

    expect(buildDevWorkOrdersPanelModel({ workOrders: [] })).toMatchObject({
      loading: false,
      error: null,
      empty: true,
      rows: [],
    });
  });
});
