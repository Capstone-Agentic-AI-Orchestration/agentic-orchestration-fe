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
    <Card style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <SectionTitle
          title={vm.title}
          subtitle="Selected agents execute READY work orders and send generated artifacts to PM review."
          icon={<IconCpu size={16} />}
        />
        <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={vm.actions.refresh}>Refresh</Button>
          <Button variant="secondary" size="sm" icon={<IconRocket size={13} />} onClick={vm.actions.rerunReady} disabled={!vm.canRerunReady}>
            {vm.rerunButtonLabel}
          </Button>
          <Button variant="primary" size="sm" icon={<IconPlay size={13} />} onClick={vm.actions.start} disabled={!vm.canStartRun}>
            {vm.startButtonLabel}
          </Button>
        </div>
      </div>

      {vm.statusErrorMessage && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactBackendError(vm.statusErrorMessage)}</div>}
      {vm.runsErrorMessage && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactBackendError(vm.runsErrorMessage)}</div>}

      <div style={{ marginTop: 14 }}>
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
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
        {vm.facts.map((fact) => (
          <OrchestrationFact key={fact.label} label={fact.label} value={fact.value} tone={fact.tone} mono={fact.mono} />
        ))}
      </div>

      <div style={{ marginTop: 16 }}><RunStatusBanner /></div>

      <div style={{ marginTop: 16 }}>
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
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Live agent output</div>
        <AgentLiveStrip scoped />
      </div>

      <div style={{ marginTop: 14 }}><ActivityConsole /></div>

      {vm.preview && (
        <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(79,139,255,.22)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "rgba(79,139,255,.08)", borderBottom: "1px solid rgba(79,139,255,.16)" }}>
            <div className="row gap-2">
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{vm.preview.fileName}</span>
              <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{vm.preview.agentType}</span>
            </div>
            <button onClick={vm.actions.closePreview} style={{ background: "none", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>x</button>
          </div>
          <pre style={{ margin: 0, padding: 14, fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 400, background: "rgba(0,0,0,.2)", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", whiteSpace: "pre", tabSize: 2 }}>{vm.preview.content}</pre>
        </div>
      )}

      {vm.latestRun && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(79,139,255,.24)", background: "rgba(79,139,255,.07)", borderRadius: 10 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Latest run</div>
              <div className="mono" style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{vm.latestRun.runId}</div>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <OrchestrationRunBadge status={vm.latestRun.status} />
              <Badge tone="purple">{vm.latestRun.triggerLabel}</Badge>
              <Badge tone="gray">{vm.latestRun.startedAtLabel}</Badge>
            </div>
          </div>
          {vm.latestRun.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{vm.latestRun.error}</div>}
        </div>
      )}

      {vm.failedWorkOrders.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.07)", borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Failed work orders</div>
          {vm.failedWorkOrders.map((row) => (
            <FailedWorkOrderRowView key={row.id} row={row} vm={vm} />
          ))}
        </div>
      )}

      <RepositoryStatus vm={vm} />
      <RunReadinessStatus vm={vm} />
      <WorkOrdersAndEvents vm={vm} />
      <RunHistory vm={vm} />
    </Card>
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
      <div className="row gap-2" style={{ marginTop: 14, padding: 10, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="row gap-2"><IconGitBranch size={13} style={{ color: "#6EE7B7" }} /> {vm.repoStatusMessage}</span>
        <a href={vm.detail.repoUrl || undefined} target="_blank" rel="noreferrer" className="row gap-1" style={{ color: "#93C5FD", fontWeight: 700 }}>Open repo <IconExternalLink size={12} /></a>
      </div>
    );
  }

  return (
    <div className="row gap-2" style={{ marginTop: 14, padding: 10, border: "1px solid rgba(59,130,246,.24)", background: "rgba(59,130,246,.07)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, justifyContent: "space-between", flexWrap: "wrap" }}>
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
      <div style={{ marginTop: 14, padding: 10, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
        {compactBackendError(vm.positiveStatusMessage)}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
      {vm.providerUnavailable && <BlockerMessage message={vm.providerUnavailableMessage} />}
      {vm.githubDeliveryUnavailable && <BlockerMessage message={vm.githubDeliveryUnavailableMessage} />}
      {vm.blockerMessages.map((blocker) => <BlockerMessage key={blocker} message={blocker} />)}
    </div>
  );
}

function BlockerMessage({ message }: { message: string }) {
  return (
    <div className="row gap-2" style={{ padding: 10, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5 }}>
      <IconAlertTriangle size={13} style={{ color: "#FBBF24", flexShrink: 0 }} />
      <span>{compactBackendError(message)}</span>
    </div>
  );
}

function WorkOrdersAndEvents({ vm }: { vm: BackendOrchestrationPanelViewModel }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, .7fr)", gap: 14, marginTop: 16 }}>
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
    <div style={{ marginTop: 16 }}>
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
