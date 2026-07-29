"use client";

/**
 * LoadingScreen — Pre-render cover that zooms into the page.
 *
 * Sequence (≈ 2.4s total):
 *   0–200ms:    Top progress bar starts drawing.
 *   200–500ms:  Brand mark rises in (large, centered).
 *   400–700ms:  Wordmark rises in.
 *   600–1100ms: Hairline draws.
 *   900–1300ms: Meta caption fades in.
 *   1100–2400ms: Cover scales and fades (zoom into page).
 *   2400ms+:    Cover unmounts. Scroll enabled.
 *
 * Implementation: pure CSS, no GSAP, no JS animation library.
 *
 * Reduced motion: animation shortens to 0.9s (no zoom, just a fade),
 * but the cover is still shown. The user explicitly opted to see a
 * loading screen.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ParticleFieldCanvas } from "@/features/marketing/home/components/VisualPrimitives";
import "./LoadingScreen.css";

interface LoadingScreenProps {
  onComplete?: () => void;
}

const TOTAL_MS = 2200;
const REDUCED_MS = 900;

const AGENTS = [
  { name: "Planner", status: "Parsing brief" },
  { name: "Architect", status: "Mapping graph" },
  { name: "Frontend", status: "Composing UI" },
  { name: "Backend", status: "Binding services" },
  { name: "Database", status: "Indexing state" },
  { name: "Reviewer", status: "Checking handoff" },
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = mq.matches;
    setReduced(isReduced);
    const duration = isReduced ? REDUCED_MS : TOTAL_MS;
    const id = setTimeout(() => {
      setDone(true);
      onCompleteRef.current?.();
    }, duration);
    return () => clearTimeout(id);
  }, []);

  if (done) return null;

  return (
    <div
      className={`loading-screen ${reduced ? "is-reduced" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading DevFlow"
    >
      <ParticleFieldCanvas variant="subtle" className="loading-screen-particles" reducedMotion={reduced} />
      <div className="loading-screen-progress" aria-hidden="true" />
      <div className="loading-screen-scan" aria-hidden="true" />
      <div className="loading-screen-inner">
        <div className="loading-screen-brand">
          <div className="loading-screen-mark" aria-hidden="true">
            ⌬
          </div>
          <div>
            <div className="loading-screen-word">devflow</div>
            <div className="loading-screen-meta">agent system boot</div>
          </div>
        </div>

        <div className="loading-screen-console" aria-hidden="true">
          <div className="loading-screen-console-head">
            <span>RUN::PRELOAD</span>
            <span>required refresh gate</span>
          </div>
          <div className="loading-screen-agent-grid">
            {AGENTS.map((agent, index) => (
              <div key={agent.name} className="loading-screen-agent" style={{ "--agent-index": index } as CSSProperties}>
                <span>{agent.name}</span>
                <i />
                <small>{agent.status}</small>
              </div>
            ))}
          </div>
          <div className="loading-screen-hairline-wrap">
            <div className="loading-screen-hairline" />
          </div>
        </div>
      </div>
    </div>
  );
}
