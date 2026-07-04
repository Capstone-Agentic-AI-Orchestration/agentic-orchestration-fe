// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveDevFlowGate2, getDevFlowProjectArtifact } from "@/shared/api/devflow-api";
import { Button, Textarea, Badge } from "@/shared/components/ui";
import {
  IconCode,
  IconCheck,
  IconClose,
  IconAlertTriangle,
  IconFileText,
  IconDownload,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  frontend: { label: "Frontend", color: "#F97316" },
  backend: { label: "Backend", color: "#10B981" },
  database: { label: "Database", color: "#14B8A6" },
  architecture: { label: "Architecture", color: "#A78BFA" },
};

export function Gate2Step({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, status, refresh } = ctx;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, string>>({});

  const projectStatus = project?.status ?? status?.status;
  const isAwaiting = projectStatus === "AWAITING_GATE_2";
  const artifacts = project?.artifacts ?? status?.artifacts ?? [];

  const handleApprove = async (approved: boolean) => {
    setActing(true);
    setError("");
    try {
      await approveDevFlowGate2(projectId, approved, notes.trim() || undefined);
      await refresh();
      if (approved) {
        router.push(`/pm/orchestrate/${projectId}/run`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  };

  const handleExpand = async (artifactId: string) => {
    if (expandedArtifacts[artifactId] !== undefined) return;
    try {
      const full = await getDevFlowProjectArtifact(projectId, artifactId);
      setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: full.content ?? "" }));
    } catch {
      setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: "Failed to load content" }));
    }
  };

  const groupedArtifacts = artifacts.reduce((acc: Record<string, any[]>, artifact: any) => {
    const agent = artifact.agentType ?? "other";
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(artifact);
    return acc;
  }, {});

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconCode size={16} />
          Gate 2: Code Review
        </h3>
        <p className="wizard-step-section-desc">
          Review the generated artifacts before approving the GitHub commit. Click any file to expand
          its content.
        </p>
      </div>

      {!isAwaiting && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            This gate is not currently awaiting review (status: {projectStatus?.replace(/_/g, " ")}).
          </span>
        </div>
      )}

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Generated Artifacts ({artifacts.length})
        </h4>
        {artifacts.length === 0 ? (
          <div className="wizard-info-banner info">
            <IconFileText size={16} />
            <span>No artifacts generated yet. Code generation happens after Gate 1 approval.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {Object.entries(groupedArtifacts).map(([agent, items]) => {
              const meta = AGENT_LABELS[agent] ?? { label: agent, color: "var(--text-3)" };
              return (
                <div key={agent}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Badge tone="blue" style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}>
                      {meta.label}
                    </Badge>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      {items.length} file{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {items.map((artifact: any) => (
                      <details
                        key={artifact.id}
                        className="gate-review-artifact"
                        onClick={() => handleExpand(artifact.id)}
                      >
                        <summary>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <IconFileText size={14} style={{ color: "var(--text-3)" }} />
                            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.8125rem" }}>
                              {artifact.filePath}
                            </span>
                          </span>
                          <Badge tone="gray">{artifact.language}</Badge>
                        </summary>
                        <pre>
                          <code>{expandedArtifacts[artifact.id] ?? artifact.content ?? "Loading…"}</code>
                        </pre>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAwaiting && (
        <div className="wizard-step-section">
          <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add any feedback or conditions for this code review…"
          />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button variant="primary" onClick={() => handleApprove(true)} disabled={acting}>
              <IconCheck size={14} />
              {acting ? "Approving…" : "Approve & Commit to GitHub"}
            </Button>
            <Button variant="danger" onClick={() => handleApprove(false)} disabled={acting}>
              <IconClose size={14} />
              Reject
            </Button>
          </div>
        </div>
      )}

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="gate-2"
        nextLabel="Continue to Delivery"
        nextDisabled={!isAwaiting || acting}
        onComplete={() => handleApprove(true)}
      />
    </div>
  );
}
