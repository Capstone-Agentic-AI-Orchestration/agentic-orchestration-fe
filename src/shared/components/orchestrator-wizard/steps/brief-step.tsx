"use client";

import {
  BRIEF_STACK_OPTIONS,
  useBriefStepViewModel,
} from "@/features/orchestration";
import { Button, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";
import {
  IconSparkles,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function BriefStep({
  ctx,
}: {
  ctx: OrchestratorWizardContextValue;
  stepId: string;
}) {
  const vm = useBriefStepViewModel(ctx);

  return (
    <div className="execution-setup">
      <section className="wizard-step-section execution-setup-hero">
        <span className="execution-setup-eyebrow">Step 1 · Define the outcome</span>
        <h3 className="wizard-step-section-title">
          What should this project deliver?
        </h3>
        <p className="wizard-step-section-desc">
          Give DevFlow enough context to prepare a plan. You can review everything before execution starts.
        </p>
      </section>

      <section className="wizard-step-section">
        <h3 className="wizard-step-section-title">Project outcome</h3>
        <p className="wizard-step-section-desc">
          Focus on the result the client expects, the people it serves, and the most important capabilities.
        </p>
        {vm.saveError && (
          <div className="wizard-info-banner warning" role="alert">
            <IconAlertTriangle size={16} />
            <span>{vm.saveError}</span>
          </div>
        )}
        {vm.saved && (
          <div className="wizard-info-banner success" role="status">
            <IconCheck size={16} />
            <span>Project outcome saved. Review the execution setup when you are ready.</span>
          </div>
        )}
        <div className="wizard-review-stack">
          <Field label="Client or company">
            <Input
              value={vm.companyName}
              onChange={vm.actions.onCompanyNameChange}
              placeholder="e.g. Acme Corp"
            />
          </Field>
          <Field
            label="Desired outcome"
            helper="Describe what should be delivered and how the client will know it works. At least 10 characters."
          >
            <Textarea
              value={vm.brief}
              onChange={vm.actions.onBriefChange}
              placeholder="e.g. Deliver a task management dashboard where a small team can sign in, manage project boards, and review weekly progress."
              rows={6}
            />
          </Field>
        </div>
      </section>

      <section className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconSparkles size={16} />
          Help me shape the outcome
        </h3>
        <p className="wizard-step-section-desc">
          Optional: DevFlow can turn your rough description into a clearer brief and suggest missing capabilities.
        </p>
        <div className="auto-analyze-card execution-setup-assist">
          <div className="auto-analyze-header">
            <IconSparkles size={18} />
            <h3>Review and improve this description</h3>
          </div>
          <p className="auto-analyze-desc">
            Your original text stays unchanged until you choose to apply the suggested version.
          </p>
          {vm.analyzeError && (
            <div className="wizard-info-banner warning">
              <IconAlertTriangle size={16} />
              <span>{vm.analyzeError}</span>
            </div>
          )}
          {vm.showAnalyzeSkeleton && (
            <div className="auto-analyze-skeleton" aria-label="Analyzing brief">
              <span className="skeleton auto-analyze-skeleton-line is-wide" />
              <span className="skeleton auto-analyze-skeleton-line" />
              <span className="skeleton auto-analyze-skeleton-line is-short" />
              <div className="auto-analyze-skeleton-chips">
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            </div>
          )}
          {vm.analyzeResult && (
            <div className="auto-analyze-result">
              <h4>Suggested outcome</h4>
              <p className="auto-analyze-result-copy">
                {vm.analyzeResult.enhancedBrief}
              </p>
              <h4>Suggested capabilities</h4>
              <div className="auto-analyze-features">
                {vm.analyzeResult.suggestedFeatures.map((feature, i) => (
                  <span key={i} className="auto-analyze-feature-chip">
                    {feature}
                  </span>
                ))}
              </div>
              <h4 className="auto-analyze-subhead">Suggested build foundation</h4>
              <div className="auto-analyze-techstack">
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Frontend</span>
                  <span className="auto-analyze-tech-value">{vm.analyzeResult.suggestedTechStack.frontend}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Backend</span>
                  <span className="auto-analyze-tech-value">{vm.analyzeResult.suggestedTechStack.backend}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Database</span>
                  <span className="auto-analyze-tech-value">{vm.analyzeResult.suggestedTechStack.database}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Styling</span>
                  <span className="auto-analyze-tech-value">{vm.analyzeResult.suggestedTechStack.styling}</span>
                </div>
              </div>
              <div className="auto-analyze-meta">
                Complexity: <strong>{vm.analyzeResult.complexity}</strong> · Est. files:{" "}
                <strong>{vm.analyzeResult.estimatedFiles}</strong>
              </div>
              <div className="auto-analyze-actions">
                <Button variant="primary" size="sm" onClick={vm.actions.applyEnhanced}>
                  <IconCheck size={14} />
                  Use this version
                </Button>
                <Button variant="ghost" size="sm" onClick={vm.actions.discardAnalysis}>
                  Discard
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={vm.actions.analyze}
            disabled={vm.analyzing || !vm.canAnalyze}
            style={{ marginTop: vm.analyzeButtonMarginTop }}
          >
            {vm.analyzing ? (
              <>
                <IconRefresh size={14} className="spin" />
                Analyzing…
              </>
            ) : (
              <>
                <IconSparkles size={14} />
                Improve description
              </>
            )}
          </Button>
        </div>
      </section>

      <details className="wizard-disclosure">
        <summary>
          <span>
            <strong>Optional build and design preferences</strong>
            <small>Use the recommended defaults or give the delivery team more direction.</small>
          </span>
        </summary>
        <div className="wizard-disclosure-body">
          <Field
            label="Build foundation"
            helper="Choose a preferred foundation only when the project has a technical constraint."
          >
            <Select
              value={vm.stackKey}
              onChange={vm.actions.onStackKeyChange}
            >
              {BRIEF_STACK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <h3 className="wizard-step-section-title">Design direction</h3>
            <p className="wizard-step-section-desc">
              Optional preferences for how the final experience should look and feel.
            </p>
            <DesignGuidancePanel value={vm.designGuidance} onChange={vm.actions.setDesignGuidance} />
          </div>
        </div>
      </details>

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="brief"
        nextLabel={vm.saving ? "Saving…" : "Save outcome and review"}
        nextDisabled={!vm.canSave || vm.saving}
        onComplete={vm.actions.save}
      />
    </div>
  );
}
