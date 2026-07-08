import {
  buildDeliveryReviewPanelModel,
  deliveryReadinessStats,
  deliveryReadinessStatusView,
  deliveryReviewStatusView,
} from "./delivery-review-panel";

describe("delivery review panel model", () => {
  it("maps delivery review statuses to badge labels and tones", () => {
    expect(deliveryReviewStatusView("ACCEPTED")).toEqual({ tone: "green", label: "Accepted" });
    expect(deliveryReviewStatusView("REVISION_REQUESTED")).toEqual({ tone: "amber", label: "Revision requested" });
    expect(deliveryReviewStatusView("REVISION_RESOLVED")).toEqual({ tone: "blue", label: "Ready for acceptance" });
    expect(deliveryReviewStatusView(null)).toEqual({ tone: "gray", label: "Pending" });
  });

  it("derives readiness status and stat rows", () => {
    const readiness = {
      ready: false,
      blockers: [{ code: "ACTIVE_WORK", message: "Open work orders", severity: "BLOCKER" }],
      counts: {
        publishedArtifacts: 4,
        activeWorkOrders: 2,
        openDocuments: 1,
        missingAgentTypes: 3,
      },
    };

    expect(deliveryReadinessStatusView({ readiness: readiness as never, readinessLoading: false })).toEqual({
      tone: "amber",
      label: "Blocked",
    });
    expect(deliveryReadinessStatusView({ readiness: null, readinessLoading: true })).toEqual({
      tone: "amber",
      label: "Checking",
    });
    expect(deliveryReadinessStats(readiness as never)).toEqual([
      { label: "Published artifacts", value: "4" },
      { label: "Open work orders", value: "2" },
      { label: "Open documents", value: "1" },
      { label: "Missing coverage", value: "3" },
    ]);
  });

  it("builds review/readiness display state", () => {
    const model = buildDeliveryReviewPanelModel({
      readiness: {
        ready: true,
        blockers: [],
        counts: {
          publishedArtifacts: 2,
          activeWorkOrders: 0,
          openDocuments: 0,
          missingAgentTypes: 0,
        },
      } as never,
      readinessLoading: false,
      review: {
        status: "REVISION_REQUESTED",
        acceptedAt: null,
        revisionRequestedAt: "2026-07-08T00:00:00.000Z",
      } as never,
    });

    expect(model).toMatchObject({
      readinessStatus: { tone: "green", label: "Ready" },
      reviewStatus: { tone: "amber", label: "Revision requested" },
      hasReadiness: true,
      hasBlockers: false,
      showEmptyReview: false,
      showResolveRevision: true,
      acceptedAtLabel: null,
    });
    expect(model.revisionRequestedAtLabel).toBeTruthy();
  });

  it("marks empty review state when no review exists", () => {
    expect(buildDeliveryReviewPanelModel({
      review: null,
      readiness: null,
      readinessLoading: false,
    })).toMatchObject({
      showEmptyReview: true,
      showResolveRevision: false,
      hasReadiness: false,
      hasBlockers: false,
    });
  });
});
