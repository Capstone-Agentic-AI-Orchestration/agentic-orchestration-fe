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
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";
import { loadDesignGuidance } from "@/shared/design-guidance";

export function Gate1Step({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const projectStatus = project?.status ?? status?.status;
  const isAwaiting = projectStatus === "AWAITING_GATE_1";
  const contract = project?.contract ?? status?.contract;
  const designGuidance = loadDesignGuidance(projectId);

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
        <h4 className="wizard-section-label">
          Frontend Design Contract
        </h4>
        <div className="wizard-review-panel">
          <DesignGuidancePanel value={designGuidance} readOnly />
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Project Contract
        </h4>
        {contract ? (
          <div className="wizard-review-stack">
            <div className="wizard-review-panel">
              <div className="wizard-review-kicker">
                Project Name
              </div>
              <div className="wizard-review-title">
                {contract.projectName ?? project?.companyName}
              </div>
              <div className="wizard-review-body">
                {contract.description ?? project?.brief}
              </div>
            </div>

            {contract.requirements && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  Requirements
                </div>
                <div className="wizard-metadata-grid">
                  <div><span>Type</span><strong>{contract.requirements.projectType}</strong></div>
                  <div><span>Complexity</span><strong>{contract.requirements.complexity}</strong></div>
                  <div><span>Est. files</span><strong>{contract.requirements.estimatedFiles}</strong></div>
                  <div><span>Stack</span><strong>{contract.requirements.techStack?.frontend} + {contract.requirements.techStack?.backend}</strong></div>
                </div>
                {contract.requirements.features?.length > 0 && (
                  <div className="wizard-feature-group">
                    <div className="wizard-review-kicker">Features</div>
                    <div className="wizard-feature-chips">
                      {contract.requirements.features.map((f: string, i: number) => (
                        <span key={i} className="auto-analyze-feature-chip">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {contract.fileManifest?.length > 0 && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  File Manifest ({contract.fileManifest.length} files)
                </div>
                <div className="wizard-file-manifest">
                  {contract.fileManifest.map((path: string, i: number) => (
                    <div key={i} className="wizard-file-path">{path}</div>
                  ))}
                </div>
              </div>
            )}

            {contract.acceptanceCriteria?.length > 0 && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  Acceptance Criteria
                </div>
                <div className="wizard-check-row-list">
                  {contract.acceptanceCriteria.map((c: string, i: number) => (
                    <div key={i} className="wizard-check-row">
                      <IconCheck size={14} />
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
          <h4 className="wizard-section-label">
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add any feedback or conditions for this plan approval…"
          />
          <div className="wizard-action-row">
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
