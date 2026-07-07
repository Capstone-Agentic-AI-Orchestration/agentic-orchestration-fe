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
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";
import { loadDesignGuidance } from "@/shared/design-guidance";

const AGENT_LABELS: Record<string, { label: string; tone: "neutral" | "green" | "attention" | "gray" }> = {
  frontend: { label: "Frontend", tone: "attention" },
  backend: { label: "Backend", tone: "green" },
  database: { label: "Database", tone: "neutral" },
  architecture: { label: "Architecture", tone: "gray" },
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
  const designGuidance = loadDesignGuidance(projectId);

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
    setExpandedArtifacts((prev) => ({ ...prev, [artifactId]: null as any }));
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
          Build review
        </h3>
        <p className="wizard-step-section-desc">
          Review the generated deliverables before approving the GitHub commit. Click any file to expand
          its content.
        </p>
      </div>

      {!isAwaiting && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            This build review is not currently awaiting approval (status: {projectStatus?.replace(/_/g, " ")}).
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
        <h4 className="wizard-section-label">
          Frontend Design Contract
        </h4>
        <div className="wizard-review-panel">
          <DesignGuidancePanel value={designGuidance} readOnly />
        </div>
      </div>

      <div className="wizard-step-section">
        <h4 className="wizard-section-label">
          Generated Deliverables ({artifacts.length})
        </h4>
        {artifacts.length === 0 ? (
          <div className="wizard-info-banner info">
            <IconFileText size={16} />
            <span>No deliverables generated yet. Code generation happens after plan approval.</span>
          </div>
        ) : (
          <div className="wizard-review-stack">
            {Object.entries(groupedArtifacts).map(([agent, items]) => {
              const meta = AGENT_LABELS[agent] ?? { label: agent, tone: "gray" as const };
              return (
                <div key={agent} className="wizard-review-panel wizard-review-panel--dense">
                  <div className="wizard-artifact-group-head">
                    <Badge tone={meta.tone}>
                      {meta.label}
                    </Badge>
                    <span>
                      {items.length} file{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="wizard-artifact-list">
                    {items.map((artifact: any) => (
                      <details
                        key={artifact.id}
                        className="gate-review-artifact"
                        onClick={() => handleExpand(artifact.id)}
                      >
                        <summary>
                          <span className="gate-review-artifact-summary-main">
                            <IconFileText size={14} />
                            <span className="gate-review-artifact-path">
                              {artifact.filePath}
                            </span>
                          </span>
                          <Badge tone="gray">{artifact.language}</Badge>
                        </summary>
                        {expandedArtifacts[artifact.id] === null ? (
                          <div className="gate-review-artifact-loading" aria-label="Loading artifact content">
                            <span className="skeleton" />
                            <span className="skeleton" />
                            <span className="skeleton" />
                          </div>
                        ) : (
                          <pre>
                            <code>{expandedArtifacts[artifact.id] ?? artifact.content ?? "Loading..."}</code>
                          </pre>
                        )}
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
          <h4 className="wizard-section-label">
            Review Notes (optional)
          </h4>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add any feedback or conditions for this code review…"
          />
          <div className="wizard-action-row">
            <Button variant="primary" onClick={() => handleApprove(true)} disabled={acting}>
              <IconCheck size={14} />
              {acting ? "Approving…" : "Approve build and commit to GitHub"}
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
