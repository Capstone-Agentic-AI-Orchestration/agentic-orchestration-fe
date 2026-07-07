"use client";

import { useEffect, useRef, useState } from "react";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import { IconActivity, IconCpu, IconCreditCard, IconClock, IconZap } from "@/shared/components/icons";

/**
 * Mission-control header for a live orchestration run.
 *
 * This is the "token streaming up there" surface. It reduces the store's
 * per-node telemetry (delivered over the typed `node.telemetry` channel) into a
 * single live read: total tokens, spend, budget burn, and elapsed time — plus
 * the headline status and overall pipeline progress.
 *
 * Token budget: the orchestration status API does not expose the per-run
 * `RunBudget`, so we chart consumed tokens against the backend default
 * (`RunBudget` = 200k). Consumed is real (summed from telemetry).
 */
export const RUN_TOKEN_BUDGET = 200_000;

const PIPELINE_ORDER = [
  "parse_requirements",
  "negotiate_contract",
  "gate_1_check",
  "frontend_agent",
  "backend_agent",
  "database_agent",
  "architecture_agent",
  "validate_outputs",
  "gate_2_check",
  "commit_to_github",
  "mark_delivered",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ready to launch",
  PARSING_REQUIREMENTS: "Parsing requirements",
  NEGOTIATING_CONTRACT: "Negotiating contract",
  AWAITING_GATE_1: "Awaiting Gate 1 review",
  GENERATING_CODE: "Generating code",
  AWAITING_GATE_2: "Awaiting Gate 2 review",
  COMMITTING: "Committing to GitHub",
  DELIVERED: "Delivered",
  FAILED: "Run blocked",
};

const CONN_TONE: Record<string, string> = {
  connected: "#10B981",
  connecting: "#F59E0B",
  disconnected: "#F59E0B",
};

function normalizeNode(node: string | undefined | null): string {
  if (!node || node === "none") return "";
  return node.replace(/^work_order_/, "").toLowerCase();
}

function humanize(value: string | undefined | null): string {
  if (!value) return "Standby";
  return STATUS_LABEL[value] ?? value.replace(/_/g, " ");
}

interface RunMeterBarProps {
  projectName?: string;
  /** Authoritative status string (project.status ?? status?.status). */
  status?: string;
}

export function RunMeterBar({ projectName, status: statusProp }: RunMeterBarProps) {
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);
  const connectionStatus = useOrchestrationStore((s) => s.connectionStatus);

  const status = orchestrationState?.status ?? statusProp ?? "PENDING";
  const currentNode = normalizeNode(orchestrationState?.currentNode);
  const runId = orchestrationState?.runId ?? "";

  const isFailed = status === "FAILED" || Boolean(orchestrationState?.error);
  const isDelivered = status === "DELIVERED" || status === "SUCCEEDED";
  const isRunning = !isFailed && !isDelivered && status !== "PENDING";

  // ── Telemetry roll-up ─────────────────────────────────────────────
  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;
  let activeModel = "";
  for (const node of Object.values(nodeStates)) {
    const t = node.telemetry;
    if (!t) continue;
    inputTokens += t.inputTokens ?? 0;
    outputTokens += t.outputTokens ?? 0;
    cost += t.costUsd ?? 0;
    if (node.phase === "running" && t.model) activeModel = t.model;
  }
  const totalTokens = inputTokens + outputTokens;
  const budgetPct = Math.min(100, (totalTokens / RUN_TOKEN_BUDGET) * 100);

  // ── Elapsed clock (resets per run) ────────────────────────────────
  const elapsed = useRunClock(runId, isRunning);

  // ── Overall progress ──────────────────────────────────────────────
  const idx = PIPELINE_ORDER.indexOf(currentNode);
  const nodePct = currentNode ? nodeStates[currentNode]?.progressPct : undefined;
  const progress = isDelivered
    ? 100
    : idx >= 0
      ? Math.round(((idx + (typeof nodePct === "number" ? nodePct / 100 : 0.5)) / (PIPELINE_ORDER.length - 1)) * 100)
      : isRunning
        ? 6
        : 0;

  const accent = isFailed ? "#EF4444" : isDelivered ? "#10B981" : isRunning ? "#FAFAFA" : "#A1A1A1";
  const detail =
    orchestrationState?.error ||
    nodeStates[currentNode]?.progressLabel ||
    (isRunning ? "Agents are working — watch the live output below." : "Launch the pipeline to begin.");

  return (
    <section className="cockpit-meter reveal" aria-label="Run telemetry">
      <div className="cockpit-meter-inner">
        <div className="cockpit-meter-head">
          <div className="cockpit-meter-headline">
            <span
              className={isRunning ? "cockpit-status-dot is-live" : "cockpit-status-dot"}
              style={{ background: accent, boxShadow: isRunning ? `0 0 12px ${accent}` : "none" }}
            />
            <div style={{ minWidth: 0 }}>
              <div className="cockpit-eyebrow">
                {projectName ? `${projectName} · Orchestration` : "Orchestration"}
              </div>
              <h3 className="cockpit-title">{humanize(status)}</h3>
            </div>
          </div>
          <div className="cockpit-conn" title={`WebSocket ${connectionStatus}`}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: CONN_TONE[connectionStatus] }} />
            {connectionStatus}
          </div>
        </div>

        <p className="cockpit-detail">{detail}</p>

        <div className="cockpit-stats">
          <MeterStat
            icon={<IconZap size={13} />}
            label="Tokens streamed"
            value={<AnimatedNumber value={totalTokens} />}
            sub={totalTokens > 0 ? `${inputTokens.toLocaleString()} in · ${outputTokens.toLocaleString()} out` : "in · out"}
            accent="var(--text-2)"
          />
          <MeterStat
            icon={<IconCreditCard size={13} />}
            label="Est. spend"
            value={<AnimatedNumber value={cost} format={(n) => `$${n.toFixed(n < 1 ? 4 : 2)}`} />}
            sub={activeModel || "live cost"}
            accent="var(--text-2)"
          />
          <MeterStat
            icon={<IconClock size={13} />}
            label="Elapsed"
            value={formatElapsed(elapsed)}
            sub={isRunning ? "running" : isDelivered ? "complete" : "idle"}
            accent={isRunning ? "var(--text-2)" : isDelivered ? "var(--green)" : "var(--text-3)"}
          />
          <div className="cockpit-stat cockpit-stat-budget">
            <span className="cockpit-stat-label">
              <IconCpu size={13} />
              Budget burn
            </span>
            <span className="cockpit-stat-value mono">{Math.round(budgetPct)}%</span>
            <span className="cockpit-budget-track" aria-hidden="true">
              <span
                className="cockpit-budget-fill"
                style={{
                  width: `${budgetPct}%`,
                  background: budgetPct > 85 ? "var(--amber)" : "var(--text)",
                }}
              />
            </span>
          </div>
        </div>

        <div className="cockpit-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="cockpit-progress-head">
            <span className="row gap-2" style={{ alignItems: "center", color: "var(--text-3)", fontSize: 11.5 }}>
              <IconActivity size={12} />
              Pipeline progress
            </span>
            <span className="mono" style={{ color: "white", fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {progress}%
            </span>
          </div>
          <div className="cockpit-progress-track">
            <div
              className={isRunning ? "cockpit-progress-fill is-live" : "cockpit-progress-fill"}
              style={{
                width: `${progress}%`,
                background: isFailed
                  ? "var(--red)"
                  : isDelivered
                    ? "var(--green)"
                    : "var(--text)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MeterStat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: string;
}) {
  return (
    <div className="cockpit-stat">
      <span className="cockpit-stat-label" style={{ color: accent }}>
        {icon}
        {label}
      </span>
      <span className="cockpit-stat-value mono">{value}</span>
      <span className="cockpit-stat-sub">{sub}</span>
    </div>
  );
}

/* ── Smooth count-up (text-only; no layout thrash) ──────────────────── */
function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const duration = 520;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}

/* ── Elapsed clock, restarts when the run id or running flag changes ─── */
function useRunClock(runId: string, running: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    // Defer the reset out of the effect body (async setState keeps render pure).
    const raf = requestAnimationFrame(() => setElapsed(0));
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [runId, running]);

  return elapsed;
}

function formatElapsed(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
