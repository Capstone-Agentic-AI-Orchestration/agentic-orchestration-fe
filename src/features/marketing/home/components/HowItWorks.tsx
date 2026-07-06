"use client";

/**
 * HowItWorks - 4 rows explaining the flow.
 * No staggered animation. Single fade-up on scroll.
 */

import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import "./HowItWorks.css";

const STEPS = [
  {
    n: "01",
    title: "Brief",
    body: "Submit one description. Devflow parses scope, target stack, file manifest, and acceptance criteria.",
  },
  {
    n: "02",
    title: "Kickoff",
    body: "The run locks milestones, stakeholders, permissions, and the contract before agents start work.",
  },
  {
    n: "03",
    title: "Build",
    body: "Frontend, backend, database, and architecture agents execute in parallel with contract checks.",
  },
  {
    n: "04",
    title: "Review",
    body: "The PM approves the contract and final artifacts. Approved work lands in GitHub.",
  },
];

export function HowItWorks() {
  return (
    <SectionReveal as="section" className="how" id="how-it-works">
      <div className="how-inner">
        <div className="how-head">
          <p className="how-eyebrow">The flow</p>
          <h2 className="how-title">How it works</h2>
        </div>

        <ol className="how-list">
          {STEPS.map((s) => (
            <li key={s.n} className="how-step">
              <span className="how-step-n">{s.n}</span>
              <div className="how-step-body">
                <h3 className="how-step-title">{s.title}</h3>
                <p className="how-step-text">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SectionReveal>
  );
}
