export type RunStepDestination = "gate-1" | "gate-2" | "delivery";

interface RunStepProjectLike {
  status?: string | null;
  companyName?: string | null;
}

interface RunStepStatusLike {
  status?: string | null;
}

export interface RunStepState {
  projectStatus: string;
  projectName?: string;
  isAwaitingGate1: boolean;
  isAwaitingGate2: boolean;
  isDelivered: boolean;
  nextLabel: string;
  nextDisabled: boolean;
  destination: RunStepDestination | null;
}

export interface RunFocusCopy {
  eyebrow: string;
  title: string;
  description: string;
  tone: "blue" | "amber" | "red" | "green";
}

export function runFocusCopy(status: string | null | undefined): RunFocusCopy {
  switch (status) {
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
      return {
        eyebrow: "Preparing the plan",
        title: "DevFlow is turning the outcome into a build plan",
        description: "No action is needed yet. You will be asked to approve the plan before implementation begins.",
        tone: "blue",
      };
    case "GENERATING_CODE":
      return {
        eyebrow: "Build in progress",
        title: "The approved plan is being built",
        description: "DevFlow is coordinating the selected team and will pause when the completed build is ready for review.",
        tone: "blue",
      };
    case "COMMITTING":
      return {
        eyebrow: "Preparing delivery",
        title: "The approved build is being prepared for handoff",
        description: "No action is needed. DevFlow is finalizing the repository and delivery record.",
        tone: "amber",
      };
    case "FAILED":
      return {
        eyebrow: "Action needed",
        title: "The build stopped before completion",
        description: "Retry the recoverable work below. Open technical details only if you need the failure evidence.",
        tone: "red",
      };
    case "DELIVERED":
      return {
        eyebrow: "Build complete",
        title: "The project is ready for final delivery review",
        description: "Continue to delivery to review the handoff and record acceptance.",
        tone: "green",
      };
    default:
      return {
        eyebrow: "Build status",
        title: "DevFlow is ready",
        description: "The current project state is synchronized. DevFlow will show the next required decision here.",
        tone: "blue",
      };
  }
}

export function buildRunStepState(input: {
  project: RunStepProjectLike | null;
  status: RunStepStatusLike | null;
}): RunStepState {
  const projectStatus = input.project?.status ?? input.status?.status ?? "PENDING";
  const isAwaitingGate1 = projectStatus === "AWAITING_GATE_1";
  const isAwaitingGate2 = projectStatus === "AWAITING_GATE_2";
  const isDelivered = projectStatus === "DELIVERED";
  const destination = isAwaitingGate1
    ? "gate-1"
    : isAwaitingGate2
      ? "gate-2"
      : isDelivered
        ? "delivery"
        : null;

  return {
    projectStatus,
    projectName: input.project?.companyName ?? undefined,
    isAwaitingGate1,
    isAwaitingGate2,
    isDelivered,
    nextLabel: isAwaitingGate1
      ? "Go to plan review"
      : isAwaitingGate2
        ? "Go to build review"
        : isDelivered
          ? "Go to delivery"
          : "Continue",
    nextDisabled: destination === null,
    destination,
  };
}

export function runStepDestinationPath(
  projectId: string,
  destination: RunStepDestination | null,
): string | null {
  if (!destination) return null;
  return `/pm/orchestrate/${projectId}`;
}
