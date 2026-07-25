"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDevFlowOrchestrationModels,
  type DevFlowGatewayModelCatalog,
  type DevFlowOrchestrationModelSelection,
  type DevFlowOrchestrationModelTarget,
} from "@/shared/api/devflow-api";
import {
  modelSelectionStorageKey,
  parseStoredModelSelection,
  reconcileModelSelection,
} from "@/shared/models/orchestration-model-selection";

export interface OrchestrationModelSelectionController {
  catalog: DevFlowGatewayModelCatalog | null;
  selection: DevFlowOrchestrationModelSelection | null;
  loading: boolean;
  error: string;
  advanced: boolean;
  setDefaultModel: (model: string) => void;
  setOverride: (target: DevFlowOrchestrationModelTarget, model: string) => void;
  setAdvanced: (advanced: boolean) => void;
  refresh: () => Promise<void>;
}

export function useOrchestrationModelSelection(
  projectId: string,
): OrchestrationModelSelectionController {
  const [catalog, setCatalog] = useState<DevFlowGatewayModelCatalog | null>(null);
  const [selection, setSelection] = useState<DevFlowOrchestrationModelSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [advanced, setAdvancedState] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextCatalog = await getDevFlowOrchestrationModels();
      const stored = typeof window === "undefined"
        ? null
        : parseStoredModelSelection(window.localStorage.getItem(modelSelectionStorageKey(projectId)));
      const nextSelection = reconcileModelSelection(stored ?? selection, nextCatalog);
      setCatalog(nextCatalog);
      setSelection(nextSelection);
      setAdvancedState(Boolean(Object.keys(nextSelection.overrides ?? {}).length));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [projectId, selection]);

  useEffect(() => {
    void refresh();
    // A project change should load that project's saved selection once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!selection || typeof window === "undefined") return;
    window.localStorage.setItem(modelSelectionStorageKey(projectId), JSON.stringify(selection));
  }, [projectId, selection]);

  const setDefaultModel = (model: string) => {
    setSelection((current) => current ? reconcileModelSelection(
      { ...current, defaultModel: model },
      catalog ?? {
        models: [],
        defaultModel: model,
        source: "fallback",
        fetchedAt: "",
        warning: null,
      },
    ) : { defaultModel: model });
  };

  const setOverride = (target: DevFlowOrchestrationModelTarget, model: string) => {
    setSelection((current) => {
      if (!current) return current;
      const overrides = { ...(current.overrides ?? {}) };
      if (!model || model === current.defaultModel) delete overrides[target];
      else overrides[target] = model;
      return Object.keys(overrides).length > 0
        ? { ...current, overrides }
        : { defaultModel: current.defaultModel };
    });
  };

  const setAdvanced = (nextAdvanced: boolean) => {
    setAdvancedState(nextAdvanced);
    if (!nextAdvanced) {
      setSelection((current) => current ? { defaultModel: current.defaultModel } : current);
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
  };
}
