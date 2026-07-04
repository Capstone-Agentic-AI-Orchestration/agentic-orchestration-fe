import type { DevFlowProjectLifecycle, DevFlowProjectStatus } from "@/shared/api/devflow-api";

export function devflowStatusView(status?: DevFlowProjectStatus | string | null) {
  const map: Record<string, { label: string; tone: "gray" | "blue" | "green" | "amber" | "red" | "purple"; progress: number; stage: string }> = {
    PENDING: { label: "Pending", tone: "gray", progress: 8, stage: "Intake" },
    PARSING_REQUIREMENTS: { label: "Parsing requirements", tone: "blue", progress: 18, stage: "Discovery" },
    NEGOTIATING_CONTRACT: { label: "Negotiating contract", tone: "amber", progress: 30, stage: "Planning" },
    AWAITING_GATE_1: { label: "Awaiting architecture gate", tone: "amber", progress: 42, stage: "Architecture" },
    GENERATING_CODE: { label: "Generating code", tone: "purple", progress: 68, stage: "Development" },
    AWAITING_GATE_2: { label: "Awaiting code gate", tone: "amber", progress: 82, stage: "Review" },
    COMMITTING: { label: "Committing", tone: "blue", progress: 90, stage: "Handover" },
    DELIVERED: { label: "Delivered", tone: "green", progress: 100, stage: "Delivered" },
    FAILED: { label: "Failed", tone: "red", progress: 45, stage: "Needs attention" },
  };

  return map[status || ""] || { label: status || "Unknown", tone: "gray", progress: 0, stage: "Unknown" };
}

export function devflowLifecycleView(project?: { status?: DevFlowProjectStatus | string | null; lifecycle?: DevFlowProjectLifecycle | null } | null) {
  if (project?.lifecycle) {
    return {
      label: project.lifecycle.label,
      tone: normalizeTone(project.lifecycle.tone),
      progress: project.lifecycle.progress,
      stage: project.lifecycle.label,
      nextAction: project.lifecycle.nextAction,
      signals: project.lifecycle.signals,
    };
  }

  const fallback = devflowStatusView(project?.status);
  return {
    ...fallback,
    nextAction: "Open project",
    signals: {
      clientAccepted: false,
      kickoffReady: false,
      orchestrationStarted: false,
      clientReviewOpen: false,
      revisionOpen: false,
      totalTasks: 0,
      openTasks: 0,
      totalWorkOrders: 0,
      activeWorkOrders: 0,
      clientVisibleArtifacts: 0,
    },
  };
}

export function lifecycleProgressColor(tone?: string | null) {
  const map: Record<string, string> = {
    gray: "#94A3B8",
    blue: "#60A5FA",
    purple: "#A78BFA",
    yellow: "#FBBF24",
    amber: "#FBBF24",
    green: "#34D399",
    red: "#F87171",
  };
  return map[tone || ""] || "#94A3B8";
}

function normalizeTone(tone?: string | null) {
  if (tone === "yellow") return "amber";
  return tone || "gray";
}

export function formatDevFlowDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function compactDevFlowError(message?: unknown) {
  if (!message) return "";

  if (message instanceof Error) {
    return message.message;
  }

  if (typeof message === "object" && message && "message" in message) {
    const objectMessage = (message as { message?: unknown }).message;
    if (typeof objectMessage === "string") return objectMessage;
  }

  if (typeof message !== "string") return String(message);

  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed.message)) return parsed.message.join(" ");
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Text responses from the API are already displayable.
  }

  return message;
}

export function projectInitials(name?: string | null) {
  if (!name?.trim()) return "PR";
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PR";
}
