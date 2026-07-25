"use client";

import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Textarea,
  useToast,
} from "@/shared/components/ui";
import {
  IconArrowRight,
  IconCpu,
  IconFileText,
  IconRefresh,
  IconWorkflow,
} from "@/shared/components/icons";
import { BackendAwareRouteState } from "@/shared/components/backend-aware-route-state";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { AgentLiveStrip } from "@/features/pm/shared/components/pm-agent-live-strip";
import { OrchestrationCanvas } from "@/shared/components/orchestration/canvas/orchestration-canvas";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { RunStatusBanner } from "@/shared/components/orchestration/run-status-banner";
import { ModelSelectionPanel } from "@/shared/components/orchestration/model-selection-panel";
import { startDevFlowOrchestrationFromPrompt } from "@/shared/api/devflow-api";
import { useOrchestrationModelSelection } from "@/shared/hooks/use-orchestration-model-selection";
import {
  compactDevFlowError,
  formatDevFlowDate,
  lifecycleProgressColor,
} from "@/shared/utils/devflow-projects";
import type {
  OrchestrationMetricIcon,
  OrchestrationMetricViewModel,
  OrchestrationWorkbenchViewModel,
} from "../model/orchestration-workbench";

export function DevOrchestratorWorkbenchView({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <div className="dev-workspace-page dev-orchestrator-page" data-screen-label="Dev Orchestrator">
      <DevPageHeader
        title="AI Orchestrator"
        subtitle="Start a build, follow every agent handoff, and inspect the generated result without leaving the cockpit."
        actions={
          <Button
            variant="secondary"
            icon={<IconRefresh size={14} />}
            onClick={vm.actions.refresh}
          >
            Refresh
          </Button>
        }
      />

      {vm.selectedProjectLoading ? (
        <Card className="dev-muted-state">Loading selected project…</Card>
      ) : !vm.selectedProject ? (
        <BackendAwareRouteState
          eyebrow="Orchestration cockpit"
          title="Select an assigned project"
          subtitle="Choose a project before starting or monitoring an AI build."
          projects={vm.projects}
          loading={vm.selectedProjectLoading}
          error={vm.selectedProjectError}
          pending={["A project assignment from your project manager"]}
          primaryAction={{ label: "Open projects", onClick: vm.actions.openProjects }}
        />
      ) : (
        <>
          <ProjectRunContext vm={vm} />

          {!vm.selectedProject.runId ? (
            <StartBuildPanel
              projectId={vm.selectedProject.id}
              repositoryReady={Boolean(vm.selectedProject.repoUrl)}
              onStarted={vm.actions.refresh}
            />
          ) : null}

          {vm.errorMessage ? (
            <Card className="dev-error-state" role="alert">
              <strong>The latest orchestration data could not be loaded.</strong>
              <span>{vm.errorMessage}</span>
              <Button variant="secondary" size="sm" onClick={vm.actions.refresh}>
                Try again
              </Button>
            </Card>
          ) : vm.selectedProject.runId ? (
            <Cockpit vm={vm} />
          ) : null}
        </>
      )}
    </div>
  );
}

function ProjectRunContext({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  if (!vm.selectedProject) return null;
  const disconnected = vm.connectionStatus === "disconnected";

  return (
    <section className="dev-orch-context">
      <div className="dev-orch-context-copy">
        <div className="dev-project-badges">
          <Badge tone={vm.lifecycle.tone}>{vm.lifecycle.label}</Badge>
          <Badge tone={disconnected ? "red" : "green"} dot>
            {disconnected ? "Live updates disconnected" : "Live updates connected"}
          </Badge>
        </div>
        <h2>{vm.selectedProject.companyName}</h2>
        <p>{vm.selectedProject.brief}</p>
      </div>
      {vm.selectedProject.runId ? (
        <Button
          variant="primary"
          iconRight={<IconArrowRight size={14} />}
          onClick={vm.actions.openOutput}
        >
          Inspect output
        </Button>
      ) : null}
    </section>
  );
}

function StartBuildPanel({
  projectId,
  repositoryReady,
  onStarted,
}: {
  projectId: string;
  repositoryReady: boolean;
  onStarted: () => void;
}) {
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const modelSelection = useOrchestrationModelSelection(projectId);

  const startBuild = async () => {
    const buildPrompt = prompt.trim();
    if (!buildPrompt) {
      setError("Describe the result you want the agents to build.");
      return;
    }
    if (modelSelection.loading) {
      setError("Wait for the Vercel model list to finish loading before starting the build.");
      return;
    }
    if (!modelSelection.selection) {
      setError(modelSelection.error || "Choose an AI Gateway model before starting the build.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await startDevFlowOrchestrationFromPrompt(
        projectId,
        buildPrompt,
        modelSelection.selection,
      );
      toast.success("Build started", "The orchestration run is now being prepared.");
      onStarted();
    } catch (cause) {
      setError(compactDevFlowError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (!repositoryReady) {
    return (
      <Card className="dev-start-build-panel dev-repository-blocked">
        <span className="dev-section-kicker">Repository required</span>
        <h2>This project is not ready to build</h2>
        <p>
          Ask the project manager to assign a repository from Teams before starting
          orchestration.
        </p>
      </Card>
    );
  }

  return (
    <Card className="dev-start-build-panel">
      <div>
        <span className="dev-section-kicker">Start here</span>
        <h2>Describe the build outcome</h2>
        <p>
          Give the orchestrator a concrete goal, constraints, and acceptance criteria.
          You can monitor each specialist after the run begins.
        </p>
      </div>
      <Field
        label="Build prompt"
        error={error || undefined}
        helper="Include the expected behavior, important edge cases, and completion criteria."
      >
        <Textarea
          rows={7}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Build the assigned feature so that…"
          disabled={submitting}
        />
      </Field>
      <ModelSelectionPanel controller={modelSelection} disabled={submitting} />
      <div className="dev-start-build-actions">
        <span>{prompt.trim().length} characters</span>
        <Button variant="primary" onClick={startBuild} disabled={submitting}>
          {submitting ? "Starting…" : "Start AI build"}
        </Button>
      </div>
    </Card>
  );
}

function Cockpit({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <div className="dev-cockpit">
      <div className="dev-cockpit-sticky">
        <Card className={`dev-orch-guidance tone-${vm.guidance.tone}`}>
          <span className="dev-orch-guidance-eyebrow">{vm.guidance.eyebrow}</span>
          <h2>{vm.guidance.title}</h2>
          <p>{vm.guidance.description}</p>
          <strong>{vm.guidance.waitingOn}</strong>
        </Card>
        <RunStatusBanner />
      </div>

      <section className="dev-cockpit-primary">
        <Card className="dev-cockpit-pipeline">
          <SectionHeading
            title="Live pipeline"
            detail="Select a node to inspect it. Available run controls stay attached to the canvas."
          />
          <OrchestrationCanvas
            projectId={vm.selectedProjectId!}
            live={vm.isLiveRun}
            showControls
          />
        </Card>

        <aside className="dev-cockpit-summary">
          <div className="dev-cockpit-metrics">
            {vm.metrics.map((metric) => (
              <OrchestratorMetric key={metric.label} metric={metric} />
            ))}
          </div>
          <OrchestrationProviderStatusPanel
            status={vm.provider.status}
            loading={vm.provider.loading}
            error={vm.providerErrorMessage}
          />
        </aside>
      </section>

      <section className="dev-cockpit-activity">
        <Card className="dev-agent-streams">
          <SectionHeading
            title="Live agent streams"
            detail="Watch specialist output and transitions as the run progresses."
          />
          <AgentLiveStrip scoped />
        </Card>
        <AssignedHandoffs vm={vm} />
      </section>

      <section className="dev-cockpit-output">
        <Artifacts vm={vm} />
        <Diagnostics vm={vm} />
      </section>
    </div>
  );
}

function Artifacts({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <Card className="dev-cockpit-card dev-artifacts-card">
      <div className="dev-cockpit-card-heading">
        <SectionHeading
          title="Generated artifacts"
          detail="Files produced for the selected assigned project."
        />
        <Button variant="secondary" size="sm" onClick={vm.actions.openOutput}>
          Full output
        </Button>
      </div>
      {vm.outputs.loading ? (
        <div className="dev-muted-state">Loading artifacts…</div>
      ) : vm.outputs.artifacts.length === 0 ? (
        <div className="dev-muted-state">
          No artifacts yet. They will appear as agents finish work.
        </div>
      ) : (
        <div className="dev-technical-list">
          {vm.outputs.artifacts.map((artifact) => (
            <div key={artifact.id} className="dev-technical-row">
              <div>
                <strong>{artifact.displayName || artifact.filePath}</strong>
                <span>
                  {artifact.agentType} · {formatDevFlowDate(artifact.createdAt)}
                </span>
              </div>
              <Badge
                tone={
                  artifact.validationStatus === "PASSED"
                    ? "green"
                    : artifact.validationStatus === "FAILED"
                      ? "red"
                      : "gray"
                }
              >
                {artifact.validationStatus || "PENDING"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Diagnostics({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  if (!vm.selectedProject) return null;
  return (
    <div className="dev-diagnostics-stack">
      <Card className="dev-cockpit-card">
        <SectionHeading
          title="Run diagnostics"
          detail="Live topology, health, and execution data."
        />
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
      </Card>
      <Card className="dev-cockpit-card">
        <SectionHeading
          title="Recent events"
          detail="Technical records for troubleshooting and support."
        />
        {vm.outputs.loading ? (
          <div className="dev-muted-state">Loading events…</div>
        ) : vm.outputs.events.length === 0 ? (
          <div className="dev-muted-state">No event logs yet.</div>
        ) : (
          <div className="dev-technical-list">
            {vm.visibleEvents.map((event) => (
              <div key={event.id} className="dev-technical-row">
                <div>
                  <strong>{event.nodeName}</strong>
                  <span>
                    {event.eventType} · {formatDevFlowDate(event.occurredAt)} ·{" "}
                    {event.runTokens} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AssignedHandoffs({ vm }: { vm: OrchestrationWorkbenchViewModel }) {
  return (
    <Card className="dev-cockpit-card">
      <SectionHeading
        title="Assigned handoffs"
        detail="Work orders currently visible to you."
      />
      {vm.outputs.workOrders.length === 0 ? (
        <div className="dev-muted-state">No visible handoffs yet.</div>
      ) : (
        <div className="dev-technical-list">
          {vm.visibleWorkOrders.map((workOrder) => (
            <div key={workOrder.id} className="dev-technical-row">
              <div>
                <strong>{workOrder.title}</strong>
                <span>
                  {workOrder.agentType} · {workOrder.priority}
                </span>
              </div>
              <Badge
                tone={
                  workOrder.status === "DISPATCHED"
                    ? "purple"
                    : workOrder.status === "READY"
                      ? "blue"
                      : "gray"
                }
              >
                {workOrder.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="dev-section-heading">
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}

function OrchestratorMetric({ metric }: { metric: OrchestrationMetricViewModel }) {
  return (
    <Card className="dev-orch-metric">
      <div className="dev-orch-metric-label">
        {metricIcon(metric.icon)}
        <span>{metric.label}</span>
      </div>
      <strong>{metric.value}</strong>
      <p>{metric.sub}</p>
    </Card>
  );
}

function metricIcon(icon: OrchestrationMetricIcon): ReactNode {
  if (icon === "work-orders") return <IconWorkflow size={16} />;
  if (icon === "artifacts") return <IconFileText size={16} />;
  return <IconCpu size={16} />;
}
