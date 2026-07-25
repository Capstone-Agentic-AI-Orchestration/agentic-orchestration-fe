export type ProjectNextActionStatus =
  | "PENDING"
  | "PARSING_REQUIREMENTS"
  | "NEGOTIATING_CONTRACT"
  | "AWAITING_GATE_1"
  | "GENERATING_CODE"
  | "AWAITING_GATE_2"
  | "COMMITTING"
  | "DELIVERED"
  | "FAILED"
  | string;

export type ProjectNextActionKind = "blocked" | "waiting" | "running" | "idle" | "done";
export type ProjectNextActionTone = "green" | "amber" | "red" | "blue" | "yellow";
export type ProjectNextActionButtonVariant = "primary" | "secondary";

export type ProjectNextActionHeroActionId =
  | "openRepository"
  | "reviewContract"
  | "rejectContract"
  | "reviewArtifacts"
  | "requestChanges"
  | "retry"
  | "start";

export interface ProjectNextActionHeroActionModel {
  id: ProjectNextActionHeroActionId;
  label: string;
  variant: ProjectNextActionButtonVariant;
}

export interface ProjectNextActionHeroModel {
  kind: ProjectNextActionKind;
  badge: {
    tone: ProjectNextActionTone;
    label: string;
  };
  headline: string;
  detail: string | null;
  cta: ProjectNextActionHeroActionModel | null;
  secondary: ProjectNextActionHeroActionModel | null;
}

export interface ProjectNextActionHeroInput {
  status: ProjectNextActionStatus;
  runId?: string | null;
  repoUrl?: string | null;
  artifactCount: number;
  orchestrationBlockers: string[];
  providerAvailable?: boolean;
  providerReason?: string;
  lastActivity?: string;
  isStarting?: boolean;
  canRejectGate1?: boolean;
  canRejectGate2?: boolean;
}

const RUNNING_STEP_LABELS: Record<string, string> = {
  PARSING_REQUIREMENTS: "Parsing your brief",
  NEGOTIATING_CONTRACT: "Generating the project contract",
  GENERATING_CODE: "Building your application",
  COMMITTING: "Pushing to GitHub",
};

export function buildProjectNextActionHeroModel(
  input: ProjectNextActionHeroInput,
): ProjectNextActionHeroModel {
  const {
    status,
    runId,
    repoUrl,
    artifactCount,
    orchestrationBlockers,
    providerAvailable,
  } = input;

  if (status === "DELIVERED" && repoUrl) {
    return {
      kind: "done",
      badge: { tone: "green", label: "Delivered" },
      headline: "This project is live on GitHub.",
      detail: "Share the repo link with your client and close out the engagement.",
      cta: { id: "openRepository", label: "Open repository", variant: "secondary" },
      secondary: null,
    };
  }

  if (status === "AWAITING_GATE_1") {
    return {
      kind: "waiting",
      badge: { tone: "amber", label: "Architecture review" },
      headline: "The contract is ready for your review.",
      detail: "Approving starts parallel code generation across all 4 agents. Rejecting aborts the run; you can provide notes to improve the contract.",
      cta: { id: "reviewContract", label: "Review contract", variant: "primary" },
      secondary: input.canRejectGate1
        ? { id: "rejectContract", label: "Reject", variant: "secondary" }
        : null,
    };
  }

  if (status === "AWAITING_GATE_2") {
    return {
      kind: "waiting",
      badge: { tone: "amber", label: "Code review" },
      headline: artifactCount === 1
        ? "1 artifact is ready for review."
        : `All ${artifactCount} artifacts are ready for review.`,
      detail: "Approving commits everything to GitHub. Rejecting lets the agents retry with your feedback.",
      cta: { id: "reviewArtifacts", label: "Review artifacts", variant: "primary" },
      secondary: input.canRejectGate2
        ? { id: "requestChanges", label: "Request changes", variant: "secondary" }
        : null,
    };
  }

  if (status === "FAILED") {
    return {
      kind: "blocked",
      badge: { tone: "red", label: "Failed" },
      headline: "The orchestration run failed.",
      detail: input.providerReason || "Check the activity log and retry the run. Agents will pick up where they left off.",
      cta: { id: "retry", label: "Retry", variant: "primary" },
      secondary: null,
    };
  }

  if (RUNNING_STEP_LABELS[status] || runId) {
    const step = RUNNING_STEP_LABELS[status] || "Working";
    return {
      kind: "running",
      badge: { tone: "blue", label: "In progress" },
      headline: `${step}...`,
      detail: input.lastActivity || "AI agents are working on your project.",
      cta: null,
      secondary: null,
    };
  }

  if (providerAvailable === false) {
    return {
      kind: "blocked",
      badge: { tone: "red", label: "Provider unavailable" },
      headline: "The AI provider is not configured.",
      detail: input.providerReason || "Check your LLM API keys in the admin settings.",
      cta: null,
      secondary: null,
    };
  }

  if (orchestrationBlockers.length > 0) {
    return {
      kind: "blocked",
      badge: { tone: "yellow", label: "Not ready" },
      headline: orchestrationBlockers[0],
      detail: orchestrationBlockers.length > 1
        ? `+ ${orchestrationBlockers.length - 1} more issue${orchestrationBlockers.length > 2 ? "s" : ""} to resolve`
        : null,
      cta: null,
      secondary: null,
    };
  }

  return {
    kind: "idle",
    badge: { tone: "green", label: "Ready" },
    headline: "Ready to review and start.",
    detail: "DevFlow prepares the agent tasks automatically, then pauses for your approval before code generation.",
    cta: {
      id: "start",
      label: input.isStarting ? "Starting..." : "Start planning",
      variant: "primary",
    },
    secondary: null,
  };
}
