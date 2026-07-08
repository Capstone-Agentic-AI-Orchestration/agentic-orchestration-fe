"use client";

import {
  KICKOFF_CHECKLIST_FIELDS,
  KICKOFF_TEXT_FIELDS,
  useKickoffStepViewModel,
} from "@/features/orchestration";
import { Button, Field, Textarea, Badge } from "@/shared/components/ui";
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";
import {
  IconCheck,
  IconCheckCircle,
  IconAlertTriangle,
  IconClipboard,
  IconWorkflow,
  IconLock,
  IconSparkles,
  IconRefresh,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function KickoffStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const vm = useKickoffStepViewModel(ctx);

  return (
    <div>
      <div className="wizard-step-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 className="wizard-step-section-title">
              <IconLock size={16} />
              Kickoff Configuration
            </h3>
            <p className="wizard-step-section-desc">
              Define scope, milestones, and confirm readiness. {vm.completedChecks} of {vm.totalChecks} checks complete.
            </p>
          </div>
          <Badge tone={vm.ready ? "green" : "amber"}>
            {vm.statusLabel}
          </Badge>
        </div>
      </div>

      {vm.error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}
      {vm.saved && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>Kickoff saved. {vm.ready ? "Ready to proceed to team setup." : "Complete remaining checks to unlock orchestration."}</span>
        </div>
      )}

      {/* Auto-analyze card */}
      <div className="wizard-step-section">
        <div className="auto-analyze-card compact">
          <div className="auto-analyze-header">
            <IconSparkles size={18} />
            <h3>Auto-generate kickoff content</h3>
          </div>
          <p className="auto-analyze-desc">
            Let AI analyze the project brief and fill in scope, milestones, tech stack notes, and delivery roles automatically.
          </p>
          <Button variant="secondary" size="sm" onClick={vm.actions.autoAnalyze} disabled={vm.analyzing}>
            {vm.analyzing ? (
              <><IconRefresh size={14} className="spin" /> Analyzing…</>
            ) : (
              <><IconSparkles size={14} /> Auto-generate from brief</>
            )}
          </Button>
          {vm.analyzing && (
            <div className="auto-analyze-skeleton" aria-label="Generating kickoff content">
              <span className="skeleton auto-analyze-skeleton-line is-wide" />
              <span className="skeleton auto-analyze-skeleton-line" />
              <span className="skeleton auto-analyze-skeleton-line is-short" />
            </div>
          )}
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Design Direction
        </h4>
        <DesignGuidancePanel
          value={vm.form.designGuidance}
          onChange={(next) => vm.actions.setValue("designGuidance", next)}
        />
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Project Details
        </h4>
        <div className="wizard-field-grid">
          {KICKOFF_TEXT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <Textarea
                rows={3}
                value={vm.form[field.key]}
                onChange={(event) => vm.actions.setValue(field.key, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Readiness Checklist
        </h4>
        <div className="wizard-checklist">
          {KICKOFF_CHECKLIST_FIELDS.map((item) => (
            <div
              key={item.key}
              className={`wizard-checklist-item ${vm.form[item.key] ? "checked" : ""}`}
              onClick={() => vm.actions.setValue(item.key, !vm.form[item.key])}
            >
              <span className="wizard-checklist-checkbox">
                <IconCheck size={12} />
              </span>
              <span className="wizard-checklist-label">
                <strong>{item.label}</strong>
                <span className="wizard-checklist-desc">
                  {item.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-action-row">
        <Button variant="primary" size="sm" onClick={vm.actions.save} disabled={vm.saving}>
          <IconCheckCircle size={14} />
          {vm.saving ? "Saving…" : "Save kickoff"}
        </Button>
        <Button variant="secondary" size="sm" onClick={vm.actions.createStarterTasks} disabled={vm.action === "tasks"}>
          <IconClipboard size={14} />
          {vm.action === "tasks" ? "Creating…" : "Create starter tasks"}
        </Button>
        <Button variant="secondary" size="sm" onClick={vm.actions.createStarterWorkOrders} disabled={vm.action === "work-orders"}>
          <IconWorkflow size={14} />
          {vm.action === "work-orders" ? "Creating…" : "Create starter agent tasks"}
        </Button>
      </div>

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="kickoff"
        nextLabel={vm.ready ? "Save & Continue" : "Save & Continue"}
        nextDisabled={vm.nextDisabled}
        onComplete={vm.actions.save}
      />
    </div>
  );
}
