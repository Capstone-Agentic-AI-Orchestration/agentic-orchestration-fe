"use client";

/**
 * AnatomyOfRun — scroll-pinned terminal walkthrough of one orchestration run.
 *
 * The section pins when it reaches the top of the viewport; scrolling drives
 * the animation. A single terminal card is centered, zooms in, reveals each
 * log line as the user scrolls, and hands off to the next terminal with a
 * slide transition. The progress rail and stepper dots show where the run is.
 *
 * Driven by GSAP ScrollTrigger pin + scrub.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";
import "./AnatomyOfRun.css";

interface RunCard {
  key: string;
  agent: string;
  index: string;
  lines: string[];
  meta: string;
  duration: string;
  final?: boolean;
}

const CARDS: RunCard[] = [
  {
    key: "contract",
    agent: "contract_agent",
    index: "01 / 06",
    lines: [
      "> reading brief...",
      "> parsing scope → 18 files · 12 tests · 8 acceptance criteria",
      "> negotiating agent contracts",
      "> contract signed",
      "> manifest ready",
    ],
    meta: "contract negotiated",
    duration: "1m 42s",
  },
  {
    key: "frontend",
    agent: "frontend_agent",
    index: "02 / 06",
    lines: [
      "> scaffolding app/(dashboard)/page.tsx",
      "> wiring data hooks → /api/orders",
      "> running component type-check",
      "> generating 851 tokens · 14 KB",
      "> UI scaffolded",
    ],
    meta: "ui scaffolded",
    duration: "2m 04s",
  },
  {
    key: "backend",
    agent: "backend_agent",
    index: "03 / 06",
    lines: [
      "> building /api/orders route",
      "> writing zod schema + handler + tests",
      "> wiring service layer + auth guard",
      "> generating 847 tokens · 12 KB",
      "> API implemented",
    ],
    meta: "api implemented",
    duration: "2m 18s",
  },
  {
    key: "database",
    agent: "database_agent",
    index: "04 / 06",
    lines: [
      "> designing schema: orders, customers, line_items",
      "> generating Prisma migration",
      "> applying migration to staging DB",
      "> generating 312 tokens · 4 KB",
      "> schema migrated",
    ],
    meta: "schema migrated",
    duration: "1m 06s",
  },
  {
    key: "architecture",
    agent: "architecture_agent",
    index: "05 / 06",
    lines: [
      "> mapping service boundaries + queues",
      "> validating deploy topology",
      "> checking cost + concurrency limits",
      "> generating 508 tokens · 7 KB",
      "> architecture sealed",
    ],
    meta: "architecture sealed",
    duration: "1m 31s",
  },
  {
    key: "deploy",
    agent: "github",
    index: "06 / 06",
    lines: [
      "> git add . && git commit -m \"feat: orders flow\"",
      "> git push origin main",
      "> 18 files changed · 0 errors",
      "> gate 2 approved",
      "> deployed to GitHub",
    ],
    meta: "shipped to github",
    duration: "8m 12s total",
    final: true,
  },
];

export function AnatomyOfRun() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    registerGsapPlugins();

    const root = rootRef.current;
    const stage = stageRef.current;
    const progress = progressRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const dots = dotRefs.current.filter(Boolean) as HTMLSpanElement[];

    if (!root || !stage || cards.length === 0) return;

    // Scroll-scrubbed sequence. Each card gets 0.6 units of scroll distance
    // so the animation feels responsive without requiring an enormous scroll.
    const SEGMENT = 0.6;
    const INTRO = 0.12;
    const REVEAL_START = 0.12;
    const TRANSITION_START = 0.48;
    const total = CARDS.length * SEGMENT + 0.25;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: `+=${total * 100}%`,
        pin: stage,
        pinSpacing: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    });

    cards.forEach((card, i) => {
      const at = i * SEGMENT;
      const lines = card.querySelectorAll<HTMLElement>(".run-line");
      const fill = card.querySelector<HTMLElement>(".run-meter-fill");
      const dot = dots[i];

      if (i === 0) {
        tl.fromTo(
          card,
          { scale: 0.82, opacity: 0, xPercent: 0 },
          { scale: 1, opacity: 1, duration: INTRO },
          at,
        );
      } else {
        tl.fromTo(
          card,
          { xPercent: 100, opacity: 0, scale: 0.95 },
          { xPercent: 0, opacity: 1, scale: 1, duration: INTRO },
          at,
        );
        tl.to(
          cards[i - 1],
          { xPercent: -100, opacity: 0, duration: INTRO },
          at,
        );
      }

      const lineDuration = 0.06;
      const lineStagger = 0.06;
      lines.forEach((line, li) => {
        tl.fromTo(
          line,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: lineDuration },
          at + REVEAL_START + li * lineStagger,
        );
      });

      if (fill) {
        tl.fromTo(
          fill,
          { scaleX: 0 },
          { scaleX: 1, duration: TRANSITION_START - REVEAL_START, ease: "none" },
          at + REVEAL_START,
        );
      }

      if (dot) {
        tl.fromTo(
          dot,
          { opacity: 0.25, scale: 1 },
          { opacity: 1, scale: 1.25, duration: 0.08 },
          at,
        );
        if (i < cards.length - 1) {
          tl.to(
            dot,
            { opacity: 0.25, scale: 1, duration: 0.08 },
            at + TRANSITION_START,
          );
        }
      }

      if (progress) {
        tl.to(
          progress,
          { scaleX: (i + 1) / cards.length, duration: SEGMENT, ease: "none" },
          at,
        );
      }
    });

    const last = cards[cards.length - 1];
    tl.to(last, { opacity: 0, scale: 0.96, duration: 0.35 }, CARDS.length * SEGMENT);

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 150);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 600);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      tl.kill();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="anatomy">
      <div ref={stageRef} className="anatomy-stage">
        <div className="anatomy-head">
          <p className="anatomy-eyebrow">A real run</p>
          <h2 className="anatomy-title">One brief. Six agents. Eight minutes.</h2>
          <div className="anatomy-stepper" aria-hidden="true">
            {CARDS.map((card, i) => (
              <span
                key={card.key}
                ref={(el) => { dotRefs.current[i] = el; }}
                className="anatomy-step"
              />
            ))}
          </div>
        </div>

        <div className="anatomy-viewport">
          {CARDS.map((card, i) => (
            <div
              key={card.key}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="run-card-wrap"
            >
              <article className={`run-card${card.final ? " run-card--final" : ""}`}>
                <header className="run-card-bar">
                  <span className="run-card-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="run-card-agent">{card.agent}</span>
                  <span className="run-card-index">{card.index}</span>
                </header>
                <div className="run-card-body">
                  {card.lines.map((line, li) => (
                    <p key={li} className="run-line">
                      <span className="run-line-prompt">{line.startsWith(">") ? ">" : " "}</span>
                      {line.replace(/^>\s?/, "")}
                    </p>
                  ))}
                </div>
                <footer className="run-card-foot">
                  <span className="run-card-status">
                    <span className="run-card-dot" />
                    {card.meta}
                  </span>
                  <span className="run-card-dur">{card.duration}</span>
                </footer>
                <div className="run-meter" aria-hidden="true">
                  <div className="run-meter-fill" />
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="anatomy-progress" aria-hidden="true">
          <div ref={progressRef} className="anatomy-progress-fill" />
        </div>
      </div>
    </section>
  );
}
