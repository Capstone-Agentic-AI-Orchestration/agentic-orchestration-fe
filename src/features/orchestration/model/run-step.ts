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
  return `/pm/orchestrate/${projectId}/${destination}`;
}
