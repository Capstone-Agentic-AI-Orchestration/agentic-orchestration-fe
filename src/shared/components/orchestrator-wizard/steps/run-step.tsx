"use client";

import { runFocusCopy, useRunStepViewModel } from "@/features/orchestration";
import { IconRocket } from "@/shared/components/icons";
import { OrchestrationRunCockpit } from "@/shared/components/orchestration/run-cockpit/orchestration-run-cockpit";
import { ModelSelectionPanel } from "@/shared/components/orchestration/model-selection-panel";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";
import { Badge, Button } from "@/shared/components/ui";

export function RunStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useRunStepViewModel(ctx);
  const focus = runFocusCopy(vm.projectStatus);

  return (
    <div>
      <section className={`orchestrator-focus-card tone-${focus.tone}`} aria-live="polite">
        <div className="orchestrator-focus-copy">
          <Badge tone={focus.tone}>{focus.eyebrow}</Badge>
          <h3><IconRocket size={18} />{focus.title}</h3>
          <p>{focus.description}</p>
        </div>
        <div className="orchestrator-focus-actions">
          {vm.projectStatus === "FAILED" && (
            <Button variant="primary" onClick={vm.actions.rerun} disabled={vm.starting}>
              {vm.starting ? "Retrying…" : "Retry recoverable work"}
            </Button>
          )}
          <Button variant="secondary" onClick={vm.actions.resync} disabled={vm.starting}>
            Refresh status
          </Button>
        </div>
        {vm.error && <p className="orchestrator-focus-error" role="alert">{vm.error}</p>}
      </section>

      <details className="orchestrator-technical-details">
        <summary>Show technical run details</summary>
        <p className="orchestrator-technical-intro">
          Agent activity, model overrides, token telemetry, retries, and provider diagnostics.
        </p>
        <ModelSelectionPanel
          controller={vm.modelSelection}
          disabled={vm.starting || vm.modelSelectionLocked}
        />
        <OrchestrationRunCockpit
          projectId={vm.projectId}
          projectName={vm.projectName}
          status={vm.projectStatus}
          onStart={vm.actions.start}
          onRerun={vm.actions.rerun}
          onResync={vm.actions.resync}
          starting={vm.starting}
          error={vm.error}
        />
      </details>
    </div>
  );
}
