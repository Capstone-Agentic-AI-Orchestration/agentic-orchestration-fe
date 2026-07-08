import {
  activeProviderLabel,
  buildArtifactInlinePreviewModel,
  buildBackendOrchestrationPanelModel,
  buildFailedWorkOrderRows,
  buildReadyWorkOrderRows,
  buildRunHistoryRows,
  hasExecutableInstructions,
} from "./orchestration-panel";

describe("backend orchestration panel model", () => {
  it("maps provider labels and executable instructions", () => {
    expect(activeProviderLabel("llm")).toBe("LLM");
    expect(activeProviderLabel("mock")).toBe("Mock");
    expect(activeProviderLabel("simulation")).toBe("Agent");
    expect(hasExecutableInstructions({ instructions: "  Build it  " } as never)).toBe(true);
    expect(hasExecutableInstructions({ instructions: "   " } as never)).toBe(false);
  });

  it("builds ready and failed work-order rows", () => {
    const workOrders = [
      { id: "ready-1", title: "Ready", status: "READY", agentType: "BACKEND", instructions: "Do it" },
      { id: "ready-2", title: "Needs instructions", status: "READY", agentType: "FRONTEND", instructions: "" },
      { id: "failed-1", title: "Failed", status: "FAILED", agentType: "DATABASE", instructions: "Retry", executionError: "Provider error" },
    ] as never;

    expect(buildReadyWorkOrderRows(workOrders)).toMatchObject([
      {
        id: "ready-1",
        instructionLabel: "Instructions ready",
        instructionTone: "blue",
      },
      {
        id: "ready-2",
        instructionLabel: "Missing instructions",
        instructionTone: "amber",
      },
    ]);

    expect(buildFailedWorkOrderRows(workOrders, "failed-1")).toMatchObject([
      {
        id: "failed-1",
        executionError: "Provider error",
        canRetry: true,
        retrying: true,
      },
    ]);
  });

  it("builds run history labels", () => {
    const rows = buildRunHistoryRows([
      {
        id: "run-1",
        runId: "orchestration-run",
        trigger: "RETRY_FAILED_WORK_ORDER",
        currentNode: "backend",
        status: "FAILED",
        completedWorkOrders: 2,
        failedWorkOrders: 1,
        completedArtifacts: 3,
        executions: [{ id: "execution-1" }, { id: "execution-2" }],
      },
    ] as never);

    expect(rows[0]).toMatchObject({
      runId: "orchestration-run",
      meta: "RETRY_FAILED_WORK_ORDER - backend",
      status: "FAILED",
      completedWorkOrdersLabel: "2 done",
      failedWorkOrdersLabel: "1 failed",
      completedArtifactsLabel: "3 artifacts",
      executionLabel: "2 executions recorded",
    });
  });

  it("builds inline artifact preview only when content is available", () => {
    expect(buildArtifactInlinePreviewModel({
      filePath: "work-orders/backend/API_CONTRACT.json",
      agentType: "BACKEND",
      content: "{}",
    } as never)).toEqual({
      fileName: "API_CONTRACT.json",
      agentType: "BACKEND",
      content: "{}",
    });
    expect(buildArtifactInlinePreviewModel({ filePath: "empty.txt", agentType: "BACKEND" } as never)).toBeNull();
  });

  it("builds aggregate orchestration state with blockers and facts", () => {
    const model = buildBackendOrchestrationPanelModel({
      detail: {
        id: "project-1",
        status: "READY_FOR_BUILD",
        runId: null,
        repoUrl: null,
      } as never,
      status: { status: "RUNNING", currentNode: "frontend" } as never,
      statusLoading: false,
      providerStatus: {
        activeMode: "llm",
        available: false,
        reason: "Missing key",
        githubDelivery: { available: false, owner: null, reason: "Missing GitHub" },
      } as never,
      providerLoading: false,
      providerError: null,
      workOrders: [
        { id: "ready-1", title: "Ready", status: "READY", agentType: "BACKEND", instructions: "Do it" },
        { id: "done-1", title: "Done", status: "COMPLETED", agentType: "FRONTEND", instructions: "Done" },
      ] as never,
      artifacts: [
        { id: "artifact-1", filePath: "work-orders/backend/result.ts", outputReviewStatus: "PENDING" },
      ] as never,
      events: [],
      runs: [],
      runsLoading: false,
      blockers: ["Create READY work orders"],
      starting: false,
      actionId: "",
      previewArtifact: null,
    });

    expect(model).toMatchObject({
      activeProviderLabel: "LLM",
      title: "LLM-provider orchestration",
      providerUnavailable: true,
      githubDeliveryUnavailable: true,
      actionBlocked: true,
      canStartRun: false,
      canRerunReady: false,
      repoLinked: false,
      showBlockers: true,
      blockerMessages: ["Create READY work orders"],
      hasReadyWorkOrders: true,
    });
    expect(model.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Executable work orders", value: "1", tone: "green" }),
      expect.objectContaining({ label: "Generated artifacts", value: "1", tone: "blue" }),
      expect.objectContaining({ label: "PM review queue", value: "1", tone: "amber" }),
    ]));
  });
});
