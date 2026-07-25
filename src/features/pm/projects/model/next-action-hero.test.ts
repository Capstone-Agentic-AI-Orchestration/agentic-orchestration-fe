import { buildProjectNextActionHeroModel } from "./next-action-hero";

describe("project next action hero model", () => {
  it("prioritizes PM review gates over broader run state", () => {
    expect(buildProjectNextActionHeroModel({
      status: "AWAITING_GATE_1",
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
      artifactCount: 1,
      orchestrationBlockers: [],
    })).toMatchObject({
      headline: "1 artifact is ready for review.",
      secondary: null,
    });
  });

  it("does not require kickoff or manual work orders before start", () => {
    expect(buildProjectNextActionHeroModel({
      status: "PENDING",
      artifactCount: 0,
      orchestrationBlockers: [],
      providerAvailable: true,
    })).toMatchObject({
      kind: "idle",
      headline: "Ready to review and start.",
      cta: { id: "start" },
    });

    expect(buildProjectNextActionHeroModel({
      status: "PENDING",
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
      artifactCount: 0,
      orchestrationBlockers: [],
    })).toMatchObject({
      kind: "done",
      cta: { id: "openRepository" },
    });
  });
});
