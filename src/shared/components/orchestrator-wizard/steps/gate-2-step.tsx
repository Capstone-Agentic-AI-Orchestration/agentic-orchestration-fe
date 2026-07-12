"use client";

import { useGate2StepViewModel } from "@/features/orchestration";
import { Button, Textarea, Badge } from "@/shared/components/ui";
import {
  IconCode,
  IconCheck,
  IconClose,
  IconAlertTriangle,
  IconFileText,
} from "@/shared/components/icons";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";

export function Gate2Step({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useGate2StepViewModel(ctx);

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconCode size={16} />
          Build review
        </h3>
        <p className="wizard-step-section-desc">
          Review the generated deliverables before approving the GitHub commit. Click any file to expand
          its content.
        </p>
      </div>

      {!vm.isAwaiting && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            This build review is not currently awaiting approval (status: {vm.projectStatusLabel}).
          </span>
        </div>
      )}

      {vm.error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">Decision summary</h4>
        <div className="wizard-metadata-grid">
          <div><span>Generated files</span><strong>{vm.artifacts.length}</strong></div>
          <div><span>Agent groups</span><strong>{vm.artifactGroups.length}</strong></div>
          <div><span>Destination</span><strong>GitHub</strong></div>
          <div><span>Decision</span><strong>{vm.isAwaiting ? "Required now" : "Not pending"}</strong></div>
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Frontend Design Contract
        </h4>
        <div className="wizard-review-panel">
          <DesignGuidancePanel value={vm.designGuidance} readOnly />
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Generated Deliverables ({vm.artifacts.length})
        </h4>
        {vm.artifacts.length === 0 ? (
          <div className="wizard-info-banner info">
            <IconFileText size={16} />
            <span>No deliverables generated yet. Code generation happens after plan approval.</span>
          </div>
        ) : (
          <div className="wizard-review-stack">
            {vm.artifactGroups.map((group) => (
              <div key={group.agent} className="wizard-review-panel wizard-review-panel--dense">
                <div className="wizard-artifact-group-head">
                  <Badge tone={group.tone}>
                    {group.label}
                  </Badge>
                  <span>
                    {group.artifacts.length} file{group.artifacts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="wizard-artifact-list">
                  {group.artifacts.map((artifact) => (
                    <details
                      key={artifact.id}
                      className="gate-review-artifact"
                      onClick={() => vm.actions.expandArtifact(artifact.id)}
                    >
                      <summary>
                        <span className="gate-review-artifact-summary-main">
                          <IconFileText size={14} />
                          <span className="gate-review-artifact-path">
                            {artifact.filePath}
                          </span>
                        </span>
                        <Badge tone="gray">{artifact.language}</Badge>
                      </summary>
                      {vm.expandedArtifacts[artifact.id] === null ? (
                        <div className="gate-review-artifact-loading" aria-label="Loading artifact content">
                          <span className="skeleton" />
                          <span className="skeleton" />
                          <span className="skeleton" />
                        </div>
                      ) : (
                        <pre>
                          <code>{vm.expandedArtifacts[artifact.id] ?? artifact.content ?? "Loading..."}</code>
                        </pre>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {vm.isAwaiting && (
        <div className="wizard-step-section">
          <h4 className="wizard-section-label">
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={vm.notes}
            onChange={vm.actions.onNotesChange}
            placeholder="Add any feedback or conditions for this code review…"
          />
          <div className="wizard-action-row">
            <Button variant="primary" onClick={() => vm.actions.approve(true)} disabled={vm.acting}>
              <IconCheck size={14} />
              {vm.acting ? "Approving…" : "Approve build and commit to GitHub"}
            </Button>
            <Button variant="danger" onClick={() => vm.actions.approve(false)} disabled={vm.acting}>
              <IconClose size={14} />
              Request changes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
