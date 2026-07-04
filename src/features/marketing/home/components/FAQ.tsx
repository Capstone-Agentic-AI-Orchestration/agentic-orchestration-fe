"use client";

/**
 * FAQ — 3 questions, accordion with spring height + chevron rotation.
 * No "agency" question. No fake urgency. Just the 3 things prospects ask.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import "./FAQ.css";

const QUESTIONS = [
  {
    q: "What does this actually build?",
    a: "Production-grade web applications. Frontend (Next.js or similar), backend (NestJS or similar), database (Postgres with Prisma), CI/CD, tests, documentation, and a GitHub repo you own. Each build is scoped by a signed-off contract and goes through two PM approval gates before delivery.",
  },
  {
    q: "Who is this for?",
    a: "Teams that need production-grade software in days, not months. A solo founder shipping an MVP. A mid-market company replacing a legacy internal tool. A consultancy running parallel client builds. Not a fit for exploratory research, one-off scripts, or anything that doesn't want a deployed artifact.",
  },
  {
    q: "How do I try it?",
    a: "Submit a brief through the form below. You'll get a scoped contract back within minutes, and a full delivery within days. No credit card, no demo-gating, no sales call required to start.",
  },
];

export function FAQ() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(0);

  const toggle = (i: number) => {
    setOpen((current) => (current === i ? -1 : i));
  };

  return (
    <SectionReveal as="section" className="faq">
      <div className="faq-inner">
        <div className="faq-head">
          <p className="faq-eyebrow">Common questions</p>
          <h2 className="faq-title">FAQ</h2>
        </div>

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
                  <span>{item.q}</span>
                  <svg
                    className="faq-chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
                    >
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
    </SectionReveal>
  );
}
