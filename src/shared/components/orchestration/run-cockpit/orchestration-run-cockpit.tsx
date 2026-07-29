"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  buildExecutionSummary,
  type ExecutionPhase,
} from "@/features/orchestration/model/run-cockpit";
import {
  controlDevFlowOrchestration,
  type DevFlowOrchestrationControlAction,
} from "@/shared/api/devflow-api";
import {
  IconRocket,
  IconPlay,
  IconRefresh,
  IconPause,
  IconClose,
  IconActivity,
  IconAlertTriangle,
  IconFileText,
  IconShield,
  IconCode,
  IconGitBranch,
  IconArrowRight,
  IconCheck,
} from "@/shared/components/icons";
import { ActivityConsole } from "@/shared/components/orchestration/activity-console";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import { RunMeterBar } from "./run-meter-bar";
import { AgentLiveHandoff, AgentOutputInspector, AgentRunTranscript, AgentStreamGrid, AgentStreamPulse } from "./agent-stream-grid";
import { PipelineRail } from "./pipeline-rail";

const RUNNING_STATUSES = new Set([
  "PARSING_REQUIREMENTS",
  "NEGOTIATING_CONTRACT",
  "GENERATING_CODE",
  "COMMITTING",
]);

const LAUNCH_STEPS = [
  { icon: <IconFileText size={15} />, title: "Prepare the plan", body: "DevFlow turns the approved outcome into concrete work and deliverables." },
  { icon: <IconShield size={15} />, title: "Review the plan", body: "You approve the direction before implementation begins." },
  { icon: <IconCode size={15} />, title: "Build deliverables", body: "Work progresses against the approved plan and pauses for review." },
  { icon: <IconGitBranch size={15} />, title: "Approve delivery", body: "You review the result before the final handoff." },
];

interface OrchestrationRunCockpitProps {
  projectId: string;
  projectName?: string;
  /** Authoritative status (project.status ?? status?.status). */
  status: string;
  onStart: () => void;
  onRerun: () => void;
  onResync?: () => Promise<void> | void;
  starting: boolean;
  error?: string;
}

export function OrchestrationRunCockpit({
  projectId,
  projectName,
  status,
  onStart,
  onRerun,
  onResync,
  starting,
  error,
}: OrchestrationRunCockpitProps) {
  const router = useRouter();
  const connectionStatus = useOrchestrationStore((s) => s.connectionStatus);
  const [selectedAgentNodeId, setSelectedAgentNodeId] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const isRunning = RUNNING_STATUSES.has(status);
  const isAwaitingGate = status === "AWAITING_GATE_1" || status === "AWAITING_GATE_2";
  const isFailed = status === "FAILED";
  const isDelivered = status === "DELIVERED";
  const isLive = isRunning || isAwaitingGate || isFailed || isDelivered;
  const streamOnline = connectionStatus === "connected";
  const execution = buildExecutionSummary(status);
  const selectAgentNode = (nodeId: string) => {
    setSelectedAgentNodeId(nodeId);
    window.requestAnimationFrame(() => {
      inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const resyncStream = async () => {
    if (!onResync || resyncing) return;
    setResyncing(true);
    try {
      await onResync();
    } finally {
      setResyncing(false);
    }
  };

  // Pristine project that has never run → premium launch pad.
  if (!isLive) {
    return (
      <div className="cockpit">
        <LaunchPad onStart={onStart} starting={starting} error={error} isFailed={false} onRerun={onRerun} />
      </div>
    );
  }

  return (
    <div className="cockpit">
      <RunMeterBar projectName={projectName} status={status} />

      {error && (
        <div className="wizard-info-banner warning" style={{ marginTop: 14 }}>
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <ExecutionPhaseRail phases={execution.phases} />

      {execution.actionStep && (
        <section className="cockpit-decision reveal" aria-labelledby="cockpit-decision-title">
          <span className="cockpit-decision-icon">
            {execution.actionStep === "delivery" ? <IconGitBranch size={18} /> : <IconShield size={18} />}
          </span>
          <div className="cockpit-decision-copy">
            <span>PM action required</span>
            <strong id="cockpit-decision-title">{execution.headline}</strong>
            <p>{execution.description}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => router.push(`/pm/orchestrate/${projectId}`)}
          >
            {execution.actionLabel}
            <IconArrowRight size={14} />
          </button>
        </section>
      )}

      {isFailed && (
        <div className="cockpit-retry reveal">
          <div className="cockpit-retry-copy">
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <IconAlertTriangle size={16} style={{ color: "#FCA5A5" }} />
              <strong>The run is blocked</strong>
            </div>
            <p>{error || "Check the latest activity entry to identify which step or service stopped execution."}</p>
            <ol>
              <li>Review the latest failed event in the activity log.</li>
              <li>Fix the service or project input named in the error.</li>
              <li>Retry the full execution, or retry only work that is ready.</li>
            </ol>
          </div>
          <div className="cockpit-retry-actions">
            <button className="btn btn-primary btn-sm magnetic" onClick={onStart} disabled={starting}>
              {starting ? <IconRefresh size={14} className="spin" /> : <IconRefresh size={14} />}
              Retry full run
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onRerun} disabled={starting}>
              Rerun ready work only
            </button>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="cockpit-primary-controls">
          <span>Need to intervene?</span>
          <RunControlCluster projectId={projectId} />
        </div>
      )}

      <details className="cockpit-technical">
        <summary>
          <span className="cockpit-technical-summary">
            <IconActivity size={15} />
            <span>
              <strong>Technical activity</strong>
              <small>Live workstreams, generated output, and execution events</small>
            </span>
          </span>
          <span className="cockpit-technical-status">
            {isRunning && (
              <span className={streamOnline ? "cockpit-live-pill" : "cockpit-live-pill is-paused"}>
                {streamOnline ? "Live" : "Polling"}
              </span>
            )}
            <span aria-hidden="true">+</span>
          </span>
        </summary>
        <div className="cockpit-technical-body">
          <div className="cockpit-toolbar">
            <div className="cockpit-toolbar-copy">
              <span className="cockpit-toolbar-title">Live execution detail</span>
              <p className="cockpit-toolbar-subtitle">
                {streamOnline
                  ? "Inspect workstreams, intermediate output, and handoffs."
                  : "Project status keeps updating while the live stream reconnects."}
              </p>
            </div>
            <div className="cockpit-toolbar-actions">
              <AgentStreamPulse />
              <StreamHealthPill status={connectionStatus} />
              {onResync && (
                <button
                  type="button"
                  className="stream-resync-btn"
                  onClick={resyncStream}
                  disabled={resyncing}
                  title={streamOnline ? "Request the latest execution state" : "Refresh execution status"}
                >
                  <IconRefresh size={13} className={resyncing ? "spin" : undefined} />
                  {resyncing ? "Syncing" : streamOnline ? "Resync" : "Refresh status"}
                </button>
              )}
            </div>
          </div>

          <AgentLiveHandoff />
          <AgentRunTranscript
            selectedNodeId={selectedAgentNodeId}
            onSelectAgent={selectAgentNode}
            streamOnline={streamOnline}
          />
          <div ref={inspectorRef} className="agent-inspector-anchor">
            <AgentOutputInspector
              selectedNodeId={selectedAgentNodeId}
              onSelectedNodeIdChange={setSelectedAgentNodeId}
              streamOnline={streamOnline}
            />
          </div>

          <div className="cockpit-stage">
            <AgentStreamGrid
              selectedNodeId={selectedAgentNodeId}
              onSelectAgent={selectAgentNode}
              streamOnline={streamOnline}
            />
            <PipelineRail />
          </div>

          <details className="cockpit-log">
            <summary>
              <IconActivity size={14} />
              Event log
              <span className="cockpit-log-hint">technical events</span>
            </summary>
            <div className="cockpit-log-body">
              <ActivityConsole maxHeight={260} />
            </div>
          </details>
        </div>
      </details>
    </div>
  );
}

function ExecutionPhaseRail({ phases }: { phases: ExecutionPhase[] }) {
  return (
    <section className="execution-phase-rail reveal" aria-label="Execution phases">
      {phases.map((phase, index) => (
        <div key={phase.id} className={`execution-phase is-${phase.state}`}>
          <span className="execution-phase-marker" aria-hidden="true">
            {phase.state === "done" ? <IconCheck size={13} /> : index + 1}
          </span>
          <span>
            <strong>{phase.label}</strong>
            <small>
              {phase.state === "done"
                ? "Complete"
                : phase.state === "active"
                  ? "In progress"
                  : phase.state === "blocked"
                    ? "Needs attention"
                    : "Upcoming"}
            </small>
          </span>
        </div>
      ))}
    </section>
  );
}

function StreamHealthPill({ status }: { status: "disconnected" | "connecting" | "connected" }) {
  const copy = {
    connected: {
      label: "Live updates",
      detail: "Receiving live updates",
    },
    connecting: {
      label: "Connecting",
      detail: "Opening live stream",
    },
    disconnected: {
      label: "Status polling",
      detail: "Token stream resumes after socket reconnect",
    },
  }[status];

  return (
    <span className={`stream-health-pill is-${status}`} title={copy.detail} aria-live="polite">
      <span className="stream-health-dot" aria-hidden="true" />
      <span>{copy.label}</span>
    </span>
  );
}

/* ── Pre-run launch pad ─────────────────────────────────────────────── */
function LaunchPad({
  onStart,
  starting,
  error,
  isFailed,
  onRerun,
}: {
  onStart: () => void;
  starting: boolean;
  error?: string;
  isFailed: boolean;
  onRerun: () => void;
}) {
  return (
    <section className="cockpit-launch reveal">
      <div className="cockpit-launch-glow" aria-hidden="true" />
      <div className="cockpit-launch-inner">
        <span className="cockpit-launch-badge">
          <span className="dot" />
          Ready to execute
        </span>
        <h3 className="cockpit-launch-title">Start project execution</h3>
        <p className="cockpit-launch-lead">
          DevFlow will prepare the plan, build the approved deliverables, and pause whenever your
          decision is required. Technical activity remains available as an optional detailed view.
        </p>

        <div className="cockpit-launch-steps">
          {LAUNCH_STEPS.map((s, i) => (
            <div key={s.title} className="cockpit-launch-step reveal" style={{ "--i": i } as CSSProperties}>
              <span className="cockpit-launch-step-icon">{s.icon}</span>
              <div>
                <div className="cockpit-launch-step-title">{s.title}</div>
                <div className="cockpit-launch-step-body">{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="wizard-info-banner warning" style={{ marginTop: 4 }}>
            <IconAlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="cockpit-launch-actions">
          <button className="btn btn-primary btn-lg magnetic cockpit-launch-cta" onClick={onStart} disabled={starting}>
            {starting ? (
              <>
                <IconRefresh size={16} className="spin" />
                Starting…
              </>
            ) : (
              <>
                <IconPlay size={16} />
                {isFailed ? "Retry execution" : "Start execution"}
                <span className="btn-island" aria-hidden="true">
                  <IconRocket size={14} />
                </span>
              </>
            )}
          </button>
          {isFailed && (
            <button className="btn btn-secondary btn-lg" onClick={onRerun} disabled={starting}>
              <IconRefresh size={14} />
              Retry ready work
            </button>
          )}
        </div>
        {starting && (
          <div className="cockpit-loading-skeleton" aria-label="Starting project execution">
            <span className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Mid-run controls (run-level) ───────────────────────────────────── */
function RunControlCluster({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState<DevFlowOrchestrationControlAction | null>(null);

  const run = async (action: DevFlowOrchestrationControlAction) => {
    setBusy(action);
    try {
      await controlDevFlowOrchestration(projectId, action);
    } catch {
      // surfaced via the activity log / status; keep the cluster quiet
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="cockpit-controls">
      <button className="cockpit-ctl" onClick={() => run("pause")} disabled={busy !== null} title="Pause run">
        <IconPause size={13} />
        {busy === "pause" ? "Pausing…" : "Pause"}
      </button>
      <button className="cockpit-ctl" onClick={() => run("resume")} disabled={busy !== null} title="Resume run">
        <IconPlay size={13} />
        Resume
      </button>
      <button className="cockpit-ctl is-danger" onClick={() => run("cancel")} disabled={busy !== null} title="Cancel run">
        <IconClose size={13} />
        {busy === "cancel" ? "Cancelling…" : "Cancel"}
      </button>
    </div>
  );
}
