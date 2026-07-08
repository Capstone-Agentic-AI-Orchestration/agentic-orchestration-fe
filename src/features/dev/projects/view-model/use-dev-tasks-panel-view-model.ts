"use client";

import { useMemo, useState } from "react";
import {
  addDevFlowProjectTaskComment,
  getDevFlowProjectTaskActivity,
  type DevFlowProjectTask,
  type DevFlowProjectTaskActivity,
  type DevFlowProjectTaskStatus,
  updateDevFlowProjectTask,
} from "@/shared/api/devflow-api";
import {
  buildDevTasksPanelModel,
  type DevTasksPanelInput,
  type DevTasksPanelModel,
} from "../model/dev-tasks-panel";

export interface DevTasksPanelViewModel extends DevTasksPanelModel {
  activityOpen: boolean;
  actions: {
    updateStatus: (task: DevFlowProjectTask, status: DevFlowProjectTaskStatus) => Promise<void>;
    openActivity: (task: DevFlowProjectTask) => Promise<void>;
    closeActivity: () => void;
    setComment: (comment: string) => void;
    addComment: () => Promise<void>;
  };
}

export function useDevTasksPanelViewModel(input: DevTasksPanelInput): DevTasksPanelViewModel {
  const [taskError, setTaskError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [selectedTask, setSelectedTask] = useState<DevFlowProjectTask | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<DevFlowProjectTaskActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const model = useMemo(
    () => buildDevTasksPanelModel({
      ...input,
      taskError,
      updatingTaskId,
      selectedTask,
      activity,
      activityLoading,
      activityError,
      comment,
      commentSaving,
    }),
    [
      input.projectId,
      input.tasks,
      input.loading,
      input.error,
      taskError,
      updatingTaskId,
      selectedTask,
      activity,
      activityLoading,
      activityError,
      comment,
      commentSaving,
    ],
  );

  const updateStatus = async (task: DevFlowProjectTask, status: DevFlowProjectTaskStatus) => {
    setUpdatingTaskId(task.id);
    setTaskError("");
    try {
      await updateDevFlowProjectTask(input.projectId, task.id, { status });
      await input.onChanged?.();
    } catch (nextError) {
      setTaskError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setUpdatingTaskId("");
    }
  };

  const openActivity = async (task: DevFlowProjectTask) => {
    setSelectedTask(task);
    setActivityOpen(true);
    setActivity([]);
    setActivityError("");
    setActivityLoading(true);
    try {
      setActivity(await getDevFlowProjectTaskActivity(input.projectId, task.id));
    } catch (nextError) {
      setActivityError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setActivityLoading(false);
    }
  };

  const addComment = async () => {
    if (!selectedTask || !comment.trim()) return;
    setCommentSaving(true);
    setActivityError("");
    try {
      await addDevFlowProjectTaskComment(input.projectId, selectedTask.id, { message: comment.trim() });
      setComment("");
      setActivity(await getDevFlowProjectTaskActivity(input.projectId, selectedTask.id));
    } catch (nextError) {
      setActivityError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setCommentSaving(false);
    }
  };

  return {
    ...model,
    activityOpen,
    actions: {
      updateStatus,
      openActivity,
      closeActivity: () => setActivityOpen(false),
      setComment,
      addComment,
    },
  };
}
