"use client";

/**
 * HeroScene - animated build panels for the landing hero.
 * No WebGL. The old node graph was removed so the prompt-to-build story
 * comes from the live brief, agent lanes, and delivery outputs.
 */

import type { CSSProperties } from "react";

const AGENT_LANES = [
  { label: "Architecture", value: "service map", delay: "0s" },
  { label: "Frontend", value: "routes + UI", delay: "0.35s" },
  { label: "Backend", value: "APIs + jobs", delay: "0.7s" },
  { label: "Database", value: "schema + RLS", delay: "1.05s" },
] as const;

const OUTPUTS = ["PR opened", "Tests queued", "Review passed"] as const;

const PROCESS_LINES = ["scope parsed", "contract locked", "agents dispatched"] as const;

const LIVE_COMMAND = "run orchestration --brief brief.md";

const SIGNAL_PACKETS = [
  { x: "18%", y: "24%", delay: "0s" },
  { x: "48%", y: "13%", delay: "0.55s" },
  { x: "78%", y: "31%", delay: "1.1s" },
  { x: "35%", y: "58%", delay: "1.65s" },
  { x: "66%", y: "72%", delay: "2.2s" },
] as const;

export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-live-layer">
        <div className="hero-signal-field">
          {SIGNAL_PACKETS.map((packet, index) => (
            <span
              key={`${packet.x}-${packet.y}`}
              className="hero-signal-packet"
              style={{
                "--packet-x": packet.x,
                "--packet-y": packet.y,
                "--packet-delay": packet.delay,
                "--packet-index": index,
              } as CSSProperties}
            />
          ))}
        </div>

        <span className="hero-connector hero-connector-a" />
        <span className="hero-connector hero-connector-b" />
        <span className="hero-connector hero-connector-c" />

        <div className="hero-command-card">
          <div className="hero-command-top">
            <span>brief.md</span>
            <span className="hero-command-status">
              <span className="hero-status-dot" />
              compiling
            </span>
          </div>
          <p>Build a client portal with auth, billing, tickets, dashboards, and GitHub delivery.</p>
          <div className="hero-command-log">
            {PROCESS_LINES.map((line, index) => (
              <span
                key={line}
                className="hero-log-line"
                style={{ "--line-delay": `${index * 0.55}s` } as CSSProperties}
              >
                {line}
              </span>
            ))}
          </div>
          <div className="hero-command-input">
            <span className="hero-command-prompt">$</span>
            <span className="hero-command-typed">{LIVE_COMMAND}</span>
            <span className="hero-command-insert" />
          </div>
        </div>

        <div className="hero-agent-stack">
          {AGENT_LANES.map((agent) => (
            <div
              key={agent.label}
              className="hero-agent-row"
              style={{ "--agent-delay": agent.delay } as CSSProperties}
            >
              <span className="hero-agent-label">{agent.label}</span>
              <span className="hero-agent-value">{agent.value}</span>
              <span className="hero-agent-signal" />
            </div>
          ))}
        </div>

        <div className="hero-output-grid">
          {OUTPUTS.map((output, index) => (
            <span
              key={output}
              className="hero-output-chip"
              style={{ "--output-delay": `${index * 0.28}s` } as CSSProperties}
            >
              {output}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeroScene;
