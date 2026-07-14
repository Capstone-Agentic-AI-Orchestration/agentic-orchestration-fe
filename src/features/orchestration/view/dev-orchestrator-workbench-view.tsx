"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowRight, IconCpu, IconFileText, IconRefresh, IconWorkflow } from "@/shared/components/icons";
import { BackendAwareRouteState } from "@/shared/components/backend-aware-route-state";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { AgentLiveStrip } from "@/features/pm/shared/components/pm-agent-live-strip";
import { OrchestrationCanvas } from "@/shared/components/orchestration/canvas/orchestration-canvas";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { RunStatusBanner } from "@/shared/components/orchestration/run-status-banner";
import { formatDevFlowDate, lifecycleProgressColor } from "@/shared/utils/devflow-projects";
import type { OrchestrationMetricIcon, OrchestrationMetricViewModel, OrchestrationWorkbenchViewModel } from "../model/orchestration-workbench";

type WorkbenchTab = "overview" | "pipeline" | "agents" | "artifacts" | "diagnostics";

const TABS: Array<{ id: WorkbenchTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "agents", label: "Agents" },
  { id: "artifacts", label: "Artifacts" },
  { id: "diagnostics", label: "Diagnostics" },
];

export function DevOrchestratorWorkbenchView({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("overview");

  return (
    <div data-screen-label="Dev Orchestrator" style={{ display: "grid", gap: 20 }}>
      <DevPageHeader
        title="AI Orchestrator"
        subtitle="See what the AI is doing, what happens next, and which project-manager decision the run is waiting for."
        actions={<Button variant="secondary" icon={<IconRefresh size={14} />} onClick={vm.actions.refresh}>Refresh</Button>}
      />

      {vm.errorMessage ? (
        <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{vm.errorMessage}</Card>
      ) : vm.selectedProjectLoading ? (
        <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading selected project...</Card>
      ) : !vm.selectedProject ? (
        <BackendAwareRouteState
          eyebrow="Orchestration module"
          title="No assigned project selected"
          subtitle="Orchestration status appears after this developer account is assigned to a backend project."
          projects={vm.projects}
          loading={vm.selectedProjectLoading}
          error={vm.selectedProjectError}
          pending={["Project assignment through PM member management"]}
          primaryAction={{ label: "Open projects", onClick: vm.actions.openProjects }}
        />
      ) : (
        <>
          <nav className="dev-orch-tabs" aria-label="Orchestrator views">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : undefined}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && <Overview vm={vm} />}
          {activeTab === "pipeline" && (
            <Card style={{ padding: 18 }}>
              <SectionHeading title="Live pipeline" detail="Select a node to inspect its status and telemetry. Run controls remain with the project manager." />
              <OrchestrationCanvas projectId={vm.selectedProject.id} live={vm.isLiveRun} showControls={false} />
            </Card>
          )}
          {activeTab === "agents" && (
            <div style={{ display: "grid", gap: 18 }}>
              <Card style={{ padding: 18 }}>
                <SectionHeading title="Live agent activity" detail="Follow specialist output and handoffs in plain project context." />
                <AgentLiveStrip scoped />
              </Card>
              <AssignedHandoffs vm={vm} />
            </div>
          )}
          {activeTab === "artifacts" && <Artifacts vm={vm} />}
          {activeTab === "diagnostics" && <Diagnostics vm={vm} />}
        </>
      )}
    </div>
  );
}

function Overview({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  if (!vm.selectedProject) return null;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card className={`dev-orch-guidance tone-${vm.guidance.tone}`} style={{ padding: 20 }}>
        <span className="dev-orch-guidance-eyebrow">{vm.guidance.eyebrow}</span>
        <h2>{vm.guidance.title}</h2>
        <p>{vm.guidance.description}</p>
        <strong>{vm.guidance.waitingOn}</strong>
      </Card>

      <Card style={{ padding: 24 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <Badge tone={vm.lifecycle.tone}>{vm.lifecycle.label}</Badge>
            <h2 style={{ margin: "12px 0 0", fontSize: 22, fontWeight: 700 }}>{vm.selectedProject.companyName}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 8, maxWidth: 760 }}>{vm.selectedProject.brief}</p>
          </div>
          <Button variant="primary" iconRight={<IconArrowRight size={14} />} onClick={vm.actions.openOutput}>Open project output</Button>
        </div>
        <div style={{ marginTop: 18, maxWidth: 520 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ color: "var(--text-2)", fontSize: 12 }}>Lifecycle progress</span>
            <span className="mono" style={{ fontSize: 12, color: "white" }}>{vm.lifecycle.progress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(8,14,32,.7)", overflow: "hidden" }}>
            <div style={{ width: `${vm.lifecycle.progress}%`, height: "100%", background: lifecycleProgressColor(vm.lifecycle.tone) }} />
          </div>
        </div>
      </Card>

      <RunStatusBanner />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {vm.metrics.map((metric) => <OrchestratorMetric key={metric.label} metric={metric} />)}
      </div>
    </div>
  );
}

function Artifacts({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <SectionHeading title="Generated artifacts" detail="Files produced for the selected assigned project." />
          <Button variant="primary" size="sm" onClick={vm.actions.openOutput}>Open full output</Button>
        </div>
      </div>
      {vm.outputs.loading ? (
        <div style={{ padding: 18, color: "var(--text-2)" }}>Loading artifacts...</div>
      ) : vm.outputs.artifacts.length === 0 ? (
        <div style={{ padding: 18, color: "var(--text-3)" }}>No artifacts yet. They will appear after the build agents finish their work.</div>
      ) : vm.outputs.artifacts.map((artifact) => (
        <div key={artifact.id} style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflowWrap: "anywhere" }}>{artifact.displayName || artifact.filePath}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{artifact.agentType} · {formatDevFlowDate(artifact.createdAt)}</div>
            </div>
            <Badge tone={artifact.validationStatus === "PASSED" ? "green" : artifact.validationStatus === "FAILED" ? "red" : "gray"}>
              {artifact.validationStatus || "PENDING"}
            </Badge>
          </div>
        </div>
      ))}
    </Card>
  );
}

function Diagnostics({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  if (!vm.selectedProject) return null;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <OrchestrationProviderStatusPanel status={vm.provider.status} loading={vm.provider.loading} error={vm.providerErrorMessage} />
      <OrchestrationLiveVisualizer
        project={vm.selectedProject}
        status={vm.orchestration.status}
        providerStatus={vm.provider.status}
        workOrders={vm.outputs.workOrders}
        artifacts={vm.outputs.artifacts}
        events={vm.outputs.events}
        loading={vm.liveVisualizerLoading}
        useWebSocket
      />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
          <SectionHeading title="Recent orchestration events" detail="Technical event records for troubleshooting and support." />
        </div>
        {vm.outputs.loading ? (
          <div style={{ padding: 18, color: "var(--text-2)" }}>Loading events...</div>
        ) : vm.outputs.events.length === 0 ? (
          <div style={{ padding: 18, color: "var(--text-3)" }}>No event logs yet.</div>
        ) : vm.visibleEvents.map((event) => (
          <div key={event.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{event.nodeName}</div>
            <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.eventType} · {formatDevFlowDate(event.occurredAt)} · {event.runTokens} tokens</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AssignedHandoffs({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <Card style={{ padding: 18 }}>
      <SectionHeading title="Assigned handoffs" detail="Work orders visible to this developer." />
      {vm.outputs.workOrders.length === 0 ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No visible handoffs yet.</div>
      ) : vm.visibleWorkOrders.map((workOrder) => (
        <div key={workOrder.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>{workOrder.title}</div>
            <Badge tone={workOrder.status === "DISPATCHED" ? "purple" : workOrder.status === "READY" ? "blue" : "gray"}>{workOrder.status}</Badge>
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{workOrder.agentType} · {workOrder.priority}</div>
        </div>
      ))}
    </Card>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title}</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>{detail}</p>
    </div>
  );
}

function OrchestratorMetric({ metric }: { metric: OrchestrationMetricViewModel }) {
  return (
    <Card style={{ padding: 16 }}>
      <div className="row gap-2" style={{ color: "#C4B5FD" }}>{metricIcon(metric.icon)}<span style={{ color: "var(--text-2)", fontSize: 12 }}>{metric.label}</span></div>
      <div style={{ fontSize: 23, fontWeight: 800, marginTop: 10 }}>{metric.value}</div>
      <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{metric.sub}</div>
    </Card>
  );
}

function metricIcon(icon: OrchestrationMetricIcon): ReactNode {
  if (icon === "work-orders") return <IconWorkflow size={16} />;
  if (icon === "artifacts") return <IconFileText size={16} />;
  return <IconCpu size={16} />;
}
