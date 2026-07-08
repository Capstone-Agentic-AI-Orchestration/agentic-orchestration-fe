export type ProjectBadgeTone = "gray" | "blue" | "purple" | "green" | "amber" | "red";

export interface ProjectBadgeModel {
  tone: ProjectBadgeTone;
  label: string;
}

export function orchestrationRunBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    SUCCEEDED: { tone: "green", label: "Succeeded" },
    RUNNING: { tone: "blue", label: "Running" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };
  return map[status || "RUNNING"] || map.RUNNING;
}

export function orchestrationFactBadge(tone?: string | null): ProjectBadgeModel {
  if (tone === "green") return { tone: "green", label: "OK" };
  if (tone === "amber") return { tone: "amber", label: "Review" };
  if (tone === "red") return { tone: "red", label: "Blocked" };
  return { tone: "gray", label: "Live" };
}

export function projectTaskStatusColor(status?: string | null): string {
  const colors: Record<string, string> = {
    TODO: "var(--text-3)",
    IN_PROGRESS: "var(--blue)",
    DONE: "var(--green)",
    BLOCKED: "var(--red)",
  };
  return colors[status || "TODO"] || colors.TODO;
}

export function backendTaskStatusBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    TODO: { tone: "gray", label: "To Do" },
    IN_PROGRESS: { tone: "blue", label: "In Progress" },
    DONE: { tone: "green", label: "Done" },
    BLOCKED: { tone: "red", label: "Blocked" },
  };
  return map[status || "TODO"] || map.TODO;
}

export function workOrderStatusBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    DRAFT: { tone: "gray", label: "Draft" },
    READY: { tone: "blue", label: "Ready" },
    DISPATCHED: { tone: "purple", label: "Dispatched" },
    COMPLETED: { tone: "green", label: "Completed" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };
  return map[status || "DRAFT"] || map.DRAFT;
}

export function workOrderPriorityBadge(priority?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    LOW: { tone: "gray", label: "LOW" },
    NORMAL: { tone: "blue", label: "NORMAL" },
    HIGH: { tone: "amber", label: "HIGH" },
    URGENT: { tone: "red", label: "URGENT" },
  };
  return map[priority || "NORMAL"] || { tone: "blue", label: priority || "Normal" };
}

export function backendReviewBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    PENDING: { tone: "gray", label: "Pending" },
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision" },
  };
  return map[status || "PENDING"] || map.PENDING;
}

export function artifactValidationBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    PASS: { tone: "green", label: "Valid" },
    FAIL: { tone: "red", label: "Invalid" },
    PENDING: { tone: "gray", label: "Unchecked" },
  };
  return map[status || "PENDING"] || map.PENDING;
}

export function outputReviewBadge(status?: string | null): ProjectBadgeModel {
  const map: Record<string, ProjectBadgeModel> = {
    PENDING: { tone: "gray", label: "Awaiting" },
    APPROVED: { tone: "green", label: "Approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework" },
  };
  return map[status || "PENDING"] || map.PENDING;
}

export function personInitials(name?: string | null): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export function reviewNoteColors(tone?: string | null): { border: string; background: string } {
  if (tone === "green") {
    return { border: "rgba(16,185,129,.24)", background: "rgba(16,185,129,.07)" };
  }
  if (tone === "blue") {
    return { border: "rgba(79,139,255,.24)", background: "rgba(79,139,255,.07)" };
  }
  return { border: "rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)" };
}
