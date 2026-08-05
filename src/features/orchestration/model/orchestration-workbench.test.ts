import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildOrchestrationGuidance,
  buildOrchestrationMetrics,
  hasActiveWorkOrder,
  isLiveOrchestrationRun,
  orchestrationRefreshIntervalMs,
  shouldPollLiveSnapshot,
  visibleOrchestrationEvents,
  visibleWorkOrders,
} from "./orchestration-workbench";
import {
  buildBriefAnalyzeInput,
  buildBriefStepState,
  normalizeBriefAnalyzeError,
} from "./brief-step";
import {
  applyKickoffAutoAnalyzeResult,
  buildKickoffForm,
  buildKickoffStepState,
  kickoffPayloadFromForm,
  normalizeKickoffAnalyzeError,
} from "./kickoff-step";
import {
  buildExecutionSummary,
  buildRunMeterViewModel,
  formatElapsedDuration,
  humanizeRunStatus,
  normalizeRunNode,
} from "./run-cockpit";
import { buildReadinessStepState } from "./readiness-step";
import {
  buildDeliveryStepState,
  deliveryReviewTone,
  deliveryStatusLabel,
} from "./delivery-step";
import {
  buildGate1ReviewState,
  buildGate2ReviewState,
  formatProjectStatusLabel,
  groupGateArtifactsByAgent,
} from "./gate-review";
import {
  buildRunStepState,
  runFocusCopy,
  runStepDestinationPath,
} from "./run-step";
import {
  avatarInitial,
  buildTeamStepState,
  canRemoveMember,
  memberDisplayName,
  memberRoleTone,
  profileDisplayName,
} from "./team-step";
import {
  buildOrchestratorWizardLayoutModel,
  computeWizardCompletedSteps,
  determineWizardStepFromStatus,
  getWizardStepIndex,
  orchestratorPhaseForStep,
  orchestratorPhaseTargetStep,
} from "./orchestrator-wizard";
import { buildLaunchReviewState } from "./launch-review";
import {
  buildAgentSnapshots,
  buildTranscriptEntries,
  filterChunksByMode,
  filterTranscriptEntriesByMode,
  filterTranscriptEntriesByScope,
  formatChunksForClipboard,
  formatCompactCount,
  formatStreamAge,
  formatTranscriptForClipboard,
  resolveAgentState,
} from "./agent-stream";

describe("orchestration workbench model", () => {
  it("derives live-run and polling state from project and socket status", () => {
    expect(isLiveOrchestrationRun({ runId: "run-1", status: "GENERATING_CODE" })).toBe(true);
    expect(isLiveOrchestrationRun({ runId: "run-1", status: "DELIVERED" })).toBe(false);
    expect(hasActiveWorkOrder([{ status: "READY" }, { status: "DISPATCHED" }] as never)).toBe(true);
    expect(orchestrationRefreshIntervalMs("connected")).toBe(10000);
    expect(orchestrationRefreshIntervalMs("disconnected")).toBe(4000);
    expect(shouldPollLiveSnapshot({
      selectedProjectId: "project-1",
      liveRun: false,
      workOrders: [{ status: "DISPATCHED" }] as never,
    })).toBe(true);
  });

  it("builds provider, run, work-order, and artifact metrics", () => {
    const metrics = buildOrchestrationMetrics({
      providerLoading: false,
      providerStatus: { activeMode: "llm", available: true, reason: "" } as never,
      providerError: "",
      orchestrationLoading: false,
      orchestrationStatus: { status: "RUNNING", currentNode: "frontend_agent" } as never,
      selectedRunId: "run-1",
      outputsLoading: false,
      workOrders: [{ status: "DISPATCHED" }, { status: "READY" }] as never,
      artifacts: [{ clientVisible: true }, { clientVisible: false }] as never,
    });

    expect(metrics.map((metric) => metric.label)).toEqual(["Provider", "Run status", "Work orders", "Artifacts"]);
    expect(metrics[0]).toMatchObject({ value: "LLM", sub: "Ready" });
    expect(metrics[1]).toMatchObject({ value: "RUNNING", sub: "frontend_agent" });
    expect(metrics[2]).toMatchObject({ value: "2", sub: "1 dispatched" });
    expect(metrics[3]).toMatchObject({ value: "2", sub: "1 client-visible" });
  });

  it("limits event and handoff lists for the workbench", () => {
    const events = Array.from({ length: 10 }, (_, index) => ({ id: `event-${index}` }));
    const workOrders = Array.from({ length: 7 }, (_, index) => ({ id: `work-${index}` }));

    expect(visibleOrchestrationEvents(events as never)).toHaveLength(8);
    expect(visibleWorkOrders(workOrders as never)).toHaveLength(5);
  });

  it("turns orchestration status into one role-aware next-action message", () => {
    expect(buildOrchestrationGuidance({ status: "GENERATING_CODE", currentNode: "frontend_agent" })).toMatchObject({
      title: "Frontend Agent",
      waitingOn: "Waiting on: AI orchestrator",
      tone: "blue",
    });
    expect(buildOrchestrationGuidance({ status: "AWAITING_GATE_1" })).toMatchObject({
      eyebrow: "Action required",
      waitingOn: "Waiting on: project manager",
      tone: "amber",
    });
    expect(buildOrchestrationGuidance({ status: "FAILED", error: "Provider unavailable" })).toMatchObject({
      description: "Provider unavailable",
      tone: "red",
    });
  });

  it("keeps the dev orchestrator route as a thin feature shell", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/(dev)/dev/orchestrator/page.tsx"),
      "utf8",
    );

    expect(route).toContain("@/features/orchestration");
    expect(route).not.toContain("useDevFlowProjectOutputs");
    expect(route).not.toContain("useSocketSubscription");
  });
});

describe("run cockpit model", () => {
  it("normalizes run status, node names, and elapsed display", () => {
    expect(normalizeRunNode("work_order_frontend_agent")).toBe("frontend_agent");
    expect(normalizeRunNode("none")).toBe("");
    expect(humanizeRunStatus("AWAITING_GATE_1")).toBe("Plan ready for review");
    expect(humanizeRunStatus("CUSTOM_STATUS")).toBe("CUSTOM STATUS");
    expect(formatElapsedDuration(0)).toBe("0:00");
    expect(formatElapsedDuration(65_000)).toBe("1:05");
  });

  it("builds run meter telemetry and progress from orchestration store state", () => {
    const vm = buildRunMeterViewModel({
      projectName: "Atlas",
      status: "PENDING",
      connectionStatus: "connected",
      orchestrationState: {
        status: "GENERATING_CODE",
        currentNode: "work_order_frontend_agent",
        nodeStatus: "running",
        runId: "run-1",
        error: null,
      },
      nodeStates: {
        frontend_agent: {
          nodeId: "frontend_agent",
          phase: "running",
          progressPct: 25,
          progressLabel: "Rendering MVVM views",
          telemetry: {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.25,
            model: "gpt-test",
          },
          updatedAt: 1,
        },
        backend_agent: {
          nodeId: "backend_agent",
          phase: "exiting",
          telemetry: {
            inputTokens: 200,
            outputTokens: 300,
            costUsd: 0.15,
          },
          updatedAt: 2,
        },
      },
    } as never);

    expect(vm).toMatchObject({
      projectName: "Atlas",
      status: "GENERATING_CODE",
      statusLabel: "Building deliverables",
      currentNode: "frontend_agent",
      runId: "run-1",
      isRunning: true,
      inputTokens: 1200,
      outputTokens: 800,
      totalTokens: 2000,
      cost: 0.4,
      activeModel: "gpt-test",
      detail: "Rendering MVVM views",
      execution: {
        phaseLabel: "Building",
        nextCheckpoint: "Build review",
      },
    });
    expect(vm.budgetPct).toBe(1);
    expect(vm.progress).toBe(33);
  });

  it("marks delivered and failed run meter states explicitly", () => {
    const delivered = buildRunMeterViewModel({
      status: "DELIVERED",
      connectionStatus: "disconnected",
      orchestrationState: null,
      nodeStates: {},
    });
    const failed = buildRunMeterViewModel({
      status: "GENERATING_CODE",
      connectionStatus: "connected",
      orchestrationState: {
        status: "GENERATING_CODE",
        currentNode: "backend_agent",
        nodeStatus: "running",
        runId: "run-2",
        error: "Backend contract drift",
      },
      nodeStates: {},
    } as never);

    expect(delivered).toMatchObject({ isDelivered: true, isRunning: false, progress: 100 });
    expect(failed).toMatchObject({
      isFailed: true,
      isRunning: false,
      detail: "Backend contract drift",
    });
  });
});

describe("agent stream model", () => {
  const chunks = [
    { nodeId: "frontend_agent", runId: "run-1", type: "token", chunk: "Hello", timestamp: 1 },
    { nodeId: "frontend_agent", runId: "run-1", type: "token", chunk: " world", timestamp: 2 },
    { nodeId: "backend_agent", runId: "run-1", type: "decision", chunk: "Create DTO", timestamp: 3 },
    { nodeId: "frontend_agent", runId: "run-1", type: "tool-call", chunk: "write file", timestamp: 4 },
  ] as never;

  it("filters and formats stream chunks by display mode", () => {
    expect(filterChunksByMode(chunks, "tokens")).toHaveLength(2);
    expect(filterChunksByMode(chunks, "events")).toHaveLength(2);
    expect(formatChunksForClipboard(filterChunksByMode(chunks, "tokens"), "tokens")).toBe("Hello world");
    expect(formatChunksForClipboard(filterChunksByMode(chunks, "events"), "events")).toContain("[decision] Create DTO");
  });

  it("builds snapshots and resolves agent states from stream/runtime state", () => {
    const snapshots = buildAgentSnapshots({
      currentNode: "frontend_agent",
      agentStreams: {
        frontend_agent: { chunks, buffer: "Hello world" },
      },
      nodeStates: {
        frontend_agent: {
          nodeId: "frontend_agent",
          phase: "running",
          updatedAt: 1,
        },
        backend_agent: {
          nodeId: "backend_agent",
          phase: "exiting",
          updatedAt: 2,
        },
      },
    } as never);

    const frontend = snapshots.find((snapshot) => snapshot.agent.nodeId === "frontend_agent");
    const backend = snapshots.find((snapshot) => snapshot.agent.nodeId === "backend_agent");

    expect(frontend).toMatchObject({
      state: "running",
      tokenChunks: 2,
      streamedChars: 11,
    });
    expect(backend).toMatchObject({ state: "done" });
    expect(resolveAgentState(undefined, { chunks: [], buffer: "" } as never, "")).toBe("idle");
  });

  it("builds transcript entries, scopes them, and formats clipboard text", () => {
    const snapshots = buildAgentSnapshots({
      currentNode: "",
      agentStreams: {
        frontend_agent: { chunks, buffer: "Hello world" },
      },
      nodeStates: {},
    } as never);
    const entries = buildTranscriptEntries(snapshots);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({ type: "token", text: "Hello world" });
    expect(filterTranscriptEntriesByMode(entries, "tokens")).toHaveLength(1);
    expect(filterTranscriptEntriesByScope(entries, "frontend_agent", "selected")).toHaveLength(3);
    expect(formatTranscriptForClipboard(entries)).toContain("[Frontend - token] Hello world");
  });

  it("formats compact counts and stream age display", () => {
    expect(formatCompactCount(undefined)).toBe("-");
    expect(formatCompactCount(1200)).toBe("1.2k");
    expect(formatStreamAge(500)).toBe("just now");
    expect(formatStreamAge(12_000)).toBe("12s ago");
    expect(formatStreamAge(120_000)).toBe("2m ago");
  });
});

describe("orchestrator wizard model", () => {
  it("maps project and run status to the recommended wizard step", () => {
    expect(determineWizardStepFromStatus(null, null)).toBe("brief");
    expect(determineWizardStepFromStatus({ status: "PENDING", brief: "Short" }, null)).toBe("brief");
    expect(determineWizardStepFromStatus({ status: "PENDING", brief: "A detailed project brief" }, null)).toBe("review");
    expect(determineWizardStepFromStatus({ status: "AWAITING_GATE_1" }, null)).toBe("gate-1");
    expect(determineWizardStepFromStatus({ status: "AWAITING_GATE_2" }, null)).toBe("gate-2");
    expect(determineWizardStepFromStatus({ status: "DELIVERED" }, null)).toBe("delivery");
    expect(determineWizardStepFromStatus({ status: "FAILED" }, null)).toBe("run");
  });

  it("derives completed wizard steps from setup and orchestration state", () => {
    const completed = computeWizardCompletedSteps(
      {
        status: "AWAITING_GATE_2",
        brief: "A detailed enough brief",
      },
      { runId: "run-1" },
    );

    expect(Array.from(completed)).toEqual([
      "brief",
      "review",
      "run",
      "gate-1",
    ]);
  });

  it("builds layout navigation state for the wizard shell", () => {
    const model = buildOrchestratorWizardLayoutModel({
      currentStep: "run",
      project: {
        companyName: "Atlas",
        status: "AWAITING_GATE_1",
        brief: "A detailed enough brief",
      },
      status: { runId: "run-1" },
    });

    expect(model).toMatchObject({
      recommendedStep: "gate-1",
      maxReachedStep: "gate-1",
      currentStepNumber: getWizardStepIndex("run") + 1,
      onTrack: false,
      projectName: "Atlas",
    });
  });
});

describe("launch review model", () => {
  it("requires AI readiness but treats GitHub as optional at launch", () => {
    expect(buildLaunchReviewState({
      providerStatus: {
        available: true,
        activeMode: "llm",
        githubDelivery: { available: false },
      },
      llmResult: null,
      githubResult: null,
    })).toMatchObject({
      llmOk: true,
      githubOk: false,
      canStart: true,
      agentMode: "llm",
      githubLabel: "Connect later",
    });
  });

  it("blocks launch when AI generation is unavailable", () => {
    expect(buildLaunchReviewState({
      providerStatus: null,
      llmResult: { ok: false, reason: "Provider unavailable" },
      githubResult: { ok: true },
    })).toMatchObject({
      llmOk: false,
      githubOk: true,
      canStart: false,
      llmLabel: "Needs attention",
    });
  });

  it("maps internal orchestration steps into three customer-facing phases", () => {
    expect(orchestratorPhaseForStep("brief")).toBe("setup");
    expect(orchestratorPhaseForStep("gate-1")).toBe("build");
    expect(orchestratorPhaseForStep("gate-2")).toBe("build");
    expect(orchestratorPhaseForStep("delivery")).toBe("deliver");

    expect(orchestratorPhaseTargetStep("setup", "gate-1")).toBe("brief");
    expect(orchestratorPhaseTargetStep("build", "gate-1")).toBe("gate-1");
    expect(orchestratorPhaseTargetStep("deliver", "run")).toBe("delivery");
  });
});

describe("simple run focus", () => {
  it("translates runtime statuses into a plain-language PM update", () => {
    expect(runFocusCopy("PARSING_REQUIREMENTS")).toMatchObject({
      eyebrow: "Preparing the plan",
      tone: "blue",
    });
    expect(runFocusCopy("GENERATING_CODE")).toMatchObject({
      eyebrow: "Build in progress",
      tone: "blue",
    });
    expect(runFocusCopy("FAILED")).toMatchObject({
      eyebrow: "Action needed",
      tone: "red",
    });
    expect(runFocusCopy("DELIVERED")).toMatchObject({
      eyebrow: "Build complete",
      tone: "green",
    });
  });
});

describe("PM execution summary", () => {
  it("turns orchestration states into PM phases and decision prompts", () => {
    expect(buildExecutionSummary("AWAITING_GATE_1")).toMatchObject({
      headline: "The plan needs your decision",
      phaseLabel: "Plan review",
      actionStep: "gate-1",
      actionLabel: "Review plan",
      phases: [
        { id: "prepare", state: "done" },
        { id: "plan", state: "active" },
        { id: "build", state: "upcoming" },
        { id: "deliver", state: "upcoming" },
      ],
    });

    expect(buildExecutionSummary("DELIVERED")).toMatchObject({
      phaseLabel: "Complete",
      actionStep: "delivery",
      phases: [
        { id: "prepare", state: "done" },
        { id: "plan", state: "done" },
        { id: "build", state: "done" },
        { id: "deliver", state: "done" },
      ],
    });

    const blocked = buildExecutionSummary("FAILED", "backend_agent");
    expect(blocked).toMatchObject({
      phaseLabel: "Blocked",
      nextCheckpoint: "Resolve blocker",
    });
    expect(blocked.phases).toContainEqual(
      expect.objectContaining({ id: "build", state: "blocked" }),
    );
  });
});

describe("brief step model", () => {
  it("derives save, analyze, and skeleton state from brief fields", () => {
    expect(buildBriefStepState({
      companyName: "",
      brief: "hi",
      analyzing: false,
      analyzeResult: null,
    })).toMatchObject({
      canSave: false,
      canAnalyze: false,
      showAnalyzeSkeleton: false,
      analyzeButtonMarginTop: "0",
    });

    expect(buildBriefStepState({
      companyName: "Atlas",
      brief: "Build a project dashboard",
      analyzing: true,
      analyzeResult: null,
    })).toMatchObject({
      canSave: true,
      canAnalyze: true,
      showAnalyzeSkeleton: true,
      analyzeButtonMarginTop: "14px",
    });
  });

  it("normalizes analyze input and provider configuration errors", () => {
    const guidance = { style: "minimal" };
    expect(buildBriefAnalyzeInput({
      companyName: "  ",
      brief: "  Build a dashboard  ",
      stackKey: "nextjs-nestjs-supabase",
      designGuidance: guidance as never,
    })).toEqual({
      companyName: "Unknown company",
      brief: "Build a dashboard",
      stackKey: "nextjs-nestjs-supabase",
      designGuidance: guidance,
    });

    expect(normalizeBriefAnalyzeError({
      message: "Provider not configured",
      details: "Missing API key",
    })).toContain("Auto-analyze requires an LLM API key");
    expect(normalizeBriefAnalyzeError(new Error("Transient failure"))).toBe("Transient failure");
  });
});

describe("kickoff step model", () => {
  it("builds kickoff form defaults from project and kickoff data", () => {
    const form = buildKickoffForm({
      kickoff: {
        scopeSummary: null,
        milestones: "M1",
        requiredDocuments: null,
        techStackNotes: null,
        deliveryRoles: "PM",
        readinessNotes: null,
        scopeConfirmed: true,
        milestonesConfirmed: false,
        documentsConfirmed: false,
        techStackConfirmed: true,
        rolesConfirmed: false,
        clientAccessConfirmed: false,
        initialTasksCreated: false,
        initialWorkOrdersCreated: false,
      } as never,
      project: { brief: "Project brief", stackKey: "nextjs-nestjs-supabase" },
      designGuidance: { style: "minimal" } as never,
    });

    expect(form).toMatchObject({
      scopeSummary: "Project brief",
      milestones: "M1",
      techStackNotes: "nextjs-nestjs-supabase",
      deliveryRoles: "PM",
      scopeConfirmed: true,
      techStackConfirmed: true,
    });
  });

  it("derives checklist progress and ready status", () => {
    const form = buildKickoffForm({
      kickoff: null,
      project: null,
      designGuidance: {} as never,
    });
    const state = buildKickoffStepState({
      form: { ...form, scopeConfirmed: true, rolesConfirmed: true },
      kickoff: { status: "READY" } as never,
    });

    expect(state).toMatchObject({
      completedChecks: 2,
      totalChecks: 8,
      ready: true,
      statusLabel: "Ready",
    });
  });

  it("applies auto-analyze results and strips design guidance from kickoff payloads", () => {
    const form = buildKickoffForm({
      kickoff: null,
      project: null,
      designGuidance: { style: "minimal" } as never,
    });
    const next = applyKickoffAutoAnalyzeResult(form, {
      enhancedBrief: "Enhanced scope",
      suggestedFeatures: ["Auth", "Dashboard"],
      suggestedTechStack: {
        frontend: "Next",
        backend: "Nest",
        database: "Postgres",
        styling: "Tailwind",
      },
      complexity: "medium",
      estimatedFiles: 12,
    } as never);

    expect(next.scopeSummary).toBe("Enhanced scope");
    expect(next.milestones).toBe("- Auth\n- Dashboard");
    expect(next.techStackNotes).toContain("Frontend: Next");
    expect(next.deliveryRoles).toContain("2+ feature areas");
    expect(kickoffPayloadFromForm(next)).not.toHaveProperty("designGuidance");
  });

  it("normalizes kickoff provider configuration errors", () => {
    expect(normalizeKickoffAnalyzeError({
      message: "Provider not available",
      details: "API key missing",
    })).toContain("Auto-analyze requires an LLM API key");
    expect(normalizeKickoffAnalyzeError(new Error("Brief failed"))).toBe("Brief failed");
  });
});

describe("run step model", () => {
  it("derives run-step navigation state from project status", () => {
    expect(buildRunStepState({ project: null, status: null })).toMatchObject({
      projectStatus: "PENDING",
      nextLabel: "Continue",
      nextDisabled: true,
      destination: null,
    });
    expect(buildRunStepState({ project: { status: "AWAITING_GATE_1" }, status: null })).toMatchObject({
      isAwaitingGate1: true,
      nextLabel: "Go to plan review",
      nextDisabled: false,
      destination: "gate-1",
    });
    expect(buildRunStepState({ project: { status: "AWAITING_GATE_2" }, status: null })).toMatchObject({
      isAwaitingGate2: true,
      nextLabel: "Go to build review",
      nextDisabled: false,
      destination: "gate-2",
    });
    expect(buildRunStepState({ project: { status: "DELIVERED" }, status: null })).toMatchObject({
      isDelivered: true,
      nextLabel: "Go to delivery",
      nextDisabled: false,
      destination: "delivery",
    });
  });

  it("builds run-step destination paths", () => {
    expect(runStepDestinationPath("project-1", null)).toBeNull();
    expect(runStepDestinationPath("project-1", "gate-1")).toBe("/dev/orchestrate/project-1");
    expect(runStepDestinationPath("project-1", "gate-2")).toBe("/dev/orchestrate/project-1");
    expect(runStepDestinationPath("project-1", "delivery")).toBe("/dev/orchestrate/project-1");
  });
});

describe("team step model", () => {
  it("filters search results that are already project members", () => {
    const state = buildTeamStepState({
      members: [
        { userId: "user-1", role: "PM", profile: { fullName: "Pat Manager" } },
        { userId: "user-2", role: "DEV", profile: { email: "dev@example.com" } },
      ],
      results: [
        { userId: "user-1", fullName: "Pat Manager", email: "pat@example.com" },
        { userId: "user-3", fullName: "Cam Client", email: "cam@example.com" },
      ],
    });

    expect(state.memberCount).toBe(2);
    expect(state.hasMembers).toBe(true);
    expect(state.memberIds.has("user-2")).toBe(true);
    expect(state.visibleResults.map((profile) => profile.userId)).toEqual(["user-3"]);
  });

  it("formats team member labels, initials, tones, and removal permissions", () => {
    expect(memberDisplayName({
      userId: "user-1",
      role: "DEV",
      profile: { fullName: "Dev User", email: "dev@example.com" },
    })).toBe("Dev User");
    expect(memberDisplayName({
      userId: "user-2",
      role: "CLIENT",
      profile: { email: "client@example.com" },
    })).toBe("client@example.com");
    expect(profileDisplayName({ userId: "user-3", email: "unknown@example.com" })).toBe("Unknown");
    expect(avatarInitial("atlas")).toBe("A");
    expect(avatarInitial(null)).toBe("");
    expect(memberRoleTone("DEV")).toBe("blue");
    expect(memberRoleTone("PM")).toBe("purple");
    expect(memberRoleTone("CLIENT")).toBe("gray");
    expect(canRemoveMember({ userId: "user-1", role: "PM" })).toBe(false);
    expect(canRemoveMember({ userId: "user-2", role: "DEV" })).toBe(true);
  });
});

describe("gate review model", () => {
  it("derives Gate 1 review state from project contract data", () => {
    const state = buildGate1ReviewState({
      acting: false,
      project: {
        status: "AWAITING_GATE_1",
        companyName: "Atlas",
        brief: "Build the thing",
        contract: {
          projectName: "Atlas Contract",
          description: "Contract description",
          requirements: {
            projectType: "web",
            complexity: "medium",
            estimatedFiles: 8,
            techStack: { frontend: "Next", backend: "Nest" },
            features: ["Dashboard", "Auth"],
          },
          fileManifest: ["src/app/page.tsx", "src/features/dashboard/view/dashboard-view.tsx"],
          acceptanceCriteria: ["Renders dashboard", "Requires auth"],
        },
      },
      status: null,
    });

    expect(state).toMatchObject({
      projectStatus: "AWAITING_GATE_1",
      projectStatusLabel: "AWAITING GATE 1",
      isAwaiting: true,
      contractTitle: "Atlas Contract",
      contractDescription: "Contract description",
      hasRequirements: true,
      features: ["Dashboard", "Auth"],
      fileManifest: ["src/app/page.tsx", "src/features/dashboard/view/dashboard-view.tsx"],
      acceptanceCriteria: ["Renders dashboard", "Requires auth"],
      nextDisabled: false,
    });
  });

  it("falls back when Gate 1 is not awaiting approval", () => {
    const state = buildGate1ReviewState({
      acting: true,
      project: { status: "GENERATING_CODE", companyName: "Atlas", brief: "Fallback brief" },
      status: null,
    });

    expect(formatProjectStatusLabel(null)).toBe("unknown");
    expect(state).toMatchObject({
      projectStatus: "GENERATING_CODE",
      isAwaiting: false,
      contract: null,
      contractTitle: "Atlas",
      contractDescription: "Fallback brief",
      nextDisabled: true,
    });
  });

  it("groups Gate 2 artifacts by owning agent", () => {
    const groups = groupGateArtifactsByAgent([
      { id: "a1", agentType: "frontend", filePath: "src/features/app/view/page.tsx" },
      { id: "a2", agentType: "backend", filePath: "src/modules/app/app.controller.ts" },
      { id: "a3", agentType: "frontend", filePath: "src/features/app/model/types.ts" },
      { id: "a4", agentType: "unknown", filePath: "README.md" },
    ]);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({ agent: "frontend", label: "Frontend", tone: "attention" });
    expect(groups[0].artifacts.map((artifact) => artifact.id)).toEqual(["a1", "a3"]);
    expect(groups[1]).toMatchObject({ agent: "backend", label: "Backend", tone: "green" });
    expect(groups[2]).toMatchObject({ agent: "unknown", label: "unknown", tone: "gray" });
  });

  it("derives Gate 2 review state from generated artifacts", () => {
    const state = buildGate2ReviewState({
      acting: false,
      project: {
        status: "AWAITING_GATE_2",
        artifacts: [
          { id: "a1", agentType: "frontend", filePath: "src/app/page.tsx", language: "tsx" },
          { id: "a2", agentType: "database", filePath: "prisma/schema.prisma", language: "prisma" },
        ],
      },
      status: null,
    });

    expect(state).toMatchObject({
      projectStatus: "AWAITING_GATE_2",
      projectStatusLabel: "AWAITING GATE 2",
      isAwaiting: true,
      nextDisabled: false,
    });
    expect(state.artifacts).toHaveLength(2);
    expect(state.artifactGroups.map((group) => group.agent)).toEqual(["frontend", "database"]);
  });
});

describe("delivery step model", () => {
  it("derives delivery readiness, repo, and action state", () => {
    const state = buildDeliveryStepState({
      project: {
        status: "AWAITING_CLIENT_ACCEPTANCE",
        repoUrl: "https://github.com/acme/project",
        deliveryReview: { status: "REVISION_REQUESTED", notes: "Please revise copy." },
      },
      status: null,
      readiness: { blockers: [] },
      loadingReadiness: false,
    });

    expect(state).toMatchObject({
      projectStatus: "AWAITING_CLIENT_ACCEPTANCE",
      projectStatusLabel: "AWAITING CLIENT ACCEPTANCE",
      isDelivered: false,
      repoUrl: "https://github.com/acme/project",
      blockers: [],
      hasBlockers: false,
      deliveryReviewTone: "yellow",
      deliveryReviewStatusLabel: "REVISION REQUESTED",
      canAct: true,
      nextLabel: "Complete",
    });
  });

  it("blocks delivery actions while loading, blocked, or delivered", () => {
    expect(buildDeliveryStepState({
      project: { status: "GENERATING_CODE" },
      status: null,
      readiness: { blockers: ["Missing repository"] },
      loadingReadiness: false,
    }).canAct).toBe(false);
    expect(buildDeliveryStepState({
      project: { status: "GENERATING_CODE" },
      status: null,
      readiness: { blockers: [] },
      loadingReadiness: true,
    }).canAct).toBe(false);
    expect(buildDeliveryStepState({
      project: { status: "DELIVERED" },
      status: null,
      readiness: { blockers: [] },
      loadingReadiness: false,
    })).toMatchObject({ canAct: false, isDelivered: true, nextLabel: "Finish" });
  });

  it("formats delivery review state", () => {
    expect(deliveryStatusLabel(null)).toBe("Unknown");
    expect(deliveryStatusLabel("REVISION_RESOLVED")).toBe("REVISION RESOLVED");
    expect(deliveryReviewTone("ACCEPTED")).toBe("green");
    expect(deliveryReviewTone("REVISION_REQUESTED")).toBe("yellow");
    expect(deliveryReviewTone("REVISION_RESOLVED")).toBe("blue");
    expect(deliveryReviewTone("PENDING")).toBe("gray");
  });
});

describe("readiness step model", () => {
  it("reads the current provider status contract", () => {
    const state = buildReadinessStepState({
      providerStatus: {
        available: true,
        activeMode: "llm",
        githubDelivery: { available: true },
      },
      llmResult: null,
      githubResult: null,
    });

    expect(state).toMatchObject({
      llmOk: true,
      githubOk: true,
      agentMode: "llm",
      allReady: true,
    });
  });

  it("derives readiness from provider status defaults", () => {
    const state = buildReadinessStepState({
      providerStatus: {
        llmAvailable: true,
        agentProviderMode: "llm",
        githubDelivery: { ok: false },
      },
      llmResult: null,
      githubResult: null,
    });

    expect(state).toMatchObject({
      llmOk: true,
      githubOk: false,
      agentMode: "llm",
      allReady: false,
      llmTone: "green",
      githubTone: "yellow",
      llmLabel: "Ready",
      githubLabel: "Not verified",
    });
  });

  it("lets fresh verification results override provider status", () => {
    const state = buildReadinessStepState({
      providerStatus: {
        llmAvailable: false,
        agentProviderMode: "mock",
        githubDelivery: { ok: false },
      },
      llmResult: { ok: true, model: "gpt-test" },
      githubResult: { ok: true },
    });

    expect(state).toMatchObject({
      llmOk: true,
      githubOk: true,
      allReady: true,
      llmTone: "green",
      githubTone: "green",
    });
  });
});
