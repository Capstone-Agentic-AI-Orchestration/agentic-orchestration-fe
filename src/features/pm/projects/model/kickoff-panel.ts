import type {
  DevFlowProjectDetail,
  DevFlowProjectKickoff,
  UpdateDevFlowProjectKickoffInput,
} from "@/shared/api/devflow-api";
import { clientInviteSummary, formatBackendDate } from "../utils/pm-project-detail.utils";

export const BACKEND_KICKOFF_TEXT_FIELDS = [
  { key: "scopeSummary", label: "Scope summary" },
  { key: "milestones", label: "Milestones" },
  { key: "requiredDocuments", label: "Required documents" },
  { key: "techStackNotes", label: "Tech stack notes" },
  { key: "deliveryRoles", label: "Delivery roles" },
  { key: "readinessNotes", label: "Readiness notes" },
] as const;

export type BackendKickoffTextKey = typeof BACKEND_KICKOFF_TEXT_FIELDS[number]["key"];
export type BackendKickoffChecklistKey =
  | "scopeConfirmed"
  | "milestonesConfirmed"
  | "documentsConfirmed"
  | "techStackConfirmed"
  | "rolesConfirmed"
  | "clientAccessConfirmed"
  | "initialTasksCreated"
  | "initialWorkOrdersCreated";
export type BackendKickoffFormKey = BackendKickoffTextKey | BackendKickoffChecklistKey;

export interface BackendKickoffForm extends Required<UpdateDevFlowProjectKickoffInput> {}

export type BackendKickoffDetail = Pick<
  DevFlowProjectDetail,
  "id" | "brief" | "stackKey" | "kickoff" | "members" | "clientInvites"
>;

export interface BackendKickoffChecklistItem {
  key: BackendKickoffChecklistKey;
  label: string;
  body: string;
  checked: boolean;
}

export interface BackendKickoffInviteRow {
  id: string;
  contactName: string;
  email: string;
  status: string;
  tone: "green" | "yellow" | "red";
  timelineLabel: string;
}

export interface BackendKickoffPanelModel {
  checklist: BackendKickoffChecklistItem[];
  completedChecks: number;
  totalChecks: number;
  ready: boolean;
  statusLabel: string;
  statusTone: "green" | "yellow";
  inviteSubtitle: string;
  inviteRows: BackendKickoffInviteRow[];
  hasInvites: boolean;
  taskCount: number;
  workOrderCount: number;
  outputMessage: string;
  outputTone: string;
}

export function buildBackendKickoffForm(input: {
  detail: BackendKickoffDetail;
  kickoff?: DevFlowProjectKickoff | null;
}): BackendKickoffForm {
  const kickoff = input.kickoff ?? input.detail.kickoff;
  return {
    scopeSummary: kickoff?.scopeSummary || input.detail.brief || "",
    milestones: kickoff?.milestones || "",
    requiredDocuments: kickoff?.requiredDocuments || "",
    techStackNotes: kickoff?.techStackNotes || input.detail.stackKey || "",
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
  };
}

export function buildBackendKickoffChecklist(input: {
  form: BackendKickoffForm;
  detail: BackendKickoffDetail;
  tasks: unknown[];
  workOrders: unknown[];
}): BackendKickoffChecklistItem[] {
  const memberCount = input.detail.members.length;
  return [
    { key: "scopeConfirmed", label: "Scope", body: input.form.scopeSummary || input.detail.brief, checked: input.form.scopeConfirmed },
    { key: "milestonesConfirmed", label: "Milestones", body: input.form.milestones || "No milestones saved", checked: input.form.milestonesConfirmed },
    { key: "documentsConfirmed", label: "Documents", body: input.form.requiredDocuments || "No required documents saved", checked: input.form.documentsConfirmed },
    { key: "techStackConfirmed", label: "Stack", body: input.form.techStackNotes || input.detail.stackKey, checked: input.form.techStackConfirmed },
    {
      key: "rolesConfirmed",
      label: "Roles",
      body: input.form.deliveryRoles || `${memberCount} project member${memberCount === 1 ? "" : "s"}`,
      checked: input.form.rolesConfirmed,
    },
    {
      key: "clientAccessConfirmed",
      label: "Client access",
      body: clientInviteSummary(input.detail.clientInvites),
      checked: input.form.clientAccessConfirmed,
    },
    {
      key: "initialTasksCreated",
      label: "Tasks",
      body: `${input.tasks.length} task${input.tasks.length === 1 ? "" : "s"}`,
      checked: input.form.initialTasksCreated,
    },
    {
      key: "initialWorkOrdersCreated",
      label: "Work orders",
      body: `${input.workOrders.length} work order${input.workOrders.length === 1 ? "" : "s"}`,
      checked: input.form.initialWorkOrdersCreated,
    },
  ];
}

export function buildBackendKickoffInviteRows(detail: BackendKickoffDetail): BackendKickoffInviteRow[] {
  return detail.clientInvites.map((invite) => ({
    id: invite.id,
    contactName: invite.contactName,
    email: invite.email,
    status: invite.status,
    tone: invite.status === "ACCEPTED" ? "green" : invite.status === "PENDING" ? "yellow" : "red",
    timelineLabel: invite.acceptedAt
      ? `Joined ${formatBackendDate(invite.acceptedAt)}`
      : `Invited ${formatBackendDate(invite.createdAt)}`,
  }));
}

export function buildBackendKickoffPanelModel(input: {
  detail: BackendKickoffDetail;
  form: BackendKickoffForm;
  tasks: unknown[];
  workOrders: unknown[];
}): BackendKickoffPanelModel {
  const kickoff = input.detail.kickoff;
  const checklist = buildBackendKickoffChecklist(input);
  const completedChecks = checklist.filter((item) => item.checked).length;
  const ready = kickoff?.status === "READY" || kickoff?.status === "LOCKED";
  const inviteRows = buildBackendKickoffInviteRows(input.detail);
  return {
    checklist,
    completedChecks,
    totalChecks: checklist.length,
    ready,
    statusLabel: ready ? "Ready" : kickoff?.status || "Draft",
    statusTone: ready ? "green" : "yellow",
    inviteSubtitle: `${inviteRows.length} invite${inviteRows.length === 1 ? "" : "s"}`,
    inviteRows,
    hasInvites: inviteRows.length > 0,
    taskCount: input.tasks.length,
    workOrderCount: input.workOrders.length,
    outputMessage: ready
      ? "Orchestration start is available."
      : "Orchestration start unlocks when every kickoff check is saved.",
    outputTone: ready ? "#6EE7B7" : "var(--text-3)",
  };
}
