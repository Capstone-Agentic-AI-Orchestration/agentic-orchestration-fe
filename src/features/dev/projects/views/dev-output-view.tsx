"use client";

import { Button, Card } from "@/shared/components/ui";
import { IconRefresh } from "@/shared/components/icons";
import type { DevFlowProjectDetail } from "@/shared/api/devflow-api";
import type { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";

/**
 * What a run produced, read inside the project it belongs to.
 *
 * This was a standalone route at /dev/orchestrator/output/[projectId], reachable only from the
 * console-level orchestrator's project picker. With that workbench gone it became an orphan —
 * a project-scoped page hanging off a path that no longer had a parent.
 *
 * It takes `project` and `outputs` as props rather than fetching by id, which it used to do.
 * As a section of the project workspace it renders alongside a parent that has already loaded
 * both, and re-fetching would have meant two requests for the same project on every visit to
 * this tab.
 *
 * Distinct from the Artifacts section, which is a list: this shows each artifact's content
 * inline next to the run facts that produced it.
 */
export function DevOutputView({
  project,
  outputs,
}: {
  project: DevFlowProjectDetail;
  outputs: ReturnType<typeof useDevFlowProjectOutputs>;
}) {
  return (
    <div data-screen-label="Dev - Project Output" style={{ display: "grid", gap: 18 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Run output</h3>
          <p style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>
            Generated artifacts and run records for this project.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={outputs.refresh}>
          Refresh output
        </Button>
      </div>

      {outputs.error ? (
        <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>
          {compactDevFlowError(outputs.error)}
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 18 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Generated artifacts</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>
                {outputs.artifacts.length} project artifact records
              </p>
            </div>
            {outputs.loading ? (
              <div style={{ padding: 18, color: "var(--text-2)" }}>Loading artifacts...</div>
            ) : outputs.artifacts.length === 0 ? (
              <div style={{ padding: 18, color: "var(--text-3)" }}>
                No generated artifacts have been recorded yet.
              </div>
            ) : outputs.artifacts.map((artifact) => (
              <details key={artifact.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <summary style={{ padding: "12px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1 }} className="mono">{artifact.displayName || artifact.filePath}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 11.5, fontWeight: 400 }}>
                    {artifact.agentType} - {formatDevFlowDate(artifact.createdAt)}
                  </span>
                </summary>
                {artifact.content && (
                  <pre style={{ margin: 0, padding: "8px 18px 14px", fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 360, background: "rgba(0,0,0,.15)", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", whiteSpace: "pre", tabSize: 2 }}>
                    {artifact.content}
                  </pre>
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
      <span style={{ color: "var(--text-3)", fontSize: 12.5 }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
