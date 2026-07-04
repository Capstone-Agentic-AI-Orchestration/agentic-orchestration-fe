// @ts-nocheck
"use client";

import { useState } from "react";
import {
  autoAnalyzeDevFlowBrief,
  updateDevFlowProject,
  type DevFlowAutoAnalyzeResult,
} from "@/shared/api/devflow-api";
import { Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import {
  IconSparkles,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

const STACK_OPTIONS = [
  { value: "nextjs-nestjs-supabase", label: "Next.js + NestJS + Supabase" },
  { value: "nextjs-nestjs-postgres", label: "Next.js + NestJS + PostgreSQL" },
  { value: "react-express-mongo", label: "React + Express + MongoDB" },
  { value: "nextjs-supabase", label: "Next.js + Supabase (serverless)" },
  { value: "react-native-nestjs", label: "React Native + NestJS" },
];

export function BriefStep({
  ctx,
  stepId,
}: {
  ctx: OrchestratorWizardContextValue;
  stepId: string;
}) {
  const { project, projectId, refresh } = ctx;
  const [companyName, setCompanyName] = useState(project?.companyName ?? "");
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [stackKey, setStackKey] = useState(project?.stackKey ?? "nextjs-nestjs-supabase");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<DevFlowAutoAnalyzeResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = companyName.trim().length > 0 && brief.trim().length >= 10;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeResult(null);
    try {
      const result = await autoAnalyzeDevFlowBrief({
        companyName: companyName.trim() || "Unknown company",
        brief: brief.trim(),
        stackKey,
      });
      setAnalyzeResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const details = (err as any)?.details ?? "";
      const combined = message + " " + details;
      setAnalyzeError(
        combined.includes("API key") || combined.includes("not configured") || combined.includes("not available")
          ? "Auto-analyze requires an LLM API key. Ask an admin to configure a provider (Admin &gt; Providers) with an API key, then try again."
          : message,
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyEnhanced = () => {
    if (!analyzeResult) return;
    setBrief(analyzeResult.enhancedBrief);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await updateDevFlowProject(projectId, { companyName, brief, stackKey });
      setSaved(true);
      await refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

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
          {analyzeError && (
            <div className="wizard-info-banner warning">
              <IconAlertTriangle size={16} />
              <span>{analyzeError}</span>
            </div>
          )}
          {analyzeResult && (
            <div className="auto-analyze-result">
              <h4>Enhanced Brief</h4>
              <p style={{ margin: "0 0 12px", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text)" }}>
                {analyzeResult.enhancedBrief}
              </p>
              <h4>Suggested Features</h4>
              <div className="auto-analyze-features">
                {analyzeResult.suggestedFeatures.map((feature, i) => (
                  <span key={i} className="auto-analyze-feature-chip">
                    {feature}
                  </span>
                ))}
              </div>
              <h4 style={{ marginTop: "14px" }}>Tech Stack</h4>
              <div className="auto-analyze-techstack">
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Frontend</span>
                  <span className="auto-analyze-tech-value">{analyzeResult.suggestedTechStack.frontend}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Backend</span>
                  <span className="auto-analyze-tech-value">{analyzeResult.suggestedTechStack.backend}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Database</span>
                  <span className="auto-analyze-tech-value">{analyzeResult.suggestedTechStack.database}</span>
                </div>
                <div className="auto-analyze-tech-item">
                  <span className="auto-analyze-tech-label">Styling</span>
                  <span className="auto-analyze-tech-value">{analyzeResult.suggestedTechStack.styling}</span>
                </div>
              </div>
              <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "var(--text-3)" }}>
                Complexity: <strong>{analyzeResult.complexity}</strong> · Est. files:{" "}
                <strong>{analyzeResult.estimatedFiles}</strong>
              </div>
              <div className="auto-analyze-actions">
                <Button variant="primary" size="sm" onClick={handleApplyEnhanced}>
                  <IconCheck size={14} />
                  Apply enhanced brief
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAnalyzeResult(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing || brief.trim().length < 3}
            style={{ marginTop: analyzeResult ? "14px" : "0" }}
          >
            {analyzing ? (
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
        {saveError && (
          <div className="wizard-info-banner warning">
            <IconAlertTriangle size={16} />
            <span>{saveError}</span>
          </div>
        )}
        {saved && (
          <div className="wizard-info-banner success">
            <IconCheck size={16} />
            <span>Project brief saved. Continue to the next step.</span>
          </div>
        )}
        <div style={{ display: "grid", gap: "16px" }}>
          <Field label="Company name">
            <Input
              value={companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </Field>
          <Field label="Project brief" helper="Describe what the client wants to build. Min 10 characters.">
            <Textarea
              value={brief}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBrief(e.target.value)}
              placeholder="e.g. A task management dashboard for a small team with user auth, project boards, and reporting"
              rows={5}
            />
          </Field>
          <Field label="Tech stack">
            <Select
              value={stackKey}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStackKey(e.target.value)}
            >
              {STACK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="brief"
        nextLabel="Save & Continue"
        nextDisabled={!canSave || saving}
        onComplete={handleSave}
      />
    </div>
  );
}
