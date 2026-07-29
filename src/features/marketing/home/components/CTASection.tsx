"use client";

import Link from "next/link";
import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import { ParticleFieldCanvas } from "./VisualPrimitives";
import type { SceneProgressProps } from "./cinema-progress";
import "./CTASection.css";

export function CTASection({ cinematic = false, interactive = false, sceneName = "cta" }: SceneProgressProps) {
  const content = (
      <div className="cta-inner">
        <div className="cta-head" data-cinema-reveal>
          <p>Section 5</p>
          <h2>Ready to run DevFlow?</h2>
          <span>Sign in with your approved GitHub account and continue into your workspace.</span>
        </div>

        <div className="cta-grid">
          <article className="cta-terminal">
            <header className="cta-terminal-header">
              <span>DevFlow terminal</span>
              <span className="cta-online"><i />Online</span>
            </header>
            <div className="cta-terminal-body">
              <ParticleFieldCanvas variant="beam" className="cta-terminal-particles" sceneName={sceneName} interactive={interactive || cinematic} />
              <div className="cta-terminal-lines">
                <p><strong>&gt; devflow connect</strong><span>Connecting to the orchestration control plane...</span></p>
                <p><strong>&gt; authenticate</strong><span>Verifying your GitHub organization access...</span></p>
                <p><strong>&gt; load workspace</strong><span>Restoring projects, runs, and approvals...</span></p>
                <p><strong>&gt; assemble team</strong><span>Selecting the agents required for your next run...</span></p>
                <p><strong>&gt; lock plan</strong><span>Preparing the reviewable execution plan...</span></p>
                <p><strong>&gt; ready</strong><span>Your workspace is ready.</span></p>
                <p className="cta-cursor-line"><strong>&gt;</strong><span className="cta-cursor" aria-hidden="true" /></p>
              </div>
            </div>
          </article>

          <article className="cta-form">
            <div className="cta-form-head">
              <h3>Open your workspace</h3>
              <p>
                DevFlow uses your GitHub organization membership to send you to
                the right project, delivery, or administration workspace.
              </p>
            </div>

            <Link href="/sign-in" className="cta-button">
              <span>Continue to sign in</span>
              <span aria-hidden="true">→</span>
            </Link>

            <p className="cta-secure">Access is limited to approved DevFlow team members.</p>
          </article>
        </div>

        <div className="cta-trust" aria-label="Trusted by ambitious teams">
          <span>Trusted by ambitious teams</span>
          <div>
            <b>DevFlow</b>
            <b>Northpoint</b>
            <b>Veridian</b>
            <b>Thread</b>
            <b>Altura</b>
          </div>
        </div>
      </div>
  );

  if (cinematic) {
    return (
      <section className="cta is-cinematic">
        {content}
      </section>
    );
  }

  return (
    <SectionReveal as="section" className="cta" id="cta" y={12}>
      {content}
    </SectionReveal>
  );
}
