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

// The PM keeps this card for status but no longer builds: prompting, run control and both
// gates are @Roles(DEV, ADMIN). Every state that offers the builder an action must offer the
// observer none, or the PM gets a button whose request the backend refuses.
describe("buildProjectNextActionHeroModel with canBuild: false", () => {
  const observer = { canBuild: false, artifactCount: 3, orchestrationBlockers: [] as string[] };

  it("reports gate 1 as waiting on the developer, with no approve action", () => {
    expect(buildProjectNextActionHeroModel({ ...observer, status: "AWAITING_GATE_1" })).toMatchObject({
      kind: "waiting",
      headline: "The contract is with the developer for review.",
      cta: null,
      secondary: null,
    });
  });

  it("reports gate 2 as waiting on the developer, with no approve action", () => {
    expect(buildProjectNextActionHeroModel({ ...observer, status: "AWAITING_GATE_2" })).toMatchObject({
      kind: "waiting",
      headline: "The build is with the developer for review.",
      cta: null,
      secondary: null,
    });
  });

  it("offers no retry on a failed run", () => {
    expect(buildProjectNextActionHeroModel({ ...observer, status: "FAILED" })).toMatchObject({
      kind: "blocked",
      cta: null,
    });
  });

  it("offers no start action when idle, and points at the missing repository", () => {
    expect(buildProjectNextActionHeroModel({ ...observer, status: "PENDING" })).toMatchObject({
      kind: "idle",
      headline: "Ready for the developer to start the build.",
      detail: "Create the project repository so a developer can start the run.",
      cta: null,
    });
  });

  it("still links the repository once delivered — the one action that is the PM's", () => {
    expect(buildProjectNextActionHeroModel({
      ...observer,
      status: "DELIVERED",
      repoUrl: "https://github.com/acme/app",
    })).toMatchObject({
      kind: "done",
      cta: { id: "openRepository" },
    });
  });

  it("leaves the builder's actions untouched when canBuild is omitted", () => {
    expect(buildProjectNextActionHeroModel({
      status: "AWAITING_GATE_1",
      artifactCount: 3,
      orchestrationBlockers: [],
    })).toMatchObject({ cta: { id: "reviewContract" } });
  });
});
