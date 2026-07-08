import type {
  CreateDevFlowProjectTaskInput,
  DevFlowArtifact,
  DevFlowProjectMember,
  DevFlowProjectTask,
  DevFlowProjectTaskActivity,
  DevFlowProjectTaskStatus,
} from "@/shared/api/devflow-api";
import { formatBackendDate } from "../utils/pm-project-detail.utils";

export const PROJECT_TASK_STATUS_OPTIONS: Array<{
  value: DevFlowProjectTaskStatus;
  label: string;
}> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
];

export interface BackendTaskForm {
  title: string;
  description: string;
  assignedToId: string;
  artifactId: string;
}

export interface BackendTaskAssigneeOption {
  userId: string;
  label: string;
}

export interface BackendTaskArtifactOption {
  id: string;
  label: string;
}

export interface BackendTaskRow {
  id: string;
  title: string;
  description: string | null;
  status: DevFlowProjectTaskStatus;
  assigneeLabel: string;
  artifactLabel: string | null;
  task: DevFlowProjectTask;
}

export interface BackendTaskActivityRow {
  id: string;
  actorLabel: string;
  createdAtLabel: string;
  message: string;
}

export interface BackendTasksPanelModel {
  taskRows: BackendTaskRow[];
  taskSubtitle: string;
  hasTasks: boolean;
  assigneeOptions: BackendTaskAssigneeOption[];
  artifactOptions: BackendTaskArtifactOption[];
  canCreateTask: boolean;
  activityRows: BackendTaskActivityRow[];
  hasActivity: boolean;
}

export const EMPTY_BACKEND_TASK_FORM: BackendTaskForm = {
  title: "",
  description: "",
  assignedToId: "",
  artifactId: "",
};

export function buildBackendTaskAssigneeOptions(
  members: DevFlowProjectMember[],
): BackendTaskAssigneeOption[] {
  return members
    .filter((member) => member.role === "DEV")
    .map((member) => ({
      userId: member.userId,
      label: member.user.fullName || member.user.email || member.user.id,
    }));
}

export function buildBackendTaskArtifactOptions(
  artifacts: DevFlowArtifact[],
): BackendTaskArtifactOption[] {
  return artifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.displayName || artifact.filePath,
  }));
}

export function buildBackendTaskRows(tasks: DevFlowProjectTask[]): BackendTaskRow[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeLabel: task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned",
    artifactLabel: task.artifact ? task.artifact.displayName || task.artifact.filePath : null,
    task,
  }));
}

export function buildBackendTaskActivityRows(
  activity: DevFlowProjectTaskActivity[],
): BackendTaskActivityRow[] {
  return activity.map((item) => ({
    id: item.id,
    actorLabel: item.actor?.fullName || item.actor?.email || "System",
    createdAtLabel: formatBackendDate(item.createdAt),
    message: item.message || item.type,
  }));
}

export function backendTaskCreatePayload(
  form: BackendTaskForm,
): CreateDevFlowProjectTaskInput | null {
  const title = form.title.trim();
  if (!title) return null;
  return {
    title,
    description: form.description.trim() || undefined,
    assignedToId: form.assignedToId || undefined,
    artifactId: form.artifactId || undefined,
  };
}

export function buildBackendTasksPanelModel(input: {
  tasks: DevFlowProjectTask[];
  artifacts: DevFlowArtifact[];
  members: DevFlowProjectMember[];
  form: BackendTaskForm;
  activity: DevFlowProjectTaskActivity[];
}): BackendTasksPanelModel {
  const taskRows = buildBackendTaskRows(input.tasks);
  const activityRows = buildBackendTaskActivityRows(input.activity);
  return {
    taskRows,
    taskSubtitle: `${input.tasks.length} backend task${input.tasks.length === 1 ? "" : "s"}`,
    hasTasks: input.tasks.length > 0,
    assigneeOptions: buildBackendTaskAssigneeOptions(input.members),
    artifactOptions: buildBackendTaskArtifactOptions(input.artifacts),
    canCreateTask: Boolean(backendTaskCreatePayload(input.form)),
    activityRows,
    hasActivity: activityRows.length > 0,
  };
}
