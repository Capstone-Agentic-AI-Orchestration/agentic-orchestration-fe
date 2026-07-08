"use client";

import { Button, Card } from "@/shared/components/ui";
import { IconRefresh } from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { DevOrchestratorWorkbench } from "@/features/orchestration";
import { useDevFlowProject, useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";

export function DevOrchestratorView() {
  return <DevOrchestratorWorkbench />;
}

export function DevOutputView({ projectId }: { projectId: string }) {
  const { project, loading, error } = useDevFlowProject(projectId);
  const outputs = useDevFlowProjectOutputs(projectId, { includeEvents: true, includeTimeline: true, includeWorkOrders: true });

  return (
    <div data-screen-label="Dev Orchestrator Output" style={{ display: "grid", gap: 20 }}>
      <DevPageHeader
        title={project?.companyName || "Generated Output"}
        subtitle={project ? `Generated artifacts and run records for ${project.id}.` : `Project output for ${projectId || "the selected project"}.`}
        actions={<Button variant="secondary" icon={<IconRefresh size={14} />} onClick={outputs.refresh}>Refresh output</Button>}
      />

      {error || outputs.error ? (
        <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactDevFlowError(error || outputs.error)}</Card>
      ) : loading ? (
        <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading project output...</Card>
      ) : !project ? (
        <Card style={{ padding: 22, color: "var(--text-3)" }}>No assigned backend project was found for this output route.</Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 18 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Generated artifacts</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{outputs.artifacts.length} project artifact records</p>
            </div>
            {outputs.loading ? (
              <div style={{ padding: 18, color: "var(--text-2)" }}>Loading artifacts...</div>
            ) : outputs.artifacts.length === 0 ? (
              <div style={{ padding: 18, color: "var(--text-3)" }}>No generated artifacts have been recorded yet.</div>
            ) : outputs.artifacts.map((artifact) => (
              <details key={artifact.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <summary style={{ padding: "12px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1 }} className="mono">{artifact.displayName || artifact.filePath}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 11.5, fontWeight: 400 }}>{artifact.agentType} - {formatDevFlowDate(artifact.createdAt)}</span>
                </summary>
                {artifact.content && (
                  <pre style={{ margin: 0, padding: "8px 18px 14px", fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 360, background: "rgba(0,0,0,.15)", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", whiteSpace: "pre", tabSize: 2 }}>{artifact.content}</pre>
                )}
              </details>
            ))}
          </Card>
          <Card style={{ padding: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Output facts</h3>
            <OutputFact label="Run" value={project.runId || "Not started"} />
            <OutputFact label="Repo" value={project.repoUrl || "Not linked"} />
            <OutputFact label="Stack" value={project.stackKey} />
            <OutputFact label="Events" value={String(outputs.events.length)} />
          </Card>
        </div>
      )}
    </div>
  );
}

function OutputFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{label}</span>
      <span className="mono" style={{ color: "white", fontSize: 11.5, textAlign: "right", overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}
