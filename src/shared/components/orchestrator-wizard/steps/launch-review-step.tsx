"use client";

import { useLaunchReviewStepViewModel } from "@/features/orchestration";
import {
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconCode,
  IconCpu,
  IconGitHub,
  IconRefresh,
  IconRocket,
  IconShield,
} from "@/shared/components/icons";
import { Badge, Button } from "@/shared/components/ui";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function LaunchReviewStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useLaunchReviewStepViewModel(ctx);

  return (
    <div className="launch-review">
      <section className="wizard-step-section launch-review-hero">
        <div>
          <span className="launch-review-eyebrow">Step 2 · Check and start</span>
          <h3 className="wizard-step-section-title">
            <IconRocket size={16} />
            Confirm the direction
          </h3>
          <p className="wizard-step-section-desc">
            Review what DevFlow will use, check that execution can start, and keep control at the plan and build approvals.
          </p>
        </div>
        <Badge tone={vm.canStart ? "green" : "yellow"}>
          {vm.checking ? "Checking" : vm.canStart ? "Ready to start" : "Action needed"}
        </Badge>
      </section>

      <section className="launch-review-grid" aria-label="Execution setup summary">
        <article className="launch-review-summary">
          <span className="launch-review-card-label">Project outcome</span>
          <strong>{vm.projectName}</strong>
          <p>{vm.brief || "No project brief has been provided yet."}</p>
        </article>
        <article className="launch-review-summary">
          <span className="launch-review-card-label">Scope guardrail</span>
          <strong>Work from the approved outcome</strong>
          <p>{vm.scopeSummary}</p>
        </article>
        <article className="launch-review-summary">
          <span className="launch-review-card-label">Approval path</span>
          <strong>Two decisions before delivery</strong>
          <p>{vm.milestoneSummary}</p>
        </article>
      </section>

      <section className="wizard-step-section">
        <div className="launch-review-section-head">
          <div>
            <h3 className="wizard-step-section-title">Automatic launch checks</h3>
            <p className="wizard-step-section-desc">
              DevFlow checks the technical requirements for you. Delivery can be connected later.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={vm.actions.check} disabled={vm.checking || vm.starting}>
            <IconRefresh size={14} className={vm.checking ? "spin" : undefined} />
            Check again
          </Button>
        </div>

        <div className="launch-check-list" aria-live="polite">
          <article className={`launch-check ${vm.llmOk ? "is-ready" : "needs-attention"}`}>
            <span className="launch-check-icon"><IconCpu size={18} /></span>
            <div>
              <div className="launch-check-title">
                <strong>Planning service</strong>
                <Badge tone={vm.llmOk ? "green" : "yellow"}>{vm.checking ? "Checking" : vm.llmLabel}</Badge>
              </div>
              <p>
                {vm.llmResult?.reason
                  || (vm.llmOk
                    ? "DevFlow can prepare the implementation plan."
                    : "The planning service must be available before execution starts.")}
              </p>
            </div>
          </article>

          <article className={`launch-check ${vm.githubOk ? "is-ready" : "is-optional"}`}>
            <span className="launch-check-icon"><IconGitHub size={18} /></span>
            <div>
              <div className="launch-check-title">
                <strong>Delivery connection</strong>
                <Badge tone={vm.githubOk ? "green" : "gray"}>{vm.checking ? "Checking" : vm.githubLabel}</Badge>
              </div>
              <p>{vm.githubResult?.reason || vm.githubNote}</p>
            </div>
          </article>

          <article className="launch-check is-ready">
            <span className="launch-check-icon"><IconCheck size={18} /></span>
            <div>
              <div className="launch-check-title">
                <strong>Work setup</strong>
                <Badge tone="green">Automatic</Badge>
              </div>
              <p>DevFlow prepares the work automatically when execution starts. No kickoff checklist is required.</p>
            </div>
          </article>
        </div>

        <details className="launch-review-technical">
          <summary>Technical check details</summary>
          <div>
            <span>Execution mode</span>
            <strong>{vm.agentMode}</strong>
          </div>
          <div>
            <span>Build foundation</span>
            <strong>{vm.stackKey}</strong>
          </div>
          {vm.llmResult?.model && (
            <div>
              <span>Planning model</span>
              <strong>{vm.llmResult.model}</strong>
            </div>
          )}
        </details>
      </section>

      <section className="wizard-step-section">
        <h3 className="wizard-step-section-title">What happens after you start</h3>
        <div className="launch-review-timeline">
          <div><IconClipboard size={15} /><span><strong>1. Plan</strong> DevFlow turns the approved outcome into a concrete implementation plan.</span></div>
          <div><IconCheck size={15} /><span><strong>2. Approve</strong> You review the plan before any code is generated.</span></div>
          <div><IconCode size={15} /><span><strong>3. Build</strong> The approved deliverables are built and prepared for your review.</span></div>
          <div><IconShield size={15} /><span><strong>4. Deliver</strong> You approve the build before the final handoff.</span></div>
        </div>
      </section>

      {vm.error && (
        <div className="wizard-info-banner warning" role="alert">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="review"
        backLabel="Edit description"
        nextLabel={vm.starting ? "Starting…" : "Start execution"}
        nextDisabled={vm.checking || vm.starting || !vm.canStart}
        onComplete={vm.actions.start}
      />
    </div>
  );
}
