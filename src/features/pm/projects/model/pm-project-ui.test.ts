import {
  artifactValidationBadge,
  backendReviewBadge,
  backendTaskStatusBadge,
  orchestrationFactBadge,
  orchestrationRunBadge,
  outputReviewBadge,
  personInitials,
  projectTaskStatusColor,
  reviewNoteColors,
  workOrderPriorityBadge,
  workOrderStatusBadge,
} from "./pm-project-ui";

describe("pm project ui model", () => {
  it("maps orchestration, task, and work-order statuses", () => {
    expect(orchestrationRunBadge("SUCCEEDED")).toEqual({ tone: "green", label: "Succeeded" });
    expect(orchestrationRunBadge("UNKNOWN")).toEqual({ tone: "blue", label: "Running" });
    expect(backendTaskStatusBadge("IN_PROGRESS")).toEqual({ tone: "blue", label: "In Progress" });
    expect(workOrderStatusBadge("DISPATCHED")).toEqual({ tone: "purple", label: "Dispatched" });
    expect(projectTaskStatusColor("BLOCKED")).toBe("var(--red)");
  });

  it("maps review and validation badges", () => {
    expect(backendReviewBadge("REVISION_REQUESTED")).toEqual({ tone: "amber", label: "Revision" });
    expect(artifactValidationBadge("FAIL")).toEqual({ tone: "red", label: "Invalid" });
    expect(outputReviewBadge("REWORK_REQUESTED")).toEqual({ tone: "amber", label: "Rework" });
    expect(orchestrationFactBadge("red")).toEqual({ tone: "red", label: "Blocked" });
  });

  it("normalizes priority, initials, and note colors", () => {
    expect(workOrderPriorityBadge("URGENT")).toEqual({ tone: "red", label: "URGENT" });
    expect(workOrderPriorityBadge(undefined)).toEqual({ tone: "blue", label: "NORMAL" });
    expect(personInitials("Ada Lovelace")).toBe("AL");
    expect(personInitials("")).toBe("?");
    expect(reviewNoteColors("blue")).toEqual({
      border: "rgba(79,139,255,.24)",
      background: "rgba(79,139,255,.07)",
    });
  });
});
