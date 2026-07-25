/**
 * Pure utility functions for PM project detail views.
 * No React dependencies — safe to import anywhere.
 */

export function kickoffFormFromDetail(kickoff: Record<string, unknown>, detail: Record<string, unknown>) {
  return {
    scopeSummary: kickoff.scopeSummary || detail.brief || "",
    milestones: kickoff.milestones || "",
    requiredDocuments: kickoff.requiredDocuments || "",
    techStackNotes: kickoff.techStackNotes || detail.stackKey || "",
    deliveryRoles: kickoff.deliveryRoles || "",
    readinessNotes: kickoff.readinessNotes || "",
    scopeConfirmed: Boolean(kickoff.scopeConfirmed),
    milestonesConfirmed: Boolean(kickoff.milestonesConfirmed),
    documentsConfirmed: Boolean(kickoff.documentsConfirmed),
    techStackConfirmed: Boolean(kickoff.techStackConfirmed),
    rolesConfirmed: Boolean(kickoff.rolesConfirmed),
    clientAccessConfirmed: Boolean(kickoff.clientAccessConfirmed),
    initialTasksCreated: Boolean(kickoff.initialTasksCreated),
    initialWorkOrdersCreated: Boolean(kickoff.initialWorkOrdersCreated),
  };
}

export function clientInviteSummary(invites: Array<{ status: string }> = []): string {
  if (!invites.length) return "No invite linked";
  const accepted = invites.filter((invite) => invite.status === "ACCEPTED").length;
  const pending = invites.filter((invite) => invite.status === "PENDING").length;
  if (accepted && pending) return `${accepted} joined, ${pending} pending`;
  if (accepted) return `${accepted} joined`;
  if (pending) return `${pending} pending`;
  return `${invites.length} invite${invites.length === 1 ? "" : "s"}`;
}

export function projectManagerIds(detail: { createdById?: string; members: Array<{ userId: string; role: string }> }): Set<string> {
  return new Set([
    detail.createdById,
    ...detail.members
      .filter((member) => ["PM", "ADMIN"].includes(member.role))
      .map((member) => member.userId),
  ].filter(Boolean) as string[]);
}

export function orchestrationReadinessBlockers(
  detail: { runId?: string },
  workOrders: Array<{ status: string; instructions?: string }> = [],
  outputsLoading = false,
  requireReadyWorkOrders = false,
): string[] {
  const blockers: string[] = [];
  const readyExecutableWorkOrders = workOrders.filter((wo) => wo.status === "READY" && wo.instructions?.trim());

  if (detail.runId) return blockers;
  if (requireReadyWorkOrders && outputsLoading) {
    blockers.push("Wait for work orders to finish loading before rerunning them.");
  }
  if (requireReadyWorkOrders && !outputsLoading && readyExecutableWorkOrders.length === 0) {
    blockers.push("No READY work orders are available to rerun.");
  }

  return blockers;
}

export function workOrderDispatchBlocker(workOrder: { status: string; instructions?: string }): string {
  if (workOrder.status !== "READY") return "Only READY work orders can dispatch.";
  if (!workOrder.instructions?.trim()) return "Instructions are required before dispatch.";
  return "";
}

export function backendStatusBits(status: string): { label: string; tone: string } {
  const map: Record<string, { label: string; tone: string }> = {
    PENDING: { label: "Pending", tone: "gray" },
    PARSING_REQUIREMENTS: { label: "Parsing requirements", tone: "blue" },
    NEGOTIATING_CONTRACT: { label: "Negotiating contract", tone: "yellow" },
    AWAITING_GATE_1: { label: "Awaiting architecture gate", tone: "yellow" },
    GENERATING_CODE: { label: "Generating code", tone: "blue" },
    AWAITING_GATE_2: { label: "Awaiting code gate", tone: "yellow" },
    COMMITTING: { label: "Committing", tone: "blue" },
    DELIVERED: { label: "Delivered", tone: "green" },
    FAILED: { label: "Failed", tone: "red" },
  };
  return map[status] || { label: status || "Unknown", tone: "gray" };
}

export function githubAutopushStatus(
  detail: { repoUrl?: string; status?: string; runId?: string },
  githubDelivery?: { available?: boolean },
  activeMode?: string,
): { label: string; tone: string } {
  if (detail.repoUrl) return { label: "Pushed to GitHub", tone: "green" };
  if (detail.status === "DELIVERED") return { label: "Delivered, repo missing", tone: "red" };
  if (detail.status === "COMMITTING") return { label: "Pushing now", tone: "blue" };
  if (detail.status === "AWAITING_GATE_2") return { label: "Waiting for Gate 2", tone: "amber" };
  if (activeMode === "llm" && githubDelivery && !githubDelivery.available) {
    return { label: "Blocked by setup", tone: "red" };
  }
  if (activeMode === "llm" && githubDelivery?.available) {
    return { label: "Ready after Gate 2", tone: "green" };
  }
  if (detail.runId) return { label: "Run in progress", tone: "blue" };
  return { label: "Not started", tone: "gray" };
}

export function compactBackendError(message?: string): string {
  if (!message) return "";
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed.message)) return parsed.message.join(" ");
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Plain text API errors are already suitable for display.
  }
  return message;
}

export function formatBackendDate(value?: string | Date | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function groupArtifactsByAgent(artifacts: Array<{ agentType?: string }>): Array<[string, Array<{ agentType?: string }>]> {
  const groups = new Map<string, Array<{ agentType?: string }>>();
  for (const artifact of artifacts) {
    const agent = (artifact.agentType || "unknown").toUpperCase();
    if (!groups.has(agent)) groups.set(agent, []);
    groups.get(agent)!.push(artifact);
  }
  return Array.from(groups.entries());
}

export function orchestrationTriggerLabel(trigger?: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manual start",
    RETRY: "Supervisor retry",
    RECOVERY: "Supervisor recovery",
    SCHEDULED: "Scheduled",
    WEBHOOK: "Webhook",
  };
  return map[trigger || ""] || trigger || "Unknown";
}
