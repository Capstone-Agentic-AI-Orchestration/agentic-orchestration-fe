"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  buildDeliveryReviewPanelModel,
  type DeliveryReviewPanelModel,
} from "@/features/pm/projects/model/delivery-review-panel";
import {
  resolveDevFlowProjectDeliveryRevision,
  type DevFlowDeliveryReadiness,
  type DevFlowProjectDeliveryReview,
} from "@/shared/api/devflow-api";

export interface BackendDeliveryReviewPanelInput {
  projectId: string;
  review?: DevFlowProjectDeliveryReview | null;
  readiness?: DevFlowDeliveryReadiness | null;
  readinessLoading?: boolean;
  readinessError?: string | null;
  onRefreshReadiness?: () => void | Promise<void>;
  onChanged?: () => void | Promise<void>;
}

export interface DeliveryReviewPanelViewModel extends DeliveryReviewPanelModel {
  projectId: string;
  review: DevFlowProjectDeliveryReview | null;
  readiness: DevFlowDeliveryReadiness | null;
  readinessLoading: boolean;
  readinessError: string;
  note: string;
  saving: boolean;
  error: string;
  actions: {
    setNote: (value: string) => void;
    onNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    refreshReadiness: () => void | Promise<void>;
    resolveRevision: () => Promise<void>;
  };
}

export function useDeliveryReviewPanelViewModel(
  input: BackendDeliveryReviewPanelInput,
): DeliveryReviewPanelViewModel {
  const review = input.review ?? null;
  const readiness = input.readiness ?? null;
  const readinessLoading = Boolean(input.readinessLoading);
  const [note, setNote] = useState(review?.resolutionNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const model = buildDeliveryReviewPanelModel({
    review,
    readiness,
    readinessLoading,
  });

  useEffect(() => {
    setNote(review?.resolutionNote || "");
  }, [review?.id, review?.resolutionNote]);

  const resolveRevision = async () => {
    setSaving(true);
    setError("");
    try {
      await resolveDevFlowProjectDeliveryRevision(input.projectId, {
        note: note.trim() || undefined,
      });
      await input.onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    ...model,
    projectId: input.projectId,
    review,
    readiness,
    readinessLoading,
    readinessError: input.readinessError ?? "",
    note,
    saving,
    error,
    actions: {
      setNote,
      onNoteChange: (event) => setNote(event.target.value),
      refreshReadiness: () => input.onRefreshReadiness?.(),
      resolveRevision,
    },
  };
}
