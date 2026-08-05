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
  /**
   * Whether the viewer may start runs and decide gates. False for a PM: the backend answers
   * 403 on every build route for them, so offering "Start planning" or "Review contract"
   * would promise an action that cannot succeed. When false the same states are reported as
   * status — what is happening and who it is waiting on — with no call to action.
   *
   * Defaults to true so the developer console, which does own these actions, needs no flag.
   */
  canBuild?: boolean;
}

const RUNNING_STEP_LABELS: Record<string, string> = {
  PARSING_REQUIREMENTS: "Parsing your brief",
  NEGOTIATING_CONTRACT: "Generating the project contract",
  GENERATING_CODE: "Building your application",
  COMMITTING: "Pushing to GitHub",
};


const DELIVERED_MODEL: ProjectNextActionHeroModel = {
  kind: "done",
  badge: { tone: "green", label: "Delivered" },
  headline: "This project is live on GitHub.",
  detail: "Share the repo link with your client and close out the engagement.",
  cta: { id: "openRepository", label: "Open repository", variant: "secondary" },
  secondary: null,
};

/**
 * Splits on who is looking, because the same project state means different things to the
 * two consoles. The builder is told what to do next; the observer is told what is happening
 * and who it is waiting on. Keeping them as one function meant a ternary on every field and
 * made it easy to leave a PM a button the backend would refuse.
 */
export function buildProjectNextActionHeroModel(
  input: ProjectNextActionHeroInput,
): ProjectNextActionHeroModel {
  return (input.canBuild ?? true) ? buildBuilderModel(input) : buildObserverModel(input);
}

/** The developer (or admin) view: every state that has an action offers it. */
function buildBuilderModel(input: ProjectNextActionHeroInput): ProjectNextActionHeroModel {
  const { status, runId, repoUrl, artifactCount, orchestrationBlockers, providerAvailable } = input;

  if (status === "DELIVERED" && repoUrl) return DELIVERED_MODEL;

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
      headline: artifactsReadyLine(artifactCount),
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

  const inFlight = runningModel(input, status, runId);
  if (inFlight) return inFlight;

  if (providerAvailable === false) return providerUnavailableModel(input);
  if (orchestrationBlockers.length > 0) return blockedModel(orchestrationBlockers);

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

/**
 * The PM view: status only. The single CTA it ever offers is the repository link, because
 * that is the one thing on this card a PM is allowed to act on.
 */
function buildObserverModel(input: ProjectNextActionHeroInput): ProjectNextActionHeroModel {
  const { status, runId, repoUrl, artifactCount, orchestrationBlockers, providerAvailable } = input;

  if (status === "DELIVERED" && repoUrl) return DELIVERED_MODEL;

  if (status === "AWAITING_GATE_1") {
    return {
      kind: "waiting",
      badge: { tone: "amber", label: "Architecture review" },
      headline: "The contract is with the developer for review.",
      detail: "Code generation starts once the developer approves gate 1. Nothing is needed from you.",
      cta: null,
      secondary: null,
    };
  }

  if (status === "AWAITING_GATE_2") {
    return {
      kind: "waiting",
      badge: { tone: "amber", label: "Code review" },
      headline: "The build is with the developer for review.",
      detail: `${artifactsReadyLine(artifactCount)} The developer approves gate 2 before anything is committed to GitHub.`,
      cta: null,
      secondary: null,
    };
  }

  if (status === "FAILED") {
    return {
      kind: "blocked",
      badge: { tone: "red", label: "Failed" },
      headline: "The orchestration run failed.",
      detail: input.providerReason || "The developer can retry the run; agents pick up where they left off.",
      cta: null,
      secondary: null,
    };
  }

  const inFlight = runningModel(input, status, runId);
  if (inFlight) return inFlight;

  if (providerAvailable === false) return providerUnavailableModel(input);
  if (orchestrationBlockers.length > 0) return blockedModel(orchestrationBlockers);

  return {
    kind: "idle",
    badge: { tone: "green", label: "Ready" },
    headline: "Ready for the developer to start the build.",
    detail: repoUrl
      ? "The repository is provisioned. A developer starts the run from their workspace."
      : "Create the project repository so a developer can start the run.",
    cta: null,
    secondary: null,
  };
}

function artifactsReadyLine(artifactCount: number): string {
  return artifactCount === 1
    ? "1 artifact is ready for review."
    : `All ${artifactCount} artifacts are ready for review.`;
}

/** Shared by both roles: a run in flight has no action for anyone, only progress. */
function runningModel(
  input: ProjectNextActionHeroInput,
  status: ProjectNextActionStatus,
  runId?: string | null,
): ProjectNextActionHeroModel | null {
  if (!RUNNING_STEP_LABELS[status] && !runId) return null;
  return {
    kind: "running",
    badge: { tone: "blue", label: "In progress" },
    headline: `${RUNNING_STEP_LABELS[status] || "Working"}...`,
    detail: input.lastActivity || "AI agents are working on your project.",
    cta: null,
    secondary: null,
  };
}

function providerUnavailableModel(input: ProjectNextActionHeroInput): ProjectNextActionHeroModel {
  return {
    kind: "blocked",
    badge: { tone: "red", label: "Provider unavailable" },
    headline: "The AI provider is not configured.",
    detail: input.providerReason || "Check your LLM API keys in the admin settings.",
    cta: null,
    secondary: null,
  };
}

function blockedModel(orchestrationBlockers: string[]): ProjectNextActionHeroModel {
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
