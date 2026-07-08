"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  buildDeliveryStepState,
  type DeliveryStepState,
} from "@/features/orchestration/model/delivery-step";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  acceptDevFlowProjectDelivery,
  getDevFlowDeliveryReadiness,
  requestDevFlowProjectDeliveryRevision,
} from "@/shared/api/devflow-api";

export interface DeliveryStepViewModel extends DeliveryStepState {
  projectId: string;
  readiness: any | null;
  loadingReadiness: boolean;
  notes: string;
  acting: boolean;
  error: string;
  success: string;
  actions: {
    setNotes: (value: string) => void;
    onNotesChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    accept: () => Promise<void>;
    requestRevision: () => Promise<void>;
    refresh: () => Promise<void>;
  };
}

export function useDeliveryStepViewModel(ctx: OrchestratorWizardContextValue): DeliveryStepViewModel {
  const { project, projectId, status, refresh } = ctx;
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(true);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingReadiness(true);
    getDevFlowDeliveryReadiness(projectId)
      .then((result) => {
        if (active) setReadiness(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoadingReadiness(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const state = buildDeliveryStepState({
    project,
    status,
    readiness,
    loadingReadiness,
    acting,
  });

  const accept = async () => {
    setActing(true);
    setError("");
    setSuccess("");
    try {
      await acceptDevFlowProjectDelivery(projectId, { note: notes.trim() || undefined });
      setSuccess("Delivery accepted. The project is now complete.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  const requestRevision = async () => {
    setActing(true);
    setError("");
    setSuccess("");
    try {
      await requestDevFlowProjectDeliveryRevision(projectId, { note: notes.trim() || "Revision requested" });
      setSuccess("Revision request sent to the development team.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  return {
    ...state,
    projectId,
    readiness,
    loadingReadiness,
    notes,
    acting,
    error,
    success,
    actions: {
      setNotes,
      onNotesChange: (event) => setNotes(event.target.value),
      accept,
      requestRevision,
      refresh,
    },
  };
}
