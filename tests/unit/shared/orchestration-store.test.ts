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
