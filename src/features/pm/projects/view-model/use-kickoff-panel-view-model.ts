"use client";

import { useEffect, useState } from "react";
import {
  buildBackendKickoffForm,
  buildBackendKickoffPanelModel,
  type BackendKickoffDetail,
  type BackendKickoffForm,
  type BackendKickoffFormKey,
  type BackendKickoffPanelModel,
} from "../model/kickoff-panel";
import {
  createDevFlowKickoffTasks,
  createDevFlowKickoffWorkOrders,
  updateDevFlowProjectKickoff,
  type DevFlowCollaborationDocument,
} from "@/shared/api/devflow-api";

type KickoffAction = "" | "tasks" | "work-orders";

export interface BackendKickoffPanelInput {
  detail: BackendKickoffDetail;
  tasks: unknown[];
  workOrders: unknown[];
  /** Drives the Documents check from what was actually received rather than from a text field. */
  documents?: DevFlowCollaborationDocument[];
  loading?: boolean;
  error?: string | null;
  onChanged?: () => void | Promise<void>;
}

export interface BackendKickoffPanelViewModel extends BackendKickoffPanelModel {
  detail: BackendKickoffDetail;
  form: BackendKickoffForm;
  loading: boolean;
  error: string;
  kickoffError: string;
  saving: boolean;
  action: KickoffAction;
  actions: {
    setValue: <Key extends BackendKickoffFormKey>(key: Key, value: BackendKickoffForm[Key]) => void;
    saveKickoff: () => Promise<void>;
    createStarterTasks: () => Promise<void>;
    createStarterWorkOrders: () => Promise<void>;
  };
}

export function useBackendKickoffPanelViewModel(
  input: BackendKickoffPanelInput,
): BackendKickoffPanelViewModel {
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<KickoffAction>("");
  const [kickoffError, setKickoffError] = useState("");
  const [form, setForm] = useState(() => buildBackendKickoffForm({
    kickoff: input.detail.kickoff,
    detail: input.detail,
  }));
  const loading = Boolean(input.loading);
  const model = buildBackendKickoffPanelModel({
    detail: input.detail,
    form,
    tasks: input.tasks,
    workOrders: input.workOrders,
    documents: (input.documents ?? []).map((document) => ({
      // A link-only record has no stored file, so there is nothing to extract or to read.
      isFile: Boolean(document.fileName || document.extraction),
      extraction: document.extraction?.status ?? (document.fileName ? "PENDING" : "NOT_APPLICABLE"),
    })),
  });

  useEffect(() => {
    setForm(buildBackendKickoffForm({
      kickoff: input.detail.kickoff,
      detail: input.detail,
    }));
  }, [input.detail.id, input.detail.kickoff?.updatedAt]);

  const setValue = <Key extends BackendKickoffFormKey>(key: Key, value: BackendKickoffForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveKickoff = async () => {
    setSaving(true);
    setKickoffError("");
    try {
      await updateDevFlowProjectKickoff(input.detail.id, form);
      await input.onChanged?.();
    } catch (err) {
      setKickoffError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const createStarterTasks = async () => {
    setAction("tasks");
    setKickoffError("");
    try {
      await createDevFlowKickoffTasks(input.detail.id);
      await input.onChanged?.();
    } catch (err) {
      setKickoffError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  const createStarterWorkOrders = async () => {
    setAction("work-orders");
    setKickoffError("");
    try {
      await createDevFlowKickoffWorkOrders(input.detail.id);
      await input.onChanged?.();
    } catch (err) {
      setKickoffError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  return {
    ...model,
    detail: input.detail,
    form,
    loading,
    error: input.error ?? "",
    kickoffError,
    saving,
    action,
    actions: {
      setValue,
      saveKickoff,
      createStarterTasks,
      createStarterWorkOrders,
    },
  };
}
