"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  buildGate1ReviewState,
  type Gate1ReviewState,
} from "@/features/orchestration/model/gate-review";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import { approveDevFlowGate1 } from "@/shared/api/devflow-api";
import { loadDesignGuidance } from "@/shared/design-guidance";

export interface Gate1StepViewModel extends Gate1ReviewState {
  projectId: string;
  designGuidance: ReturnType<typeof loadDesignGuidance>;
  notes: string;
  acting: boolean;
  error: string;
  actions: {
    setNotes: (value: string) => void;
    onNotesChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    approve: (approved: boolean) => Promise<void>;
  };
}

export function useGate1StepViewModel(ctx: OrchestratorWizardContextValue): Gate1StepViewModel {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const state = buildGate1ReviewState({ project, status, acting });

  const approve = async (approved: boolean) => {
    setActing(true);
    setError("");
    try {
      await approveDevFlowGate1(projectId, approved, notes.trim() || undefined);
      await refresh();
      if (approved) {
        router.push(`/pm/orchestrate/${projectId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  return {
    ...state,
    projectId,
    designGuidance: loadDesignGuidance(projectId),
    notes,
    acting,
    error,
    actions: {
      setNotes,
      onNotesChange: (event) => setNotes(event.target.value),
      approve,
    },
  };
}
