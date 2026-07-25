"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  buildBriefAnalyzeInput,
  buildBriefStepState,
  DEFAULT_BRIEF_STACK_KEY,
  type BriefStepState,
} from "@/features/orchestration/model/brief-step";
import type {
  DevFlowAutoAnalyzeResult,
  DevFlowDesignGuidance,
} from "@/shared/api/devflow-api";
import { updateDevFlowProject } from "@/shared/api/devflow-api";
import { requestFastBriefAnalysis } from "@/shared/ai/brief-analysis";
import { loadDesignGuidance, saveDesignGuidance } from "@/shared/design-guidance";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import { normalizeBriefAnalyzeError } from "@/features/orchestration/model/brief-step";

export interface BriefStepViewModel extends BriefStepState {
  projectId: string;
  companyName: string;
  brief: string;
  stackKey: string;
  designGuidance: DevFlowDesignGuidance;
  analyzing: boolean;
  analyzeError: string;
  analyzeResult: DevFlowAutoAnalyzeResult | null;
  saving: boolean;
  saveError: string;
  saved: boolean;
  actions: {
    setCompanyName: (value: string) => void;
    onCompanyNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    setBrief: (value: string) => void;
    onBriefChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    setStackKey: (value: string) => void;
    onStackKeyChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    setDesignGuidance: (value: DevFlowDesignGuidance) => void;
    analyze: () => Promise<void>;
    applyEnhanced: () => void;
    discardAnalysis: () => void;
    save: () => Promise<boolean>;
  };
}

export function useBriefStepViewModel(ctx: OrchestratorWizardContextValue): BriefStepViewModel {
  const { project, projectId, refresh } = ctx;
  const [companyName, setCompanyName] = useState(project?.companyName ?? "");
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [stackKey, setStackKey] = useState(project?.stackKey ?? DEFAULT_BRIEF_STACK_KEY);
  const [designGuidance, setDesignGuidance] = useState<DevFlowDesignGuidance>(() => loadDesignGuidance(projectId));
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<DevFlowAutoAnalyzeResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const analyzeRequestRef = useRef(0);
  const state = buildBriefStepState({ companyName, brief, analyzing, analyzeResult });

  const analyze = async () => {
    const requestId = analyzeRequestRef.current + 1;
    analyzeRequestRef.current = requestId;
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeResult(null);
    try {
      const result = await requestFastBriefAnalysis(buildBriefAnalyzeInput({
        companyName,
        brief,
        stackKey,
        designGuidance,
      }));
      if (analyzeRequestRef.current !== requestId) return;
      setAnalyzeResult(result);
    } catch (err) {
      if (analyzeRequestRef.current !== requestId) return;
      setAnalyzeError(normalizeBriefAnalyzeError(err));
    } finally {
      if (analyzeRequestRef.current === requestId) {
        setAnalyzing(false);
      }
    }
  };

  const applyEnhanced = () => {
    if (!analyzeResult) return;
    setBrief(analyzeResult.enhancedBrief);
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      saveDesignGuidance(projectId, designGuidance);
      await updateDevFlowProject(projectId, { companyName, brief, stackKey });
      setSaved(true);
      await refresh();
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    ...state,
    projectId,
    companyName,
    brief,
    stackKey,
    designGuidance,
    analyzing,
    analyzeError,
    analyzeResult,
    saving,
    saveError,
    saved,
    actions: {
      setCompanyName,
      onCompanyNameChange: (event) => setCompanyName(event.target.value),
      setBrief,
      onBriefChange: (event) => setBrief(event.target.value),
      setStackKey,
      onStackKeyChange: (event) => setStackKey(event.target.value),
      setDesignGuidance,
      analyze,
      applyEnhanced,
      discardAnalysis: () => setAnalyzeResult(null),
      save,
    },
  };
}
