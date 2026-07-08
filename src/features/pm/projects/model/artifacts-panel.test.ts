import {
  artifactValidationBadgeView,
  backendReviewBadgeView,
  buildArtifactPreviewModel,
  buildBackendArtifactsPanelModel,
  buildRevisionNotes,
  buildRevisionRequestRows,
  buildValidationPanelModel,
  outputReviewBadgeView,
  workOrderAgentTypeFromArtifact,
} from "./artifacts-panel";

describe("backend artifacts panel model", () => {
  it("maps review, output, validation, and agent badges", () => {
    expect(backendReviewBadgeView("REVISION_REQUESTED")).toEqual({ tone: "amber", label: "Revision requested" });
    expect(outputReviewBadgeView("PUBLISHED")).toEqual({ tone: "blue", label: "Published" });
    expect(artifactValidationBadgeView("FAILED")).toEqual({ tone: "red", label: "Invalid" });
    expect(workOrderAgentTypeFromArtifact("backend")).toBe("BACKEND");
    expect(workOrderAgentTypeFromArtifact("unknown")).toBe("FRONTEND");
  });

  it("derives open revision rows and linked task state", () => {
    const rows = buildRevisionRequestRows({
      artifacts: [
        {
          id: "artifact-1",
          filePath: "src/app/page.tsx",
          displayName: "Client page",
          reviewStatus: "REVISION_REQUESTED",
          reviewedAt: "2026-07-08T00:00:00.000Z",
        },
        {
          id: "artifact-2",
          filePath: "src/app/handled.tsx",
          reviewStatus: "REVISION_REQUESTED",
          revisionHandledAt: "2026-07-08T01:00:00.000Z",
        },
      ] as never,
      tasks: [{ id: "task-1", artifactId: "artifact-1" }] as never,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "artifact-1",
      title: "Client page",
      hasLinkedTask: true,
    });
  });

  it("builds validation panel state from summary and errors", () => {
    expect(buildValidationPanelModel({
      validationStatus: "FAILED",
      validationSummary: "Contract drift",
      validationErrors: ["Missing route", { field: "dto" }],
    } as never)).toMatchObject({
      visible: true,
      failed: true,
      badge: { tone: "red", label: "Invalid" },
      summary: "Contract drift",
      errors: ["Missing route", "[object Object]"],
    });
  });

  it("combines client revision and PM resolution notes", () => {
    expect(buildRevisionNotes({
      artifact: {
        reviewNote: "Needs copy updates",
      } as never,
      revisionResolutionNote: "Assign to frontend dev",
    })).toBe("Client revision request:\nNeeds copy updates\n\nPM resolution note:\nAssign to frontend dev");
  });

  it("builds preview state for visibility, linked tasks, content size, and revision handling", () => {
    const model = buildArtifactPreviewModel({
      artifact: {
        id: "artifact-1",
        filePath: "src/features/dashboard/view/DashboardView.tsx",
        agentType: "FRONTEND",
        content: "export default function Dashboard() {}",
        clientVisible: true,
        reviewStatus: "REVISION_REQUESTED",
        outputReviewStatus: "REWORK_REQUESTED",
        validationStatus: "PASSED",
        createdAt: "2026-07-08T00:00:00.000Z",
        reviewNote: "Tune layout",
      } as never,
      tasks: [
        {
          id: "task-1",
          artifactId: "artifact-1",
          title: "Tune layout",
          status: "TODO",
          assignedTo: { fullName: "Dev User" },
        },
      ] as never,
    });

    expect(model).toMatchObject({
      title: "src/features/dashboard/view/DashboardView.tsx",
      visibilityLabel: "Client-visible",
      outputReviewBlocked: true,
      revisionOpen: true,
      revisionHandled: false,
      hasLinkedTasks: true,
      linkedTasksLabel: "1 task linked to this revision",
      fileName: "DashboardView.tsx",
    });
    expect(model?.contentKbLabel).toMatch(/KB$/);
    expect(model?.linkedTasks[0]).toMatchObject({
      title: "Tune layout",
      assigneeLabel: "Dev User",
    });
  });

  it("builds aggregate panel state with developer options", () => {
    const model = buildBackendArtifactsPanelModel({
      artifacts: [
        {
          id: "artifact-1",
          filePath: "src/features/dashboard/view/DashboardView.tsx",
          agentType: "FRONTEND",
          clientVisible: false,
          reviewStatus: "PENDING",
          outputReviewStatus: "PENDING",
          validationStatus: "PENDING",
          createdAt: "2026-07-08T00:00:00.000Z",
        },
      ] as never,
      tasks: [],
      members: [
        { role: "DEV", userId: "user-1", user: { fullName: "Dev User", email: "dev@example.com" } },
        { role: "PM", userId: "user-2", user: { fullName: "PM User", email: "pm@example.com" } },
      ] as never,
      preview: null,
    });

    expect(model).toMatchObject({
      hasArtifacts: true,
      artifactSubtitle: "1 backend artifact records",
      developerOptions: [{ userId: "user-1", label: "Dev User" }],
      previewModel: null,
    });
  });
});
