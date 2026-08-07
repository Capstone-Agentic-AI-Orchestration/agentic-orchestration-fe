import type {
  DevFlowProjectTask,
  DevFlowProjectTaskActivity,
  DevFlowProjectTaskActivityType,
  DevFlowProjectTaskStatus,
} from "@/shared/api/devflow-api";
import { formatDevFlowDate } from "@/shared/utils/devflow-projects";

export type DevTaskBadgeTone = "green" | "amber" | "gray" | "red" | "blue";

export interface DevTaskBadgeView {
  tone: DevTaskBadgeTone;
  label: string;
}

export interface DevTaskRevisionCallout {
  requestedAtLabel: string | null;
  note: string | null;
}

export interface DevTaskRow {
  id: string;
  title: string;
  description: string | null;
  status: DevFlowProjectTaskStatus;
  statusBadge: DevTaskBadgeView;
  artifactLabel: string | null;
  revision: DevTaskRevisionCallout | null;
  updating: boolean;
  task: DevFlowProjectTask;
}

export interface DevTaskActivityRowModel {
  id: string;
  actorName: string;
  label: string;
  createdAtLabel: string;
  message: string | null;
  isComment: boolean;
}

export interface DevTaskActivityModalModel {
  taskTitle: string;
  taskDescription: string | null;
  rows: DevTaskActivityRowModel[];
  loading: boolean;
  error: string | null;
  empty: boolean;
  comment: string;
  commentSaving: boolean;
  postDisabled: boolean;
}

export interface DevTasksPanelModel {
  loading: boolean;
  error: string | null;
  taskError: string | null;
  empty: boolean;
  rows: DevTaskRow[];
  activityModal: DevTaskActivityModalModel | null;
}

export interface DevTasksPanelInput {
  projectId: string;
  tasks: DevFlowProjectTask[];
  loading?: boolean;
  error?: string | null;
  onChanged?: () => void | Promise<void>;
}

export function devTaskStatusBadgeView(status?: DevFlowProjectTaskStatus): DevTaskBadgeView {
  const map: Record<DevFlowProjectTaskStatus, DevTaskBadgeView> = {
    BACKLOG: { tone: "gray", label: "Backlog" },
    TODO: { tone: "gray", label: "To do" },
    IN_PROGRESS: { tone: "blue", label: "In progress" },
    IN_REVIEW: { tone: "amber", label: "In review" },
    DONE: { tone: "green", label: "Done" },
    BLOCKED: { tone: "red", label: "Blocked" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };

  return map[status || "TODO"] || map.TODO;
}

export function devTaskActivityLabel(type: DevFlowProjectTaskActivityType | string): string {
  const map: Record<DevFlowProjectTaskActivityType, string> = {
    TASK_CREATED: "created task",
    STATUS_CHANGED: "changed status",
    ASSIGNEE_CHANGED: "changed assignee",
    ARTIFACT_CHANGED: "changed artifact link",
    COMMENT: "commented",
  };

  return map[type as DevFlowProjectTaskActivityType] || type;
}

export function buildDevTaskRows(tasks: DevFlowProjectTask[], updatingTaskId = ""): DevTaskRow[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    statusBadge: devTaskStatusBadgeView(task.status),
    artifactLabel: task.artifact ? task.artifact.displayName || task.artifact.filePath : null,
    revision: task.artifact?.reviewStatus === "REVISION_REQUESTED"
      ? {
        requestedAtLabel: task.artifact.reviewedAt ? `Requested ${formatDevFlowDate(task.artifact.reviewedAt)}` : null,
        note: task.artifact.reviewNote || null,
      }
      : null,
    updating: updatingTaskId === task.id,
    task,
  }));
}

export function buildDevTaskActivityRows(activity: DevFlowProjectTaskActivity[]): DevTaskActivityRowModel[] {
  return activity.map((item) => ({
    id: item.id,
    actorName: item.actor?.fullName || item.actor?.email || "System",
    label: devTaskActivityLabel(item.type),
    createdAtLabel: formatDevFlowDate(item.createdAt),
    message: item.message,
    isComment: item.type === "COMMENT",
  }));
}

export function buildDevTaskActivityModalModel(input: {
  selectedTask: DevFlowProjectTask | null;
  activity: DevFlowProjectTaskActivity[];
  loading?: boolean;
  error?: string | null;
  comment?: string;
  commentSaving?: boolean;
}): DevTaskActivityModalModel | null {
  if (!input.selectedTask) return null;

  const rows = buildDevTaskActivityRows(input.activity);
  const comment = input.comment || "";
  const loading = Boolean(input.loading);
  const error = input.error || null;

  return {
    taskTitle: input.selectedTask.title,
    taskDescription: input.selectedTask.description,
    rows,
    loading,
    error,
    empty: !loading && !error && rows.length === 0,
    comment,
    commentSaving: Boolean(input.commentSaving),
    postDisabled: Boolean(input.commentSaving) || comment.trim().length === 0,
  };
}

export function buildDevTasksPanelModel(input: DevTasksPanelInput & {
  taskError?: string | null;
  updatingTaskId?: string;
  selectedTask?: DevFlowProjectTask | null;
  activity?: DevFlowProjectTaskActivity[];
  activityLoading?: boolean;
  activityError?: string | null;
  comment?: string;
  commentSaving?: boolean;
}): DevTasksPanelModel {
  const rows = buildDevTaskRows(input.tasks, input.updatingTaskId || "");

  return {
    loading: Boolean(input.loading),
    error: input.error || null,
    taskError: input.taskError || null,
    empty: !input.loading && !input.error && rows.length === 0,
    rows,
    activityModal: buildDevTaskActivityModalModel({
      selectedTask: input.selectedTask || null,
      activity: input.activity || [],
      loading: input.activityLoading,
      error: input.activityError,
      comment: input.comment,
      commentSaving: input.commentSaving,
    }),
  };
}
