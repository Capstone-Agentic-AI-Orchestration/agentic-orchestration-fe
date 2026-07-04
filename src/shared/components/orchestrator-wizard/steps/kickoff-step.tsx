// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  updateDevFlowProjectKickoff,
  createDevFlowKickoffTasks,
  createDevFlowKickoffWorkOrders,
  autoAnalyzeDevFlowBrief,
} from "@/shared/api/devflow-api";
import { Button, Field, Textarea, Badge } from "@/shared/components/ui";
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

const CHECKLIST_FIELDS = [
  { key: "scopeConfirmed", label: "Scope confirmed", desc: "Scope summary reviewed" },
  { key: "milestonesConfirmed", label: "Milestones defined", desc: "Delivery milestones documented" },
  { key: "documentsConfirmed", label: "Documents listed", desc: "Required documents identified" },
  { key: "techStackConfirmed", label: "Tech stack confirmed", desc: "Stack notes reviewed" },
  { key: "rolesConfirmed", label: "Roles assigned", desc: "Delivery roles defined" },
  { key: "clientAccessConfirmed", label: "Client access set up", desc: "Client invite configured" },
  { key: "initialTasksCreated", label: "Starter tasks created", desc: "Initial tasks generated" },
  { key: "initialWorkOrdersCreated", label: "Starter work orders created", desc: "Initial work orders generated" },
] as const;

const TEXT_FIELDS = [
  { key: "scopeSummary", label: "Scope summary" },
  { key: "milestones", label: "Milestones" },
  { key: "requiredDocuments", label: "Required documents" },
  { key: "techStackNotes", label: "Tech stack notes" },
  { key: "deliveryRoles", label: "Delivery roles" },
  { key: "readinessNotes", label: "Readiness notes" },
] as const;

function kickoffFormFromKickoff(kickoff: any, project: any) {
  return {
    scopeSummary: kickoff?.scopeSummary || project?.brief || "",
    milestones: kickoff?.milestones || "",
    requiredDocuments: kickoff?.requiredDocuments || "",
    techStackNotes: kickoff?.techStackNotes || project?.stackKey || "",
    deliveryRoles: kickoff?.deliveryRoles || "",
    readinessNotes: kickoff?.readinessNotes || "",
    scopeConfirmed: Boolean(kickoff?.scopeConfirmed),
    milestonesConfirmed: Boolean(kickoff?.milestonesConfirmed),
    documentsConfirmed: Boolean(kickoff?.documentsConfirmed),
    techStackConfirmed: Boolean(kickoff?.techStackConfirmed),
    rolesConfirmed: Boolean(kickoff?.rolesConfirmed),
    clientAccessConfirmed: Boolean(kickoff?.clientAccessConfirmed),
    initialTasksCreated: Boolean(kickoff?.initialTasksCreated),
    initialWorkOrdersCreated: Boolean(kickoff?.initialWorkOrdersCreated),
  };
}

export function KickoffStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, refresh } = ctx;
  const kickoff = project?.kickoff;
  const [form, setForm] = useState(() => kickoffFormFromKickoff(kickoff, project));
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(kickoffFormFromKickoff(project?.kickoff, project));
  }, [project?.id, project?.kickoff?.updatedAt]);

  const completed = CHECKLIST_FIELDS.filter((item) => form[item.key]).length;
  const ready = kickoff?.status === "READY" || kickoff?.status === "LOCKED";
  const setValue = (key: string, value: any) => setForm((c) => ({ ...c, [key]: value }));

  const saveKickoff = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateDevFlowProjectKickoff(projectId, form);
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const createStarterTasks = async () => {
    setAction("tasks");
    setError("");
    try {
      await createDevFlowKickoffTasks(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  const createStarterWorkOrders = async () => {
    setAction("work-orders");
    setError("");
    try {
      await createDevFlowKickoffWorkOrders(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction("");
    }
  };

  const [analyzing, setAnalyzing] = useState(false);
  const handleAutoAnalyze = async () => {
    if (!project?.brief || project.brief.trim().length < 3) {
      setError("A project brief with at least 3 characters is required to auto-analyze.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const result = await autoAnalyzeDevFlowBrief({
        companyName: project?.companyName || "",
        brief: project.brief,
        stackKey: project?.stackKey || "nextjs-nestjs-supabase",
      });
      setValue("scopeSummary", result.enhancedBrief);
      setValue("milestones", result.suggestedFeatures.map((f: string) => `- ${f}`).join("\n"));
      setValue("techStackNotes", [
        `Frontend: ${result.suggestedTechStack.frontend}`,
        `Backend: ${result.suggestedTechStack.backend}`,
        `Database: ${result.suggestedTechStack.database}`,
        `Styling: ${result.suggestedTechStack.styling}`,
        `Complexity: ${result.complexity}`,
        `Est. files: ${result.estimatedFiles}`,
      ].join("\n"));
      setValue("deliveryRoles", `PM oversight\nDeveloper team (${result.suggestedFeatures.length}+ feature areas)\nClient reviewer`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const details = (err as any)?.details ?? "";
      const combined = message + " " + details;
      setError(
        combined.includes("API key") || combined.includes("not configured") || combined.includes("not available")
          ? "Auto-analyze requires an LLM API key. Ask an admin to configure a provider under Admin &gt; Providers."
          : message,
      );
    } finally {
      setAnalyzing(false);
    }
  };

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
              Define scope, milestones, and confirm readiness. {completed} of {CHECKLIST_FIELDS.length} checks complete.
            </p>
          </div>
          <Badge tone={ready ? "green" : "yellow"}>
            {ready ? "Ready" : kickoff?.status || "Draft"}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      {saved && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>Kickoff saved. {ready ? "Ready to proceed to team setup." : "Complete remaining checks to unlock orchestration."}</span>
        </div>
      )}

      {/* Auto-analyze card */}
      <div className="wizard-step-section">
        <div className="auto-analyze-card" style={{ padding: 16 }}>
          <div className="auto-analyze-header">
            <IconSparkles size={18} />
            <h3>Auto-generate kickoff content</h3>
          </div>
          <p className="auto-analyze-desc">
            Let AI analyze the project brief and fill in scope, milestones, tech stack notes, and delivery roles automatically.
          </p>
          <Button variant="secondary" size="sm" onClick={handleAutoAnalyze} disabled={analyzing}>
            {analyzing ? (
              <><IconRefresh size={14} className="spin" /> Analyzing…</>
            ) : (
              <><IconSparkles size={14} /> Auto-generate from brief</>
            )}
          </Button>
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Project Details
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {TEXT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <Textarea
                rows={3}
                value={form[field.key]}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(field.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Readiness Checklist
        </h4>
        <div className="wizard-checklist">
          {CHECKLIST_FIELDS.map((item) => (
            <div
              key={item.key}
              className={`wizard-checklist-item ${form[item.key] ? "checked" : ""}`}
              onClick={() => setValue(item.key, !form[item.key])}
            >
              <span className="wizard-checklist-checkbox">
                <IconCheck size={12} />
              </span>
              <span className="wizard-checklist-label">
                <strong>{item.label}</strong>
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
                  {item.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <Button variant="primary" size="sm" onClick={saveKickoff} disabled={saving}>
          <IconCheckCircle size={14} />
          {saving ? "Saving…" : "Save kickoff"}
        </Button>
        <Button variant="secondary" size="sm" onClick={createStarterTasks} disabled={action === "tasks"}>
          <IconClipboard size={14} />
          {action === "tasks" ? "Creating…" : "Create starter tasks"}
        </Button>
        <Button variant="secondary" size="sm" onClick={createStarterWorkOrders} disabled={action === "work-orders"}>
          <IconWorkflow size={14} />
          {action === "work-orders" ? "Creating…" : "Create starter work orders"}
        </Button>
      </div>

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="kickoff"
        nextLabel={ready ? "Save & Continue" : "Save & Continue"}
        nextDisabled={saving || action !== ""}
        onComplete={saveKickoff}
      />
    </div>
  );
}
