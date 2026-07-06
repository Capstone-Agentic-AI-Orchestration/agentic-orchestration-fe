import { humanizeJourneyTerm, journeyStageForProject, makeProjectJourneyContext } from "@/shared/journey";

describe("journey view models", () => {
  it("maps backend status to human journey stages", () => {
    expect(journeyStageForProject({ status: "PENDING" })).toBe("project-setup");
    expect(journeyStageForProject({ status: "AWAITING_GATE_1" })).toBe("plan-review");
    expect(journeyStageForProject({ status: "GENERATING_CODE" })).toBe("build-run");
    expect(journeyStageForProject({ status: "AWAITING_GATE_2" })).toBe("build-review");
    expect(journeyStageForProject({ status: "DELIVERED" })).toBe("accepted");
  });

  it("humanizes old orchestration terms", () => {
    expect(humanizeJourneyTerm("Review Gate 1 work order artifacts")).toBe("Review Plan review agent task deliverables");
  });

  it("builds a PM context with next action and blockers", () => {
    const context = makeProjectJourneyContext({
      role: "pm",
      project: {
        id: "project-1",
        companyName: "Northstar Logistics",
        status: "AWAITING_GATE_1",
        lifecycle: {
          stage: "IN_ORCHESTRATION",
          label: "Gate 1",
          nextAction: "Review Gate 1",
          tone: "yellow",
          progress: 42,
          signals: {
            clientAccepted: false,
            kickoffReady: true,
            orchestrationStarted: true,
            clientReviewOpen: false,
            revisionOpen: false,
            deliveryAccepted: false,
            deliveryRevisionOpen: false,
            totalTasks: 4,
            openTasks: 1,
            totalWorkOrders: 5,
            activeWorkOrders: 2,
            clientVisibleArtifacts: 0,
          },
        },
      },
      blockers: ["Gate 1 needs approval"],
    });

    expect(context.stage).toBe("plan-review");
    expect(context.title).toContain("Plan review");
    expect(context.nextAction).toBe("Review Plan review");
    expect(context.health).toBe("attention");
    expect(context.blockers?.[0].title).toBe("Plan review needs approval");
  });

  it("flags Eve unavailable as a blocking provider issue", () => {
    const context = makeProjectJourneyContext({
      role: "admin",
      project: { id: "project-1", companyName: "Northstar Logistics", status: "PENDING" },
      providerStatus: {
        requestedMode: "llm",
        activeMode: "llm",
        available: false,
        fallbackMode: null,
        missingRequirements: ["EVE_SERVICE_URL"],
        reason: "Eve service URL missing",
        providers: [],
        llmEngine: {
          requestedEngine: "eve",
          activeEngine: "graph",
          fallbackReason: "EVE_SERVICE_URL is unset",
          eveServiceConfigured: false,
          model: "display-model",
        },
      },
    });

    expect(context.health).toBe("blocked");
    expect(context.blockers?.some((issue) => issue.title === "Eve service is not configured")).toBe(true);
  });
});
