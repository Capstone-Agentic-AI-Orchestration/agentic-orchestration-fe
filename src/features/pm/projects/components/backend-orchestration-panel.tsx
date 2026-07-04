// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconCpu,
  IconExternalLink,
  IconGitBranch,
  IconGitHub,
  IconPlay,
  IconRefresh,
  IconRocket,
} from "@/shared/components/icons";
import { AgentLiveStrip } from "@/features/pm/shared/components/pm-agent-live-strip";
import { ActivityConsole } from "@/shared/components/orchestration/activity-console";
import { RunStatusBanner } from "@/shared/components/orchestration/run-status-banner";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { getDevFlowProjectArtifact } from "@/shared/api/devflow-api";
import {
  SectionTitle,
  OrchestrationFact,
  OrchestrationRunBadge,
} from "./pm-project-ui";
import {
  backendStatusBits,
  githubAutopushStatus,
  compactBackendError,
  formatBackendDate,
  orchestrationTriggerLabel,
} from "../utils/pm-project-detail.utils";

export function BackendOrchestrationPanel({
  detail, status, statusLoading, statusError,
  providerStatus, providerLoading, providerError,
  githubVerification, githubVerificationLoading, githubVerificationError,
  llmVerification, llmVerificationLoading, llmVerificationError,
  workOrders, artifacts, events, runs, runsLoading, runsError,
  blockers, starting, actionId, creatingRepo,
  onCreateRepo, onStart, onRerunReady, onRetryFailedWorkOrder,
  onVerifyGithubDelivery, onVerifyLlmProvider, onRefresh,
}: Record<string, any>) {
  const readyWorkOrders = workOrders.filter((wo: any) => wo.status === "READY");
  const executableWorkOrders = readyWorkOrders.filter((wo: any) => wo.instructions?.trim());
  const failedWorkOrders = workOrders.filter((wo: any) => wo.status === "FAILED");
  const completedWorkOrders = workOrders.filter((wo: any) => wo.status === "COMPLETED");
  const generatedWorkOrderArtifacts = artifacts.filter((a: any) => a.filePath?.startsWith("work-orders/"));
  const pendingPmReview = artifacts.filter((a: any) => (a.outputReviewStatus || "PENDING") === "PENDING");
  const statusView = backendStatusBits(status?.status || detail.status);
  const currentNode = status?.currentNode && status.currentNode !== "none" ? status.currentNode : detail.runId || "No active node";
  const latestRun = runs?.[0];
  const providerUnavailable = !providerLoading && (providerError || (providerStatus && !providerStatus.available));
  const githubDelivery = providerStatus?.githubDelivery;
  const githubDeliveryUnavailable = providerStatus?.activeMode === "llm" && githubDelivery && !githubDelivery.available;
  const actionBlocked = blockers.length > 0 || Boolean(providerUnavailable) || Boolean(githubDeliveryUnavailable);
  const activeProviderLabel = providerStatus?.activeMode === "llm" ? "LLM" : providerStatus?.activeMode === "mock" ? "Mock" : "Agent";
  const autopushView = githubAutopushStatus(detail, githubDelivery, providerStatus?.activeMode);
  const [previewArtifact, setPreviewArtifact] = useState<any>(null);

  const handleSelectArtifact = async (artifact: any) => {
    try {
      const full = await getDevFlowProjectArtifact(detail.id, artifact.id);
      setPreviewArtifact(full);
    } catch {
      setPreviewArtifact(artifact);
    }
  };

  return (
    <Card style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <SectionTitle
          title={`${activeProviderLabel}-provider orchestration`}
          subtitle="Selected agents execute READY work orders and send generated artifacts to PM review."
          icon={<IconCpu size={16} />}
        />
        <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={onRefresh}>Refresh</Button>
          <Button variant="secondary" size="sm" icon={<IconRocket size={13} />} onClick={onRerunReady} disabled={actionId === "rerun-ready" || actionBlocked || executableWorkOrders.length === 0}>
            {actionId === "rerun-ready" ? "Queuing..." : "Rerun READY"}
          </Button>
          <Button variant="primary" size="sm" icon={<IconPlay size={13} />} onClick={onStart} disabled={starting || Boolean(detail.runId) || actionBlocked}>
            {detail.runId ? "Run started" : starting ? "Starting..." : `Start ${activeProviderLabel.toLowerCase()} run`}
          </Button>
        </div>
      </div>

      {statusError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactBackendError(statusError)}</div>}
      {runsError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactBackendError(runsError)}</div>}

      <div style={{ marginTop: 14 }}>
        <OrchestrationProviderStatusPanel
          status={providerStatus}
          loading={providerLoading}
          error={providerError ? compactBackendError(providerError) : ""}
          githubVerification={githubVerification}
          githubVerificationLoading={githubVerificationLoading}
          githubVerificationError={githubVerificationError ? compactBackendError(githubVerificationError) : ""}
          onVerifyGithubDelivery={onVerifyGithubDelivery}
          llmVerification={llmVerification}
          llmVerificationLoading={llmVerificationLoading}
          llmVerificationError={llmVerificationError ? compactBackendError(llmVerificationError) : ""}
          onVerifyLlmProvider={onVerifyLlmProvider}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
        <OrchestrationFact label="Agent provider" value={providerLoading ? "Checking..." : activeProviderLabel} tone={providerStatus?.available ? "green" : "amber"} />
        <OrchestrationFact label="GitHub delivery" value={githubDelivery ? (githubDelivery.available ? githubDelivery.owner || "Ready" : "Setup needed") : "Checking..."} tone={githubDelivery?.available ? "green" : "amber"} />
        <OrchestrationFact label="Repository" value={detail.repoUrl || "Not linked"} tone={detail.repoUrl ? "green" : "gray"} mono />
        <OrchestrationFact label="Autopush" value={autopushView.label} tone={autopushView.tone} />
        <OrchestrationFact label="Run status" value={statusLoading ? "Checking..." : statusView.label} tone={statusView.tone} />
        <OrchestrationFact label="Current node" value={currentNode} tone="purple" mono />
        <OrchestrationFact label="Run history" value={runsLoading ? "Loading..." : String(runs?.length || 0)} tone={runs?.length ? "blue" : "gray"} />
        <OrchestrationFact label="Executable work orders" value={String(executableWorkOrders.length)} tone={executableWorkOrders.length ? "green" : "gray"} />
        <OrchestrationFact label="Completed work orders" value={String(completedWorkOrders.length)} tone={completedWorkOrders.length ? "green" : "gray"} />
        <OrchestrationFact label="Failed work orders" value={String(failedWorkOrders.length)} tone={failedWorkOrders.length ? "red" : "green"} />
        <OrchestrationFact label="Generated artifacts" value={String(generatedWorkOrderArtifacts.length)} tone={generatedWorkOrderArtifacts.length ? "blue" : "gray"} />
        <OrchestrationFact label="PM review queue" value={String(pendingPmReview.length)} tone={pendingPmReview.length ? "amber" : "green"} />
      </div>

      <div style={{ marginTop: 16 }}><RunStatusBanner /></div>

      <div style={{ marginTop: 16 }}>
        <OrchestrationLiveVisualizer
          project={detail} status={status} providerStatus={providerStatus}
          runs={runs || []} workOrders={workOrders} artifacts={artifacts}
          events={events} loading={statusLoading || runsLoading}
          onSelectArtifact={handleSelectArtifact} useWebSocket
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Live agent output</div>
        <AgentLiveStrip scoped />
      </div>

      <div style={{ marginTop: 14 }}><ActivityConsole /></div>

      {previewArtifact && previewArtifact.content && (
        <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(79,139,255,.22)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "rgba(79,139,255,.08)", borderBottom: "1px solid rgba(79,139,255,.16)" }}>
            <div className="row gap-2">
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{previewArtifact.filePath?.split("/").pop()}</span>
              <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{previewArtifact.agentType}</span>
            </div>
            <button onClick={() => setPreviewArtifact(null)} style={{ background: "none", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
          </div>
          <pre style={{ margin: 0, padding: 14, fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 400, background: "rgba(0,0,0,.2)", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", whiteSpace: "pre", tabSize: 2 }}>{previewArtifact.content}</pre>
        </div>
      )}

      {latestRun && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(79,139,255,.24)", background: "rgba(79,139,255,.07)", borderRadius: 10 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Latest run</div>
              <div className="mono" style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{latestRun.runId}</div>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <OrchestrationRunBadge status={latestRun.status} />
              <Badge tone="purple">{orchestrationTriggerLabel(latestRun.trigger)}</Badge>
              <Badge tone="gray">{formatBackendDate(latestRun.startedAt)}</Badge>
            </div>
          </div>
          {latestRun.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{latestRun.error}</div>}
        </div>
      )}

      {failedWorkOrders.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.07)", borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Failed work orders</div>
          {failedWorkOrders.map((wo: any) => (
            <div key={wo.id} className="row gap-2" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(239,68,68,.16)", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{wo.title}</div>
                {wo.executionError && <div style={{ color: "#FCA5A5", fontSize: 11.5, marginTop: 3 }}>{wo.executionError}</div>}
              </div>
              <Button variant="secondary" size="sm" icon={<IconRefresh size={12} />} onClick={() => onRetryFailedWorkOrder(wo.id)} disabled={actionId === wo.id || !wo.instructions?.trim()}>
                {actionId === wo.id ? "Retrying..." : "Retry"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {detail.repoUrl ? (
        <div className="row gap-2" style={{ marginTop: 14, padding: 10, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, justifyContent: "space-between", flexWrap: "wrap" }}>
          <span className="row gap-2"><IconGitBranch size={13} style={{ color: "#6EE7B7" }} /> Generated repository is linked.</span>
          <a href={detail.repoUrl} target="_blank" rel="noreferrer" className="row gap-1" style={{ color: "#93C5FD", fontWeight: 700 }}>Open repo <IconExternalLink size={12} /></a>
        </div>
      ) : (
        <div className="row gap-2" style={{ marginTop: 14, padding: 10, border: "1px solid rgba(59,130,246,.24)", background: "rgba(59,130,246,.07)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, justifyContent: "space-between", flexWrap: "wrap" }}>
          <span className="row gap-2"><IconGitHub size={13} style={{ color: "#93C5FD" }} /> No GitHub repository linked.</span>
          <Button variant="secondary" size="sm" loading={creatingRepo} onClick={onCreateRepo}>Create GitHub repository</Button>
        </div>
      )}

      {(blockers.length > 0 || providerUnavailable || githubDeliveryUnavailable) && !detail.runId ? (
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {providerUnavailable && (
            <div className="row gap-2" style={{ padding: 10, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
              <IconAlertTriangle size={13} style={{ color: "#FBBF24", flexShrink: 0 }} />
              <span>{compactBackendError(providerError) || providerStatus?.reason || "The selected agent provider is not available."}</span>
            </div>
          )}
          {githubDeliveryUnavailable && (
            <div className="row gap-2" style={{ padding: 10, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
              <IconAlertTriangle size={13} style={{ color: "#FBBF24", flexShrink: 0 }} />
              <span>{githubDelivery?.reason || "GitHub delivery is not ready. Configure GitHub App credentials before starting the LLM delivery flow."}</span>
            </div>
          )}
          {blockers.map((blocker: string) => (
            <div key={blocker} className="row gap-2" style={{ padding: 10, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
              <IconAlertTriangle size={13} style={{ color: "#FBBF24", flexShrink: 0 }} />
              <span>{blocker}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 14, padding: 10, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
          {providerUnavailable
            ? compactBackendError(providerError) || providerStatus?.reason || "The selected agent provider is not available."
            : detail.runId
              ? "This project already has an orchestration run. Review generated artifacts and publish approved outputs when ready."
              : `This project can start the ${activeProviderLabel.toLowerCase()} provider orchestration run.`}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, .7fr)", gap: 14, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>READY work orders</div>
          {readyWorkOrders.length === 0 ? (
            <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No READY work orders are queued.</div>
          ) : readyWorkOrders.slice(0, 5).map((wo: any) => (
            <div key={wo.id} className="row gap-2" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
              <Badge tone={wo.instructions?.trim() ? "blue" : "amber"}>{wo.agentType}</Badge>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{wo.title}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{wo.instructions?.trim() ? "Instructions ready" : "Missing instructions"}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Recent run events</div>
          {events.length === 0 ? (
            <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No orchestration event logs yet.</div>
          ) : events.slice(0, 5).map((event: any) => (
            <div key={event.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{event.nodeName}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{event.eventType} - {formatBackendDate(event.occurredAt)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Run history</div>
        {runsLoading ? (
          <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Loading run history...</div>
        ) : !runs?.length ? (
          <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No durable orchestration runs recorded yet.</div>
        ) : runs.slice(0, 5).map((run: any) => (
          <div key={run.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 11.5, color: "white", overflowWrap: "anywhere" }}>{run.runId}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{orchestrationTriggerLabel(run.trigger)} - {run.currentNode || "No node"}</div>
              </div>
              <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                <OrchestrationRunBadge status={run.status} />
                <Badge tone="green">{run.completedWorkOrders} done</Badge>
                {run.failedWorkOrders > 0 && <Badge tone="red">{run.failedWorkOrders} failed</Badge>}
                <Badge tone="blue">{run.completedArtifacts} artifacts</Badge>
              </div>
            </div>
            {run.executions?.length > 0 && (
              <div style={{ marginTop: 7, color: "var(--text-3)", fontSize: 11.5 }}>
                {run.executions.length} execution{run.executions.length === 1 ? "" : "s"} recorded
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
