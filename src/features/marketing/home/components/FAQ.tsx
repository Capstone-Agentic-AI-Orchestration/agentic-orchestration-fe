"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import { ParticleFieldCanvas } from "./VisualPrimitives";
import { CINEMA_PROGRESS_EVENT, type CinemaProgressDetail, type SceneProgressProps } from "./cinema-progress";
import "./FAQ.css";

const QUESTIONS = [
  {
    q: "What does DevFlow actually build?",
    a: "Production-grade web applications: frontend, backend, database, tests, documentation, and a GitHub repo you own. Each build is scoped by a signed-off contract and checked at two PM approval gates.",
  },
  {
    q: "How does DevFlow handle data security?",
    a: "Project access is scoped by role, Supabase sessions, and backend guards. Sensitive server keys stay in the backend environment, and delivered repositories keep ownership with your team from day one.",
  },
  {
    q: "Can I integrate DevFlow with my existing tools?",
    a: "Yes. DevFlow is designed around GitHub handoff, typed APIs, Postgres, and common Next.js/NestJS delivery patterns, so existing product teams can inspect, extend, and operate the output.",
  },
  {
    q: "What kind of support do you offer?",
    a: "The product flow gives you scoped contracts, generated artifacts, and review gates. For bespoke delivery, submit a brief and the team can follow up with timeline and handoff details.",
  },
  {
    q: "Is there a free trial available?",
    a: "You can submit a brief without a credit card. The first response focuses on scope and fit before any paid engagement begins.",
  },
  {
    q: "How is pricing structured?",
    a: "Pricing depends on scope, risk, and delivery complexity. The CTA brief gives enough context to return a scoped plan with timeline, milestones, and next steps.",
  },
];

export function FAQ({ cinematic = false, interactive = false, sceneName = "faq" }: SceneProgressProps) {
  const [open, setOpen] = useState(1);
  const openRef = useRef(open);
  const active = QUESTIONS[open] ?? QUESTIONS[0];

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!cinematic) return;

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<CinemaProgressDetail>).detail;
      const progress = detail.progressByScene.faq;
      const next = Math.min(QUESTIONS.length - 1, Math.floor(progress * QUESTIONS.length));
      if (detail.activeScene === "faq" && next !== openRef.current) {
        openRef.current = next;
        setOpen(next);
      }
    };

    window.addEventListener(CINEMA_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(CINEMA_PROGRESS_EVENT, onProgress);
  }, [cinematic]);

  const toggle = (i: number) => {
    setOpen((current) => (current === i ? -1 : i));
    window.dispatchEvent(new CustomEvent("marketing-interaction-burst", { detail: { intensity: 0.9, scene: "faq" } }));
  };

  const content = (
      <div className="faq-inner">
        <aside className="faq-side" data-cinema-reveal>
          <p className="faq-index">04 <span>FAQ</span></p>
          <h2 className="faq-title">FAQ</h2>
          <p className="faq-subtitle">Everything you need to know about DevFlow.</p>

          <div className="faq-active">
            <span>Active question</span>
            <p>{active.q}</p>
          </div>

          <p className="faq-contact">
            Ready to start a run?
            <Link href="/sign-in">Open your workspace <span aria-hidden="true">→</span></Link>
          </p>
        </aside>

        <div className="faq-list">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="faq-question-text">{item.q}</span>
                  <span className="faq-question-mark" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ParticleFieldCanvas variant="wave" className="faq-answer-particles" sceneName={sceneName} interactive={interactive || cinematic} />
                      <div className="faq-answer-inner">
                        <p>{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
  );

  if (cinematic) {
    return (
      <section className="faq is-cinematic" id="faq">
        {content}
      </section>
    );
  }

  return (
    <SectionReveal as="section" className="faq" id="faq" y={12}>
      {content}
    </SectionReveal>
  );
}
