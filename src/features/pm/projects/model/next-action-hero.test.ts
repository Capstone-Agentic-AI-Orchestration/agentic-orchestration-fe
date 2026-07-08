import { buildProjectNextActionHeroModel } from "./next-action-hero";

describe("project next action hero model", () => {
  it("prioritizes PM review gates over broader run state", () => {
    expect(buildProjectNextActionHeroModel({
      status: "AWAITING_GATE_1",
      kickoffReady: true,
      readyWorkOrderCount: 2,
      totalWorkOrderCount: 2,
      artifactCount: 0,
      orchestrationBlockers: [],
      canRejectGate1: true,
    })).toMatchObject({
      kind: "waiting",
      badge: { label: "Architecture review" },
      cta: { id: "reviewContract" },
      secondary: { id: "rejectContract" },
    });

    expect(buildProjectNextActionHeroModel({
      status: "AWAITING_GATE_2",
      kickoffReady: true,
      readyWorkOrderCount: 2,
      totalWorkOrderCount: 2,
      artifactCount: 1,
      orchestrationBlockers: [],
    })).toMatchObject({
      headline: "1 artifact is ready for review.",
      secondary: null,
    });
  });

  it("blocks on kickoff and provider readiness before start readiness", () => {
    expect(buildProjectNextActionHeroModel({
      status: "PENDING",
      kickoffReady: false,
      readyWorkOrderCount: 1,
      totalWorkOrderCount: 1,
      artifactCount: 0,
      orchestrationBlockers: [],
      providerAvailable: true,
    })).toMatchObject({
      kind: "blocked",
      cta: { id: "goToKickoff" },
    });

    expect(buildProjectNextActionHeroModel({
      status: "PENDING",
      kickoffReady: true,
      readyWorkOrderCount: 1,
      totalWorkOrderCount: 1,
      artifactCount: 0,
      orchestrationBlockers: [],
      providerAvailable: false,
      providerReason: "Missing OPENAI_API_KEY",
    })).toMatchObject({
      badge: { label: "Provider unavailable" },
      detail: "Missing OPENAI_API_KEY",
      cta: null,
    });
  });

  it("maps ready, running, and delivered states into semantic actions", () => {
    expect(buildProjectNextActionHeroModel({
      status: "GENERATING_CODE",
      runId: "run-1",
      kickoffReady: true,
      readyWorkOrderCount: 1,
      totalWorkOrderCount: 1,
      artifactCount: 0,
      orchestrationBlockers: [],
      lastActivity: "Frontend agent is streaming.",
    })).toMatchObject({
      kind: "running",
      headline: "Building your application...",
      detail: "Frontend agent is streaming.",
      cta: null,
    });

    expect(buildProjectNextActionHeroModel({
      status: "PENDING",
      kickoffReady: true,
      readyWorkOrderCount: 3,
      totalWorkOrderCount: 3,
      artifactCount: 0,
      orchestrationBlockers: [],
      isStarting: true,
    })).toMatchObject({
      kind: "idle",
      cta: { id: "start", label: "Starting..." },
    });

    expect(buildProjectNextActionHeroModel({
      status: "DELIVERED",
      repoUrl: "https://github.com/acme/app",
      kickoffReady: true,
      readyWorkOrderCount: 0,
      totalWorkOrderCount: 0,
      artifactCount: 0,
      orchestrationBlockers: [],
    })).toMatchObject({
      kind: "done",
      cta: { id: "openRepository" },
    });
  });
});
