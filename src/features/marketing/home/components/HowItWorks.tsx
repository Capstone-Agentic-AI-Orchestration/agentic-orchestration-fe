"use client";

/**
 * HowItWorks — 4 numbered rows explaining the flow.
 * No staggered animation. Single fade-up on scroll.
 */

import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import "./HowItWorks.css";

const STEPS = [
  {
    n: "01",
    title: "Brief",
    body: "Submit a single description of what you want built. The system parses it, scopes it, and drafts a contract with file manifest and acceptance criteria.",
  },
  {
    n: "02",
    title: "Kickoff",
    body: "A PM and the AI align on milestones, team, and required documents. Stakeholders are added, permissions set, and the contract is locked.",
  },
  {
    n: "03",
    title: "Build",
    body: "Four specialised agents — frontend, backend, database, architecture — execute in parallel. Artifacts are generated, self-reviewed, and contract-validated.",
  },
  {
    n: "04",
    title: "Review",
    body: "The PM approves two gates: the contract before build, and the artifacts before delivery. Approved work is committed to GitHub and handed off to the client.",
  },
];

export function HowItWorks() {
  return (
    <SectionReveal as="section" className="how">
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
