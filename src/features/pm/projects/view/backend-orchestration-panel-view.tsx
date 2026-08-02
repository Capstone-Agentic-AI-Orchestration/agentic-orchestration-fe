"use client";

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
import {
  OrchestrationFact,
  OrchestrationRunBadge,
  SectionTitle,
} from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import type {
  FailedWorkOrderRow,
  ReadyWorkOrderRow,
  RunEventRow,
  RunHistoryRow,
} from "../model/orchestration-panel";
import type { BackendOrchestrationPanelViewModel } from "../view-model/use-orchestration-panel-view-model";

export function BackendOrchestrationPanelView({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  return (
    <div className="pm-tab-layout">
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-orchestration-command">
          <div>
            <Badge tone={vm.showBlockers ? "amber" : "green"}>{vm.showBlockers ? "ACTION REQUIRED" : "READY TO RUN"}</Badge>
            <h3>{vm.title}</h3>
            <p>Review the launch requirements below, then start the agents that will execute READY work orders and return artifacts for PM review.</p>
          </div>
          <div className="pm-orchestration-command__actions">
            <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={vm.actions.refresh}>Refresh status</Button>
            <Button variant="secondary" size="sm" icon={<IconRocket size={13} />} onClick={vm.actions.rerunReady} disabled={!vm.canRerunReady}>
              {vm.rerunButtonLabel}
            </Button>
            <Button variant="primary" size="sm" icon={<IconPlay size={13} />} onClick={vm.actions.start} disabled={!vm.canStartRun}>
              {vm.startButtonLabel}
            </Button>
          </div>
        </div>

        {vm.statusErrorMessage && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 14 }}>{compactBackendError(vm.statusErrorMessage)}</div>}
        {vm.runsErrorMessage && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 14 }}>{compactBackendError(vm.runsErrorMessage)}</div>}

        <div className="pm-tab-section">
          <div className="pm-tab-section-heading">
            <h4>Before you run</h4>
            <p>Repository access, provider availability, and work-order readiness must all pass.</p>
          </div>
          <RepositoryStatus vm={vm} />
          <RunReadinessStatus vm={vm} />
        </div>

        <div className="pm-tab-section">
          <div className="pm-tab-section-heading">
            <h4>Run summary</h4>
            <p>A compact view of the execution scope and current provider state.</p>
          </div>
          <div className="pm-orchestration-facts">
            {vm.facts.map((fact) => (
              <OrchestrationFact key={fact.label} label={fact.label} value={fact.value} tone={fact.tone} mono={fact.mono} />
            ))}
          </div>
        </div>
      </Card>

      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-tab-header">
          <SectionTitle
            title="Current run"
            subtitle="Follow progress, inspect the latest execution, and retry only failed handoffs."
            icon={<IconCpu size={16} />}
          />
          {vm.latestRun && <OrchestrationRunBadge status={vm.latestRun.status} />}
        </div>
        <div className="pm-tab-section">
          <RunStatusBanner />
          <div className="pm-orchestration-runtime">
            <div className="pm-orchestration-runtime__main">
              <OrchestrationLiveVisualizer
                project={vm.detail}
                status={vm.status}
                providerStatus={vm.providerStatus}
                runs={vm.runs}
                workOrders={vm.workOrders}
                artifacts={vm.artifacts}
                events={vm.events}
                loading={vm.visualizerLoading}
                onSelectArtifact={vm.actions.selectArtifact}
                useWebSocket
              />
              {vm.preview && <ArtifactPreview vm={vm} />}
            </div>
            <aside className="pm-orchestration-runtime__aside">
              {vm.latestRun ? (
                <div className="pm-tab-message">
                  <div style={{ fontSize: 13, fontWeight: 800 }}>Latest run</div>
                  <div className="mono" style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4, overflowWrap: "anywhere" }}>{vm.latestRun.runId}</div>
                  <div className="pm-tab-actions" style={{ marginTop: 10 }}>
                    <Badge tone="purple">{vm.latestRun.triggerLabel}</Badge>
                    <Badge tone="gray">{vm.latestRun.startedAtLabel}</Badge>
                  </div>
                  {vm.latestRun.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 9 }}>{vm.latestRun.error}</div>}
                </div>
              ) : (
                <div className="pm-tab-message">No run has started yet. Complete the launch requirements above to begin.</div>
              )}

              {vm.failedWorkOrders.length > 0 && (
                <div className="pm-tab-message pm-tab-message--danger">
                  <div style={{ color: "white", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Failed work orders</div>
                  {vm.failedWorkOrders.map((row) => (
                    <FailedWorkOrderRowView key={row.id} row={row} vm={vm} />
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </Card>

      <details className="pm-tab-details">
        <summary>Agent activity and queued work</summary>
        <div className="pm-tab-details__body">
          <div>
            <div className="pm-tab-section-heading" style={{ marginBottom: 10 }}>
              <h4>Live agent output</h4>
              <p>Streaming summaries from the active specialist agents.</p>
            </div>
            <AgentLiveStrip scoped />
          </div>
          <ActivityConsole />
          <WorkOrdersAndEvents vm={vm} />
        </div>
      </details>

      <details className="pm-tab-details">
        <summary>Provider checks and run history</summary>
        <div className="pm-tab-details__body">
          <OrchestrationProviderStatusPanel
            status={vm.providerStatus}
            loading={vm.providerLoading}
            error={vm.providerErrorMessage ? compactBackendError(vm.providerErrorMessage) : ""}
            githubVerification={vm.githubVerification}
            githubVerificationLoading={vm.githubVerificationLoading}
            githubVerificationError={vm.githubVerificationErrorMessage ? compactBackendError(vm.githubVerificationErrorMessage) : ""}
            onVerifyGithubDelivery={vm.actions.verifyGithubDelivery}
            llmVerification={vm.llmVerification}
            llmVerificationLoading={vm.llmVerificationLoading}
            llmVerificationError={vm.llmVerificationErrorMessage ? compactBackendError(vm.llmVerificationErrorMessage) : ""}
            onVerifyLlmProvider={vm.actions.verifyLlmProvider}
          />
          <RunHistory vm={vm} />
        </div>
      </details>
    </div>
  );
}

function ArtifactPreview({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  if (!vm.preview) return null;
  return (
    <div className="pm-orchestration-preview">
      <div className="pm-orchestration-preview__header">
        <div className="row gap-2" style={{ minWidth: 0 }}>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, overflowWrap: "anywhere" }}>{vm.preview.fileName}</span>
          <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{vm.preview.agentType}</span>
        </div>
        <button aria-label="Close artifact preview" onClick={vm.actions.closePreview} style={{ background: "none", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 17, fontFamily: "inherit" }}>×</button>
      </div>
      <pre>{vm.preview.content}</pre>
    </div>
  );
}

function FailedWorkOrderRowView({
  row,
  vm,
}: {
  row: FailedWorkOrderRow;
  vm: BackendOrchestrationPanelViewModel;
}) {
  return (
    <div className="row gap-2" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(239,68,68,.16)", alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{row.title}</div>
        {row.executionError && <div style={{ color: "#FCA5A5", fontSize: 11.5, marginTop: 3 }}>{row.executionError}</div>}
      </div>
      <Button variant="secondary" size="sm" icon={<IconRefresh size={12} />} onClick={() => vm.actions.retryFailedWorkOrder(row.id)} disabled={row.retrying || !row.canRetry}>
        {row.retrying ? "Retrying..." : "Retry"}
      </Button>
    </div>
  );
}

function RepositoryStatus({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  if (vm.repoLinked) {
    return (
      <div className="row gap-2 pm-tab-message pm-tab-message--success" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="row gap-2"><IconGitBranch size={13} style={{ color: "#6EE7B7" }} /> {vm.repoStatusMessage}</span>
        <a href={vm.detail.repoUrl || undefined} target="_blank" rel="noreferrer" className="row gap-1" style={{ color: "#93C5FD", fontWeight: 700 }}>Open repo <IconExternalLink size={12} /></a>
      </div>
    );
  }

  return (
    <div className="row gap-2 pm-tab-message" style={{ borderColor: "rgba(59,130,246,.24)", background: "rgba(59,130,246,.07)", justifyContent: "space-between", flexWrap: "wrap" }}>
      <span className="row gap-2"><IconGitHub size={13} style={{ color: "#93C5FD" }} /> {vm.repoStatusMessage}</span>
      <Button variant="secondary" size="sm" disabled={vm.creatingRepo} onClick={vm.actions.createRepo}>
        {vm.creatingRepo ? "Creating..." : "Create GitHub repository"}
      </Button>
    </div>
  );
}

function RunReadinessStatus({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  if (!vm.showBlockers) {
    return (
      <div className="pm-tab-message pm-tab-message--success">
        {compactBackendError(vm.positiveStatusMessage)}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {vm.providerUnavailable && <BlockerMessage message={vm.providerUnavailableMessage} />}
      {vm.githubDeliveryUnavailable && <BlockerMessage message={vm.githubDeliveryUnavailableMessage} />}
      {vm.blockerMessages.map((blocker) => <BlockerMessage key={blocker} message={blocker} />)}
    </div>
  );
}

function BlockerMessage({ message }: { message: string }) {
  return (
    <div className="row gap-2 pm-tab-message pm-tab-message--warning">
      <IconAlertTriangle size={13} style={{ color: "#FBBF24", flexShrink: 0 }} />
      <span>{compactBackendError(message)}</span>
    </div>
  );
}

function WorkOrdersAndEvents({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  return (
    <div className="pm-tab-form-grid">
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>READY work orders</div>
        {!vm.hasReadyWorkOrders ? (
          <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No READY work orders are queued.</div>
        ) : vm.readyWorkOrders.map((row) => (
          <ReadyWorkOrderRowView key={row.id} row={row} />
        ))}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Recent run events</div>
        {!vm.hasRecentEvents ? (
          <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No orchestration event logs yet.</div>
        ) : vm.recentEvents.map((row) => (
          <RunEventRowView key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function ReadyWorkOrderRowView({ row }: { row: ReadyWorkOrderRow }) {
  return (
    <div className="row gap-2" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
      <Badge tone={row.instructionTone}>{row.agentType}</Badge>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{row.title}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{row.instructionLabel}</div>
      </div>
    </div>
  );
}

function RunEventRowView({ row }: { row: RunEventRow }) {
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{row.nodeName}</div>
      <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{row.meta}</div>
    </div>
  );
}

function RunHistory({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Run history</div>
      {vm.runsLoading ? (
        <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Loading run history...</div>
      ) : !vm.hasRunHistory ? (
        <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No durable orchestration runs recorded yet.</div>
      ) : vm.runHistory.map((row) => (
        <RunHistoryRowView key={row.id} row={row} />
      ))}
    </div>
  );
}

function RunHistoryRowView({ row }: { row: RunHistoryRow }) {
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 11.5, color: "white", overflowWrap: "anywhere" }}>{row.runId}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{row.meta}</div>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          <OrchestrationRunBadge status={row.status} />
          <Badge tone="green">{row.completedWorkOrdersLabel}</Badge>
          {row.failedWorkOrdersLabel && <Badge tone="red">{row.failedWorkOrdersLabel}</Badge>}
          <Badge tone="blue">{row.completedArtifactsLabel}</Badge>
        </div>
      </div>
      {row.executionLabel && (
        <div style={{ marginTop: 7, color: "var(--text-3)", fontSize: 11.5 }}>
          {row.executionLabel}
        </div>
      )}
    </div>
  );
}
