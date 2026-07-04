// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  getDevFlowDeliveryReadiness,
  acceptDevFlowProjectDelivery,
  requestDevFlowProjectDeliveryRevision,
} from "@/shared/api/devflow-api";
import { Button, Badge, Textarea } from "@/shared/components/ui";
import {
  IconGitBranch,
  IconCheck,
  IconAlertTriangle,
  IconExternalLink,
  IconDownload,
  IconRefresh,
  IconSend,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function DeliveryStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, status, refresh } = ctx;
  const [readiness, setReadiness] = useState<any>(null);
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

  const projectStatus = project?.status ?? status?.status;
  const isDelivered = projectStatus === "DELIVERED";
  const repoUrl = project?.repoUrl ?? status?.repoUrl;
  const blockers = readiness?.blockers ?? [];
  const deliveryReview = project?.deliveryReview;

  const handleAccept = async () => {
    setActing(true);
    setError("");
    setSuccess("");
    try {
      await acceptDevFlowProjectDelivery(projectId, { notes: notes.trim() || undefined });
      setSuccess("Delivery accepted. The project is now complete.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  const handleRevision = async () => {
    setActing(true);
    setError("");
    setSuccess("");
    try {
      await requestDevFlowProjectDeliveryRevision(projectId, { notes: notes.trim() || "Revision requested" });
      setSuccess("Revision request sent to the development team.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconGitBranch size={16} />
          Delivery & Handoff
        </h3>
        <p className="wizard-step-section-desc">
          Review delivery readiness, inspect the GitHub repository, and accept the delivery or
          request revisions.
        </p>
      </div>

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Status display */}
      <div className="wizard-status-display">
        <div className="status-label">Project Status</div>
        <div className="status-value">{projectStatus?.replace(/_/g, " ") ?? "Unknown"}</div>
      </div>

      {/* Repository link */}
      {repoUrl && (
        <div className="wizard-step-section">
          <div
            style={{
              padding: 20,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: 4 }}>
                GitHub Repository
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>
                {repoUrl}
              </div>
            </div>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <IconExternalLink size={14} />
                Open repo
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Delivery readiness */}
      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Delivery Readiness
        </h4>
        {loadingReadiness ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
        ) : blockers.length > 0 ? (
          <div className="wizard-info-banner warning">
            <IconAlertTriangle size={16} />
            <div>
              <strong>Delivery blockers detected:</strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "0.8125rem" }}>
                {blockers.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="wizard-info-banner success">
            <IconCheck size={16} />
            <span>All delivery checks passed. The project is ready for client acceptance.</span>
          </div>
        )}
      </div>

      {/* Delivery review status */}
      {deliveryReview && (
        <div className="wizard-step-section">
          <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Client Review</span>
              <Badge tone={
                deliveryReview.status === "ACCEPTED" ? "green" :
                deliveryReview.status === "REVISION_REQUESTED" ? "yellow" :
                deliveryReview.status === "REVISION_RESOLVED" ? "blue" : "gray"
              }>
                {deliveryReview.status?.replace(/_/g, " ")}
              </Badge>
            </div>
            {deliveryReview.notes && (
              <div style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
                {deliveryReview.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept / Revision actions */}
      {!isDelivered && blockers.length === 0 && !loadingReadiness && (
        <div className="wizard-step-section">
          <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Delivery Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add any notes for the delivery acceptance or revision request…"
          />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button variant="primary" onClick={handleAccept} disabled={acting}>
              <IconCheck size={14} />
              {acting ? "Processing…" : "Accept delivery"}
            </Button>
            <Button variant="secondary" onClick={handleRevision} disabled={acting}>
              <IconSend size={14} />
              Request revision
            </Button>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>This project has been delivered successfully. The orchestration wizard is complete.</span>
        </div>
      )}

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="delivery"
        isLastStep
        nextLabel={isDelivered ? "Finish" : "Complete"}
        nextDisabled={acting}
        onComplete={async () => {
          await refresh();
        }}
      />
    </div>
  );
}
