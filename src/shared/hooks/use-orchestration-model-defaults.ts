"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDevFlowOrchestrationModelDefaults,
  getDevFlowOrchestrationModels,
  updateDevFlowOrchestrationModelDefaults,
  type DevFlowGatewayModelCatalog,
  type DevFlowOrchestrationModelSelection,
  type DevFlowOrchestrationModelTarget,
} from "@/shared/api/devflow-api";
import type { OrchestrationModelSelectionController } from "@/shared/hooks/use-orchestration-model-selection";
import {
  changeDefaultModel,
  changeModelOverride,
  reconcileModelSelection,
} from "@/shared/models/orchestration-model-selection";

export interface OrchestrationModelDefaultsController extends OrchestrationModelSelectionController {
  saving: boolean;
  saved: boolean;
  saveError: string;
  warning: string | null;
  updatedAt: string | null;
  save: () => Promise<void>;
  restoreRecommended: () => void;
}

export function useOrchestrationModelDefaults(): OrchestrationModelDefaultsController {
  const [catalog, setCatalog] = useState<DevFlowGatewayModelCatalog | null>(null);
  const [selection, setSelection] = useState<DevFlowOrchestrationModelSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [advanced, setAdvancedState] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setSaveError("");
    setSaved(false);
    try {
      const [nextCatalog, defaults] = await Promise.all([
        getDevFlowOrchestrationModels(),
        getDevFlowOrchestrationModelDefaults(),
      ]);
      const nextSelection = reconcileModelSelection(defaults.selection, nextCatalog);
      setCatalog(nextCatalog);
      setSelection(nextSelection);
      setAdvancedState(Boolean(Object.keys(nextSelection.overrides ?? {}).length));
      setWarning(defaults.warning);
      setUpdatedAt(defaults.updatedAt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setDefaultModel = (model: string) => {
    setSaved(false);
    setSaveError("");
    setSelection((current) => changeDefaultModel(current, model, catalog));
  };

  const setOverride = (target: DevFlowOrchestrationModelTarget, model: string) => {
    setSaved(false);
    setSaveError("");
    setSelection((current) => changeModelOverride(current, target, model));
  };

  const setAdvanced = (nextAdvanced: boolean) => {
    setAdvancedState(nextAdvanced);
    setSaved(false);
    if (!nextAdvanced) {
      setSelection((current) => current ? { defaultModel: current.defaultModel } : current);
    }
  };

  const restoreRecommended = () => {
    if (!catalog) return;
    setSelection({ defaultModel: catalog.defaultModel });
    setAdvancedState(false);
    setSaved(false);
    setSaveError("");
    setWarning(null);
  };

  const save = async () => {
    if (!selection) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const result = await updateDevFlowOrchestrationModelDefaults(selection);
      const nextSelection = reconcileModelSelection(result.selection, catalog ?? {
        models: [],
        defaultModel: result.selection.defaultModel,
        source: "fallback",
        fetchedAt: "",
        warning: null,
      });
      setSelection(nextSelection);
      setAdvancedState(Boolean(Object.keys(nextSelection.overrides ?? {}).length));
      setWarning(result.warning);
      setUpdatedAt(result.updatedAt);
      setSaved(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  return {
    catalog,
    selection,
    loading,
    error,
    advanced,
    setDefaultModel,
    setOverride,
    setAdvanced,
    refresh,
    saving,
    saved,
    saveError,
    warning,
    updatedAt,
    save,
    restoreRecommended,
  };
}
