import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// next/jest rewrites `@/` aliases in import statements (SWC) but NOT in
// jest.mock() string args, so the mock target uses a relative path. The
// component's `@/shared/api/devflow-api` import resolves to the same module.
jest.mock("../../../src/shared/api/devflow-api", () => ({
  controlDevFlowOrchestration: jest.fn().mockResolvedValue({ accepted: true, action: "pause", status: "PAUSED" }),
}));

import { RunControls } from "@/shared/components/orchestration/canvas/run-controls";
import { controlDevFlowOrchestration } from "@/shared/api/devflow-api";

const mockControl = controlDevFlowOrchestration as jest.Mock;

describe("RunControls", () => {
  beforeEach(() => mockControl.mockClear());

  it("calls control with pause when Pause is clicked", async () => {
    render(<RunControls projectId="p1" />);
    await userEvent.click(screen.getByText("Pause"));
    expect(mockControl).toHaveBeenCalledWith("p1", "pause", undefined);
  });

  it("calls control with cancel when Cancel is clicked", async () => {
    render(<RunControls projectId="p1" />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(mockControl).toHaveBeenCalledWith("p1", "cancel", undefined);
  });

  it("disables node-scoped actions until a node is selected", () => {
    const { rerender } = render(<RunControls projectId="p1" />);
    expect(screen.getByText("Retry node")).toBeDisabled();
    rerender(<RunControls projectId="p1" selectedNodeId="backend_agent" />);
    expect(screen.getByText("Retry backend_agent")).not.toBeDisabled();
  });

  it("scopes retry to the selected node", async () => {
    render(<RunControls projectId="p1" selectedNodeId="backend_agent" />);
    await userEvent.click(screen.getByText("Retry backend_agent"));
    expect(mockControl).toHaveBeenCalledWith("p1", "retry_node", { nodeId: "backend_agent" });
  });

  it("does not fire control when disabled", async () => {
    render(<RunControls projectId="p1" disabled />);
    await userEvent.click(screen.getByText("Pause"));
    expect(mockControl).not.toHaveBeenCalled();
  });
});
