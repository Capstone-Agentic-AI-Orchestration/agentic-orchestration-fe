"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  backendTaskCreatePayload,
  buildBackendTasksPanelModel,
  EMPTY_BACKEND_TASK_FORM,
  type BackendTaskForm,
  type BackendTasksPanelModel,
} from "../model/tasks-panel";
import {
  addDevFlowProjectTaskComment,
  createDevFlowProjectTask,
  getDevFlowProjectTaskActivity,
  updateDevFlowProjectTask,
  type DevFlowArtifact,
  type DevFlowProjectMember,
  type DevFlowProjectTask,
  type DevFlowProjectTaskActivity,
  type DevFlowProjectTaskStatus,
} from "@/shared/api/devflow-api";

export interface BackendTasksPanelInput {
  projectId: string;
  tasks: DevFlowProjectTask[];
  artifacts: DevFlowArtifact[];
  members: DevFlowProjectMember[];
  loading?: boolean;
  error?: string | null;
  /**
   * Progress-only rendering for the PM console: the queue and each task's state stay
   * visible, the create form and the status control do not. POST/PATCH on project tasks
   * are @Roles(DEV, ADMIN), so those controls could only ever produce a 403 here.
   * Commenting stays available — it is how a PM asks a developer about a task.
   */
  readOnly?: boolean;
  onChanged?: () => void | Promise<void>;
}

export interface BackendTasksPanelViewModel extends BackendTasksPanelModel {
  projectId: string;
  readOnly: boolean;
  loading: boolean;
  error: string;
  taskError: string;
  savingTask: boolean;
  selectedTask: DevFlowProjectTask | null;
  activityOpen: boolean;
  activityLoading: boolean;
  activityError: string;
  comment: string;
  commentSaving: boolean;
  form: BackendTaskForm;
  actions: {
    setFormValue: <Key extends keyof BackendTaskForm>(key: Key, value: BackendTaskForm[Key]) => void;
    onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onAssigneeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onArtifactChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    setComment: (value: string) => void;
    onCommentChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onCommentKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    createTask: () => Promise<void>;
    updateTaskStatus: (task: DevFlowProjectTask, status: DevFlowProjectTaskStatus) => Promise<void>;
    openTaskActivity: (task: DevFlowProjectTask) => Promise<void>;
    closeActivity: () => void;
    addComment: () => Promise<void>;
  };
}

export function useBackendTasksPanelViewModel(
  input: BackendTasksPanelInput,
): BackendTasksPanelViewModel {
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [selectedTask, setSelectedTask] = useState<DevFlowProjectTask | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<DevFlowProjectTaskActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [form, setForm] = useState<BackendTaskForm>(EMPTY_BACKEND_TASK_FORM);
  const model = buildBackendTasksPanelModel({
    tasks: input.tasks,
    artifacts: input.artifacts,
    members: input.members,
    form,
    activity,
  });

  const setFormValue = <Key extends keyof BackendTaskForm>(key: Key, value: BackendTaskForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createTask = async () => {
    const payload = backendTaskCreatePayload(form);
    if (!payload) return;
    setSavingTask(true);
    setTaskError("");
    try {
      await createDevFlowProjectTask(input.projectId, payload);
      setForm(EMPTY_BACKEND_TASK_FORM);
      await input.onChanged?.();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingTask(false);
    }
  };

  const openTaskActivity = async (task: DevFlowProjectTask) => {
    setSelectedTask(task);
    setActivityOpen(true);
    setActivity([]);
    setActivityError("");
    setActivityLoading(true);
    try {
      setActivity(await getDevFlowProjectTaskActivity(input.projectId, task.id));
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : String(err));
    } finally {
      setActivityLoading(false);
    }
  };

  const addComment = async () => {
    if (!selectedTask || !comment.trim()) return;
    setCommentSaving(true);
    setActivityError("");
    try {
      await addDevFlowProjectTaskComment(input.projectId, selectedTask.id, {
        message: comment.trim(),
      });
      setComment("");
      setActivity(await getDevFlowProjectTaskActivity(input.projectId, selectedTask.id));
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : String(err));
    } finally {
      setCommentSaving(false);
    }
  };

  const updateTaskStatus = async (
    task: DevFlowProjectTask,
    status: DevFlowProjectTaskStatus,
  ) => {
    setTaskError("");
    try {
      await updateDevFlowProjectTask(input.projectId, task.id, { status });
      await input.onChanged?.();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    ...model,
    projectId: input.projectId,
    readOnly: Boolean(input.readOnly),
    loading: Boolean(input.loading),
    error: input.error ?? "",
    taskError,
    savingTask,
    selectedTask,
    activityOpen,
    activityLoading,
    activityError,
    comment,
    commentSaving,
    form,
    actions: {
      setFormValue,
      onTitleChange: (event) => setFormValue("title", event.target.value),
      onDescriptionChange: (event) => setFormValue("description", event.target.value),
      onAssigneeChange: (event) => setFormValue("assignedToId", event.target.value),
      onArtifactChange: (event) => setFormValue("artifactId", event.target.value),
      setComment,
      onCommentChange: (event) => setComment(event.target.value),
      onCommentKeyDown: (event) => {
        if (event.key === "Enter") void addComment();
      },
      createTask,
      updateTaskStatus,
      openTaskActivity,
      closeActivity: () => setActivityOpen(false),
      addComment,
    },
  };
}
