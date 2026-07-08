"use client";

import { useDeliveryStepViewModel } from "@/features/orchestration";
import { Button, Badge, Textarea } from "@/shared/components/ui";
import {
  IconGitBranch,
  IconCheck,
  IconAlertTriangle,
  IconExternalLink,
  IconSend,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function DeliveryStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useDeliveryStepViewModel(ctx);

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

      {vm.error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}

      {vm.success && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>{vm.success}</span>
        </div>
      )}

      {/* Status display */}
      <div className="wizard-status-display">
        <div className="status-label">Project Status</div>
        <div className="status-value">{vm.projectStatusLabel}</div>
      </div>

      {/* Repository link */}
      {vm.repoUrl && (
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
                {vm.repoUrl}
              </div>
            </div>
            <a href={vm.repoUrl} target="_blank" rel="noopener noreferrer">
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
        {vm.loadingReadiness ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
        ) : vm.hasBlockers ? (
          <div className="wizard-info-banner warning">
            <IconAlertTriangle size={16} />
            <div>
              <strong>Delivery blockers detected:</strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "0.8125rem" }}>
                {vm.blockers.map((b: string, i: number) => (
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
      {vm.deliveryReview && (
        <div className="wizard-step-section">
          <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Client Review</span>
              <Badge tone={vm.deliveryReviewTone}>
                {vm.deliveryReviewStatusLabel}
              </Badge>
            </div>
            {vm.deliveryReview.notes && (
              <div style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
                {vm.deliveryReview.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept / Revision actions */}
      {vm.canAct && (
        <div className="wizard-step-section">
          <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Delivery Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={vm.notes}
            onChange={vm.actions.onNotesChange}
            placeholder="Add any notes for the delivery acceptance or revision request…"
          />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button variant="primary" onClick={vm.actions.accept} disabled={vm.acting}>
              <IconCheck size={14} />
              {vm.acting ? "Processing…" : "Accept delivery"}
            </Button>
            <Button variant="secondary" onClick={vm.actions.requestRevision} disabled={vm.acting}>
              <IconSend size={14} />
              Request revision
            </Button>
          </div>
        </div>
      )}

      {vm.isDelivered && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>This project has been delivered successfully. The orchestration wizard is complete.</span>
        </div>
      )}

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="delivery"
        isLastStep
        nextLabel={vm.nextLabel}
        nextDisabled={vm.acting}
        onComplete={vm.actions.refresh}
      />
    </div>
  );
}
