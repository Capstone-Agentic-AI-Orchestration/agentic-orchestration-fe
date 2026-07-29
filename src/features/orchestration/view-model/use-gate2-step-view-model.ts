"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  buildGate2ReviewState,
  type Gate2ReviewState,
} from "@/features/orchestration/model/gate-review";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  approveDevFlowGate2,
  getDevFlowProjectArtifact,
} from "@/shared/api/devflow-api";
import { loadDesignGuidance } from "@/shared/design-guidance";

export interface Gate2StepViewModel extends Gate2ReviewState {
  projectId: string;
  designGuidance: ReturnType<typeof loadDesignGuidance>;
  notes: string;
  acting: boolean;
  error: string;
  expandedArtifacts: Record<string, string | null>;
  actions: {
    setNotes: (value: string) => void;
    onNotesChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    approve: (approved: boolean) => Promise<void>;
    expandArtifact: (artifactId: string) => Promise<void>;
  };
}

export function useGate2StepViewModel(ctx: OrchestratorWizardContextValue): Gate2StepViewModel {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, string | null>>({});
  const state = buildGate2ReviewState({ project, status, acting });

  const approve = async (approved: boolean) => {
    setActing(true);
    setError("");
    try {
      await approveDevFlowGate2(projectId, approved, notes.trim() || undefined);
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

  const expandArtifact = async (artifactId: string) => {
    if (expandedArtifacts[artifactId] !== undefined) return;
    setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: null }));
    try {
      const full = await getDevFlowProjectArtifact(projectId, artifactId);
      setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: full.content ?? "" }));
    } catch {
      setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: "Failed to load content" }));
    }
  };

  return {
    ...state,
    projectId,
    designGuidance: loadDesignGuidance(projectId),
    notes,
    acting,
    error,
    expandedArtifacts,
    actions: {
      setNotes,
      onNotesChange: (event) => setNotes(event.target.value),
      approve,
      expandArtifact,
    },
  };
}
