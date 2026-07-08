"use client";

import { useEffect, useState } from "react";
import {
  applyKickoffAutoAnalyzeResult,
  buildKickoffForm,
  buildKickoffStepState,
  kickoffPayloadFromForm,
  normalizeKickoffAnalyzeError,
  type KickoffForm,
  type KickoffFormKey,
  type KickoffStepState,
} from "@/features/orchestration/model/kickoff-step";
import { DEFAULT_BRIEF_STACK_KEY } from "@/features/orchestration/model/brief-step";
import {
  autoAnalyzeDevFlowBrief,
  createDevFlowKickoffTasks,
  createDevFlowKickoffWorkOrders,
  updateDevFlowProjectKickoff,
} from "@/shared/api/devflow-api";
import { loadDesignGuidance, saveDesignGuidance } from "@/shared/design-guidance";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";

type KickoffAction = "" | "tasks" | "work-orders";

export interface KickoffStepViewModel extends KickoffStepState {
  projectId: string;
  form: KickoffForm;
  saving: boolean;
  action: KickoffAction;
  error: string;
  saved: boolean;
  analyzing: boolean;
  nextDisabled: boolean;
  actions: {
    setValue: <Key extends KickoffFormKey>(key: Key, value: KickoffForm[Key]) => void;
    save: () => Promise<void>;
    createStarterTasks: () => Promise<void>;
    createStarterWorkOrders: () => Promise<void>;
    autoAnalyze: () => Promise<void>;
  };
}

export function useKickoffStepViewModel(ctx: OrchestratorWizardContextValue): KickoffStepViewModel {
  const { project, projectId, refresh } = ctx;
  const kickoff = project?.kickoff;
  const [form, setForm] = useState(() => buildKickoffForm({
    kickoff,
    project,
    designGuidance: loadDesignGuidance(project?.id),
  }));
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<KickoffAction>("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const state = buildKickoffStepState({ form, kickoff });
  const nextDisabled = saving || action !== "";

  useEffect(() => {
    setForm(buildKickoffForm({
      kickoff: project?.kickoff,
      project,
      designGuidance: loadDesignGuidance(project?.id),
    }));
  }, [project?.id, project?.kickoff?.updatedAt]);

  const setValue = <Key extends KickoffFormKey>(key: Key, value: KickoffForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      saveDesignGuidance(projectId, form.designGuidance);
      await updateDevFlowProjectKickoff(projectId, kickoffPayloadFromForm(form));
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const createStarterTasks = async () => {
    setAction("tasks");
    setError("");
    try {
      await createDevFlowKickoffTasks(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  const createStarterWorkOrders = async () => {
    setAction("work-orders");
    setError("");
    try {
      await createDevFlowKickoffWorkOrders(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  const autoAnalyze = async () => {
    if (!project?.brief || project.brief.trim().length < 3) {
      setError("A project brief with at least 3 characters is required to auto-analyze.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const result = await autoAnalyzeDevFlowBrief({
        companyName: project?.companyName || "",
        brief: project.brief,
        stackKey: project?.stackKey || DEFAULT_BRIEF_STACK_KEY,
        designGuidance: form.designGuidance,
      });
      setForm((current) => applyKickoffAutoAnalyzeResult(current, result));
    } catch (err) {
      setError(normalizeKickoffAnalyzeError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    ...state,
    projectId,
    form,
    saving,
    action,
    error,
    saved,
    analyzing,
    nextDisabled,
    actions: {
      setValue,
      save,
      createStarterTasks,
      createStarterWorkOrders,
      autoAnalyze,
    },
  };
}
