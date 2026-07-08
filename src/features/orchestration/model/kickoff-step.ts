import type {
  DevFlowAutoAnalyzeResult,
  DevFlowDesignGuidance,
  DevFlowProjectDetail,
  DevFlowProjectKickoff,
} from "@/shared/api/devflow-api";

export const KICKOFF_CHECKLIST_FIELDS = [
  { key: "scopeConfirmed", label: "Scope confirmed", desc: "Scope summary reviewed" },
  { key: "milestonesConfirmed", label: "Milestones defined", desc: "Delivery milestones documented" },
  { key: "documentsConfirmed", label: "Documents listed", desc: "Required documents identified" },
  { key: "techStackConfirmed", label: "Tech stack confirmed", desc: "Stack notes reviewed" },
  { key: "rolesConfirmed", label: "Roles assigned", desc: "Delivery roles defined" },
  { key: "clientAccessConfirmed", label: "Client access set up", desc: "Client invite configured" },
  { key: "initialTasksCreated", label: "Starter tasks created", desc: "Initial tasks generated" },
  { key: "initialWorkOrdersCreated", label: "Starter agent tasks created", desc: "Initial agent tasks generated" },
] as const;

export const KICKOFF_TEXT_FIELDS = [
  { key: "scopeSummary", label: "Scope summary" },
  { key: "milestones", label: "Milestones" },
  { key: "requiredDocuments", label: "Required documents" },
  { key: "techStackNotes", label: "Tech stack notes" },
  { key: "deliveryRoles", label: "Delivery roles" },
  { key: "readinessNotes", label: "Readiness notes" },
] as const;

export type KickoffChecklistKey = typeof KICKOFF_CHECKLIST_FIELDS[number]["key"];
export type KickoffTextKey = typeof KICKOFF_TEXT_FIELDS[number]["key"];
export type KickoffFormKey = KickoffChecklistKey | KickoffTextKey | "designGuidance";

export interface KickoffForm {
  scopeSummary: string;
  milestones: string;
  requiredDocuments: string;
  techStackNotes: string;
  deliveryRoles: string;
  readinessNotes: string;
  scopeConfirmed: boolean;
  milestonesConfirmed: boolean;
  documentsConfirmed: boolean;
  techStackConfirmed: boolean;
  rolesConfirmed: boolean;
  clientAccessConfirmed: boolean;
  initialTasksCreated: boolean;
  initialWorkOrdersCreated: boolean;
  designGuidance: DevFlowDesignGuidance;
}

export interface KickoffStepState {
  completedChecks: number;
  totalChecks: number;
  ready: boolean;
  statusLabel: string;
}

export function buildKickoffForm(input: {
  kickoff?: DevFlowProjectKickoff | null;
  project?: Pick<DevFlowProjectDetail, "brief" | "stackKey"> | null;
  designGuidance: DevFlowDesignGuidance;
}): KickoffForm {
  const { kickoff, project, designGuidance } = input;
  return {
    scopeSummary: kickoff?.scopeSummary || project?.brief || "",
    milestones: kickoff?.milestones || "",
    requiredDocuments: kickoff?.requiredDocuments || "",
    techStackNotes: kickoff?.techStackNotes || project?.stackKey || "",
    deliveryRoles: kickoff?.deliveryRoles || "",
    readinessNotes: kickoff?.readinessNotes || "",
    scopeConfirmed: Boolean(kickoff?.scopeConfirmed),
    milestonesConfirmed: Boolean(kickoff?.milestonesConfirmed),
    documentsConfirmed: Boolean(kickoff?.documentsConfirmed),
    techStackConfirmed: Boolean(kickoff?.techStackConfirmed),
    rolesConfirmed: Boolean(kickoff?.rolesConfirmed),
    clientAccessConfirmed: Boolean(kickoff?.clientAccessConfirmed),
    initialTasksCreated: Boolean(kickoff?.initialTasksCreated),
    initialWorkOrdersCreated: Boolean(kickoff?.initialWorkOrdersCreated),
    designGuidance,
  };
}

export function buildKickoffStepState(input: {
  form: KickoffForm;
  kickoff?: Pick<DevFlowProjectKickoff, "status"> | null;
}): KickoffStepState {
  const completedChecks = KICKOFF_CHECKLIST_FIELDS.filter((item) => input.form[item.key]).length;
  const ready = input.kickoff?.status === "READY" || input.kickoff?.status === "LOCKED";
  return {
    completedChecks,
    totalChecks: KICKOFF_CHECKLIST_FIELDS.length,
    ready,
    statusLabel: ready ? "Ready" : input.kickoff?.status || "Draft",
  };
}

export function applyKickoffAutoAnalyzeResult(
  form: KickoffForm,
  result: DevFlowAutoAnalyzeResult,
): KickoffForm {
  return {
    ...form,
    scopeSummary: result.enhancedBrief,
    milestones: result.suggestedFeatures.map((feature) => `- ${feature}`).join("\n"),
    techStackNotes: [
      `Frontend: ${result.suggestedTechStack.frontend}`,
      `Backend: ${result.suggestedTechStack.backend}`,
      `Database: ${result.suggestedTechStack.database}`,
      `Styling: ${result.suggestedTechStack.styling}`,
      `Complexity: ${result.complexity}`,
      `Est. files: ${result.estimatedFiles}`,
    ].join("\n"),
    deliveryRoles: `PM oversight\nDeveloper team (${result.suggestedFeatures.length}+ feature areas)\nClient reviewer`,
  };
}

export function kickoffPayloadFromForm(form: KickoffForm): Omit<KickoffForm, "designGuidance"> {
  const { designGuidance: _designGuidance, ...payload } = form;
  return payload;
}

export function normalizeKickoffAnalyzeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const details = typeof error === "object" && error !== null && "details" in error
    ? String((error as { details?: unknown }).details ?? "")
    : "";
  const combined = `${message} ${details}`;
  return combined.includes("API key") || combined.includes("not configured") || combined.includes("not available")
    ? "Auto-analyze requires an LLM API key. Ask an admin to configure a provider under Admin &gt; Providers."
    : message;
}
