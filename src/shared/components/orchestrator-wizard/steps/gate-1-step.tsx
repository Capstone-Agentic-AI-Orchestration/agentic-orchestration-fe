// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveDevFlowGate1 } from "@/shared/api/devflow-api";
import { Button, Badge, Textarea } from "@/shared/components/ui";
import {
  IconClipboard,
  IconCheck,
  IconClose,
  IconAlertTriangle,
  IconShield,
  IconArrowRight,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function Gate1Step({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const projectStatus = project?.status ?? status?.status;
  const isAwaiting = projectStatus === "AWAITING_GATE_1";
  const contract = project?.contract ?? status?.contract;

  const handleApprove = async (approved: boolean) => {
    setActing(true);
    setError("");
    try {
      await approveDevFlowGate1(projectId, approved, notes.trim() || undefined);
      await refresh();
      if (approved) {
        router.push(`/pm/orchestrate/${projectId}/run`);
      }
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
          <IconShield size={16} />
          Plan review
        </h3>
        <p className="wizard-step-section-desc">
          Review the project contract — requirements, file manifest, and acceptance criteria — before
          approving code generation.
        </p>
      </div>

      {!isAwaiting && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            This plan review is not currently awaiting approval (status: {projectStatus?.replace(/_/g, " ")}).
            You can still review the contract below.
          </span>
        </div>
      )}

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Project Contract
        </h4>
        {contract ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
                Project Name
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)" }}>
                {contract.projectName ?? project?.companyName}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
                {contract.description ?? project?.brief}
              </div>
            </div>

            {contract.requirements && (
              <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                  Requirements
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: "0.8125rem" }}>
                  <div><span style={{ color: "var(--text-3)" }}>Type:</span> {contract.requirements.projectType}</div>
                  <div><span style={{ color: "var(--text-3)" }}>Complexity:</span> {contract.requirements.complexity}</div>
                  <div><span style={{ color: "var(--text-3)" }}>Est. files:</span> {contract.requirements.estimatedFiles}</div>
                  <div><span style={{ color: "var(--text-3)" }}>Stack:</span> {contract.requirements.techStack?.frontend} + {contract.requirements.techStack?.backend}</div>
                </div>
                {contract.requirements.features?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: 4 }}>Features:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {contract.requirements.features.map((f: string, i: number) => (
                        <span key={i} className="auto-analyze-feature-chip">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {contract.fileManifest?.length > 0 && (
              <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                  File Manifest ({contract.fileManifest.length} files)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 4, fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}>
                  {contract.fileManifest.map((path: string, i: number) => (
                    <div key={i} style={{ color: "var(--text-2)", padding: "2px 0" }}>{path}</div>
                  ))}
                </div>
              </div>
            )}

            {contract.acceptanceCriteria?.length > 0 && (
              <div style={{ padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                  Acceptance Criteria
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {contract.acceptanceCriteria.map((c: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.8125rem", color: "var(--text-2)" }}>
                      <IconCheck size={14} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="wizard-info-banner info">
            <IconClipboard size={16} />
            <span>The contract will be available once requirements parsing completes. Start the orchestration run first.</span>
          </div>
        )}
      </div>

      {isAwaiting && (
        <div className="wizard-step-section">
          <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add any feedback or conditions for this plan approval…"
          />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button variant="primary" onClick={() => handleApprove(true)} disabled={acting}>
              <IconCheck size={14} />
              {acting ? "Approving…" : "Approve plan and start build"}
            </Button>
            <Button variant="danger" onClick={() => handleApprove(false)} disabled={acting}>
              <IconClose size={14} />
              Reject
            </Button>
          </div>
        </div>
      )}

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="gate-1"
        nextLabel="Continue to build review"
        nextDisabled={!isAwaiting || acting}
        onComplete={() => handleApprove(true)}
      />
    </div>
  );
}
