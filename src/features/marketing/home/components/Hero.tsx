"use client";

/**
 * Hero - Landing page hero.
 * Single sentence + one CTA. No eyebrow badge.
 * Animation: clip-path wipe on the headline (single play on load).
 * Respects prefers-reduced-motion.
 */

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { MagneticButton } from "./MagneticButton";
import "./Hero.css";

// WebGL scenes are client-only, no SSR.
const Dither = dynamic(() => import("./Dither").then((m) => m.default), { ssr: false });
const HeroScene = dynamic(() => import("./HeroScene").then((m) => m.HeroScene), { ssr: false });

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set([headlineRef.current, paragraphRef.current, ctaRef.current], {
          opacity: 1,
          x: 0,
          clipPath: "none",
        });
        return;
      }

      // Delay so the hero reveals as the loading cover zooms into
      // the page. Cover zoom starts at 800ms and ends at 2000ms.
      // Starting the wipe at 800ms creates a layered reveal: cover
      // scales away + hero wipes in underneath.
      const tl = gsap.timeline({ defaults: { ease: "power4.inOut" }, delay: 0.8 });

      tl.fromTo(
        headlineRef.current,
        { clipPath: "inset(0 100% 0 0)", opacity: 0 },
        { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 0.8 }
      )
        .fromTo(
          paragraphRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.3"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.2"
        );
    },
    { scope: rootRef },
  );

  const handleCta = () => {
    const cta = document.getElementById("cta");
    if (cta) cta.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={rootRef} className="hero">
      <Dither
        waveColor={[0.16, 0.16, 0.16]}
        disableAnimation={false}
        enableMouseInteraction={true}
        mouseRadius={0.4}
        colorNum={4}
        waveAmplitude={0.25}
        waveFrequency={2.5}
        waveSpeed={0.04}
        pixelSize={2}
      />
      <div className="retro-glow-bottom-dither" />
      <HeroScene />
      <div className="hero-inner">

        <h1 ref={headlineRef} className="hero-headline">
          <span>One prompt,</span>
          <br />
          <span>build everything.</span>
        </h1>
        <p ref={paragraphRef} className="hero-paragraph">
          The first LangGraph-powered multi-agent system that turns a single
          brief into a production-grade application: frontend, backend,
          database, architecture, reviewed and shipped to GitHub in days.
        </p>
        <div ref={ctaRef} className="hero-cta">
          <MagneticButton
            className="hero-button"
            onClick={handleCta}
          >
            Start building
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
