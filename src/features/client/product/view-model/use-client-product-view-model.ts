"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  acceptDevFlowProjectDelivery,
  getDevFlowDeliveryReadiness,
  requestDevFlowProjectDeliveryRevision,
  reviewDevFlowArtifact,
  type DevFlowArtifact,
  type DevFlowArtifactReviewStatus,
  type DevFlowDeliveryReadiness,
} from "@/shared/api/devflow-api";
import { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import {
  buildClientProductModel,
  type ClientProductModel,
  type ClientProductTab,
} from "../model/client-product";

export interface ClientProductViewModel extends ClientProductModel {
  tab: ClientProductTab;
  approveOpen: boolean;
  revisionOpen: boolean;
  deliveryNote: string;
  deliveryError: string;
  deliverySaving: boolean;
  deliveryReadiness: DevFlowDeliveryReadiness | null;
  deliveryReadinessLoading: boolean;
  deliveryReadinessError: string;
  reviewing: boolean;
  reviewError: string;
  revisionArtifact: DevFlowArtifact | null;
  revisionNote: string;
  actions: {
    setTab: (tab: ClientProductTab) => void;
    refresh: () => Promise<void>;
    refreshDeliveryReadiness: () => Promise<void>;
    openApprove: () => void;
    closeApprove: () => void;
    openRevision: () => void;
    closeRevision: () => void;
    onDeliveryNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    acceptDelivery: () => Promise<void>;
    requestRevision: () => Promise<void>;
    reviewArtifact: (artifact: DevFlowArtifact, reviewStatus: Exclude<DevFlowArtifactReviewStatus, "PENDING">, reviewNote?: string) => Promise<void>;
    openArtifactRevision: (artifact: DevFlowArtifact) => void;
    closeArtifactRevision: () => void;
    onRevisionNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
}

export function useClientProductViewModel(): ClientProductViewModel {
  const [tab, setTab] = useState<ClientProductTab>("web");
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryReadiness, setDeliveryReadiness] = useState<DevFlowDeliveryReadiness | null>(null);
  const [deliveryReadinessLoading, setDeliveryReadinessLoading] = useState(false);
  const [deliveryReadinessError, setDeliveryReadinessError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [revisionArtifact, setRevisionArtifact] = useState<DevFlowArtifact | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const {
    selectedProject,
    selectedProjectLoading,
    selectedProjectError,
    refreshProjects,
    refreshSelectedProject,
  } = useSelectedDevFlowProject();
  const outputs = useDevFlowProjectOutputs(selectedProject?.id, {
    includeDocuments: true,
    includeEvents: true,
  });

  const refreshDeliveryReadiness = async () => {
    if (!selectedProject?.id) {
      setDeliveryReadiness(null);
      return;
    }
    setDeliveryReadinessLoading(true);
    setDeliveryReadinessError("");
    try {
      setDeliveryReadiness(await getDevFlowDeliveryReadiness(selectedProject.id));
    } catch (nextError) {
      setDeliveryReadiness(null);
      setDeliveryReadinessError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliveryReadinessLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!selectedProject?.id) {
      setDeliveryReadiness(null);
      setDeliveryReadinessError("");
      setDeliveryReadinessLoading(false);
      return () => {
        active = false;
      };
    }
    setDeliveryReadinessLoading(true);
    setDeliveryReadinessError("");
    getDevFlowDeliveryReadiness(selectedProject.id)
      .then((readiness) => {
        if (!active) return;
        setDeliveryReadiness(readiness);
      })
      .catch((nextError) => {
        if (!active) return;
        setDeliveryReadiness(null);
        setDeliveryReadinessError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        if (!active) return;
        setDeliveryReadinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProject?.id]);

  const refresh = async () => {
    await Promise.all([
      refreshProjects(),
      refreshSelectedProject?.(),
      outputs.refresh(),
      refreshDeliveryReadiness(),
    ]);
  };

  const model = buildClientProductModel({
    selectedProject,
    selectedProjectLoading,
    selectedProjectError,
    artifacts: outputs.artifacts,
    documents: outputs.documents,
    events: outputs.events,
    deliveryReadiness,
    deliveryReadinessLoading,
    deliveryReadinessError,
  });

  const acceptDelivery = async () => {
    if (model.deliveryBlockers.length) {
      setDeliveryError(model.deliveryBlockers[0]);
      return;
    }
    if (!selectedProject) return;
    setDeliverySaving(true);
    setDeliveryError("");
    try {
      await acceptDevFlowProjectDelivery(selectedProject.id, { note: deliveryNote.trim() || undefined });
      setApproveOpen(false);
      setDeliveryNote("");
      await refresh();
    } catch (nextError) {
      setDeliveryError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliverySaving(false);
    }
  };

  const requestRevision = async () => {
    if (!selectedProject) return;
    setDeliverySaving(true);
    setDeliveryError("");
    try {
      await requestDevFlowProjectDeliveryRevision(selectedProject.id, { note: deliveryNote.trim() });
      setRevisionOpen(false);
      setDeliveryNote("");
      await refresh();
    } catch (nextError) {
      setDeliveryError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliverySaving(false);
    }
  };

  const reviewArtifactAction = async (
    artifact: DevFlowArtifact,
    reviewStatus: Exclude<DevFlowArtifactReviewStatus, "PENDING">,
    reviewNote = "",
  ) => {
    setReviewing(true);
    setReviewError("");
    try {
      await reviewDevFlowArtifact(artifact.projectId, artifact.id, {
        reviewStatus,
        reviewNote: reviewNote.trim() || undefined,
      });
      setRevisionArtifact(null);
      setRevisionNote("");
      await outputs.refresh();
    } catch (nextError) {
      setReviewError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setReviewing(false);
    }
  };

  return {
    ...model,
    tab,
    approveOpen,
    revisionOpen,
    deliveryNote,
    deliveryError,
    deliverySaving,
    deliveryReadiness,
    deliveryReadinessLoading,
    deliveryReadinessError,
    reviewing,
    reviewError,
    revisionArtifact,
    revisionNote,
    actions: {
      setTab,
      refresh,
      refreshDeliveryReadiness,
      openApprove: () => {
        setDeliveryError("");
        setDeliveryNote(model.deliveryReview?.acceptanceNote || "");
        setApproveOpen(true);
      },
      closeApprove: () => {
        if (!deliverySaving) setApproveOpen(false);
      },
      openRevision: () => {
        setDeliveryError("");
        setDeliveryNote(model.deliveryReview?.revisionNote || "");
        setRevisionOpen(true);
      },
      closeRevision: () => {
        if (!deliverySaving) setRevisionOpen(false);
      },
      onDeliveryNoteChange: (event) => setDeliveryNote(event.target.value),
      acceptDelivery,
      requestRevision,
      reviewArtifact: reviewArtifactAction,
      openArtifactRevision: (artifact) => {
        setRevisionArtifact(artifact);
        setRevisionNote(artifact.reviewNote || "");
      },
      closeArtifactRevision: () => {
        if (!reviewing) setRevisionArtifact(null);
      },
      onRevisionNoteChange: (event) => setRevisionNote(event.target.value),
    },
  };
}
