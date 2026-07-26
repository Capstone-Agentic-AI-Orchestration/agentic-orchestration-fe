"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDevFlowOrchestrationModelDefaults,
  getDevFlowOrchestrationModels,
  type DevFlowGatewayModelCatalog,
  type DevFlowOrchestrationModelSelection,
  type DevFlowOrchestrationModelTarget,
} from "@/shared/api/devflow-api";
import {
  changeDefaultModel,
  changeModelOverride,
  modelSelectionStorageKey,
  parseStoredModelSelection,
  resolveInitialModelSelection,
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
  const [persistLocally, setPersistLocally] = useState(false);
  const [selectionProjectId, setSelectionProjectId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextCatalog = await getDevFlowOrchestrationModels();
      const defaults = await getDevFlowOrchestrationModelDefaults().catch(() => null);
      const stored = typeof window === "undefined"
        ? null
        : parseStoredModelSelection(window.localStorage.getItem(modelSelectionStorageKey(projectId)));
      const nextSelection = resolveInitialModelSelection(
        stored,
        defaults?.selection,
        nextCatalog,
      );
      setCatalog(nextCatalog);
      setSelection(nextSelection);
      setSelectionProjectId(projectId);
      setAdvancedState(Boolean(Object.keys(nextSelection.overrides ?? {}).length));
      setPersistLocally(Boolean(stored));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
    // A project change should load that project's saved selection once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (
      !selection
      || !persistLocally
      || selectionProjectId !== projectId
      || typeof window === "undefined"
    ) return;
    window.localStorage.setItem(modelSelectionStorageKey(projectId), JSON.stringify(selection));
  }, [persistLocally, projectId, selection, selectionProjectId]);

  const setDefaultModel = (model: string) => {
    setPersistLocally(true);
    setSelectionProjectId(projectId);
    setSelection((current) => changeDefaultModel(current, model, catalog));
  };

  const setOverride = (target: DevFlowOrchestrationModelTarget, model: string) => {
    setPersistLocally(true);
    setSelectionProjectId(projectId);
    setSelection((current) => changeModelOverride(current, target, model));
  };

  const setAdvanced = (nextAdvanced: boolean) => {
    setAdvancedState(nextAdvanced);
    if (!nextAdvanced) {
      setPersistLocally(true);
      setSelectionProjectId(projectId);
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
