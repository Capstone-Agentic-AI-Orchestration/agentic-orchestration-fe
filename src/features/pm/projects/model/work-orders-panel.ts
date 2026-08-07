import type {
  CreateDevFlowWorkOrderInput,
  DevFlowArtifact,
  DevFlowProjectTask,
  DevFlowWorkOrder,
  DevFlowWorkOrderAgentType,
  DevFlowWorkOrderPriority,
  DevFlowWorkOrderStatus,
} from "@/shared/api/devflow-api";
import { formatBackendDate } from "../utils/pm-project-detail.utils";

export const WORK_ORDER_AGENT_OPTIONS: Array<{ value: DevFlowWorkOrderAgentType; label: string }> = [
  { value: "FRONTEND", label: "Frontend" },
  { value: "BACKEND", label: "Backend" },
  { value: "DATABASE", label: "Database" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "CONTRACT", label: "Contract" },
];

export const WORK_ORDER_PRIORITY_OPTIONS: Array<{ value: DevFlowWorkOrderPriority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export const BASE_WORK_ORDER_STATUS_OPTIONS: Array<{ value: DevFlowWorkOrderStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "READY", label: "Ready" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export interface BackendWorkOrderForm {
  title: string;
  instructions: string;
  agentType: DevFlowWorkOrderAgentType;
  /** The configured agent to run this. Empty means the role comes from agentType alone. */
  workspaceAgentId: string;
  priority: DevFlowWorkOrderPriority;
  taskId: string;
  artifactId: string;
}

export interface BackendWorkOrderRow {
  id: string;
  title: string;
  instructions: string | null;
  hasInstructions: boolean;
  agentType: DevFlowWorkOrderAgentType;
  priority: DevFlowWorkOrderPriority;
  status: DevFlowWorkOrderStatus;
  taskLabel: string | null;
  artifactLabel: string | null;
  runLabel: string | null;
  updatedAtLabel: string;
  executionLabel: string | null;
  executionTone: string;
  dispatchBlocker: string;
  statusDisabled: boolean;
  statusOptions: Array<{ value: DevFlowWorkOrderStatus; label: string }>;
  workOrder: DevFlowWorkOrder;
}

export interface BackendWorkOrderTaskShortcut {
  id: string;
  title: string;
  meta: string;
  selected: boolean;
  task: DevFlowProjectTask;
}

export interface BackendWorkOrdersPanelModel {
  workOrderRows: BackendWorkOrderRow[];
  workOrderSubtitle: string;
  hasWorkOrders: boolean;
  taskOptions: Array<{ id: string; label: string }>;
  artifactOptions: Array<{ id: string; label: string }>;
  taskShortcuts: BackendWorkOrderTaskShortcut[];
  selectedTask: DevFlowProjectTask | null;
  selectedArtifact: DevFlowArtifact | null;
  selectedTaskLabel: string | null;
  selectedArtifactLabel: string | null;
  formIssue: string;
  canCreateWorkOrder: boolean;
}

export const EMPTY_BACKEND_WORK_ORDER_FORM: BackendWorkOrderForm = {
  title: "",
  instructions: "",
  agentType: "FRONTEND",
  workspaceAgentId: "",
  priority: "NORMAL",
  taskId: "",
  artifactId: "",
};

export function workOrderFormIssue(form: BackendWorkOrderForm): string {
  if (!form.title.trim()) return "Title is required.";
  if (!form.instructions.trim()) return "Instructions are required before a work order can be actioned.";
  return "";
}

export function workOrderCreatePayload(
  form: BackendWorkOrderForm,
): CreateDevFlowWorkOrderInput | null {
  if (workOrderFormIssue(form)) return null;
  return {
    title: form.title.trim(),
    instructions: form.instructions.trim() || undefined,
    agentType: form.agentType,
    workspaceAgentId: form.workspaceAgentId || undefined,
    priority: form.priority,
    taskId: form.taskId || undefined,
    artifactId: form.artifactId || undefined,
  };
}

export function applyTaskToWorkOrderForm(
  form: BackendWorkOrderForm,
  task: DevFlowProjectTask,
): BackendWorkOrderForm {
  return {
    ...form,
    title: form.title || `Handoff: ${task.title}`,
    instructions: form.instructions || task.description || "",
    taskId: task.id,
    artifactId: task.artifactId || form.artifactId,
  };
}

export function workOrderDispatchBlocker(workOrder: DevFlowWorkOrder): string {
  if (workOrder.status !== "READY") return "Only READY work orders can dispatch.";
  if (!workOrder.instructions?.trim()) return "Instructions are required before dispatch.";
  return "";
}

export function workOrderStatusOptions(
  status: DevFlowWorkOrderStatus,
): Array<{ value: DevFlowWorkOrderStatus; label: string }> {
  const options = [...BASE_WORK_ORDER_STATUS_OPTIONS];
  if (status === "DISPATCHED") options.splice(2, 0, { value: "DISPATCHED", label: "Dispatched" });
  if (status === "COMPLETED") options.splice(2, 0, { value: "COMPLETED", label: "Completed" });
  return options;
}

export function workOrderExecutionLabel(workOrder: DevFlowWorkOrder): {
  label: string | null;
  tone: string;
} {
  if (workOrder.executionError) {
    return { label: `Execution failed: ${workOrder.executionError}`, tone: "#FCA5A5" };
  }
  if (workOrder.executionCompletedAt) {
    return {
      label: `Execution completed ${formatBackendDate(workOrder.executionCompletedAt)}`,
      tone: "var(--text-3)",
    };
  }
  if (workOrder.executionStartedAt) {
    return {
      label: `Execution started ${formatBackendDate(workOrder.executionStartedAt)}`,
      tone: "var(--text-3)",
    };
  }
  return { label: null, tone: "var(--text-3)" };
}

export function buildBackendWorkOrderRows(
  workOrders: DevFlowWorkOrder[],
): BackendWorkOrderRow[] {
  return workOrders.map((workOrder) => {
    const execution = workOrderExecutionLabel(workOrder);
    return {
      id: workOrder.id,
      title: workOrder.title,
      instructions: workOrder.instructions,
      hasInstructions: Boolean(workOrder.instructions),
      agentType: workOrder.agentType,
      priority: workOrder.priority,
      status: workOrder.status,
      taskLabel: workOrder.task?.title ?? null,
      artifactLabel: workOrder.artifact ? workOrder.artifact.displayName || workOrder.artifact.filePath : null,
      runLabel: workOrder.executionRunId ? `Run ${workOrder.executionAttempt || 1}` : null,
      updatedAtLabel: formatBackendDate(workOrder.updatedAt),
      executionLabel: execution.label,
      executionTone: execution.tone,
      dispatchBlocker: workOrderDispatchBlocker(workOrder),
      statusDisabled: ["DISPATCHED", "COMPLETED"].includes(workOrder.status),
      statusOptions: workOrderStatusOptions(workOrder.status),
      workOrder,
    };
  });
}

export function buildWorkOrderTaskShortcuts(input: {
  tasks: DevFlowProjectTask[];
  selectedTaskId: string;
}): BackendWorkOrderTaskShortcut[] {
  return input.tasks.slice(0, 4).map((task) => ({
    id: task.id,
    title: task.title,
    meta: `${task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned"} - ${task.status}`,
    selected: task.id === input.selectedTaskId,
    task,
  }));
}

export function buildBackendWorkOrdersPanelModel(input: {
  workOrders: DevFlowWorkOrder[];
  tasks: DevFlowProjectTask[];
  artifacts: DevFlowArtifact[];
  form: BackendWorkOrderForm;
}): BackendWorkOrdersPanelModel {
  const selectedTask = input.tasks.find((task) => task.id === input.form.taskId) ?? null;
  const selectedArtifact = input.artifacts.find((artifact) => artifact.id === input.form.artifactId) ?? null;
  const formIssue = workOrderFormIssue(input.form);
  return {
    workOrderRows: buildBackendWorkOrderRows(input.workOrders),
    workOrderSubtitle: `${input.workOrders.length} work order${input.workOrders.length === 1 ? "" : "s"} ready for persona handoff`,
    hasWorkOrders: input.workOrders.length > 0,
    taskOptions: input.tasks.map((task) => ({ id: task.id, label: task.title })),
    artifactOptions: input.artifacts.map((artifact) => ({
      id: artifact.id,
      label: artifact.displayName || artifact.filePath,
    })),
    taskShortcuts: buildWorkOrderTaskShortcuts({
      tasks: input.tasks,
      selectedTaskId: input.form.taskId,
    }),
    selectedTask,
    selectedArtifact,
    selectedTaskLabel: selectedTask ? `Task: ${selectedTask.title}` : null,
    selectedArtifactLabel: selectedArtifact
      ? `Artifact: ${selectedArtifact.displayName || selectedArtifact.filePath}`
      : null,
    formIssue,
    canCreateWorkOrder: !formIssue,
  };
}
