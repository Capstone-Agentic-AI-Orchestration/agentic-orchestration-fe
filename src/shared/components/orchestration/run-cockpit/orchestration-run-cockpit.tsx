"use client";

import { useRef, useState, type CSSProperties } from "react";
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
  { icon: <IconFileText size={15} />, title: "Parse & contract", body: "Agents read the brief and negotiate an architecture contract." },
  { icon: <IconShield size={15} />, title: "Gate 1 — your call", body: "You approve the contract before any code is written." },
  { icon: <IconCode size={15} />, title: "Build in parallel", body: "Frontend, backend, database & architecture agents stream code live." },
  { icon: <IconGitBranch size={15} />, title: "Gate 2 → delivery", body: "Review generated code, then it commits to GitHub." },
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

      {isAwaitingGate && (
        <div className="cockpit-state-banner is-awaiting reveal">
          <IconShield size={16} />
          <span>
            {status === "AWAITING_GATE_1"
              ? "Plan review is waiting for approval before code generation starts."
              : "Build review is waiting for approval before GitHub delivery."}
          </span>
        </div>
      )}

      {isDelivered && (
        <div className="cockpit-state-banner is-delivered reveal">
          <IconGitBranch size={16} />
          <span>Delivery is complete. Review the final handoff and client-facing artifacts.</span>
        </div>
      )}

      {isFailed && (
        <div className="cockpit-retry reveal">
          <div className="cockpit-retry-copy">
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <IconAlertTriangle size={16} style={{ color: "#FCA5A5" }} />
              <strong>The run is blocked</strong>
            </div>
            <p>{error || "Check the latest activity entry to identify which agent or provider stopped the run."}</p>
            <ol>
              <li>Review the latest failed event in the activity log.</li>
              <li>Fix the provider or project input named in the error.</li>
              <li>Retry the full run, or rerun only work orders that are ready.</li>
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

      <div className="cockpit-toolbar">
        <div className="cockpit-toolbar-copy">
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <IconActivity size={15} style={{ color: "var(--primary-2)" }} />
            <span className="cockpit-toolbar-title">Live agent output</span>
            {isRunning && (
              <span className={streamOnline ? "cockpit-live-pill" : "cockpit-live-pill is-paused"}>
                {streamOnline ? "Live tokens" : "Tokens paused"}
              </span>
            )}
          </div>
          <p className="cockpit-toolbar-subtitle">
            {streamOnline
              ? "Watch each specialist think, stream, validate, and hand off its artifact."
              : "Status keeps polling while token deltas resume after the socket reconnects."}
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
              title={streamOnline ? "Request the latest stream state from the socket" : "Refresh run status while the socket reconnects"}
            >
              <IconRefresh size={13} className={resyncing ? "spin" : undefined} />
              {resyncing ? "Syncing" : streamOnline ? "Resync stream" : "Refresh status"}
            </button>
          )}
          {isRunning && <RunControlCluster projectId={projectId} />}
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

      <details className="cockpit-log" open={isRunning}>
        <summary>
          <IconActivity size={14} />
          Activity log
          <span className="cockpit-log-hint">orchestration events</span>
        </summary>
        <div className="cockpit-log-body">
          <ActivityConsole maxHeight={260} />
        </div>
      </details>
    </div>
  );
}

function StreamHealthPill({ status }: { status: "disconnected" | "connecting" | "connected" }) {
  const copy = {
    connected: {
      label: "Socket live",
      detail: "Receiving token events",
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
          Orchestration ready
        </span>
        <h3 className="cockpit-launch-title">Launch the AI build pipeline</h3>
        <p className="cockpit-launch-lead">
          Eight specialized agents will take your brief from requirements to a committed GitHub
          repository — pausing twice for your approval. You&apos;ll watch every token stream in real
          time.
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
                {isFailed ? "Retry orchestration" : "Start orchestration"}
                <span className="btn-island" aria-hidden="true">
                  <IconRocket size={14} />
                </span>
              </>
            )}
          </button>
          {isFailed && (
            <button className="btn btn-secondary btn-lg" onClick={onRerun} disabled={starting}>
              <IconRefresh size={14} />
              Rerun ready work orders
            </button>
          )}
        </div>
        {starting && (
          <div className="cockpit-loading-skeleton" aria-label="Starting orchestration">
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
