import {
  artifactAgentIs,
  buildBackendPreviewModel,
  buildClientProductModel,
  buildDeliverableChecklist,
  buildPreviewBody,
  clientDeliveryBlockers,
  deliveryBlockersForState,
  deliveryReviewBadgeView,
  reviewBadgeView,
  sharedVisibleArtifacts,
  sharedVisibleDocuments,
} from "./client-product";

describe("client product model", () => {
  it("filters visible artifacts/documents and checks agent type", () => {
    expect(sharedVisibleArtifacts([
      { id: "a1", clientVisible: true, agentType: "FRONTEND" },
      { id: "a2", clientVisible: false, agentType: "BACKEND" },
    ] as never)).toHaveLength(1);
    expect(sharedVisibleDocuments([
      { id: "d1", clientVisible: true },
      { id: "d2", clientVisible: false },
    ] as never)).toHaveLength(1);
    expect(artifactAgentIs({ agentType: "Backend" } as never, "backend")).toBe(true);
  });

  it("builds fallback delivery blockers from invite, artifact, and document state", () => {
    const blockers = clientDeliveryBlockers({
      clientInvites: [{ status: "PENDING" }],
    } as never, [
      { reviewStatus: "PENDING" },
      { reviewStatus: "APPROVED" },
    ] as never, [
      { status: "PENDING" },
    ] as never);

    expect(blockers).toEqual([
      "Accept the project invite before accepting final delivery.",
      "1 shared artifact still need approval or revision handling.",
      "1 client-visible document still need approval or archival.",
    ]);
  });

  it("prefers delivery readiness blockers and readiness error over fallback blockers", () => {
    expect(deliveryBlockersForState({
      project: { clientInvites: [{ status: "ACCEPTED" }] } as never,
      readiness: {
        blockers: [
          { severity: "WARNING", message: "Warning only" },
          { severity: "BLOCKER", message: "Blocking issue" },
        ],
      } as never,
      readinessError: "",
      artifacts: [],
      documents: [],
    })).toEqual(["Blocking issue"]);

    expect(deliveryBlockersForState({
      project: { clientInvites: [{ status: "ACCEPTED" }] } as never,
      readiness: null,
      readinessError: "Readiness API failed",
      artifacts: [],
      documents: [],
    })).toEqual(["Delivery readiness could not be verified: Readiness API failed"]);
  });

  it("maps review and delivery badges", () => {
    expect(reviewBadgeView("APPROVED")).toEqual({ tone: "green", label: "Approved" });
    expect(reviewBadgeView("REVISION_REQUESTED")).toEqual({ tone: "amber", label: "Revision requested" });
    expect(deliveryReviewBadgeView({ status: "ACCEPTED" } as never)).toEqual({ tone: "green", label: "Delivery accepted" });
    expect(deliveryReviewBadgeView(null)).toEqual({ tone: "neutral", label: "Awaiting acceptance" });
  });

  it("builds preview summaries, backend preview rows, and checklist state", () => {
    const artifacts = [
      { id: "front", projectId: "p1", agentType: "FRONTEND", filePath: "src/app/page.tsx", clientVisible: true, reviewStatus: "PENDING" },
      { id: "db", projectId: "p1", agentType: "DATABASE", filePath: "prisma/schema.prisma", clientVisible: true, reviewStatus: "APPROVED", publishedAt: "2026-07-08T00:00:00.000Z" },
      { id: "doc", projectId: "p1", agentType: "ARCHITECTURE", filePath: "README.md", clientVisible: true, reviewStatus: "APPROVED" },
    ] as never;

    expect(buildPreviewBody({ artifacts, agentType: "frontend" })).toBe("1 frontend artifact available in the backend deliverable list.");
    expect(buildPreviewBody({ artifacts, agentType: "mobile" })).toBe("No client-visible mobile artifact has been shared yet.");

    const backend = buildBackendPreviewModel({
      artifacts,
      events: [{ nodeName: "backend", eventType: "completed" }],
      project: { repoUrl: "https://github.example/repo" },
    } as never);
    expect(backend).toMatchObject({
      hasArtifacts: true,
      items: [
        { key: "artifacts", sub: "3 files recorded" },
        { key: "repo", sub: "https://github.example/repo" },
        { key: "event", sub: "backend completed" },
      ],
    });
    expect(backend?.artifactRows[1]).toMatchObject({
      id: "db",
      published: true,
      review: { tone: "green", label: "Approved" },
    });

    expect(buildDeliverableChecklist(artifacts, true)).toMatchObject([
      { label: "Frontend application", done: true, inProgress: false },
      { label: "Backend API", done: false, inProgress: true },
      { label: "Database schema", done: true, inProgress: false },
      { label: "Documentation", done: true, inProgress: false },
      { label: "Production deployment", done: false, inProgress: false },
    ]);
  });

  it("builds aggregate product model", () => {
    const project = {
      id: "project-1",
      companyName: "Acme Labs",
      brief: "Build the portal",
      status: "DELIVERED",
      stackKey: "next-nest",
      updatedAt: "2026-07-08T00:00:00.000Z",
      runId: "run-1",
      repoUrl: null,
      clientInvites: [{ status: "ACCEPTED" }],
      deliveryReview: { status: "PENDING" },
    };
    const model = buildClientProductModel({
      selectedProject: project,
      selectedProjectLoading: false,
      selectedProjectError: "",
      artifacts: [
        { id: "front", projectId: "project-1", agentType: "FRONTEND", filePath: "src/app/page.tsx", clientVisible: true, reviewStatus: "APPROVED" },
      ] as never,
      documents: [],
      events: [],
      deliveryReadiness: {
        ready: true,
        blockers: [],
        counts: {
          publishedArtifacts: 1,
          activeWorkOrders: 0,
          openDocuments: 0,
          missingAgentTypes: 0,
        },
      } as never,
      deliveryReadinessLoading: false,
      deliveryReadinessError: "",
    } as never);

    expect(model).toMatchObject({
      hasProject: true,
      productName: "Acme Labs",
      pendingActions: 0,
      primaryActionLabel: "Review deliverables",
      canAcceptDelivery: true,
      acceptButtonSubtitle: "Marks the engagement as delivered",
      deliveryReadinessBadge: { tone: "green", label: "Ready for acceptance" },
      buildInfo: [
        { label: "Build", value: "run-1" },
        { label: "Branch", value: "Not linked" },
        expect.objectContaining({ label: "Last update" }),
        { label: "Environment", value: "next-nest" },
      ],
    });
  });
});
