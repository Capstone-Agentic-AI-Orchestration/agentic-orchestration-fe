"use client";

import { useState, type CSSProperties } from "react";
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
import { RunMeterBar } from "./run-meter-bar";
import { AgentStreamGrid } from "./agent-stream-grid";
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
  starting: boolean;
  error?: string;
}

export function OrchestrationRunCockpit({
  projectId,
  projectName,
  status,
  onStart,
  onRerun,
  starting,
  error,
}: OrchestrationRunCockpitProps) {
  const isRunning = RUNNING_STATUSES.has(status);
  const isAwaitingGate = status === "AWAITING_GATE_1" || status === "AWAITING_GATE_2";
  const isFailed = status === "FAILED";
  const isDelivered = status === "DELIVERED";
  const isLive = isRunning || isAwaitingGate || isFailed || isDelivered;

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

      {isFailed && (
        <div className="cockpit-retry reveal">
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <IconAlertTriangle size={16} style={{ color: "#FCA5A5" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>The run hit an error. Retry the pipeline or rerun ready work orders.</span>
          </div>
          <div className="row gap-2">
            <button className="btn btn-primary btn-sm magnetic" onClick={onStart} disabled={starting}>
              {starting ? <IconRefresh size={14} className="spin" /> : <IconRefresh size={14} />}
              Retry run
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onRerun} disabled={starting}>
              Rerun work orders
            </button>
          </div>
        </div>
      )}

      <div className="cockpit-toolbar">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <IconActivity size={15} style={{ color: "var(--primary-2)" }} />
          <span className="cockpit-toolbar-title">Live agent floor</span>
          {isRunning && <span className="cockpit-live-pill">● Live</span>}
        </div>
        {isRunning && <RunControlCluster projectId={projectId} />}
      </div>

      <div className="cockpit-stage">
        <AgentStreamGrid />
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
