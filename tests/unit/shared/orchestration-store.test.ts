import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import {
  ORCHESTRATION_PROTOCOL_VERSION as V,
  type OrchestrationEvent,
} from "@/shared/api/orchestration-events";

function dispatch(event: OrchestrationEvent) {
  useOrchestrationStore.getState().applyEvent(event);
}

const base = { v: V, projectId: "p1", runId: "r1", ts: 1000 } as const;

describe("orchestration store applyEvent", () => {
  beforeEach(() => {
    useOrchestrationStore.getState().reset();
  });

  it("reduces run.status into orchestrationState", () => {
    dispatch({ ...base, type: "run.status", status: "GENERATING_CODE", currentNode: "backend_agent" });
    const s = useOrchestrationStore.getState().orchestrationState;
    expect(s).toMatchObject({ status: "GENERATING_CODE", currentNode: "backend_agent", runId: "r1" });
  });

  it("tracks node lifecycle phase and clears error on non-error phase", () => {
    dispatch({ ...base, type: "run.error", nodeId: "backend_agent", code: "NODE_FAILED", severity: "permanent", message: "boom" });
    expect(useOrchestrationStore.getState().nodeStates.backend_agent.error?.code).toBe("NODE_FAILED");

    dispatch({ ...base, type: "node.lifecycle", nodeId: "backend_agent", phase: "entering" });
    const node = useOrchestrationStore.getState().nodeStates.backend_agent;
    expect(node.phase).toBe("entering");
    expect(node.error).toBeNull();
  });

  it("records progress pct and label", () => {
    dispatch({ ...base, type: "node.progress", nodeId: "frontend_agent", pct: 45, label: "auth module" });
    const node = useOrchestrationStore.getState().nodeStates.frontend_agent;
    expect(node.progressPct).toBe(45);
    expect(node.progressLabel).toBe("auth module");
  });

  it("merges telemetry from separate timing and token events", () => {
    dispatch({ ...base, type: "node.telemetry", nodeId: "backend_agent", wallMs: 1500 });
    dispatch({ ...base, type: "node.telemetry", nodeId: "backend_agent", inputTokens: 100, outputTokens: 50, model: "claude" });
    const t = useOrchestrationStore.getState().nodeStates.backend_agent.telemetry;
    expect(t).toMatchObject({ wallMs: 1500, inputTokens: 100, outputTokens: 50, model: "claude" });
  });

  it("appends agent stream chunks and logs tool-call/decision to the activity log", () => {
    dispatch({
      ...base,
      type: "agent.stream",
      nodeId: "database_agent",
      chunks: [
        { nodeId: "database_agent", runId: "r1", type: "token", chunk: "x" },
        { nodeId: "database_agent", runId: "r1", type: "decision", chunk: "designing schema" },
      ],
    });
    const state = useOrchestrationStore.getState();
    expect(state.agentStreams.database_agent.chunks).toHaveLength(2);
    expect(state.activityLog.some((l) => l.description === "designing schema" && l.type === "agent")).toBe(true);
  });

  it("keeps a contiguous token buffer per agent across stream batches", () => {
    dispatch({
      ...base,
      type: "agent.stream",
      nodeId: "frontend_agent",
      chunks: [
        { nodeId: "frontend_agent", runId: "r1", type: "token", chunk: "function " },
        { nodeId: "frontend_agent", runId: "r1", type: "token", chunk: "App()" },
      ],
    });
    dispatch({
      ...base,
      ts: 1050,
      type: "agent.stream",
      nodeId: "frontend_agent",
      chunks: [
        { nodeId: "frontend_agent", runId: "r1", type: "token", chunk: " { return null; }" },
      ],
    });

    const stream = useOrchestrationStore.getState().agentStreams.frontend_agent;
    expect(stream.buffer).toBe("function App() { return null; }");
    expect(stream.chunks.map((c) => c.timestamp)).toEqual([1000, 1000, 1050]);
  });

  it("clears visible stream state when a different run starts", () => {
    dispatch({ ...base, type: "run.status", status: "GENERATING_CODE", currentNode: "frontend_agent" });
    dispatch({
      ...base,
      type: "agent.stream",
      nodeId: "frontend_agent",
      chunks: [{ nodeId: "frontend_agent", runId: "r1", type: "token", chunk: "old output" }],
    });
    dispatch({ ...base, type: "node.progress", nodeId: "frontend_agent", pct: 40, label: "old run" });
    dispatch({
      ...base,
      type: "agent.stream",
      nodeId: "frontend_agent",
      chunks: [{ nodeId: "frontend_agent", runId: "r1", type: "decision", chunk: "old decision" }],
    });

    dispatch({
      ...base,
      runId: "r2",
      ts: 2000,
      type: "run.status",
      status: "GENERATING_CODE",
      currentNode: "backend_agent",
    });

    const state = useOrchestrationStore.getState();
    expect(state.orchestrationState?.runId).toBe("r2");
    expect(state.agentStreams).toEqual({});
    expect(state.nodeStates).toEqual({});
    expect(state.activityLog).toEqual([]);
  });

  it("ignores late stream chunks from an older run", () => {
    dispatch({ ...base, type: "run.status", status: "GENERATING_CODE", currentNode: "frontend_agent" });
    dispatch({
      ...base,
      runId: "r2",
      ts: 2000,
      type: "run.status",
      status: "GENERATING_CODE",
      currentNode: "backend_agent",
    });
    dispatch({
      ...base,
      ts: 2100,
      type: "agent.stream",
      nodeId: "frontend_agent",
      chunks: [{ nodeId: "frontend_agent", runId: "r1", type: "token", chunk: "late old output" }],
    });
    dispatch({
      ...base,
      runId: "r2",
      ts: 2200,
      type: "agent.stream",
      nodeId: "backend_agent",
      chunks: [{ nodeId: "backend_agent", runId: "r2", type: "token", chunk: "new output" }],
    });

    const state = useOrchestrationStore.getState();
    expect(state.agentStreams.frontend_agent).toBeUndefined();
    expect(state.agentStreams.backend_agent.buffer).toBe("new output");
  });

  it("ignores late node updates and errors from an older run", () => {
    dispatch({ ...base, type: "run.status", status: "GENERATING_CODE", currentNode: "frontend_agent" });
    dispatch({
      ...base,
      runId: "r2",
      ts: 2000,
      type: "run.status",
      status: "GENERATING_CODE",
      currentNode: "backend_agent",
    });

    dispatch({ ...base, ts: 2100, type: "node.lifecycle", nodeId: "frontend_agent", phase: "entering" });
    dispatch({ ...base, ts: 2200, type: "node.progress", nodeId: "frontend_agent", pct: 90, label: "late progress" });
    dispatch({
      ...base,
      ts: 2300,
      type: "run.error",
      nodeId: "frontend_agent",
      code: "NODE_FAILED",
      severity: "transient",
      message: "late failure",
    });
    dispatch({ ...base, runId: "r2", ts: 2400, type: "node.progress", nodeId: "backend_agent", pct: 25, label: "current progress" });

    const state = useOrchestrationStore.getState();
    expect(state.nodeStates.frontend_agent).toBeUndefined();
    expect(state.nodeStates.backend_agent.progressLabel).toBe("current progress");
    expect(state.activityLog.some((entry) => entry.description.includes("late failure"))).toBe(false);
  });

  it("accepts telemetry without a run id for backwards-compatible metric updates", () => {
    dispatch({ ...base, type: "run.status", status: "GENERATING_CODE", currentNode: "backend_agent" });
    dispatch({
      v: V,
      projectId: "p1",
      ts: 1500,
      type: "node.telemetry",
      nodeId: "backend_agent",
      outputTokens: 42,
      model: "compat-model",
    });

    const telemetry = useOrchestrationStore.getState().nodeStates.backend_agent.telemetry;
    expect(telemetry).toMatchObject({ outputTokens: 42, model: "compat-model" });
  });

  it("stores a node error with recovery actions", () => {
    dispatch({
      ...base,
      type: "run.error",
      nodeId: "frontend_agent",
      code: "VALIDATION_FAILED",
      severity: "transient",
      message: "contract mismatch",
      recovery: [{ action: "retry_node", label: "Retry", nodeId: "frontend_agent" }],
    });
    const node = useOrchestrationStore.getState().nodeStates.frontend_agent;
    expect(node.phase).toBe("error");
    expect(node.error?.recovery?.[0].action).toBe("retry_node");
  });

  it("run.error without a nodeId only logs (no node state)", () => {
    dispatch({ ...base, type: "run.error", code: "CANCELLED", severity: "permanent", message: "cancelled" });
    const state = useOrchestrationStore.getState();
    expect(Object.keys(state.nodeStates)).toHaveLength(0);
    expect(state.activityLog.some((l) => l.description.includes("CANCELLED"))).toBe(true);
  });
});
