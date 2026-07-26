"use client";

import { useGate1StepViewModel } from "@/features/orchestration";
import { Button, Badge, Textarea } from "@/shared/components/ui";
import {
  IconClipboard,
  IconCheck,
  IconClose,
  IconAlertTriangle,
  IconShield,
} from "@/shared/components/icons";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";

export function Gate1Step({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useGate1StepViewModel(ctx);

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

      {!vm.isAwaiting && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            This plan review is not currently awaiting approval (status: {vm.projectStatusLabel}).
            You can still review the contract below.
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
          <div><span>Features</span><strong>{vm.features.length}</strong></div>
          <div><span>Planned files</span><strong>{vm.fileManifest.length}</strong></div>
          <div><span>Agent team</span><strong>{vm.agentPlan?.activeAgents.length ?? 0}</strong></div>
          <div><span>Acceptance checks</span><strong>{vm.acceptanceCriteria.length}</strong></div>
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
          Project Contract
        </h4>
        {vm.contract ? (
          <div className="wizard-review-stack">
            <div className="wizard-review-panel">
              <div className="wizard-review-kicker">
                Project Name
              </div>
              <div className="wizard-review-title">
                {vm.contractTitle}
              </div>
              <div className="wizard-review-body">
                {vm.contractDescription}
              </div>
            </div>

            {vm.hasRequirements && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  Requirements
                </div>
                <div className="wizard-metadata-grid">
                  <div><span>Type</span><strong>{vm.contract.requirements.projectType}</strong></div>
                  <div><span>Complexity</span><strong>{vm.contract.requirements.complexity}</strong></div>
                  <div><span>Est. files</span><strong>{vm.contract.requirements.estimatedFiles}</strong></div>
                  <div><span>Stack</span><strong>{vm.contract.requirements.techStack?.frontend} + {vm.contract.requirements.techStack?.backend}</strong></div>
                </div>
                {vm.features.length > 0 && (
                  <div className="wizard-feature-group">
                    <div className="wizard-review-kicker">Features</div>
                    <div className="wizard-feature-chips">
                      {vm.features.map((f: string, i: number) => (
                        <span key={i} className="auto-analyze-feature-chip">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {vm.agentPlan && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  Locked Agent Team ({vm.agentPlan.activeAgents.length})
                </div>
                <div className="wizard-check-row-list">
                  {vm.agentPlan.entries.map((entry) => (
                    <div key={entry.agent} className="wizard-check-row">
                      <IconCheck size={14} />
                      <span>
                        <strong>{entry.agent.replace(/-/g, " ")}</strong>
                        {" · "}
                        {entry.role}
                        {" — "}
                        {entry.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vm.fileManifest.length > 0 && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  File Manifest ({vm.fileManifest.length} files)
                </div>
                <div className="wizard-file-manifest">
                  {vm.fileManifest.map((path: string, i: number) => (
                    <div key={i} className="wizard-file-path">{path}</div>
                  ))}
                </div>
              </div>
            )}

            {vm.acceptanceCriteria.length > 0 && (
              <div className="wizard-review-panel">
                <div className="wizard-review-kicker">
                  Acceptance Criteria
                </div>
                <div className="wizard-check-row-list">
                  {vm.acceptanceCriteria.map((c: string, i: number) => (
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

      {vm.isAwaiting && (
        <div className="wizard-step-section">
          <h4 className="wizard-section-label">
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={vm.notes}
            onChange={vm.actions.onNotesChange}
            placeholder="Add any feedback or conditions for this plan approval…"
          />
          <div className="wizard-action-row">
            <Button variant="primary" onClick={() => vm.actions.approve(true)} disabled={vm.acting}>
              <IconCheck size={14} />
              {vm.acting ? "Approving…" : "Approve plan and start build"}
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
