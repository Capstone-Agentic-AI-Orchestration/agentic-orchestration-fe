import {
  buildDevArtifactPreviewModel,
  buildDevArtifactRows,
  buildDevArtifactsPanelModel,
  devOutputReviewBadgeView,
  devReviewBadgeView,
  devValidationBadgeView,
} from "./dev-artifacts-panel";

describe("dev artifacts panel model", () => {
  const artifact = {
    id: "artifact-1",
    projectId: "project-1",
    agentType: "BACKEND",
    filePath: "src/modules/orders/orders.service.ts",
    content: "export class OrdersService {}",
    createdAt: "2026-07-08T00:00:00.000Z",
    reviewStatus: "REVISION_REQUESTED",
    outputReviewStatus: "REWORK_REQUESTED",
    validationStatus: "FAILED",
    reviewedAt: "2026-07-09T00:00:00.000Z",
    validationSummary: "Route contract mismatch",
    reviewNote: "Fix DTO names",
    revisionHandledAt: "2026-07-10T00:00:00.000Z",
    revisionResolutionNote: "Updated the DTOs",
  };

  it("maps review, output review, and validation badges", () => {
    expect(devReviewBadgeView("APPROVED")).toEqual({ tone: "green", label: "Approved" });
    expect(devReviewBadgeView("REVISION_REQUESTED")).toEqual({ tone: "amber", label: "Revision requested" });
    expect(devReviewBadgeView()).toEqual({ tone: "gray", label: "Pending review" });

    expect(devOutputReviewBadgeView("APPROVED")).toEqual({ tone: "green", label: "PM approved" });
    expect(devOutputReviewBadgeView("REWORK_REQUESTED")).toEqual({ tone: "amber", label: "Rework" });
    expect(devOutputReviewBadgeView("PUBLISHED")).toEqual({ tone: "blue", label: "Published" });
    expect(devOutputReviewBadgeView()).toEqual({ tone: "gray", label: "PM pending" });

    expect(devValidationBadgeView("PASSED")).toEqual({ tone: "green", label: "Validated" });
    expect(devValidationBadgeView("FAILED")).toEqual({ tone: "red", label: "Invalid" });
    expect(devValidationBadgeView()).toEqual({ tone: "gray", label: "Unvalidated" });
  });

  it("builds artifact rows with display state and caps the list at eight", () => {
    const rows = buildDevArtifactRows(Array.from({ length: 9 }, (_, index) => ({
      ...artifact,
      id: `artifact-${index}`,
      filePath: `file-${index}.ts`,
      revisionHandledAt: index === 0 ? artifact.revisionHandledAt : null,
    })) as never);

    expect(rows).toHaveLength(8);
    expect(rows[0]).toMatchObject({
      id: "artifact-0",
      filePath: "file-0.ts",
      subtitle: expect.stringContaining("BACKEND - "),
      revisionHandled: true,
      review: { tone: "amber", label: "Revision requested" },
      outputReview: { tone: "amber", label: "Rework" },
      validation: { tone: "red", label: "Invalid" },
    });
    expect(rows[1].revisionHandled).toBe(false);
  });

  it("builds preview labels, notes, and content", () => {
    const preview = buildDevArtifactPreviewModel(artifact as never);

    expect(preview).toMatchObject({
      title: "src/modules/orders/orders.service.ts",
      subtitle: expect.stringContaining("BACKEND - "),
      reviewedAtLabel: expect.stringContaining("Reviewed "),
      validationSummary: "Route contract mismatch",
      reviewNote: "Fix DTO names",
      revisionHandledLabel: expect.stringContaining("PM handled "),
      revisionResolutionNote: "Updated the DTOs",
      content: "export class OrdersService {}",
    });
  });

  it("builds aggregate loading, error, empty, and preview state", () => {
    expect(buildDevArtifactsPanelModel({ artifacts: [], loading: true })).toMatchObject({
      loading: true,
      error: null,
      empty: false,
      rows: [],
      preview: null,
    });

    expect(buildDevArtifactsPanelModel({ artifacts: [], error: "Network error" })).toMatchObject({
      loading: false,
      error: "Network error",
      empty: false,
    });

    expect(buildDevArtifactsPanelModel({ artifacts: [] })).toMatchObject({
      loading: false,
      error: null,
      empty: true,
      rows: [],
    });

    expect(buildDevArtifactsPanelModel({ artifacts: [artifact] as never, preview: artifact as never }).preview).toEqual(
      expect.objectContaining({ title: artifact.filePath }),
    );
  });
});
