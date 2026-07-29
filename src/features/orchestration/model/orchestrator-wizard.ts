export type OrchestratorStepId =
  | "brief"
  | "review"
  | "run"
  | "gate-1"
  | "gate-2"
  | "delivery";

export const ORCHESTRATOR_STEP_ORDER: OrchestratorStepId[] = [
  "brief",
  "review",
  "run",
  "gate-1",
  "gate-2",
  "delivery",
];

export type OrchestratorPhaseId = "setup" | "build" | "deliver";

export interface OrchestratorPhase {
  id: OrchestratorPhaseId;
  label: string;
  description: string;
  steps: OrchestratorStepId[];
}

export const ORCHESTRATOR_PHASES: OrchestratorPhase[] = [
  {
    id: "setup",
    label: "Set up",
    description: "Describe the outcome and confirm the direction",
    steps: ["brief", "review"],
  },
  {
    id: "build",
    label: "Build",
    description: "Follow progress and make decisions when asked",
    steps: ["run", "gate-1", "gate-2"],
  },
  {
    id: "deliver",
    label: "Deliver",
    description: "Review and accept the final handoff",
    steps: ["delivery"],
  },
];

export function orchestratorPhaseForStep(step: OrchestratorStepId): OrchestratorPhaseId {
  return ORCHESTRATOR_PHASES.find((phase) => phase.steps.includes(step))?.id ?? "setup";
}

export function orchestratorPhaseTargetStep(
  phaseId: OrchestratorPhaseId,
  recommendedStep: OrchestratorStepId,
): OrchestratorStepId {
  const phase = ORCHESTRATOR_PHASES.find((item) => item.id === phaseId) ?? ORCHESTRATOR_PHASES[0];
  return phase.steps.includes(recommendedStep) ? recommendedStep : phase.steps[0];
}

interface WizardProjectLike {
  status?: string | null;
  brief?: string | null;
  companyName?: string | null;
}

interface WizardStatusLike {
  status?: string | null;
  runId?: string | null;
}

export interface OrchestratorWizardLayoutModel {
  recommendedStep: OrchestratorStepId;
  completedSteps: Set<OrchestratorStepId>;
  maxReachedStep: OrchestratorStepId;
  maxReachedIndex: number;
  currentStepIndex: number;
  currentStepNumber: number;
  onTrack: boolean;
  projectName: string;
}

export function getWizardStepIndex(stepId: OrchestratorStepId): number {
  return ORCHESTRATOR_STEP_ORDER.indexOf(stepId);
}

export function getWizardStepByIndex(index: number): OrchestratorStepId {
  return ORCHESTRATOR_STEP_ORDER[Math.min(Math.max(index, 0), ORCHESTRATOR_STEP_ORDER.length - 1)];
}

export function determineWizardStepFromStatus(
  project: WizardProjectLike | null,
  status: WizardStatusLike | null,
): OrchestratorStepId {
  if (!project) return "brief";

  const projectStatus = project.status ?? status?.status;
  switch (projectStatus) {
    case "PENDING":
      return project.brief?.trim() && project.brief.trim().length > 10 ? "review" : "brief";
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
      return "run";
    case "AWAITING_GATE_1":
      return "gate-1";
    case "GENERATING_CODE":
      return "run";
    case "AWAITING_GATE_2":
      return "gate-2";
    case "COMMITTING":
      return "run";
    case "DELIVERED":
      return "delivery";
    case "FAILED":
      return "run";
    default:
      return project.brief?.trim() && project.brief.trim().length > 10 ? "review" : "brief";
  }
}

export function computeWizardCompletedSteps(
  project: WizardProjectLike | null,
  status: WizardStatusLike | null,
): Set<OrchestratorStepId> {
  const completed = new Set<OrchestratorStepId>();
  if (!project) return completed;

  const projectStatus = project.status ?? status?.status;

  if (project.brief && project.brief.length > 10) completed.add("brief");

  const hasRun =
    status?.runId ||
    projectStatus === "AWAITING_GATE_1" ||
    projectStatus === "GENERATING_CODE" ||
    projectStatus === "AWAITING_GATE_2" ||
    projectStatus === "COMMITTING" ||
    projectStatus === "DELIVERED";
  if (hasRun) {
    completed.add("review");
    completed.add("run");
  }

  if (
    projectStatus === "GENERATING_CODE" ||
    projectStatus === "AWAITING_GATE_2" ||
    projectStatus === "COMMITTING" ||
    projectStatus === "DELIVERED"
  ) {
    completed.add("gate-1");
  }

  if (projectStatus === "COMMITTING" || projectStatus === "DELIVERED") {
    completed.add("gate-2");
  }

  if (projectStatus === "DELIVERED") {
    completed.add("delivery");
  }

  return completed;
}

export function buildOrchestratorWizardLayoutModel(input: {
  project: WizardProjectLike | null;
  status: WizardStatusLike | null;
  currentStep: OrchestratorStepId;
}): OrchestratorWizardLayoutModel {
  const recommendedStep = determineWizardStepFromStatus(input.project, input.status);
  const completedSteps = computeWizardCompletedSteps(input.project, input.status);
  const maxReachedIndex = Math.max(
    getWizardStepIndex(recommendedStep),
    ...Array.from(completedSteps).map((step) => getWizardStepIndex(step)),
  );
  const currentStepIndex = getWizardStepIndex(input.currentStep);

  return {
    recommendedStep,
    completedSteps,
    maxReachedStep: getWizardStepByIndex(maxReachedIndex),
    maxReachedIndex,
    currentStepIndex,
    currentStepNumber: currentStepIndex + 1,
    onTrack: input.currentStep === recommendedStep,
    projectName: input.project?.companyName ?? "Loading...",
  };
}
