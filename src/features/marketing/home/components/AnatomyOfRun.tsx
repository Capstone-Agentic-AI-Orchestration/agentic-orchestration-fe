"use client";

/**
 * AnatomyOfRun - generated-reference pinned run console.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";
import { ParticleFieldCanvas } from "./VisualPrimitives";
import type { SceneProgressProps } from "./cinema-progress";
import "./AnatomyOfRun.css";

const RUN_LINES = [
  { n: "01", time: "00:00:01", agent: "Orchestrator", action: "Run initialized" },
  { n: "02", time: "00:00:02", agent: "Planner", action: "Brief parsed, execution plan created" },
  { n: "03", time: "00:00:04", agent: "Architect", action: "System design updated" },
  { n: "04", time: "00:00:07", agent: "Engineer", action: "Code changes implemented" },
  { n: "05", time: "00:00:18", agent: "Reviewer", action: "Changes reviewed, feedback applied" },
  { n: "06", time: "00:00:26", agent: "QA Agent", action: "Tests generated and executed" },
  { n: "07", time: "00:00:31", agent: "Deployer", action: "Build successful, preparing deployment" },
  { n: "08", time: "00:00:38", agent: "Orchestrator", action: "Run completed successfully", final: true },
];

const TIMELINE = [
  { n: "01", label: "Planner", time: "00:00:02" },
  { n: "02", label: "Architect", time: "00:00:04" },
  { n: "03", label: "Engineer", time: "00:00:07" },
  { n: "04", label: "Reviewer", time: "00:00:18" },
  { n: "05", label: "QA Agent", time: "00:00:26" },
  { n: "06", label: "Deployer", time: "00:00:31" },
];

function emitAgent(agent: string | null) {
  window.dispatchEvent(new CustomEvent("marketing-agent-hover", { detail: { agent, scene: "anatomy" } }));
}

export function AnatomyOfRun({ cinematic = false, interactive = false, sceneName = "anatomy" }: SceneProgressProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    registerGsapPlugins();

    const root = rootRef.current;
    const stage = stageRef.current;
    const progress = progressRef.current;
    const lines = lineRefs.current.filter(Boolean) as HTMLDivElement[];
    const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!root || !stage || !progress) return;

    if (cinematic || reduced || window.innerWidth < 820) {
      gsap.set([progress, ...lines, ...steps], { clearProps: "all", opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "+=280%",
        pin: stage,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(".anatomy-copy", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.28 }, 0)
      .fromTo(".anatomy-console", { opacity: 0, y: 46, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.36 }, 0.05)
      .fromTo(".anatomy-panel-ghost", { opacity: 0, x: -28 }, { opacity: 1, x: 0, duration: 0.32, stagger: 0.04 }, 0.16);

    lines.forEach((line, i) => {
      const at = 0.28 + i * 0.12;
      tl.fromTo(line, { opacity: 0.08, y: 12 }, { opacity: 1, y: 0, duration: 0.08 }, at);
      if (steps[i - 1]) {
        tl.to(steps[i - 1], { opacity: 1, scale: 1, duration: 0.08 }, at);
      }
      tl.to(progress, { scaleX: Math.min(1, (i + 1) / RUN_LINES.length), duration: 0.12, ease: "none" }, at);
    });

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      tl.kill();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
    };
  }, [cinematic]);

  return (
    <section ref={rootRef} className={`anatomy ${cinematic ? "is-cinematic" : ""}`}>
      <div ref={stageRef} className="anatomy-stage">
        <ParticleFieldCanvas variant="wave" className="anatomy-particles" sceneName={sceneName} interactive={interactive || cinematic} />
        <div className="anatomy-frame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="anatomy-kicker" data-cinema-reveal>
          <span>02</span>
          <span>Anatomy of a run</span>
        </div>

        <div className="anatomy-layout">
          <aside className="anatomy-copy" data-cinema-reveal>
            <h2 className="anatomy-title">One brief.<br />Six agents.<br />Eight minutes.</h2>
            <p className="anatomy-text">
              DevFlow orchestrates specialized agents in parallel. Each one executes, validates,
              and hands off until the run is complete.
            </p>
          </aside>

          <div className="anatomy-console-wrap">
            <div className="anatomy-panel-ghost anatomy-panel-ghost--one" aria-hidden="true" />
            <div className="anatomy-panel-ghost anatomy-panel-ghost--two" aria-hidden="true" />
            <article className="anatomy-console">
              <header className="anatomy-console-head">
                <span>RUN 7f3a9c1e</span>
                <span className="anatomy-live"><i />Live</span>
                <span className="anatomy-elapsed">Elapsed 02:41</span>
              </header>
              <div className="anatomy-console-body">
                {RUN_LINES.map((line, i) => (
                  <div
                    key={line.n}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    className={`anatomy-log ${line.final ? "is-final" : ""}`}
                    data-agent={line.agent.toLowerCase()}
                    tabIndex={interactive || cinematic ? 0 : undefined}
                    onPointerEnter={() => emitAgent(line.agent)}
                    onPointerLeave={() => emitAgent(null)}
                    onFocus={() => emitAgent(line.agent)}
                    onBlur={() => emitAgent(null)}
                  >
                    <span>{line.n}</span>
                    <span>{line.time}</span>
                    <strong>{line.agent}</strong>
                    <span>→</span>
                    <span>{line.action}</span>
                    {line.final && <b aria-hidden="true">✓</b>}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <div className="anatomy-timeline">
          <button type="button" className="anatomy-pause" aria-label="Pause run animation">Ⅱ</button>
          <div className="anatomy-rail">
            <div ref={progressRef} className="anatomy-rail-fill" />
            {TIMELINE.map((step, i) => (
              <div
                key={step.n}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="anatomy-rail-step"
                data-agent={step.label.toLowerCase()}
                style={{ left: `${(i / (TIMELINE.length - 1)) * 100}%` }}
              >
                <span className="anatomy-rail-dot" />
                <span className="anatomy-rail-index">{step.n}</span>
                <strong>{step.label}</strong>
                <small>{step.time}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
