import {
  buildDevTaskActivityModalModel,
  buildDevTaskActivityRows,
  buildDevTaskRows,
  buildDevTasksPanelModel,
  devTaskActivityLabel,
  devTaskStatusBadgeView,
} from "./dev-tasks-panel";

describe("dev tasks panel model", () => {
  const task = {
    id: "task-1",
    projectId: "project-1",
    artifactId: "artifact-1",
    title: "Fix backend DTOs",
    description: "Align the generated DTOs with the API contract.",
    status: "IN_PROGRESS",
    assignedToId: "dev-1",
    createdById: "pm-1",
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
    assignedTo: null,
    createdBy: null,
    artifact: {
      id: "artifact-1",
      filePath: "src/modules/orders/dto/create-order.dto.ts",
      displayName: null,
      reviewStatus: "REVISION_REQUESTED",
      reviewNote: "DTO name does not match the contract",
      reviewedAt: "2026-07-10T00:00:00.000Z",
      revisionHandledAt: null,
    },
  };

  const activity = {
    id: "activity-1",
    projectId: "project-1",
    taskId: "task-1",
    actorId: "dev-1",
    type: "COMMENT",
    message: "Working on this now.",
    metadata: {},
    createdAt: "2026-07-11T00:00:00.000Z",
    actor: {
      id: "dev-1",
      email: "dev@example.com",
      fullName: "Dev User",
      role: "DEV",
      status: "ACTIVE",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
  };

  it("maps task status and activity labels", () => {
    expect(devTaskStatusBadgeView("TODO")).toEqual({ tone: "gray", label: "To do" });
    expect(devTaskStatusBadgeView("IN_PROGRESS")).toEqual({ tone: "blue", label: "In progress" });
    expect(devTaskStatusBadgeView("IN_REVIEW")).toEqual({ tone: "amber", label: "In review" });
    expect(devTaskStatusBadgeView("DONE")).toEqual({ tone: "green", label: "Done" });

    expect(devTaskActivityLabel("TASK_CREATED")).toBe("created task");
    expect(devTaskActivityLabel("STATUS_CHANGED")).toBe("changed status");
    expect(devTaskActivityLabel("UNKNOWN_EVENT")).toBe("UNKNOWN_EVENT");
  });

  it("builds task rows with artifact and revision display state", () => {
    const rows = buildDevTaskRows([task] as never, "task-1");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "task-1",
      title: "Fix backend DTOs",
      description: "Align the generated DTOs with the API contract.",
      status: "IN_PROGRESS",
      artifactLabel: "src/modules/orders/dto/create-order.dto.ts",
      updating: true,
      statusBadge: { tone: "blue", label: "In progress" },
      revision: {
        requestedAtLabel: expect.stringContaining("Requested "),
        note: "DTO name does not match the contract",
      },
    });
  });

  it("builds activity rows and modal state", () => {
    const rows = buildDevTaskActivityRows([activity] as never);
    expect(rows[0]).toMatchObject({
      id: "activity-1",
      actorName: "Dev User",
      label: "commented",
      message: "Working on this now.",
      isComment: true,
    });

    const modal = buildDevTaskActivityModalModel({
      selectedTask: task as never,
      activity: [activity] as never,
      comment: "  ",
    });

    expect(modal).toMatchObject({
      taskTitle: "Fix backend DTOs",
      taskDescription: "Align the generated DTOs with the API contract.",
      empty: false,
      comment: "  ",
      postDisabled: true,
    });
  });

  it("builds aggregate loading, error, empty, and task-error state", () => {
    expect(buildDevTasksPanelModel({ projectId: "project-1", tasks: [], loading: true })).toMatchObject({
      loading: true,
      error: null,
      empty: false,
      rows: [],
      activityModal: null,
    });

    expect(buildDevTasksPanelModel({ projectId: "project-1", tasks: [], error: "Network error" })).toMatchObject({
      loading: false,
      error: "Network error",
      empty: false,
    });

    expect(buildDevTasksPanelModel({ projectId: "project-1", tasks: [], taskError: "Update failed" })).toMatchObject({
      loading: false,
      taskError: "Update failed",
      empty: true,
    });

    expect(buildDevTasksPanelModel({ projectId: "project-1", tasks: [task] as never, selectedTask: task as never }).activityModal).toEqual(
      expect.objectContaining({ taskTitle: task.title }),
    );
  });
});
