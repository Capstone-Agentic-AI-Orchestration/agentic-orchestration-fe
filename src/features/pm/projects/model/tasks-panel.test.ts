import {
  backendTaskCreatePayload,
  buildBackendTaskActivityRows,
  buildBackendTaskArtifactOptions,
  buildBackendTaskAssigneeOptions,
  buildBackendTaskRows,
  buildBackendTasksPanelModel,
  EMPTY_BACKEND_TASK_FORM,
} from "./tasks-panel";

describe("backend tasks panel model", () => {
  it("normalizes create-task payloads from form state", () => {
    expect(backendTaskCreatePayload(EMPTY_BACKEND_TASK_FORM)).toBeNull();
    expect(backendTaskCreatePayload({
      title: "  Fix copy  ",
      description: "  Update dashboard wording  ",
      assignedToId: "user-1",
      artifactId: "",
    })).toEqual({
      title: "Fix copy",
      description: "Update dashboard wording",
      assignedToId: "user-1",
      artifactId: undefined,
    });
  });

  it("builds assignee and artifact select options", () => {
    expect(buildBackendTaskAssigneeOptions([
      {
        userId: "dev-1",
        role: "DEV",
        user: { id: "dev-1", fullName: "Dev User", email: "dev@example.com" },
      },
      {
        userId: "pm-1",
        role: "PM",
        user: { id: "pm-1", fullName: "PM User", email: "pm@example.com" },
      },
    ] as never)).toEqual([{ userId: "dev-1", label: "Dev User" }]);

    expect(buildBackendTaskArtifactOptions([
      { id: "artifact-1", displayName: null, filePath: "src/app/page.tsx" },
      { id: "artifact-2", displayName: "Dashboard", filePath: "src/dashboard.tsx" },
    ] as never)).toEqual([
      { id: "artifact-1", label: "src/app/page.tsx" },
      { id: "artifact-2", label: "Dashboard" },
    ]);
  });

  it("builds task rows with display labels", () => {
    expect(buildBackendTaskRows([
      {
        id: "task-1",
        title: "Fix copy",
        description: "Update wording",
        status: "IN_PROGRESS",
        assignedTo: { fullName: null, email: "dev@example.com" },
        artifact: { displayName: null, filePath: "src/app/page.tsx" },
      },
      {
        id: "task-2",
        title: "Unassigned",
        description: null,
        status: "TODO",
        assignedTo: null,
        artifact: null,
      },
    ] as never)).toMatchObject([
      {
        id: "task-1",
        assigneeLabel: "dev@example.com",
        artifactLabel: "src/app/page.tsx",
      },
      {
        id: "task-2",
        assigneeLabel: "Unassigned",
        artifactLabel: null,
      },
    ]);
  });

  it("builds activity rows and aggregate panel state", () => {
    const activityRows = buildBackendTaskActivityRows([
      {
        id: "activity-1",
        actor: { fullName: "PM User", email: "pm@example.com" },
        createdAt: "2026-07-08T00:00:00.000Z",
        message: null,
        type: "STATUS_CHANGED",
      },
    ] as never);

    expect(activityRows[0]).toMatchObject({
      id: "activity-1",
      actorLabel: "PM User",
      message: "STATUS_CHANGED",
    });

    const model = buildBackendTasksPanelModel({
      tasks: [{ id: "task-1", title: "Fix", status: "TODO", assignedTo: null, artifact: null }] as never,
      artifacts: [],
      members: [],
      form: { ...EMPTY_BACKEND_TASK_FORM, title: "Fix copy" },
      activity: [{ id: "activity-1", actor: null, createdAt: "2026-07-08T00:00:00.000Z", message: "Created", type: "COMMENT" }] as never,
    });

    expect(model).toMatchObject({
      taskSubtitle: "1 backend task",
      hasTasks: true,
      canCreateTask: true,
      hasActivity: true,
    });
  });
});
