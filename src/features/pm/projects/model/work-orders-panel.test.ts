import {
  applyTaskToWorkOrderForm,
  buildBackendWorkOrderRows,
  buildBackendWorkOrdersPanelModel,
  EMPTY_BACKEND_WORK_ORDER_FORM,
  workOrderCreatePayload,
  workOrderDispatchBlocker,
  workOrderFormIssue,
  workOrderStatusOptions,
} from "./work-orders-panel";

describe("backend work orders panel model", () => {
  it("validates and normalizes work order create payloads", () => {
    expect(workOrderFormIssue(EMPTY_BACKEND_WORK_ORDER_FORM)).toBe("Title is required.");
    expect(workOrderFormIssue({ ...EMPTY_BACKEND_WORK_ORDER_FORM, title: "Handoff" }))
      .toBe("Instructions are required before a work order can be actioned.");
    expect(workOrderCreatePayload({
      title: "  Handoff  ",
      instructions: "  Build it  ",
      agentType: "FRONTEND",
      priority: "HIGH",
      taskId: "task-1",
      artifactId: "",
    })).toEqual({
      title: "Handoff",
      instructions: "Build it",
      agentType: "FRONTEND",
      priority: "HIGH",
      taskId: "task-1",
      artifactId: undefined,
    });
  });

  it("applies task details to the work order form without overwriting existing title or instructions", () => {
    expect(applyTaskToWorkOrderForm(EMPTY_BACKEND_WORK_ORDER_FORM, {
      id: "task-1",
      title: "Fix dashboard",
      description: "Copy changes",
      artifactId: "artifact-1",
    } as never)).toMatchObject({
      title: "Handoff: Fix dashboard",
      instructions: "Copy changes",
      taskId: "task-1",
      artifactId: "artifact-1",
    });

    expect(applyTaskToWorkOrderForm({
      ...EMPTY_BACKEND_WORK_ORDER_FORM,
      title: "Existing",
      instructions: "Existing instructions",
    }, {
      id: "task-2",
      title: "Other task",
      description: "New instructions",
      artifactId: null,
    } as never)).toMatchObject({
      title: "Existing",
      instructions: "Existing instructions",
      taskId: "task-2",
    });
  });

  it("derives dispatch blockers and status options", () => {
    expect(workOrderDispatchBlocker({ status: "DRAFT", instructions: "Ready" } as never))
      .toBe("Only READY work orders can dispatch.");
    expect(workOrderDispatchBlocker({ status: "READY", instructions: "" } as never))
      .toBe("Instructions are required before dispatch.");
    expect(workOrderDispatchBlocker({ status: "READY", instructions: "Do it" } as never)).toBe("");
    expect(workOrderStatusOptions("DISPATCHED").map((option) => option.value)).toContain("DISPATCHED");
    expect(workOrderStatusOptions("COMPLETED").map((option) => option.value)).toContain("COMPLETED");
  });

  it("builds work order rows with labels and execution state", () => {
    const rows = buildBackendWorkOrderRows([
      {
        id: "wo-1",
        title: "Frontend handoff",
        instructions: "Build shell",
        agentType: "FRONTEND",
        priority: "NORMAL",
        status: "READY",
        task: { title: "Fix dashboard" },
        artifact: { displayName: null, filePath: "src/app/page.tsx" },
        executionRunId: "run-1",
        executionAttempt: 2,
        executionError: "Failed call",
        updatedAt: "2026-07-08T00:00:00.000Z",
      },
    ] as never);

    expect(rows[0]).toMatchObject({
      id: "wo-1",
      hasInstructions: true,
      taskLabel: "Fix dashboard",
      artifactLabel: "src/app/page.tsx",
      runLabel: "Run 2",
      executionLabel: "Execution failed: Failed call",
      dispatchBlocker: "",
    });
  });

  it("builds aggregate panel state", () => {
    const model = buildBackendWorkOrdersPanelModel({
      workOrders: [{ id: "wo-1", status: "DRAFT", title: "Draft", instructions: null, agentType: "BACKEND", priority: "LOW", updatedAt: null }] as never,
      tasks: [
        {
          id: "task-1",
          title: "Fix dashboard",
          status: "TODO",
          description: "Copy",
          artifactId: "artifact-1",
          assignedTo: { fullName: "Dev User", email: "dev@example.com" },
        },
      ] as never,
      artifacts: [{ id: "artifact-1", displayName: "Dashboard", filePath: "src/app/page.tsx" }] as never,
      form: { ...EMPTY_BACKEND_WORK_ORDER_FORM, title: "Handoff", instructions: "Do it", taskId: "task-1", artifactId: "artifact-1" },
    });

    expect(model).toMatchObject({
      workOrderSubtitle: "1 work order ready for persona handoff",
      hasWorkOrders: true,
      selectedTaskLabel: "Task: Fix dashboard",
      selectedArtifactLabel: "Artifact: Dashboard",
      formIssue: "",
      canCreateWorkOrder: true,
    });
    expect(model.taskShortcuts[0]).toMatchObject({
      title: "Fix dashboard",
      meta: "Dev User - TODO",
      selected: true,
    });
  });
});
