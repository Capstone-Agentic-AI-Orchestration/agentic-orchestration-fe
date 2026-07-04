import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// See run-controls.test for why the mock target is a relative path.
jest.mock("../../../src/shared/api/devflow-api", () => ({
  controlDevFlowOrchestration: jest.fn().mockResolvedValue({ accepted: true }),
}));

import { NodeErrorCard } from "@/shared/components/orchestration/canvas/node-error-card";
import { controlDevFlowOrchestration } from "@/shared/api/devflow-api";
import type { NodeError } from "@/shared/store/orchestration-store";

const mockControl = controlDevFlowOrchestration as jest.Mock;

describe("NodeErrorCard", () => {
  beforeEach(() => mockControl.mockClear());

  it("renders the error code and message", () => {
    const error: NodeError = { code: "NODE_FAILED", severity: "permanent", message: "agent crashed" };
    render(<NodeErrorCard projectId="p1" nodeId="backend_agent" error={error} />);
    expect(screen.getByText("NODE_FAILED")).toBeInTheDocument();
    expect(screen.getByText("agent crashed")).toBeInTheDocument();
  });

  it("renders provided recovery actions and fires them", async () => {
    const error: NodeError = {
      code: "VALIDATION_FAILED",
      severity: "transient",
      message: "contract mismatch",
      recovery: [{ action: "retry_node", label: "Retry backend", nodeId: "backend_agent" }],
    };
    render(<NodeErrorCard projectId="p1" nodeId="backend_agent" error={error} />);
    await userEvent.click(screen.getByText("Retry backend"));
    expect(mockControl).toHaveBeenCalledWith("p1", "retry_node", { nodeId: "backend_agent" });
  });

  it("falls back to Retry/Skip when no recovery actions are provided", async () => {
    const error: NodeError = { code: "NODE_FAILED", severity: "permanent", message: "boom" };
    render(<NodeErrorCard projectId="p1" nodeId="database_agent" error={error} />);
    await userEvent.click(screen.getByText("Skip"));
    expect(mockControl).toHaveBeenCalledWith("p1", "skip_node", { nodeId: "database_agent" });
  });
});
