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
          <span className="launch-review-eyebrow">One review, then DevFlow handles the setup</span>
          <h3 className="wizard-step-section-title">
            <IconRocket size={16} />
            Review and start planning
          </h3>
          <p className="wizard-step-section-desc">
            Confirm the project direction below. Agent tasks are prepared automatically when you start,
            and you stay in control at the plan and build approvals.
          </p>
        </div>
        <Badge tone={vm.canStart ? "green" : "yellow"}>
          {vm.checking ? "Checking" : vm.canStart ? "Ready to start" : "Action needed"}
        </Badge>
      </section>

      <section className="launch-review-grid" aria-label="Project launch summary">
        <article className="launch-review-summary">
          <span className="launch-review-card-label">Project outcome</span>
          <strong>{vm.projectName}</strong>
          <p>{vm.brief || "No project brief has been provided yet."}</p>
        </article>
        <article className="launch-review-summary">
          <span className="launch-review-card-label">Build foundation</span>
          <strong>{vm.stackKey}</strong>
          <p>DevFlow will translate this brief into a plan and prepare the right agent tasks automatically.</p>
        </article>
      </section>

      <section className="wizard-step-section">
        <div className="launch-review-section-head">
          <div>
            <h3 className="wizard-step-section-title">Automatic launch checks</h3>
            <p className="wizard-step-section-desc">
              Only AI generation must be ready now. GitHub can be connected before delivery.
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
                <strong>AI generation</strong>
                <Badge tone={vm.llmOk ? "green" : "yellow"}>{vm.checking ? "Checking" : vm.llmLabel}</Badge>
              </div>
              <p>
                {vm.llmResult?.reason
                  || (vm.llmOk
                    ? `Agent mode ${vm.agentMode} is available.`
                    : "DevFlow needs an available AI provider before planning can start.")}
              </p>
            </div>
          </article>

          <article className={`launch-check ${vm.githubOk ? "is-ready" : "is-optional"}`}>
            <span className="launch-check-icon"><IconGitHub size={18} /></span>
            <div>
              <div className="launch-check-title">
                <strong>GitHub delivery</strong>
                <Badge tone={vm.githubOk ? "green" : "gray"}>{vm.checking ? "Checking" : vm.githubLabel}</Badge>
              </div>
              <p>{vm.githubResult?.reason || vm.githubNote}</p>
            </div>
          </article>

          <article className="launch-check is-ready">
            <span className="launch-check-icon"><IconCheck size={18} /></span>
            <div>
              <div className="launch-check-title">
                <strong>Agent tasks</strong>
                <Badge tone="green">Automatic</Badge>
              </div>
              <p>Architecture and implementation tasks are created when the run starts. No kickoff checklist is required.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="wizard-step-section">
        <h3 className="wizard-step-section-title">What happens after you start</h3>
        <div className="launch-review-timeline">
          <div><IconClipboard size={15} /><span><strong>1. Plan</strong> Agents turn the brief into a concrete implementation plan.</span></div>
          <div><IconCheck size={15} /><span><strong>2. Approve</strong> You review the plan before any code is generated.</span></div>
          <div><IconCode size={15} /><span><strong>3. Build</strong> Agents generate the deliverables, then pause for your final approval.</span></div>
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
        nextLabel={vm.starting ? "Starting…" : "Start planning"}
        nextDisabled={vm.checking || vm.starting || !vm.canStart}
        onComplete={vm.actions.start}
      />
    </div>
  );
}
