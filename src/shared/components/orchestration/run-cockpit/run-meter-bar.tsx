"use client";

import { useEffect, useRef, useState } from "react";
import { formatElapsedDuration } from "@/features/orchestration/model/run-cockpit";
import { useRunMeterViewModel } from "@/features/orchestration/view-model/use-run-cockpit-view-model";
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

const CONN_TONE: Record<string, string> = {
  connected: "#10B981",
  connecting: "#F59E0B",
  disconnected: "#F59E0B",
};

interface RunMeterBarProps {
  projectName?: string;
  /** Authoritative status string (project.status ?? status?.status). */
  status?: string;
}

export function RunMeterBar({ projectName, status: statusProp }: RunMeterBarProps) {
  const vm = useRunMeterViewModel({ projectName, status: statusProp });

  return (
    <section className="cockpit-meter reveal" aria-label="Run telemetry">
      <div className="cockpit-meter-inner">
        <div className="cockpit-meter-head">
          <div className="cockpit-meter-headline">
            <span
              className={vm.isRunning ? "cockpit-status-dot is-live" : "cockpit-status-dot"}
              style={{ background: vm.accent, boxShadow: vm.isRunning ? `0 0 12px ${vm.accent}` : "none" }}
            />
            <div style={{ minWidth: 0 }}>
              <div className="cockpit-eyebrow">
                {vm.projectName ? `${vm.projectName} · Orchestration` : "Orchestration"}
              </div>
              <h3 className="cockpit-title">{vm.statusLabel}</h3>
            </div>
          </div>
          <div className="cockpit-conn" title={`WebSocket ${vm.connectionStatus}`}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: CONN_TONE[vm.connectionStatus] }} />
            {vm.connectionStatus}
          </div>
        </div>

        <p className="cockpit-detail">{vm.detail}</p>

        <div className="cockpit-stats">
          <MeterStat
            icon={<IconZap size={13} />}
            label="Tokens streamed"
            value={<AnimatedNumber value={vm.totalTokens} />}
            sub={vm.totalTokens > 0 ? `${vm.inputTokens.toLocaleString()} in · ${vm.outputTokens.toLocaleString()} out` : "in · out"}
            accent="var(--text-2)"
          />
          <MeterStat
            icon={<IconCreditCard size={13} />}
            label="Est. spend"
            value={<AnimatedNumber value={vm.cost} format={(n) => `$${n.toFixed(n < 1 ? 4 : 2)}`} />}
            sub={vm.activeModel || "live cost"}
            accent="var(--text-2)"
          />
          <MeterStat
            icon={<IconClock size={13} />}
            label="Elapsed"
            value={formatElapsedDuration(vm.elapsedMs)}
            sub={vm.isRunning ? "running" : vm.isDelivered ? "complete" : "idle"}
            accent={vm.isRunning ? "var(--text-2)" : vm.isDelivered ? "var(--green)" : "var(--text-3)"}
          />
          <div className="cockpit-stat cockpit-stat-budget">
            <span className="cockpit-stat-label">
              <IconCpu size={13} />
              Budget burn
            </span>
            <span className="cockpit-stat-value mono">{Math.round(vm.budgetPct)}%</span>
            <span className="cockpit-budget-track" aria-hidden="true">
              <span
                className="cockpit-budget-fill"
                style={{
                  width: `${vm.budgetPct}%`,
                  background: vm.budgetPct > 85 ? "var(--amber)" : "var(--text)",
                }}
              />
            </span>
          </div>
        </div>

        <div className="cockpit-progress" role="progressbar" aria-valuenow={vm.progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="cockpit-progress-head">
            <span className="row gap-2" style={{ alignItems: "center", color: "var(--text-3)", fontSize: 11.5 }}>
              <IconActivity size={12} />
              Pipeline progress
            </span>
            <span className="mono" style={{ color: "white", fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {vm.progress}%
            </span>
          </div>
          <div className="cockpit-progress-track">
            <div
              className={vm.isRunning ? "cockpit-progress-fill is-live" : "cockpit-progress-fill"}
              style={{
                width: `${vm.progress}%`,
                background: vm.isFailed
                  ? "var(--red)"
                  : vm.isDelivered
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

