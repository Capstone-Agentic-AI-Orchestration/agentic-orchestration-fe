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
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconSparkles size={16} />
          AI Auto-Analyze
        </h3>
        <p className="wizard-step-section-desc">
          Not sure how to describe your project? Write a rough idea and let AI turn it into a
          structured brief with suggested features and tech stack.
        </p>
        <div className="auto-analyze-card">
          <div className="auto-analyze-header">
            <IconSparkles size={18} />
            <h3>Enhance your brief with AI</h3>
          </div>
          <p className="auto-analyze-desc">
            Enter a few words about the project below, then click analyze. The AI will rewrite it
            as a professional brief and suggest features.
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
              <h4>Enhanced Brief</h4>
              <p className="auto-analyze-result-copy">
                {vm.analyzeResult.enhancedBrief}
              </p>
              <h4>Suggested Features</h4>
              <div className="auto-analyze-features">
                {vm.analyzeResult.suggestedFeatures.map((feature, i) => (
                  <span key={i} className="auto-analyze-feature-chip">
                    {feature}
                  </span>
                ))}
              </div>
              <h4 className="auto-analyze-subhead">Tech Stack</h4>
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
                  Apply enhanced brief
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
                Auto-analyze brief
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">Project Details</h3>
        <p className="wizard-step-section-desc">
          Define the company name, project brief, and target tech stack.
        </p>
        {vm.saveError && (
          <div className="wizard-info-banner warning">
            <IconAlertTriangle size={16} />
            <span>{vm.saveError}</span>
          </div>
        )}
        {vm.saved && (
          <div className="wizard-info-banner success">
            <IconCheck size={16} />
            <span>Project brief saved. Continue to the next step.</span>
          </div>
        )}
        <div className="wizard-review-stack">
          <Field label="Company name">
            <Input
              value={vm.companyName}
              onChange={vm.actions.onCompanyNameChange}
              placeholder="e.g. Acme Corp"
            />
          </Field>
          <Field label="Project brief" helper="Describe what the client wants to build. Min 10 characters.">
            <Textarea
              value={vm.brief}
              onChange={vm.actions.onBriefChange}
              placeholder="e.g. A task management dashboard for a small team with user auth, project boards, and reporting"
              rows={5}
            />
          </Field>
          <Field label="Tech stack">
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
        </div>
      </div>

      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">Design Direction</h3>
        <DesignGuidancePanel value={vm.designGuidance} onChange={vm.actions.setDesignGuidance} />
      </div>

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="brief"
        nextLabel="Save & Continue"
        nextDisabled={!vm.canSave || vm.saving}
        onComplete={vm.actions.save}
      />
    </div>
  );
}
