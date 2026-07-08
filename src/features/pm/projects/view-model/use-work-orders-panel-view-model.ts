"use client";

import { useState, type ChangeEvent } from "react";
import {
  applyTaskToWorkOrderForm,
  buildBackendWorkOrdersPanelModel,
  EMPTY_BACKEND_WORK_ORDER_FORM,
  workOrderCreatePayload,
  workOrderDispatchBlocker,
  type BackendWorkOrderForm,
  type BackendWorkOrdersPanelModel,
} from "../model/work-orders-panel";
import {
  createDevFlowWorkOrder,
  dispatchDevFlowWorkOrder,
  updateDevFlowWorkOrder,
  type DevFlowArtifact,
  type DevFlowProjectTask,
  type DevFlowWorkOrder,
  type DevFlowWorkOrderAgentType,
  type DevFlowWorkOrderPriority,
  type DevFlowWorkOrderStatus,
} from "@/shared/api/devflow-api";

export interface BackendWorkOrdersPanelInput {
  projectId: string;
  workOrders: DevFlowWorkOrder[];
  tasks: DevFlowProjectTask[];
  artifacts: DevFlowArtifact[];
  loading?: boolean;
  error?: string | null;
  onChanged?: () => void | Promise<void>;
}

export interface BackendWorkOrdersPanelViewModel extends BackendWorkOrdersPanelModel {
  projectId: string;
  form: BackendWorkOrderForm;
  loading: boolean;
  error: string;
  saving: boolean;
  actionId: string;
  workOrderError: string;
  actions: {
    setFormValue: <Key extends keyof BackendWorkOrderForm>(key: Key, value: BackendWorkOrderForm[Key]) => void;
    onTaskChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onInstructionsChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onAgentTypeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onPriorityChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onArtifactChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    createFromTask: (task: DevFlowProjectTask) => void;
    createWorkOrder: () => Promise<void>;
    changeStatus: (workOrder: DevFlowWorkOrder, status: DevFlowWorkOrderStatus) => Promise<void>;
    dispatchWorkOrder: (workOrder: DevFlowWorkOrder) => Promise<void>;
  };
}

export function useBackendWorkOrdersPanelViewModel(
  input: BackendWorkOrdersPanelInput,
): BackendWorkOrdersPanelViewModel {
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [workOrderError, setWorkOrderError] = useState("");
  const [form, setForm] = useState<BackendWorkOrderForm>(EMPTY_BACKEND_WORK_ORDER_FORM);
  const model = buildBackendWorkOrdersPanelModel({
    workOrders: input.workOrders,
    tasks: input.tasks,
    artifacts: input.artifacts,
    form,
  });

  const setFormValue = <Key extends keyof BackendWorkOrderForm>(
    key: Key,
    value: BackendWorkOrderForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createWorkOrder = async () => {
    const payload = workOrderCreatePayload(form);
    if (!payload) {
      setWorkOrderError(model.formIssue);
      return;
    }
    setSaving(true);
    setWorkOrderError("");
    try {
      await createDevFlowWorkOrder(input.projectId, payload);
      setForm(EMPTY_BACKEND_WORK_ORDER_FORM);
      await input.onChanged?.();
    } catch (err) {
      setWorkOrderError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    workOrder: DevFlowWorkOrder,
    status: DevFlowWorkOrderStatus,
  ) => {
    if (["READY", "DISPATCHED", "COMPLETED"].includes(status) && !workOrder.instructions?.trim()) {
      setWorkOrderError("Instructions are required before a work order can be marked ready, dispatched, or completed.");
      return;
    }
    setActionId(workOrder.id);
    setWorkOrderError("");
    try {
      await updateDevFlowWorkOrder(input.projectId, workOrder.id, { status });
      await input.onChanged?.();
    } catch (err) {
      setWorkOrderError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId("");
    }
  };

  const dispatchWorkOrder = async (workOrder: DevFlowWorkOrder) => {
    const blocker = workOrderDispatchBlocker(workOrder);
    if (blocker) {
      setWorkOrderError(blocker);
      return;
    }
    setActionId(workOrder.id);
    setWorkOrderError("");
    try {
      await dispatchDevFlowWorkOrder(input.projectId, workOrder.id);
      await input.onChanged?.();
    } catch (err) {
      setWorkOrderError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId("");
    }
  };

  return {
    ...model,
    projectId: input.projectId,
    form,
    loading: Boolean(input.loading),
    error: input.error ?? "",
    saving,
    actionId,
    workOrderError,
    actions: {
      setFormValue,
      onTaskChange: (event) => {
        const taskId = event.target.value;
        const task = input.tasks.find((candidate) => candidate.id === taskId);
        setForm((current) => ({
          ...current,
          taskId,
          artifactId: task?.artifactId || current.artifactId,
        }));
      },
      onTitleChange: (event) => setFormValue("title", event.target.value),
      onInstructionsChange: (event) => setFormValue("instructions", event.target.value),
      onAgentTypeChange: (event) => setFormValue("agentType", event.target.value as DevFlowWorkOrderAgentType),
      onPriorityChange: (event) => setFormValue("priority", event.target.value as DevFlowWorkOrderPriority),
      onArtifactChange: (event) => setFormValue("artifactId", event.target.value),
      createFromTask: (task) => setForm((current) => applyTaskToWorkOrderForm(current, task)),
      createWorkOrder,
      changeStatus,
      dispatchWorkOrder,
    },
  };
}
