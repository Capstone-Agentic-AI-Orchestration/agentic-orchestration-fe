"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import { AgentNetworkGraph, ParticleFieldCanvas } from "./VisualPrimitives";
import { CINEMA_PROGRESS_EVENT, type CinemaProgressDetail, type SceneProgressProps } from "./cinema-progress";
import "./HowItWorks.css";

const STEPS = [
  {
    n: "01",
    title: "Submit your goal",
    body: "Tell DevFlow what you want to build. The brief becomes scope, acceptance criteria, and a contract the agents can execute.",
    detail: "A single project goal is parsed into product intent, technical constraints, and the first delivery gate.",
  },
  {
    n: "02",
    title: "AI agents plan and architect",
    body: "Multi-agent system analyzes, breaks down, and designs your solution.",
    detail:
      "Specialized agents collaborate to understand requirements, structure the project, and create a technical blueprint tailored to your goals.",
  },
  {
    n: "03",
    title: "Build and iterate",
    body: "Agents write, test, and refine your code.",
    detail: "Frontend, backend, database, and architecture agents generate artifacts in parallel, then validate the work against the contract.",
  },
  {
    n: "04",
    title: "Deploy and scale",
    body: "Ship with confidence and scale effortlessly.",
    detail: "Reviewed output is committed to GitHub with implementation notes, tests, and a delivery trail your team can own.",
  },
];

export function HowItWorks({ cinematic = false, interactive = false, sceneName = "how" }: SceneProgressProps) {
  const [active, setActive] = useState(1);
  const activeRef = useRef(active);
  const current = STEPS[active];

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!cinematic) return;

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<CinemaProgressDetail>).detail;
      const progress = detail.progressByScene.how;
      const next = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      if (detail.activeScene === "how" && next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    };

    window.addEventListener(CINEMA_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(CINEMA_PROGRESS_EVENT, onProgress);
  }, [cinematic]);

  const content = (
    <>
      <ParticleFieldCanvas variant="subtle" className="how-particles" sceneName={sceneName} interactive={interactive || cinematic} />
      <div className="how-inner">
        <div className="how-head" data-cinema-reveal>
          <p className="how-eyebrow">Section 3</p>
          <h2 className="how-title">How it works</h2>
        </div>

        <div className="how-flow">
          <ol className="how-list">
            {STEPS.map((step, i) => {
              const isActive = active === i;
              return (
                <li key={step.n} className={`how-step ${isActive ? "is-active" : ""}`}>
                  <button
                    type="button"
                    className="how-step-trigger"
                    onClick={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onPointerEnter={() => {
                      if (interactive || cinematic) setActive(i);
                    }}
                    aria-expanded={isActive}
                  >
                    <span className="how-step-n">{step.n}</span>
                    <span className="how-step-icon" aria-hidden="true">{step.n === "01" ? "↥" : step.n === "02" ? "⌬" : step.n === "03" ? "</>" : "↗"}</span>
                    <span className="how-step-copy">
                      <strong>{step.title}</strong>
                      <small>{step.body}</small>
                    </span>
                    <span className="how-step-control" aria-hidden="true">{isActive ? "⌃" : "⌄"}</span>
                  </button>

                  {isActive && (
                    <motion.div
                      className="how-step-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="how-detail-copy">
                        <h3>{current.title}</h3>
                        <p>{current.detail}</p>
                        <span>Active agents</span>
                        <div className="how-agent-chips" aria-label="Active agents">
                          <span>Analyst</span>
                          <span>Architect</span>
                          <span>Researcher</span>
                          <span>Planner</span>
                        </div>
                      </div>
                      <AgentNetworkGraph mode="branch" className="how-agent-graph" sceneName={sceneName} interactive={interactive || cinematic} />
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );

  if (cinematic) {
    return (
      <section className="how is-cinematic" id="how-it-works">
        {content}
      </section>
    );
  }

  return (
    <SectionReveal as="section" className="how" id="how-it-works" y={12}>
      {content}
    </SectionReveal>
  );
}
