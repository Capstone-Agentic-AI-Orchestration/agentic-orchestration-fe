"use client";

import type { ReactNode } from "react";
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

export function DevOrchestratorWorkbenchView({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <div data-screen-label="Dev Orchestrator" style={{ display: "grid", gap: 20 }}>
      <DevPageHeader
        title="AI Orchestrator"
        subtitle="Role-scoped orchestration status, handoffs, artifacts, and event logs for the selected project."
        actions={<Button variant="secondary" icon={<IconRefresh size={14} />} onClick={vm.actions.refresh}>Refresh projects</Button>}
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
          <Card style={{ padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <Badge tone={vm.lifecycle.tone}>{vm.lifecycle.label}</Badge>
                <h2 style={{ margin: "12px 0 0", fontSize: 22, fontWeight: 700 }}>{vm.selectedProject.companyName}</h2>
                <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 8, maxWidth: 760 }}>{vm.selectedProject.brief}</p>
              </div>
              <Button variant="primary" iconRight={<IconArrowRight size={14} />} onClick={vm.actions.openOutput}>Open output</Button>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {vm.metrics.map((metric) => (
              <OrchestratorMetric key={metric.label} metric={metric} />
            ))}
          </div>

          <OrchestrationProviderStatusPanel status={vm.provider.status} loading={vm.provider.loading} error={vm.providerErrorMessage} />

          <RunStatusBanner />

          <Card style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Live pipeline</h3>
                <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Interactive DAG — click a node to inspect telemetry, errors, and reasoning. Real-time via WebSocket.</p>
              </div>
            </div>
            <OrchestrationCanvas projectId={vm.selectedProject.id} live={vm.isLiveRun} />
          </Card>

          <Card style={{ padding: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Live agent output</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Token-by-token reasoning streamed from each agent as it generates — no node selection required.</p>
            </div>
            <AgentLiveStrip scoped />
          </Card>

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

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Recent orchestration events</h3>
                <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Backend event log records for this project</p>
              </div>
              {vm.outputs.loading ? (
                <div style={{ padding: 18, color: "var(--text-2)" }}>Loading events...</div>
              ) : vm.outputs.events.length === 0 ? (
                <div style={{ padding: 18, color: "var(--text-3)" }}>No event logs yet.</div>
              ) : vm.visibleEvents.map((event) => (
                <div key={event.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{event.nodeName}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.eventType} - {formatDevFlowDate(event.occurredAt)} - {event.runTokens} tokens</div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 18 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Assigned handoffs</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Work orders visible to this developer</p>
              {vm.outputs.workOrders.length === 0 ? (
                <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No visible handoffs yet.</div>
              ) : vm.visibleWorkOrders.map((workOrder) => (
                <div key={workOrder.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{workOrder.title}</div>
                    <Badge tone={workOrder.status === "DISPATCHED" ? "purple" : workOrder.status === "READY" ? "blue" : "gray"}>{workOrder.status}</Badge>
                  </div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{workOrder.agentType} - {workOrder.priority}</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
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

